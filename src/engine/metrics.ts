import type { TrainingSession, DailyMetrics } from './types.ts';
import type { EngineFormatter } from './formatter.ts';
import { defaultFormatter } from './formatter.ts';

/**
 * EWMA (Exponentially Weighted Moving Average) step using the Coggan PMC smoothing factor.
 * alpha = 1 - e^(-1/days), matching TrainingPeaks / WKO / GoldenCheetah.
 */
const ewmaStep = (previous: number, todayTss: number, days: number): number => {
  const safeTss = Number.isFinite(todayTss) ? todayTss : 0;
  const alpha = 1 - Math.exp(-1 / days);
  const result = previous + (safeTss - previous) * alpha;
  return Number.isFinite(result) ? result : previous;
};

/**
 * Get all dates from first session to today (or specified end date), inclusive.
 */
const getDateRange = (
  sessions: TrainingSession[],
  endDate: number | undefined,
  formatDate: (ts: number) => string,
): string[] => {
  if (sessions.length === 0) return [];

  const sorted = [...sessions].sort((a, b) => a.date - b.date);
  const start = new Date(sorted[0].date);
  start.setHours(0, 0, 0, 0);

  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(0, 0, 0, 0);

  const dates: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(formatDate(current.getTime()));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

/**
 * Aggregate daily TSS from sessions.
 * Filters out planned (ghost) sessions unless includeGhosts is true.
 */
const aggregateDailyTss = (
  sessions: TrainingSession[],
  includeGhosts: boolean,
  formatDate: (ts: number) => string,
): Map<string, number> => {
  const dailyTss = new Map<string, number>();

  for (const session of sessions) {
    if (!includeGhosts && session.isPlanned) continue;

    const dateStr = formatDate(session.date);
    dailyTss.set(dateStr, (dailyTss.get(dateStr) ?? 0) + session.tss);
  }

  return dailyTss;
};

const CTL_DAYS = 42;
const ATL_DAYS = 7;

/**
 * Compute a `DailyMetrics` entry for every calendar day from the earliest session up to `endDate`, applying EWMA-based CTL, ATL, TSB, and ACWR calculations.
 * @param sessions - All training sessions in the store, including both completed and planned entries.
 * @param options - Optional configuration: `endDate` (Unix ms, defaults to today) and `includeGhosts` (whether to count planned sessions in the EWMA, defaults to `false`).
 * @returns Chronologically ordered array of `DailyMetrics` (one entry per day); empty array when `sessions` is empty.
 */
export const computeMetrics = (
  sessions: TrainingSession[],
  options?: { endDate?: number; includeGhosts?: boolean; formatter?: EngineFormatter },
): DailyMetrics[] => {
  const fmt = options?.formatter ?? defaultFormatter;
  const historicalSessions = sessions.filter((s) => !s.isPlanned);
  const allSessions =
    options?.includeGhosts ? sessions : historicalSessions;

  const dates = getDateRange(allSessions, options?.endDate, fmt.date);
  if (dates.length === 0) return [];

  const dailyTss = aggregateDailyTss(allSessions, options?.includeGhosts ?? false, fmt.date);

  const metrics: DailyMetrics[] = [];
  let ctl = 0;
  let atl = 0;

  for (const date of dates) {
    const tss = dailyTss.get(date) ?? 0;

    ctl = ewmaStep(ctl, tss, CTL_DAYS);
    atl = ewmaStep(atl, tss, ATL_DAYS);
    const tsb = ctl - atl;
    const acwr = ctl > 0 ? atl / ctl : 0;

    metrics.push({
      date,
      tss,
      ctl: Math.round(ctl * 10) / 10,
      atl: Math.round(atl * 10) / 10,
      tsb: Math.round(tsb * 10) / 10,
      acwr: Math.round(acwr * 100) / 100,
    });
  }

  return metrics;
};

/**
 * Return the most recent `DailyMetrics` entry (today's CTL/ATL/TSB/ACWR snapshot) for the given sessions.
 * @param sessions - All training sessions in the store; passed directly to `computeMetrics` with default options.
 * @returns The last element of the computed metrics array, or `undefined` when there are no sessions.
 */
export const getCurrentMetrics = (
  sessions: TrainingSession[],
): DailyMetrics | undefined => {
  const metrics = computeMetrics(sessions);
  return metrics.length > 0 ? metrics[metrics.length - 1] : undefined;
};

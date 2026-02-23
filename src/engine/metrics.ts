import type { TrainingSession, DailyMetrics } from '../types/index.ts';
import { toDateString } from '../lib/utils.ts';

/**
 * EWMA (Exponentially Weighted Moving Average) step.
 * metric_today = metric_yesterday + (tss_today - metric_yesterday) * (2 / (days + 1))
 */
const ewmaStep = (previous: number, todayTss: number, days: number): number => {
  const safeTss = Number.isFinite(todayTss) ? todayTss : 0;
  const alpha = 2 / (days + 1);
  const result = previous + (safeTss - previous) * alpha;
  return Number.isFinite(result) ? result : previous;
};

/**
 * Get all dates from first session to today (or specified end date), inclusive.
 */
const getDateRange = (
  sessions: TrainingSession[],
  endDate?: number,
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
    dates.push(toDateString(current.getTime()));
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
): Map<string, number> => {
  const dailyTss = new Map<string, number>();

  for (const session of sessions) {
    if (!includeGhosts && session.isPlanned) continue;

    const dateStr = toDateString(session.date);
    dailyTss.set(dateStr, (dailyTss.get(dateStr) ?? 0) + session.tss);
  }

  return dailyTss;
};

const CTL_DAYS = 42;
const ATL_DAYS = 7;

/**
 * Compute DailyMetrics for every day from first session to endDate.
 * Pure function — no side effects.
 */
export const computeMetrics = (
  sessions: TrainingSession[],
  options?: { endDate?: number; includeGhosts?: boolean },
): DailyMetrics[] => {
  const historicalSessions = sessions.filter((s) => !s.isPlanned);
  const allSessions =
    options?.includeGhosts ? sessions : historicalSessions;

  const dates = getDateRange(allSessions, options?.endDate);
  if (dates.length === 0) return [];

  const dailyTss = aggregateDailyTss(allSessions, options?.includeGhosts ?? false);

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
 * Get the latest metrics snapshot.
 */
export const getCurrentMetrics = (
  sessions: TrainingSession[],
): DailyMetrics | undefined => {
  const metrics = computeMetrics(sessions);
  return metrics.length > 0 ? metrics[metrics.length - 1] : undefined;
};

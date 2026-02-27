import type { SessionRecord, TrainingSession } from './types.ts';

/** Minimum number of valid power+HR records required to compute Pw:Hr decoupling. */
export const MIN_RECORDS_FOR_DECOUPLING = 10;
/** Duration of the EF trend window in milliseconds (28 days). */
export const FOUR_WEEKS_MS = 28 * 24 * 60 * 60 * 1000;

/**
 * Calculate Efficiency Factor (EF) for a session: NP/avgHR for cycling, speed/avgHR for running.
 * @param normalizedPower - Session normalized power in watts; used for cycling EF.
 * @param avgSpeed - Session average speed in m/s; used for running EF.
 * @param avgHr - Session average heart rate in bpm.
 * @param sport - Sport type determining which EF formula to apply; swimming always returns `undefined`.
 * @returns EF rounded to two decimal places, or `undefined` when inputs are insufficient.
 */
export const calculateEF = (
  normalizedPower: number | undefined,
  avgSpeed: number | undefined,
  avgHr: number | undefined,
  sport: 'running' | 'cycling' | 'swimming',
): number | undefined => {
  if (!avgHr || avgHr <= 0) return undefined;

  if (sport === 'cycling' && normalizedPower && normalizedPower > 0) {
    return Math.round((normalizedPower / avgHr) * 100) / 100;
  }

  if (sport === 'running' && avgSpeed && avgSpeed > 0) {
    // Use speed/HR for running EF (higher is better)
    return Math.round((avgSpeed * 100 / avgHr) * 100) / 100;
  }

  return undefined;
};

/**
 * Calculate Pw:Hr decoupling by comparing the first-half and second-half power-to-HR ratios; drift below 5% indicates a solid aerobic base.
 * @param records - Full time-series session records; only records with both `power > 0` and `hr > 0` are used.
 * @returns Decoupling percentage (positive = power dropped or HR rose in the second half), or `undefined` when fewer than `MIN_RECORDS_FOR_DECOUPLING` valid records exist.
 */
export const calculateDecoupling = (
  records: SessionRecord[],
): number | undefined => {
  const validRecords = records.filter(
    (r) => r.power !== undefined && r.power > 0 && r.hr !== undefined && r.hr > 0,
  );

  if (validRecords.length < MIN_RECORDS_FOR_DECOUPLING) return undefined;

  const midpoint = Math.floor(validRecords.length / 2);
  const firstHalf = validRecords.slice(0, midpoint);
  const secondHalf = validRecords.slice(midpoint);

  const firstHalfRatio = calculateHalfRatio(firstHalf);
  const secondHalfRatio = calculateHalfRatio(secondHalf);

  if (firstHalfRatio === 0) return undefined;

  // Positive decoupling means power dropped or HR rose in second half
  const decoupling =
    ((firstHalfRatio - secondHalfRatio) / firstHalfRatio) * 100;

  return Math.round(decoupling * 10) / 10;
};

const calculateHalfRatio = (records: SessionRecord[]): number => {
  if (records.length === 0) return 0;

  const avgPower =
    records.reduce((sum, r) => sum + (r.power ?? 0), 0) / records.length;
  const avgHr =
    records.reduce((sum, r) => sum + (r.hr ?? 0), 0) / records.length;

  return avgHr > 0 ? avgPower / avgHr : 0;
};

/**
 * Collect EF data points for completed sessions of a given sport over the last four weeks, sorted chronologically.
 * @param sessions - All training sessions in the store; planned sessions and wrong-sport sessions are excluded.
 * @param sport - Sport type to filter by; determines which EF formula `calculateEF` will use.
 * @returns Array of `{ date, ef }` objects (Unix ms timestamp + EF value) covering the last `FOUR_WEEKS_MS`, with sessions missing a computable EF omitted.
 */
export const getEFTrend = (
  sessions: TrainingSession[],
  sport: 'running' | 'cycling' | 'swimming',
): { date: number; ef: number }[] => {
  const fourWeeksAgo = Date.now() - FOUR_WEEKS_MS;

  return sessions
    .filter((s) => s.sport === sport && s.date >= fourWeeksAgo && !s.isPlanned)
    .sort((a, b) => a.date - b.date)
    .map((s) => {
      const speed = s.distance > 0 && s.duration > 0
        ? s.distance / s.duration
        : undefined;
      const ef = calculateEF(s.normalizedPower, speed, s.avgHr, sport);
      return ef !== undefined ? { date: s.date, ef } : null;
    })
    .filter((item): item is { date: number; ef: number } => item !== null);
};

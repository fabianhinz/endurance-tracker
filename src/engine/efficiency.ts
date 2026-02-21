import type { SessionRecord, TrainingSession } from '../types/index.ts';

/**
 * Calculate Efficiency Factor (EF).
 * For cycling: NP / Avg HR
 * For running: Speed (m/s) / Avg HR (as pace efficiency)
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
 * Calculate Pw:Hr Decoupling.
 * Compares first-half vs second-half power:HR ratio.
 * Drift < 5% = good aerobic base.
 */
export const calculateDecoupling = (
  records: SessionRecord[],
): number | undefined => {
  const validRecords = records.filter(
    (r) => r.power !== undefined && r.power > 0 && r.hr !== undefined && r.hr > 0,
  );

  if (validRecords.length < 10) return undefined;

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
 * Get EF trend over recent sessions (last 4 weeks).
 * Returns array of { date, ef } for trending.
 */
export const getEFTrend = (
  sessions: TrainingSession[],
  sport: 'running' | 'cycling' | 'swimming',
): { date: number; ef: number }[] => {
  const fourWeeksAgo = Date.now() - 28 * 24 * 60 * 60 * 1000;

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

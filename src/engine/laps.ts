import type { SessionLap } from '../types/index.ts';

/**
 * Derived metrics for a single lap computed from raw {@link SessionLap} data.
 */
export interface LapAnalysis {
  /** Zero-based position of this lap within the session. */
  lapIndex: number;
  /** Average pace in seconds per kilometre, or `undefined` when distance/time data is missing. */
  paceSecPerKm: number | undefined;
  /** Average heart rate in bpm, or `undefined` when the device did not record HR. */
  avgHr: number | undefined;
  /** Average cadence in rpm/spm, or `undefined` when not recorded. */
  avgCadence: number | undefined;
  /** Total lap distance in metres. */
  distance: number;
  /** Elapsed (timer) duration of the lap in seconds. */
  duration: number;
  /** Moving time of the lap in seconds (excludes stopped periods when available). */
  movingTime: number;
  /** Total elevation gain for the lap in metres. */
  elevationGain: number;
  /** Intensity label as reported by the device (e.g. `'active'`, `'rest'`). */
  intensity: string;
  /** `true` when the session contains rest laps and this lap is classified as active. */
  isInterval: boolean;
}

/**
 * Pairing of one active interval lap with its optional following recovery lap.
 */
export interface IntervalPair {
  /** The active (high-intensity) lap of the interval. */
  active: LapAnalysis;
  /** The recovery lap immediately following the active lap, or `undefined` if none exists. */
  recovery: LapAnalysis | undefined;
  /** Heart-rate drop from active max HR to recovery min HR in bpm, or `undefined` when HR data is absent. */
  hrRecovery: number | undefined;
}

/**
 * Summary of pace and HR drift across laps, indicating whether the athlete is
 * fading, holding steady, or building through the session.
 */
export interface ProgressiveOverload {
  /** Percentage change in pace from first to last (target) lap; positive = slower. `undefined` when pace data is unavailable. */
  paceDriftPercent: number | undefined;
  /** Percentage change in average HR from first to last (target) lap; positive = higher HR. `undefined` when HR data is unavailable. */
  hrDriftPercent: number | undefined;
  /** Number of laps used for the drift calculation (interval laps only, or all laps for steady-state sessions). */
  lapCount: number;
  /** Overall trend classification derived from pace drift relative to {@link DRIFT_THRESHOLD_PERCENT}. */
  trend: 'stable' | 'fading' | 'building';
}

/** Minimum absolute pace or HR drift percentage required to classify a session as `'fading'` or `'building'`. */
export const DRIFT_THRESHOLD_PERCENT = 3;

/**
 * Converts raw session laps into enriched {@link LapAnalysis} objects with derived pace and intensity fields.
 *
 * @param laps - Array of raw laps from a parsed FIT session.
 * @returns An array of {@link LapAnalysis} records in the same order as the input laps.
 */
export const analyzeLaps = (laps: SessionLap[]): LapAnalysis[] => {
  if (laps.length === 0) return [];

  const hasRestLaps = laps.some(
    (l) => l.intensity !== undefined && l.intensity !== 'active',
  );

  return laps.map((lap) => {
    const duration = lap.totalMovingTime ?? lap.totalTimerTime;
    const paceSecPerKm =
      lap.distance > 0 && duration > 0
        ? (duration / lap.distance) * 1000
        : undefined;

    return {
      lapIndex: lap.lapIndex,
      paceSecPerKm,
      avgHr: lap.avgHr,
      avgCadence: lap.avgCadence,
      distance: lap.distance,
      duration: lap.totalTimerTime,
      movingTime: duration,
      elevationGain: lap.totalAscent ?? 0,
      intensity: lap.intensity ?? 'active',
      isInterval: hasRestLaps && lap.intensity === 'active',
    };
  });
};

/**
 * Groups active interval laps with their immediately following recovery laps and computes HR recovery drops.
 *
 * @param laps - Array of raw laps from a parsed FIT session.
 * @returns An array of {@link IntervalPair} records, one per active interval lap; empty when no intervals are detected.
 */
export const detectIntervals = (laps: SessionLap[]): IntervalPair[] => {
  const analyzed = analyzeLaps(laps);
  if (!analyzed.some((l) => l.isInterval)) return [];

  const pairs: IntervalPair[] = [];

  for (let i = 0; i < analyzed.length; i++) {
    if (!analyzed[i].isInterval) continue;

    const active = analyzed[i];
    const nextLap = i + 1 < analyzed.length ? analyzed[i + 1] : undefined;
    const recovery = nextLap && !nextLap.isInterval ? nextLap : undefined;

    // HR recovery: drop from active max HR to recovery min HR
    const activeLap = laps[i];
    const recoveryLap = recovery ? laps[i + 1] : undefined;
    const hrRecovery =
      activeLap.maxHr !== undefined && recoveryLap?.minHr !== undefined
        ? activeLap.maxHr - recoveryLap.minHr
        : undefined;

    pairs.push({ active, recovery, hrRecovery });
  }

  return pairs;
};

/**
 * Calculates pace and HR drift from the first to the last target lap and classifies the overall trend.
 *
 * @param laps - Array of raw laps from a parsed FIT session.
 * @returns A {@link ProgressiveOverload} summary; `trend` is `'stable'` when drift is within {@link DRIFT_THRESHOLD_PERCENT}.
 */
export const detectProgressiveOverload = (laps: SessionLap[]): ProgressiveOverload => {
  const analyzed = analyzeLaps(laps);
  const intervalLaps = analyzed.filter((l) => l.isInterval);

  // If no intervals detected (steady state), use all laps
  const targetLaps = intervalLaps.length > 0 ? intervalLaps : analyzed;

  if (targetLaps.length < 2) {
    return { paceDriftPercent: undefined, hrDriftPercent: undefined, lapCount: targetLaps.length, trend: 'stable' };
  }

  const first = targetLaps[0];
  const last = targetLaps[targetLaps.length - 1];

  const paceDriftPercent =
    first.paceSecPerKm !== undefined && last.paceSecPerKm !== undefined && first.paceSecPerKm > 0
      ? ((last.paceSecPerKm - first.paceSecPerKm) / first.paceSecPerKm) * 100
      : undefined;

  const hrDriftPercent =
    first.avgHr !== undefined && last.avgHr !== undefined && first.avgHr > 0
      ? ((last.avgHr - first.avgHr) / first.avgHr) * 100
      : undefined;

  let trend: ProgressiveOverload['trend'] = 'stable';
  if (paceDriftPercent !== undefined && paceDriftPercent > DRIFT_THRESHOLD_PERCENT) {
    trend = 'fading';
  } else if (paceDriftPercent !== undefined && paceDriftPercent < -DRIFT_THRESHOLD_PERCENT) {
    trend = 'building';
  }

  return {
    paceDriftPercent: paceDriftPercent !== undefined ? Math.round(paceDriftPercent * 10) / 10 : undefined,
    hrDriftPercent: hrDriftPercent !== undefined ? Math.round(hrDriftPercent * 10) / 10 : undefined,
    lapCount: targetLaps.length,
    trend,
  };
};

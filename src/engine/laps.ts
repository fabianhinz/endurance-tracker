import type { SessionLap } from '../types/index.ts';

export interface LapAnalysis {
  lapIndex: number;
  paceSecPerKm: number | undefined;
  avgHr: number | undefined;
  avgCadence: number | undefined;
  distance: number;
  duration: number;
  movingTime: number;
  elevationGain: number;
  intensity: string;
  isInterval: boolean;
}

export interface IntervalPair {
  active: LapAnalysis;
  recovery: LapAnalysis | undefined;
  hrRecovery: number | undefined;
}

export interface ProgressiveOverload {
  paceDriftPercent: number | undefined;
  hrDriftPercent: number | undefined;
  lapCount: number;
  trend: 'stable' | 'fading' | 'building';
}

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
  if (paceDriftPercent !== undefined && paceDriftPercent > 3) {
    trend = 'fading';
  } else if (paceDriftPercent !== undefined && paceDriftPercent < -3) {
    trend = 'building';
  }

  return {
    paceDriftPercent: paceDriftPercent !== undefined ? Math.round(paceDriftPercent * 10) / 10 : undefined,
    hrDriftPercent: hrDriftPercent !== undefined ? Math.round(hrDriftPercent * 10) / 10 : undefined,
    lapCount: targetLaps.length,
    trend,
  };
};

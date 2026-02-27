import type { SessionLap } from '../engine/types.ts';

export interface LapSplitPoint {
  lap: string;
  pace: number; // min/km
  speed: number; // km/h
  intensity: string;
}

export interface LapHrPoint {
  lap: string;
  avgHr: number;
  minHr: number;
  maxHr: number;
}

export interface HrRecoveryPoint {
  label: string;
  drop: number;
  color: string;
}

export const prepareLapSplitsData = (laps: SessionLap[]): LapSplitPoint[] =>
  laps
    .filter((lap) => lap.distance > 0 && lap.avgSpeed > 0)
    .map((lap) => ({
      lap: `Lap ${lap.lapIndex + 1}`,
      pace: Math.round(((1000 / lap.avgSpeed) / 60) * 100) / 100, // min/km
      speed: Math.round(lap.avgSpeed * 3.6 * 10) / 10, // km/h
      intensity: lap.intensity ?? 'active',
    }));

export const prepareLapHrData = (laps: SessionLap[]): LapHrPoint[] =>
  laps
    .filter((lap) => lap.avgHr !== undefined)
    .map((lap) => ({
      lap: `Lap ${lap.lapIndex + 1}`,
      avgHr: lap.avgHr!,
      minHr: lap.minHr ?? lap.avgHr!,
      maxHr: lap.maxHr ?? lap.avgHr!,
    }));

/**
 * Detect interval pairs: active lap followed by rest lap.
 * HR recovery = active maxHr - rest minHr.
 */
export const prepareHrRecoveryData = (laps: SessionLap[]): HrRecoveryPoint[] => {
  const pairs: HrRecoveryPoint[] = [];

  for (let i = 0; i < laps.length - 1; i++) {
    const active = laps[i];
    const rest = laps[i + 1];

    if (
      active.intensity === 'active' &&
      rest.intensity === 'rest' &&
      active.maxHr !== undefined &&
      rest.minHr !== undefined
    ) {
      const drop = active.maxHr - rest.minHr;
      const color = drop > 25 ? '#4ade80' : drop >= 15 ? '#facc15' : '#f87171';

      pairs.push({
        label: `Rep ${pairs.length + 1}`,
        drop,
        color,
      });
    }
  }

  return pairs;
};

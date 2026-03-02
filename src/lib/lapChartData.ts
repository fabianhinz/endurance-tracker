import type { LapAnalysis } from '../engine/laps.ts';

export interface LapSplitPoint {
  lap: string;
  pace: number; // sec/km
  speed: number; // km/h
}

export interface LapHrPoint {
  lap: string;
  avgHr: number;
  minHr: number;
  maxHr: number;
}

export const prepareLapSplitsData = (laps: LapAnalysis[]): LapSplitPoint[] =>
  laps
    .filter((l) => l.paceSecPerKm !== undefined)
    .map((l) => ({
      lap: `Lap ${l.lapIndex + 1}`,
      pace: l.paceSecPerKm!,
      speed: Math.round((3600 / l.paceSecPerKm!) * 10) / 10,
    }));

export const prepareLapHrData = (laps: LapAnalysis[]): LapHrPoint[] =>
  laps
    .filter((l) => l.avgHr !== undefined)
    .map((l) => ({
      lap: `Lap ${l.lapIndex + 1}`,
      avgHr: l.avgHr!,
      minHr: l.minHr ?? l.avgHr!,
      maxHr: l.maxHr ?? l.avgHr!,
    }));

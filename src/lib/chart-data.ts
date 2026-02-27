import type { SessionRecord } from '../engine/types.ts';
import { gradeAdjustedPaceFactor } from '../engine/normalize.ts';

export interface TimeSeriesPoint {
  time: number;
}

export interface CadencePoint extends TimeSeriesPoint {
  cadence: number;
}

export interface ElevationPoint extends TimeSeriesPoint {
  elevation: number;
}

export interface GradePoint extends TimeSeriesPoint {
  grade: number;
}

export interface HrPoint extends TimeSeriesPoint {
  hr: number;
}

export interface PowerPoint extends TimeSeriesPoint {
  power: number;
}

export interface SpeedPoint extends TimeSeriesPoint {
  speed: number;
}

export interface PacePoint extends TimeSeriesPoint {
  pace: number;
}

export interface GAPPoint extends TimeSeriesPoint {
  pace: number;
  gap: number;
}

export const filterTimeSeries = <T extends TimeSeriesPoint>(
  data: T[],
  from: number,
  to: number,
): T[] => data.filter((d) => d.time >= from && d.time <= to);

export const toMinutes = (timestamp: number): number =>
  Math.round((timestamp / 60) * 100) / 100;

export const buildTimeToGpsLookup = (records: SessionRecord[]): Map<number, [number, number]> => {
  const map = new Map<number, [number, number]>();
  for (const r of records) {
    if (r.lat != null && r.lng != null) {
      map.set(toMinutes(r.timestamp), [r.lng, r.lat]);
    }
  }
  return map;
};

export const prepareHrData = (records: SessionRecord[]): HrPoint[] =>
  records
    .filter((r) => r.hr !== undefined && r.hr > 0)
    .map((r) => ({
      time: toMinutes(r.timestamp),
      hr: Math.round(r.hr!),
    }));

export const preparePowerData = (records: SessionRecord[]): PowerPoint[] =>
  records
    .filter((r) => r.power !== undefined && r.power > 0)
    .map((r) => ({
      time: toMinutes(r.timestamp),
      power: Math.round(r.power!),
    }));

export const prepareSpeedData = (records: SessionRecord[]): SpeedPoint[] =>
  records
    .filter((r) => r.speed !== undefined && r.speed > 0)
    .map((r) => ({
      time: toMinutes(r.timestamp),
      speed: Math.round(r.speed! * 3.6 * 10) / 10,
    }));

export const prepareCadenceData = (records: SessionRecord[]): CadencePoint[] =>
  records
    .filter((r) => r.cadence !== undefined && r.cadence > 0)
    .map((r) => ({
      time: toMinutes(r.timestamp),
      cadence: Math.round(r.cadence!),
    }));

export const prepareElevationData = (records: SessionRecord[]): ElevationPoint[] =>
  records
    .filter((r) => r.elevation !== undefined)
    .map((r) => ({
      time: toMinutes(r.timestamp),
      elevation: Math.round(r.elevation! * 10) / 10,
    }));

export const prepareGradeData = (records: SessionRecord[]): GradePoint[] =>
  records
    .filter((r) => r.grade !== undefined)
    .map((r) => ({
      time: toMinutes(r.timestamp),
      grade: Math.round(r.grade! * 10) / 10,
    }));

/**
 * Convert speed (m/s) to pace (min/km).
 * Returns undefined for zero/negative speed.
 */
const speedToPace = (speed: number): number | undefined => {
  if (speed <= 0) return undefined;
  return (1000 / speed) / 60; // min/km
};

export const preparePaceData = (records: SessionRecord[]): PacePoint[] =>
  records
    .filter((r) => r.speed !== undefined && r.speed > 0.5) // filter walking/standing
    .map((r) => {
      const pace = speedToPace(r.speed!)!;
      return {
        time: toMinutes(r.timestamp),
        pace: Math.round(pace * 100) / 100,
      };
    });

export const prepareGAPData = (records: SessionRecord[]): GAPPoint[] => {
  const valid = records.filter(
    (r) =>
      r.speed !== undefined &&
      r.speed > 0.5 &&
      (r.grade !== undefined || r.elevation !== undefined),
  );

  if (valid.length < 2) return [];

  return valid.map((r, i) => {
    const pace = speedToPace(r.speed!)!;

    // grade from FIT is percentage (5 = 5%), factor expects fraction (0.05)
    let gradient: number;
    if (r.grade !== undefined) {
      gradient = r.grade / 100;
    } else if (i > 0 && valid[i - 1].elevation !== undefined && r.elevation !== undefined) {
      const dx = (r.distance ?? 0) - (valid[i - 1].distance ?? 0);
      gradient = dx > 0 ? (r.elevation! - valid[i - 1].elevation!) / dx : 0;
    } else {
      gradient = 0;
    }

    const factor = gradeAdjustedPaceFactor(gradient);
    const gap = pace * factor;

    return {
      time: toMinutes(r.timestamp),
      pace: Math.round(pace * 100) / 100,
      gap: Math.round(gap * 100) / 100,
    };
  });
};

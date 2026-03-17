import type { LapAnalysis, LapRecordEnrichment } from '@/lib/laps.ts';
import { m } from '@/paraglide/messages.js';

export interface LapSplitPoint {
  lap: string;
  pace: number; // sec/km
  speed: number; // km/h
  maxPace: number; // sec/km (from max speed)
  maxSpeed: number; // km/h
  minPace: number | undefined; // sec/km (from min speed enrichment)
  minSpeed: number | undefined; // km/h
  paceRange: [number, number] | undefined; // [maxPace, minPace] (fast→slow for reversed axis)
  speedRange: [number, number] | undefined; // [minSpeed, maxSpeed]
}

export interface LapHrPoint {
  lap: string;
  avgHr: number;
  minHr: number;
  maxHr: number;
  hrRange: [number, number]; // [minHr, maxHr]
}

export interface LapPowerPoint {
  lap: string;
  avgPower: number;
  minPower: number;
  maxPower: number;
  powerRange: [number, number]; // [minPower, maxPower]
}

export const prepareLapSplitsData = (
  laps: LapAnalysis[],
  enrichments?: LapRecordEnrichment[],
): LapSplitPoint[] => {
  const enrichmentMap = new Map(enrichments?.map((e) => [e.lapIndex, e]));

  return laps
    .filter((l) => l.paceSecPerKm !== undefined && l.intensity === 'active')
    .map((l) => {
      const speed = Math.round((3600 / l.paceSecPerKm!) * 10) / 10;

      let maxSpeedKmh = speed;
      if (l.maxSpeed !== undefined) {
        maxSpeedKmh = Math.round(l.maxSpeed * 3.6 * 10) / 10;
      }

      let maxPace = l.paceSecPerKm!;
      if (l.maxSpeed !== undefined && l.maxSpeed > 0) {
        maxPace = 1000 / l.maxSpeed;
      }

      const enrichment = enrichmentMap.get(l.lapIndex);
      const minSpeedMs = enrichment?.minSpeed;

      let minSpeedKmh: number | undefined = undefined;
      if (minSpeedMs !== undefined) {
        minSpeedKmh = Math.round(minSpeedMs * 3.6 * 10) / 10;
      }

      let minPace: number | undefined = undefined;
      if (minSpeedMs !== undefined && minSpeedMs > 0) {
        minPace = 1000 / minSpeedMs;
      }

      let paceRange: [number, number] | undefined = undefined;
      if (minPace !== undefined) {
        paceRange = [maxPace, minPace];
      }

      let speedRange: [number, number] | undefined = undefined;
      if (minSpeedKmh !== undefined) {
        speedRange = [minSpeedKmh, maxSpeedKmh];
      }

      return {
        lap: m.ui_lap_label({ number: String(l.lapIndex + 1) }),
        pace: l.paceSecPerKm!,
        speed,
        maxPace,
        maxSpeed: maxSpeedKmh,
        minPace,
        minSpeed: minSpeedKmh,
        paceRange,
        speedRange,
      };
    });
};

export const prepareLapPowerData = (enrichments: LapRecordEnrichment[]): LapPowerPoint[] =>
  enrichments
    .filter((e) => e.avgPower !== undefined && e.minPower !== undefined && e.maxPower !== undefined)
    .map((e) => ({
      lap: m.ui_lap_label({ number: String(e.lapIndex + 1) }),
      avgPower: e.avgPower!,
      minPower: e.minPower!,
      maxPower: e.maxPower!,
      powerRange: [e.minPower!, e.maxPower!] as [number, number],
    }));

export const prepareLapHrData = (
  laps: LapAnalysis[],
  enrichments?: LapRecordEnrichment[],
): LapHrPoint[] => {
  const enrichmentMap = new Map(enrichments?.map((e) => [e.lapIndex, e]));

  return laps
    .filter((l) => l.avgHr !== undefined)
    .map((l) => {
      const enrichment = enrichmentMap.get(l.lapIndex);
      const minHr = enrichment?.minHr ?? l.minHr ?? l.avgHr!;
      const maxHr = l.maxHr ?? l.avgHr!;
      return {
        lap: m.ui_lap_label({ number: String(l.lapIndex + 1) }),
        avgHr: l.avgHr!,
        minHr,
        maxHr,
        hrRange: [minHr, maxHr] as [number, number],
      };
    });
};

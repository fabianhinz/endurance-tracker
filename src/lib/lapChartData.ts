import type { LapAnalysis, LapRecordEnrichment } from '../engine/laps.ts';

export interface LapSplitPoint {
  lap: string;
  pace: number; // sec/km
  speed: number; // km/h
  maxPace: number; // sec/km (from max speed)
  maxSpeed: number; // km/h
  minPace: number | undefined; // sec/km (from min speed enrichment)
  minSpeed: number | undefined; // km/h
}

export interface LapHrPoint {
  lap: string;
  avgHr: number;
  minHr: number;
  maxHr: number;
}

export interface LapPowerPoint {
  lap: string;
  avgPower: number;
  minPower: number;
  maxPower: number;
}

export const prepareLapSplitsData = (
  laps: LapAnalysis[],
  enrichments?: LapRecordEnrichment[],
): LapSplitPoint[] => {
  const enrichmentMap = new Map(enrichments?.map((e) => [e.lapIndex, e]));

  return laps
    .filter((l) => l.paceSecPerKm !== undefined)
    .map((l) => {
      const speed = Math.round((3600 / l.paceSecPerKm!) * 10) / 10;
      const maxSpeedKmh =
        l.maxSpeed !== undefined
          ? Math.round(l.maxSpeed * 3.6 * 10) / 10
          : speed;
      const maxPace =
        l.maxSpeed !== undefined && l.maxSpeed > 0
          ? 1000 / l.maxSpeed
          : l.paceSecPerKm!;

      const enrichment = enrichmentMap.get(l.lapIndex);
      const minSpeedMs = enrichment?.minSpeed;
      const minSpeedKmh =
        minSpeedMs !== undefined
          ? Math.round(minSpeedMs * 3.6 * 10) / 10
          : undefined;
      const minPace =
        minSpeedMs !== undefined && minSpeedMs > 0
          ? 1000 / minSpeedMs
          : undefined;

      return {
        lap: `Lap ${l.lapIndex + 1}`,
        pace: l.paceSecPerKm!,
        speed,
        maxPace,
        maxSpeed: maxSpeedKmh,
        minPace,
        minSpeed: minSpeedKmh,
      };
    });
};

export const prepareLapPowerData = (
  enrichments: LapRecordEnrichment[],
): LapPowerPoint[] =>
  enrichments
    .filter(
      (e) =>
        e.avgPower !== undefined &&
        e.minPower !== undefined &&
        e.maxPower !== undefined,
    )
    .map((e) => ({
      lap: `Lap ${e.lapIndex + 1}`,
      avgPower: e.avgPower!,
      minPower: e.minPower!,
      maxPower: e.maxPower!,
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

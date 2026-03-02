import type { SessionRecord } from './types.ts';
import type { LapAnalysis, LapRecordEnrichment } from './laps.ts';
import { enrichLapFromRecords } from './laps.ts';

export interface DynamicLapResult {
  analysis: LapAnalysis[];
  enrichments: LapRecordEnrichment[];
}

/**
 * Computes distance-based split laps from raw session records.
 *
 * Single O(n) pass: walks records by cumulative distance, closing a lap
 * each time `splitDistanceMetres` is reached. The last lap may be partial.
 */
export const computeDynamicLaps = (
  records: SessionRecord[],
  splitDistanceMetres: number,
): DynamicLapResult => {
  const withDistance = records.filter((r) => r.distance !== undefined);
  if (withDistance.length < 2) return { analysis: [], enrichments: [] };

  const analysis: LapAnalysis[] = [];
  const enrichments: LapRecordEnrichment[] = [];

  let lapStart = 0;
  let nextBoundary = (withDistance[0].distance ?? 0) + splitDistanceMetres;
  let lapIndex = 0;

  const closeLap = (startIdx: number, endIdx: number) => {
    const slice = withDistance.slice(startIdx, endIdx + 1);
    if (slice.length < 2) return;

    const first = slice[0];
    const last = slice[slice.length - 1];

    const distance = (last.distance ?? 0) - (first.distance ?? 0);
    const duration = last.timestamp - first.timestamp;
    const movingTime = duration; // records are per-second; no stopped detection at record level

    const paceSecPerKm =
      distance > 0 && duration > 0
        ? (duration / distance) * 1000
        : undefined;

    const hrs = slice.map((r) => r.hr).filter((h): h is number => h !== undefined && h > 0);
    const avgHr = hrs.length > 0 ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : undefined;
    const maxHr = hrs.length > 0 ? Math.max(...hrs) : undefined;

    const cadences = slice.map((r) => r.cadence).filter((c): c is number => c !== undefined && c > 0);
    const avgCadence = cadences.length > 0 ? Math.round(cadences.reduce((a, b) => a + b, 0) / cadences.length) : undefined;

    const speeds = slice.map((r) => r.speed).filter((s): s is number => s !== undefined);
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : undefined;

    let elevationGain = 0;
    for (let i = 1; i < slice.length; i++) {
      const prev = slice[i - 1].elevation;
      const curr = slice[i].elevation;
      if (prev !== undefined && curr !== undefined && curr > prev) {
        elevationGain += curr - prev;
      }
    }

    analysis.push({
      lapIndex,
      paceSecPerKm,
      avgHr,
      minHr: undefined, // enrichment handles P5 percentile
      maxHr,
      avgCadence,
      distance,
      duration,
      movingTime,
      elevationGain,
      intensity: 'active',
      maxSpeed,
      isInterval: false,
    });

    enrichments.push(enrichLapFromRecords(lapIndex, slice));
    lapIndex++;
  };

  for (let i = 0; i < withDistance.length; i++) {
    const d = withDistance[i].distance!;
    if (d >= nextBoundary) {
      closeLap(lapStart, i);
      lapStart = i;
      nextBoundary = d + splitDistanceMetres;
    }
  }

  // Close the final (possibly partial) lap
  if (lapStart < withDistance.length - 1) {
    closeLap(lapStart, withDistance.length - 1);
  }

  return { analysis, enrichments };
};

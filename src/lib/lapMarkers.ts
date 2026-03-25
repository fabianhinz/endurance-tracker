import type { SessionLap, SessionRecord } from '@/packages/engine/types.ts';

export interface LapMarker {
  lapIndex: number;
  position: [number, number]; // [lng, lat] for deck.gl
  label: string; // "1", "2", "3", ...
}

export type LapMarkerMode =
  | { kind: 'device'; laps: SessionLap[]; sessionStartMs: number }
  | { kind: 'dynamic'; splitDistanceMetres: number };

const hasValidGPS = (r: SessionRecord): boolean =>
  r.lat != null && r.lng != null && r.lat >= -90 && r.lat <= 90 && r.lng >= -180 && r.lng <= 180;

const computeDeviceMarkers = (
  records: SessionRecord[],
  laps: SessionLap[],
  sessionStartMs: number,
): LapMarker[] => {
  const markers: LapMarker[] = [];

  for (const lap of laps) {
    const lapStartSec = (lap.startTime - sessionStartMs) / 1000;
    const first = records.find((r) => r.timestamp >= lapStartSec && hasValidGPS(r));
    if (first && first.lng != null && first.lat != null) {
      markers.push({
        lapIndex: lap.lapIndex,
        position: [first.lng, first.lat],
        label: String(lap.lapIndex + 1),
      });
    }
  }

  return markers;
};

const computeDynamicMarkers = (
  records: SessionRecord[],
  splitDistanceMetres: number,
): LapMarker[] => {
  const withDistance = records.filter((r) => r.distance !== undefined);
  if (withDistance.length < 2) return [];

  const markers: LapMarker[] = [];
  let lapIndex = 0;

  // Marker at the start of split 0
  const first = withDistance.find((r) => hasValidGPS(r));
  if (first && first.lng != null && first.lat != null) {
    markers.push({
      lapIndex,
      position: [first.lng, first.lat],
      label: String(lapIndex + 1),
    });
  }

  const firstWithDist = withDistance[0];
  if (!firstWithDist) return markers;
  let nextBoundary = (firstWithDist.distance ?? 0) + splitDistanceMetres;

  for (let i = 0; i < withDistance.length; i++) {
    const rec = withDistance[i];
    if (!rec) continue;
    const d = rec.distance ?? 0;
    if (d >= nextBoundary) {
      lapIndex++;
      // Find first record at or after this index with valid GPS
      const gpsRecord = withDistance.slice(i).find((r) => hasValidGPS(r));
      if (gpsRecord && gpsRecord.lng != null && gpsRecord.lat != null) {
        markers.push({
          lapIndex,
          position: [gpsRecord.lng, gpsRecord.lat],
          label: String(lapIndex + 1),
        });
      }
      nextBoundary = d + splitDistanceMetres;
    }
  }

  return markers;
};

export const computeLapMarkers = (records: SessionRecord[], mode: LapMarkerMode): LapMarker[] => {
  if (records.length === 0) return [];

  if (mode.kind === 'device') {
    return computeDeviceMarkers(records, mode.laps, mode.sessionStartMs);
  }

  return computeDynamicMarkers(records, mode.splitDistanceMetres);
};

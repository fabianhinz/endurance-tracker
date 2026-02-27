import {
  boundsOverlap,
  segmentIntersectsBounds,
} from "../../engine/gps.ts";
import type { GPSBounds } from "../../engine/types.ts";

interface GeoCorner {
  lat: number;
  lng: number;
}

export interface PickableTrack {
  sessionId: string;
  bounds: GPSBounds;
  path: [number, number][];
}

export const pickBoundsFromCorners = (
  a: GeoCorner,
  b: GeoCorner,
): GPSBounds => ({
  minLat: Math.min(a.lat, b.lat),
  maxLat: Math.max(a.lat, b.lat),
  minLng: Math.min(a.lng, b.lng),
  maxLng: Math.max(a.lng, b.lng),
});

export const filterTracksByPickBounds = (
  tracks: PickableTrack[],
  pickBounds: GPSBounds,
): string[] => {
  const seen = new Set<string>();
  for (const t of tracks) {
    if (seen.has(t.sessionId)) continue;
    if (!boundsOverlap(t.bounds, pickBounds)) continue;
    const hit = t.path.some(
      (p, i) =>
        i > 0 && segmentIntersectsBounds(t.path[i - 1], p, pickBounds),
    );
    if (hit) seen.add(t.sessionId);
  }
  return [...seen];
};

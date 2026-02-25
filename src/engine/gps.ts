import { encode, decode } from '@googlemaps/polyline-codec';
import { Simplify as simplify } from 'simplify-ts';
import type { SessionRecord } from '../types/index.ts';
import type { GPSPoint, GPSBounds, SessionGPS } from '../types/gps.ts';

export const extractGPSPoints = (records: SessionRecord[]): GPSPoint[] =>
  records.reduce<GPSPoint[]>((acc, r) => {
    if (
      r.lat != null &&
      r.lng != null &&
      r.lat >= -90 &&
      r.lat <= 90 &&
      r.lng >= -180 &&
      r.lng <= 180
    ) {
      acc.push({ lat: r.lat, lng: r.lng });
    }
    return acc;
  }, []);

export const extractPathFromRecords = (
  records: SessionRecord[],
): [number, number][] =>
  records.reduce<[number, number][]>((acc, r) => {
    if (
      r.lat != null &&
      r.lng != null &&
      r.lat >= -90 &&
      r.lat <= 90 &&
      r.lng >= -180 &&
      r.lng <= 180
    ) {
      acc.push([r.lng, r.lat]);
    }
    return acc;
  }, []);

export const simplifyTrack = (
  points: GPSPoint[],
  tolerance = 0.00005,
): GPSPoint[] => {
  if (points.length < 3) return points;
  const simplified = simplify(
    points.map((p) => ({ x: p.lng, y: p.lat })),
    tolerance,
  );
  return simplified.map((p) => ({ lat: p.y, lng: p.x }));
};

export const encodeTrack = (points: GPSPoint[]): string =>
  encode(points.map((p) => [p.lat, p.lng]));

export const computeBounds = (points: GPSPoint[]): GPSBounds => {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  return { minLat, maxLat, minLng, maxLng };
};

export const buildSessionGPS = (
  sessionId: string,
  records: SessionRecord[],
): SessionGPS | null => {
  const points = extractGPSPoints(records);
  if (points.length < 2) return null;
  const simplified = simplifyTrack(points);
  const encodedPolyline = encodeTrack(simplified);
  const bounds = computeBounds(simplified);
  return { sessionId, encodedPolyline, pointCount: simplified.length, bounds };
};

export const decodeTrackForRendering = (
  encodedPolyline: string,
): [number, number][] =>
  decode(encodedPolyline).map((p) => [p[1], p[0]]);

export const boundsOverlap = (a: GPSBounds, b: GPSBounds): boolean =>
  a.minLat <= b.maxLat &&
  a.maxLat >= b.minLat &&
  a.minLng <= b.maxLng &&
  a.maxLng >= b.minLng;

export const unionBounds = (boundsArray: GPSBounds[]): GPSBounds | null => {
  if (boundsArray.length === 0) return null;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const b of boundsArray) {
    if (b.minLat < minLat) minLat = b.minLat;
    if (b.maxLat > maxLat) maxLat = b.maxLat;
    if (b.minLng < minLng) minLng = b.minLng;
    if (b.maxLng > maxLng) maxLng = b.maxLng;
  }
  return { minLat, maxLat, minLng, maxLng };
};

/**
 * Test whether the line segment a→b intersects an axis-aligned bounding box.
 * Uses parametric clipping (Liang-Barsky). Coordinates are [lng, lat].
 */
export const segmentIntersectsBounds = (
  a: [number, number],
  b: [number, number],
  bounds: GPSBounds,
): boolean => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];

  const p = [-dx, dx, -dy, dy];
  const q = [
    a[0] - bounds.minLng,
    bounds.maxLng - a[0],
    a[1] - bounds.minLat,
    bounds.maxLat - a[1],
  ];

  let tMin = 0;
  let tMax = 1;

  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      // Segment is parallel to this edge — reject if outside
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > tMax) return false;
        if (t > tMin) tMin = t;
      } else {
        if (t < tMin) return false;
        if (t < tMax) tMax = t;
      }
    }
  }

  return tMin <= tMax;
};

export const boundsCenter = (b: GPSBounds): GPSPoint => ({
  lat: (b.minLat + b.maxLat) / 2,
  lng: (b.minLng + b.maxLng) / 2,
});

export const scaledDistDeg = (a: GPSPoint, b: GPSPoint): number => {
  const dLat = a.lat - b.lat;
  const dLng = (a.lng - b.lng) * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180));
  return Math.sqrt(dLat * dLat + dLng * dLng);
};

/**
 * Find the densest cluster of tracks by center-point proximity.
 * For each track center, count how many other centers are within radiusDeg.
 * Pick the center with the highest neighbor count, collect all tracks within
 * radius, and return their union bounds.
 */
export const densestClusterBounds = (
  boundsArray: GPSBounds[],
  radiusDeg = 0.25,
): GPSBounds | null => {
  if (boundsArray.length === 0) return null;
  if (boundsArray.length === 1) return boundsArray[0];

  const centers = boundsArray.map((b) => boundsCenter(b));

  let bestIdx = 0;
  let bestCount = 0;

  for (let i = 0; i < centers.length; i++) {
    let count = 0;
    for (let j = 0; j < centers.length; j++) {
      if (i !== j && scaledDistDeg(centers[i], centers[j]) <= radiusDeg) count++;
    }
    if (count > bestCount) {
      bestCount = count;
      bestIdx = i;
    }
  }

  const seed = centers[bestIdx];
  const cluster = boundsArray.filter(
    (_, idx) => scaledDistDeg(seed, centers[idx]) <= radiusDeg,
  );
  return unionBounds(cluster);
};

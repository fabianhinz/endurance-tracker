import { describe, it, expect } from 'vitest';
import {
  extractGPSPoints,
  simplifyTrack,
  encodeTrack,
  decodeTrackForRendering,
  computeBounds,
  buildSessionGPS,
  boundsOverlap,
  unionBounds,
  densestClusterBounds,
  boundsCenter,
  scaledDistDeg,
} from '../../src/engine/gps.ts';
import { makeGPSRunningRecords, makeIndoorRecords } from '../factories/gps.ts';

describe('extractGPSPoints', () => {
  it('extracts valid lat/lng from records', () => {
    const records = makeGPSRunningRecords('s1', 10);
    const points = extractGPSPoints(records);
    expect(points).toHaveLength(10);
    expect(points[0].lat).toBeCloseTo(48.137, 3);
    expect(points[0].lng).toBeCloseTo(11.575, 3);
  });

  it('returns empty array for indoor sessions (no GPS)', () => {
    const records = makeIndoorRecords('s1', 50);
    const points = extractGPSPoints(records);
    expect(points).toHaveLength(0);
  });

  it('filters out records with null or out-of-range coordinates', () => {
    const records = [
      { sessionId: 's1', timestamp: 0, lat: 48.0, lng: 11.0 },
      { sessionId: 's1', timestamp: 1, lat: undefined, lng: 11.0 },
      { sessionId: 's1', timestamp: 2, lat: 48.0, lng: undefined },
      { sessionId: 's1', timestamp: 3, lat: 91, lng: 11.0 },
      { sessionId: 's1', timestamp: 4, lat: 48.0, lng: -181 },
      { sessionId: 's1', timestamp: 5, lat: 49.0, lng: 12.0 },
    ];
    const points = extractGPSPoints(records);
    expect(points).toHaveLength(2);
    expect(points[0].lat).toBe(48.0);
    expect(points[1].lat).toBe(49.0);
  });
});

describe('simplifyTrack', () => {
  it('reduces point count for a long track', () => {
    const records = makeGPSRunningRecords('s1', 500);
    const points = extractGPSPoints(records);
    const simplified = simplifyTrack(points);
    expect(simplified.length).toBeLessThan(points.length);
    expect(simplified.length).toBeGreaterThan(0);
  });

  it('returns points as-is for < 3 points', () => {
    const points = [
      { lat: 48.0, lng: 11.0 },
      { lat: 48.1, lng: 11.1 },
    ];
    const simplified = simplifyTrack(points);
    expect(simplified).toHaveLength(2);
  });

  it('handles single point', () => {
    const points = [{ lat: 48.0, lng: 11.0 }];
    const simplified = simplifyTrack(points);
    expect(simplified).toHaveLength(1);
  });
});

describe('encodeTrack + decodeTrackForRendering (round-trip)', () => {
  it('round-trips within precision tolerance', () => {
    const original = [
      { lat: 48.137, lng: 11.575 },
      { lat: 48.138, lng: 11.576 },
      { lat: 48.139, lng: 11.577 },
    ];
    const encoded = encodeTrack(original);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = decodeTrackForRendering(encoded);
    expect(decoded).toHaveLength(3);
    // Decoded format is [lng, lat]
    expect(decoded[0][1]).toBeCloseTo(48.137, 4);
    expect(decoded[0][0]).toBeCloseTo(11.575, 4);
    expect(decoded[2][1]).toBeCloseTo(48.139, 4);
    expect(decoded[2][0]).toBeCloseTo(11.577, 4);
  });
});

describe('computeBounds', () => {
  it('computes correct min/max', () => {
    const points = [
      { lat: 48.0, lng: 11.0 },
      { lat: 48.5, lng: 11.5 },
      { lat: 48.2, lng: 11.2 },
    ];
    const bounds = computeBounds(points);
    expect(bounds.minLat).toBe(48.0);
    expect(bounds.maxLat).toBe(48.5);
    expect(bounds.minLng).toBe(11.0);
    expect(bounds.maxLng).toBe(11.5);
  });
});

describe('buildSessionGPS', () => {
  it('returns null for < 2 GPS points', () => {
    const records = [
      { sessionId: 's1', timestamp: 0, lat: 48.0, lng: 11.0 },
    ];
    expect(buildSessionGPS('s1', records)).toBeNull();
  });

  it('returns null for indoor activities (no GPS)', () => {
    const records = makeIndoorRecords('s1', 100);
    expect(buildSessionGPS('s1', records)).toBeNull();
  });

  it('builds valid SessionGPS for outdoor activity', () => {
    const records = makeGPSRunningRecords('s1', 200);
    const result = buildSessionGPS('s1', records);
    expect(result).not.toBeNull();
    expect(result!.sessionId).toBe('s1');
    expect(result!.encodedPolyline.length).toBeGreaterThan(0);
    expect(result!.pointCount).toBeGreaterThan(0);
    expect(result!.bounds.minLat).toBeLessThanOrEqual(result!.bounds.maxLat);
    expect(result!.bounds.minLng).toBeLessThanOrEqual(result!.bounds.maxLng);
  });
});

describe('boundsOverlap', () => {
  it('returns true for overlapping boxes', () => {
    const a = { minLat: 48.0, maxLat: 48.5, minLng: 11.0, maxLng: 11.5 };
    const b = { minLat: 48.3, maxLat: 48.8, minLng: 11.3, maxLng: 11.8 };
    expect(boundsOverlap(a, b)).toBe(true);
  });

  it('returns false for disjoint boxes', () => {
    const a = { minLat: 48.0, maxLat: 48.5, minLng: 11.0, maxLng: 11.5 };
    const b = { minLat: 50.0, maxLat: 50.5, minLng: 13.0, maxLng: 13.5 };
    expect(boundsOverlap(a, b)).toBe(false);
  });

  it('returns true for touching edges', () => {
    const a = { minLat: 48.0, maxLat: 48.5, minLng: 11.0, maxLng: 11.5 };
    const b = { minLat: 48.5, maxLat: 49.0, minLng: 11.5, maxLng: 12.0 };
    expect(boundsOverlap(a, b)).toBe(true);
  });
});

describe('unionBounds', () => {
  it('returns null for empty array', () => {
    expect(unionBounds([])).toBeNull();
  });

  it('returns correct union for multiple bounds', () => {
    const bounds = [
      { minLat: 48.0, maxLat: 48.5, minLng: 11.0, maxLng: 11.5 },
      { minLat: 47.5, maxLat: 49.0, minLng: 10.5, maxLng: 11.2 },
    ];
    const union = unionBounds(bounds);
    expect(union).not.toBeNull();
    expect(union!.minLat).toBe(47.5);
    expect(union!.maxLat).toBe(49.0);
    expect(union!.minLng).toBe(10.5);
    expect(union!.maxLng).toBe(11.5);
  });

  it('returns single bounds unchanged', () => {
    const bounds = [
      { minLat: 48.0, maxLat: 48.5, minLng: 11.0, maxLng: 11.5 },
    ];
    const union = unionBounds(bounds);
    expect(union).toEqual(bounds[0]);
  });
});

describe('boundsCenter', () => {
  it('returns the midpoint of a bounds box', () => {
    const b = { minLat: 48.0, maxLat: 48.4, minLng: 11.0, maxLng: 11.6 };
    const center = boundsCenter(b);
    expect(center.lat).toBeCloseTo(48.2, 5);
    expect(center.lng).toBeCloseTo(11.3, 5);
  });
});

describe('scaledDistDeg', () => {
  it('returns 0 for identical points', () => {
    const p = { lat: 48.137, lng: 11.575 };
    expect(scaledDistDeg(p, p)).toBe(0);
  });

  it('returns greater distance for longitude at equator than at high latitude', () => {
    const a = { lat: 0, lng: 0 };
    const b = { lat: 0, lng: 1 };
    const distEquator = scaledDistDeg(a, b);
    const c = { lat: 60, lng: 0 };
    const d = { lat: 60, lng: 1 };
    const distHighLat = scaledDistDeg(c, d);
    expect(distEquator).toBeGreaterThan(distHighLat);
  });
});

describe('densestClusterBounds', () => {
  it('returns null for empty array', () => {
    expect(densestClusterBounds([])).toBeNull();
  });

  it('returns single bounds unchanged', () => {
    const b = { minLat: 48.0, maxLat: 48.5, minLng: 11.0, maxLng: 11.5 };
    expect(densestClusterBounds([b])).toEqual(b);
  });

  it('picks the dense cluster over an outlier', () => {
    // 3 overlapping tracks in Munich
    const munich1 = { minLat: 48.0, maxLat: 48.2, minLng: 11.4, maxLng: 11.6 };
    const munich2 = { minLat: 48.1, maxLat: 48.3, minLng: 11.5, maxLng: 11.7 };
    const munich3 = { minLat: 48.05, maxLat: 48.25, minLng: 11.45, maxLng: 11.65 };
    // 1 outlier in Berlin
    const berlin = { minLat: 52.4, maxLat: 52.6, minLng: 13.3, maxLng: 13.5 };

    const result = densestClusterBounds([munich1, munich2, munich3, berlin]);
    expect(result).not.toBeNull();
    // Result should cover Munich, not Berlin
    expect(result!.maxLat).toBeLessThan(49);
    expect(result!.minLng).toBeGreaterThan(11);
  });

  it('returns union of all when everything overlaps', () => {
    const a = { minLat: 48.0, maxLat: 48.5, minLng: 11.0, maxLng: 11.5 };
    const b = { minLat: 48.2, maxLat: 48.7, minLng: 11.2, maxLng: 11.7 };
    const result = densestClusterBounds([a, b]);
    expect(result).toEqual(unionBounds([a, b]));
  });

  it('large bounding box should NOT win over a cluster of small tracks', () => {
    // 5 short runs in Munich (centers cluster tightly around 48.14, 11.57)
    const munichRun1 = { minLat: 48.12, maxLat: 48.15, minLng: 11.55, maxLng: 11.58 };
    const munichRun2 = { minLat: 48.13, maxLat: 48.16, minLng: 11.56, maxLng: 11.59 };
    const munichRun3 = { minLat: 48.11, maxLat: 48.14, minLng: 11.54, maxLng: 11.57 };
    const munichRun4 = { minLat: 48.14, maxLat: 48.17, minLng: 11.57, maxLng: 11.60 };
    const munichRun5 = { minLat: 48.10, maxLat: 48.13, minLng: 11.53, maxLng: 11.56 };
    // 1 long bike ride Munich → Alps (center ≈ 47.6, 11.7 — outside radius of Munich cluster)
    const alpsBikeRide = { minLat: 47.0, maxLat: 48.2, minLng: 11.0, maxLng: 12.4 };

    const result = densestClusterBounds([
      munichRun1, munichRun2, munichRun3, munichRun4, munichRun5, alpsBikeRide,
    ]);

    expect(result).not.toBeNull();
    // Viewport should cover Munich, not stretch to the Alps
    expect(result!.minLat).toBeGreaterThan(48.0);
    expect(result!.maxLat).toBeLessThan(48.5);
    expect(result!.minLng).toBeGreaterThan(11.4);
    expect(result!.maxLng).toBeLessThan(11.7);
  });
});

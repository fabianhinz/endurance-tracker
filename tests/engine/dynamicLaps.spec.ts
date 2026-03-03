import { describe, it, expect } from 'vitest';
import { computeDynamicLaps } from '@/engine/dynamicLaps.ts';
import type { SessionRecord } from '@/engine/types.ts';
import { makeRunningRecords, makeCyclingRecords } from '@tests/factories/records.ts';

describe('computeDynamicLaps', () => {
  it('returns empty for empty records', () => {
    const result = computeDynamicLaps([], 1000);
    expect(result.analysis).toEqual([]);
    expect(result.enrichments).toEqual([]);
  });

  it('returns empty for single record', () => {
    const records: SessionRecord[] = [{ sessionId: 'test', timestamp: 0, distance: 0 }];
    const result = computeDynamicLaps(records, 1000);
    expect(result.analysis).toEqual([]);
    expect(result.enrichments).toEqual([]);
  });

  it('returns empty for records without distance', () => {
    const records: SessionRecord[] = [
      { sessionId: 'test', timestamp: 0 },
      { sessionId: 'test', timestamp: 1 },
      { sessionId: 'test', timestamp: 2 },
    ];
    const result = computeDynamicLaps(records, 1000);
    expect(result.analysis).toEqual([]);
    expect(result.enrichments).toEqual([]);
  });

  it('produces correct split count for running records with 1km splits', () => {
    // ~3.5 m/s for 1000s → ~3500m → 3 full km splits + partial
    const records = makeRunningRecords('test', 1000);
    const result = computeDynamicLaps(records, 1000);
    // Total distance ~3500m, so we expect 3 full splits + 1 partial
    expect(result.analysis.length).toBeGreaterThanOrEqual(3);
    result.analysis.forEach((lap, i) => {
      expect(lap.lapIndex).toBe(i);
    });
  });

  it('produces correct split count for cycling records with 5km splits', () => {
    // ~8-9 m/s for 2000s → ~16-18km → 3 full 5km splits + partial
    const records = makeCyclingRecords('test', 2000);
    const result = computeDynamicLaps(records, 5000);
    expect(result.analysis.length).toBeGreaterThanOrEqual(3);
    result.analysis.forEach((lap, i) => {
      expect(lap.lapIndex).toBe(i);
    });
  });

  it('handles partial final lap', () => {
    // Create records covering ~2500m with 1000m splits → 2 full + 1 partial
    const records = makeRunningRecords('test', 715); // ~715 * 3.5 ≈ 2502m
    const result = computeDynamicLaps(records, 1000);
    expect(result.analysis.length).toBe(3);
    // Last lap should be smaller distance
    const lastLap = result.analysis[result.analysis.length - 1];
    expect(lastLap.distance).toBeLessThan(1000);
    expect(lastLap.distance).toBeGreaterThan(0);
  });

  it('returns 1 partial lap when split distance exceeds total distance', () => {
    // ~3.5 m/s for 100s → ~350m, split at 1000m → just 1 partial lap
    const records = makeRunningRecords('test', 100);
    const result = computeDynamicLaps(records, 1000);
    expect(result.analysis).toHaveLength(1);
    expect(result.analysis[0].distance).toBeLessThan(1000);
  });

  it('computes pace correctly for running', () => {
    const records = makeRunningRecords('test', 1000);
    const result = computeDynamicLaps(records, 1000);
    // For running at ~3.5 m/s, pace ≈ 1000/3.5 ≈ 286 sec/km
    result.analysis.forEach((lap) => {
      expect(lap.paceSecPerKm).toBeDefined();
      expect(lap.paceSecPerKm!).toBeGreaterThan(200);
      expect(lap.paceSecPerKm!).toBeLessThan(400);
    });
  });

  it('aggregates HR data', () => {
    const records = makeRunningRecords('test', 1000);
    const result = computeDynamicLaps(records, 1000);
    result.analysis.forEach((lap) => {
      expect(lap.avgHr).toBeDefined();
      expect(lap.avgHr!).toBeGreaterThan(100);
      expect(lap.maxHr).toBeDefined();
      expect(lap.maxHr!).toBeGreaterThanOrEqual(lap.avgHr!);
    });
  });

  it('computes elevation gain (positive deltas only)', () => {
    const records = makeRunningRecords('test', 1000);
    const result = computeDynamicLaps(records, 1000);
    result.analysis.forEach((lap) => {
      expect(lap.elevationGain).toBeGreaterThanOrEqual(0);
    });
  });

  it('produces enrichments with correct lapIndex', () => {
    const records = makeRunningRecords('test', 1000);
    const result = computeDynamicLaps(records, 1000);
    expect(result.enrichments).toHaveLength(result.analysis.length);
    result.enrichments.forEach((e, i) => {
      expect(e.lapIndex).toBe(i);
    });
  });

  it('all laps have intensity active and isInterval false', () => {
    const records = makeRunningRecords('test', 1000);
    const result = computeDynamicLaps(records, 1000);
    result.analysis.forEach((lap) => {
      expect(lap.intensity).toBe('active');
      expect(lap.isInterval).toBe(false);
    });
  });

  it('enrichments include minHr from records', () => {
    const records = makeRunningRecords('test', 1000);
    const result = computeDynamicLaps(records, 1000);
    result.enrichments.forEach((e) => {
      expect(e.minHr).toBeDefined();
      expect(e.minHr!).toBeGreaterThan(0);
    });
  });

  it('computes maxSpeed from records', () => {
    const records = makeRunningRecords('test', 1000);
    const result = computeDynamicLaps(records, 1000);
    result.analysis.forEach((lap) => {
      expect(lap.maxSpeed).toBeDefined();
      expect(lap.maxSpeed!).toBeGreaterThan(0);
    });
  });

  it('computes avgCadence when cadence data is present', () => {
    const records = makeCyclingRecords('test', 2000);
    const result = computeDynamicLaps(records, 5000);
    result.analysis.forEach((lap) => {
      expect(lap.avgCadence).toBeDefined();
      expect(lap.avgCadence!).toBeGreaterThan(0);
    });
  });
});

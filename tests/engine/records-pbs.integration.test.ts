import { describe, it, expect } from 'vitest';
import {
  extractPeakPower,
  extractFastestDistances,
  detectNewPBs,
  mergePBs,
  POWER_WINDOWS,
  RUNNING_DISTANCES,
  SWIMMING_DISTANCES,
} from '../../src/engine/records.ts';
import { makeCyclingRecords, makeRunningRecords, makeSwimmingRecords } from '../factories/records.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('extractPeakPower', () => {
  it('extracts peak power across all 5 windows', () => {
    const records = makeCyclingRecords('s1', 3600, { basePower: 250 });
    const peaks = extractPeakPower(records);

    expect(peaks.has(5)).toBe(true);
    expect(peaks.has(60)).toBe(true);
    expect(peaks.has(300)).toBe(true);
    expect(peaks.has(1200)).toBe(true);
    expect(peaks.has(3600)).toBe(true);

    // Shorter windows should have >= peaks than longer windows
    expect(peaks.get(5)!).toBeGreaterThanOrEqual(peaks.get(60)!);
    expect(peaks.get(60)!).toBeGreaterThanOrEqual(peaks.get(300)!);
    expect(peaks.get(300)!).toBeGreaterThanOrEqual(peaks.get(1200)!);
    expect(peaks.get(1200)!).toBeGreaterThanOrEqual(peaks.get(3600)!);
  });

  it('returns empty map for too-short data', () => {
    const records = makeCyclingRecords('s1', 3, { basePower: 250 });
    const peaks = extractPeakPower(records);
    expect(peaks.size).toBe(0);
  });

  it('returns only windows that fit within data length', () => {
    // 120 seconds of data → only 5s and 60s windows fit
    const records = makeCyclingRecords('s1', 120, { basePower: 250 });
    const peaks = extractPeakPower(records);
    expect(peaks.has(5)).toBe(true);
    expect(peaks.has(60)).toBe(true);
    expect(peaks.has(300)).toBe(false);
  });
});

describe('extractFastestDistances', () => {
  it('extracts fastest 1km and 5km from running records', () => {
    // 3600s at ~3.5 m/s ≈ 12.6 km total
    const records = makeRunningRecords('s1', 3600, { baseSpeed: 3.5 });
    const distances = extractFastestDistances(records, RUNNING_DISTANCES);

    expect(distances.has(1000)).toBe(true);
    expect(distances.has(5000)).toBe(true);
    expect(distances.has(10000)).toBe(true);

    // 1km time should be less than 5km time
    expect(distances.get(1000)!).toBeLessThan(distances.get(5000)!);
  });

  it('returns empty map when run is shorter than target', () => {
    // 200s at 3.5 m/s ≈ 700m — not enough for 1km
    const records = makeRunningRecords('s1', 200, { baseSpeed: 3.5 });
    const distances = extractFastestDistances(records, [{ meters: 1000 }]);
    expect(distances.size).toBe(0);
  });

  it('handles swimming distances', () => {
    // 1200s at ~1.5 m/s ≈ 1800m total
    const records = makeSwimmingRecords('s1', 1200, { baseSpeed: 1.5 });
    const distances = extractFastestDistances(records, SWIMMING_DISTANCES);

    expect(distances.has(100)).toBe(true);
    expect(distances.has(400)).toBe(true);
    expect(distances.has(1000)).toBe(true);
    expect(distances.has(1500)).toBe(true);

    // Shorter distance = faster time
    expect(distances.get(100)!).toBeLessThan(distances.get(400)!);
    expect(distances.get(400)!).toBeLessThan(distances.get(1000)!);
  });

  it('returns empty map for records without distance data', () => {
    const records = makeCyclingRecords('s1', 3600).map((r) => ({ ...r, distance: undefined }));
    const distances = extractFastestDistances(records, RUNNING_DISTANCES);
    expect(distances.size).toBe(0);
  });
});

describe('detectNewPBs — cycling power', () => {
  it('detects new PBs with empty existing bests', () => {
    const now = Date.now();
    const records = makeCyclingRecords('s1', 3600, { basePower: 250 });

    const newPBs = detectNewPBs('s1', now, 'cycling', records, []);

    // Should find PBs for all 5 power windows
    const powerPBs = newPBs.filter((pb) => pb.category === 'peak-power');
    expect(powerPBs.length).toBe(5);
    expect(powerPBs.every((pb) => pb.sport === 'cycling')).toBe(true);
    expect(powerPBs.every((pb) => pb.sessionId === 's1')).toBe(true);
  });

  it('detects PB improvement over existing', () => {
    const now = Date.now();
    const records = makeCyclingRecords('s2', 3600, { basePower: 280 });
    const peaks = extractPeakPower(records);

    const existingBests = POWER_WINDOWS.map((w) => ({
      sport: 'cycling' as const,
      category: 'peak-power' as const,
      window: w.seconds,
      value: (peaks.get(w.seconds) ?? 0) - 20,
      sessionId: 'old-session',
      date: now - 10 * DAY_MS,
    }));

    const newPBs = detectNewPBs('s2', now, 'cycling', records, existingBests);
    const powerPBs = newPBs.filter((pb) => pb.category === 'peak-power');
    expect(powerPBs.length).toBe(5);
    powerPBs.forEach((pb) => {
      const existing = existingBests.find((e) => e.window === pb.window);
      expect(pb.value).toBeGreaterThan(existing!.value);
    });
  });

  it('no PB when existing is better', () => {
    const now = Date.now();
    const records = makeCyclingRecords('s3', 3600, { basePower: 200 });
    const peaks = extractPeakPower(records);

    const existingBests = POWER_WINDOWS.map((w) => ({
      sport: 'cycling' as const,
      category: 'peak-power' as const,
      window: w.seconds,
      value: (peaks.get(w.seconds) ?? 0) + 50,
      sessionId: 'best-session',
      date: now - 10 * DAY_MS,
    }));

    const newPBs = detectNewPBs('s3', now, 'cycling', records, existingBests);
    const powerPBs = newPBs.filter((pb) => pb.category === 'peak-power');
    expect(powerPBs.length).toBe(0);
  });

  it('compares against all-time bests (no 90-day window)', () => {
    const now = Date.now();
    const records = makeCyclingRecords('s4', 3600, { basePower: 200 });
    const peaks = extractPeakPower(records);

    // Existing PBs from > 90 days ago with higher values — should still block
    const existingBests = POWER_WINDOWS.map((w) => ({
      sport: 'cycling' as const,
      category: 'peak-power' as const,
      window: w.seconds,
      value: (peaks.get(w.seconds) ?? 0) + 50,
      sessionId: 'ancient-session',
      date: now - 200 * DAY_MS,
    }));

    const newPBs = detectNewPBs('s4', now, 'cycling', records, existingBests);
    const powerPBs = newPBs.filter((pb) => pb.category === 'peak-power');
    expect(powerPBs.length).toBe(0);
  });
});

describe('detectNewPBs — running distances', () => {
  it('detects distance PBs for running', () => {
    const now = Date.now();
    const records = makeRunningRecords('s1', 3600, { baseSpeed: 3.5 });

    const newPBs = detectNewPBs('s1', now, 'running', records, []);
    const distancePBs = newPBs.filter((pb) => pb.category === 'fastest-distance');

    // At 3.5 m/s for 3600s ≈ 12.6 km, should hit 1km, 5km, 10km
    expect(distancePBs.length).toBeGreaterThanOrEqual(2);
    expect(distancePBs.every((pb) => pb.sport === 'running')).toBe(true);
  });

  it('faster run beats slower run (lower time is better)', () => {
    const now = Date.now();
    const fastRecords = makeRunningRecords('fast', 3600, { baseSpeed: 4.5 });
    const slowRecords = makeRunningRecords('slow', 3600, { baseSpeed: 2.5 });

    const fastPBs = detectNewPBs('fast', now, 'running', fastRecords, []);
    const slowPBs = detectNewPBs('slow', now, 'running', slowRecords, fastPBs);

    // Slow session should NOT beat fast session times
    const slowDistancePBs = slowPBs.filter((pb) => pb.category === 'fastest-distance');
    expect(slowDistancePBs.length).toBe(0);
  });
});

describe('detectNewPBs — swimming distances', () => {
  it('detects distance PBs for swimming', () => {
    const now = Date.now();
    // 1200s at 1.5 m/s ≈ 1800m
    const records = makeSwimmingRecords('s1', 1200, { baseSpeed: 1.5 });

    const newPBs = detectNewPBs('s1', now, 'swimming', records, []);
    const distancePBs = newPBs.filter((pb) => pb.category === 'fastest-distance');

    expect(distancePBs.length).toBeGreaterThanOrEqual(3); // 100m, 400m, 1000m at least
    expect(distancePBs.every((pb) => pb.sport === 'swimming')).toBe(true);
  });
});

describe('detectNewPBs — session-level records', () => {
  it('detects longest ride', () => {
    const now = Date.now();
    const records = makeCyclingRecords('s1', 100, { basePower: 200 });

    const newPBs = detectNewPBs('s1', now, 'cycling', records, [], { distance: 50000, elevationGain: 800 });
    const longest = newPBs.find((pb) => pb.category === 'longest');
    const elevation = newPBs.find((pb) => pb.category === 'most-elevation');

    expect(longest).toBeDefined();
    expect(longest!.value).toBe(50000);
    expect(elevation).toBeDefined();
    expect(elevation!.value).toBe(800);
  });

  it('detects longest run', () => {
    const now = Date.now();
    const records = makeRunningRecords('s1', 100, { baseSpeed: 3.5 });

    const newPBs = detectNewPBs('s1', now, 'running', records, [], { distance: 21000 });
    const longest = newPBs.find((pb) => pb.category === 'longest');

    expect(longest).toBeDefined();
    expect(longest!.value).toBe(21000);
  });

  it('does not produce elevation PB for non-cycling sports', () => {
    const now = Date.now();
    const records = makeRunningRecords('s1', 100, { baseSpeed: 3.5 });

    const newPBs = detectNewPBs('s1', now, 'running', records, [], { distance: 10000, elevationGain: 500 });
    const elevation = newPBs.find((pb) => pb.category === 'most-elevation');

    expect(elevation).toBeUndefined();
  });
});

describe('mergePBs', () => {
  it('appends into empty array', () => {
    const incoming = [
      { sport: 'cycling' as const, category: 'peak-power' as const, window: 300, value: 250, sessionId: 's1', date: Date.now() },
    ];
    const result = mergePBs([], incoming);
    expect(result).toEqual(incoming);
  });

  it('replaces matching sport+category+window', () => {
    const existing = [
      { sport: 'cycling' as const, category: 'peak-power' as const, window: 300, value: 230, sessionId: 's1', date: Date.now() - DAY_MS },
    ];
    const incoming = [
      { sport: 'cycling' as const, category: 'peak-power' as const, window: 300, value: 260, sessionId: 's2', date: Date.now() },
    ];
    const result = mergePBs(existing, incoming);
    expect(result.length).toBe(1);
    expect(result[0].value).toBe(260);
    expect(result[0].sessionId).toBe('s2');
  });

  it('appends non-overlapping entries', () => {
    const existing = [
      { sport: 'cycling' as const, category: 'peak-power' as const, window: 300, value: 250, sessionId: 's1', date: Date.now() },
    ];
    const incoming = [
      { sport: 'running' as const, category: 'fastest-distance' as const, window: 1000, value: 280, sessionId: 's2', date: Date.now() },
    ];
    const result = mergePBs(existing, incoming);
    expect(result.length).toBe(2);
  });

  it('does not mutate the existing array', () => {
    const existing = [
      { sport: 'cycling' as const, category: 'peak-power' as const, window: 300, value: 230, sessionId: 's1', date: Date.now() },
    ];
    const copy = [...existing];
    mergePBs(existing, [
      { sport: 'cycling' as const, category: 'peak-power' as const, window: 300, value: 260, sessionId: 's2', date: Date.now() },
    ]);
    expect(existing).toEqual(copy);
  });
});

describe('multi-file upload PB accumulation', () => {
  it('fastest session gets PBs when processing multiple sessions sequentially', () => {
    const now = Date.now();
    const slowRecords = makeRunningRecords('slow', 3600, { baseSpeed: 2.5 });
    const mediumRecords = makeRunningRecords('medium', 3600, { baseSpeed: 3.5 });
    const fastRecords = makeRunningRecords('fast', 3600, { baseSpeed: 4.5 });

    let accumulatedBests: import('../../src/types/index.ts').PersonalBest[] = [];

    const slowPBs = detectNewPBs('slow', now, 'running', slowRecords, accumulatedBests);
    accumulatedBests = mergePBs(accumulatedBests, slowPBs);

    const mediumPBs = detectNewPBs('medium', now, 'running', mediumRecords, accumulatedBests);
    accumulatedBests = mergePBs(accumulatedBests, mediumPBs);

    const fastPBs = detectNewPBs('fast', now, 'running', fastRecords, accumulatedBests);
    accumulatedBests = mergePBs(accumulatedBests, fastPBs);

    const distancePBs = accumulatedBests.filter((pb) => pb.category === 'fastest-distance');
    expect(distancePBs.every((pb) => pb.sessionId === 'fast')).toBe(true);
  });
});

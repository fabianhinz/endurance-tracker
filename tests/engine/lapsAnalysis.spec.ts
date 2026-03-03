import { describe, it, expect } from 'vitest';
import {
  analyzeLaps,
  detectIntervals,
  detectProgressiveOverload,
  filterRecordsByLap,
  enrichLapFromRecords,
  enrichAllLaps,
} from '@/engine/laps.ts';
import type { SessionLap, SessionRecord } from '@/engine/types.ts';
import { makeLaps, makeCyclingRecords, makeRunningRecords } from '@tests/factories/records.ts';

function makeLap(overrides: Partial<SessionLap> = {}): SessionLap {
  return {
    sessionId: 'test',
    lapIndex: 0,
    startTime: 0,
    endTime: 300_000,
    totalElapsedTime: 300,
    totalTimerTime: 300,
    distance: 1000,
    avgSpeed: 3.33,
    intensity: 'active',
    ...overrides,
  };
}

describe('analyzeLaps', () => {
  it('returns empty array for empty input', () => {
    expect(analyzeLaps([])).toEqual([]);
  });

  it('computes pace from distance and duration', () => {
    const laps = [makeLap({ distance: 1000, totalTimerTime: 300 })];
    const result = analyzeLaps(laps);
    expect(result).toHaveLength(1);
    // 300s / 1km = 300 sec/km
    expect(result[0].paceSecPerKm).toBe(300);
  });

  it('returns undefined pace when distance is 0', () => {
    const laps = [makeLap({ distance: 0 })];
    const result = analyzeLaps(laps);
    expect(result[0].paceSecPerKm).toBeUndefined();
  });

  it('marks intervals only when there are mixed intensities', () => {
    const laps = [
      makeLap({ lapIndex: 0, intensity: 'active' }),
      makeLap({ lapIndex: 1, intensity: 'rest' }),
      makeLap({ lapIndex: 2, intensity: 'active' }),
    ];
    const result = analyzeLaps(laps);
    expect(result[0].isInterval).toBe(true);
    expect(result[1].isInterval).toBe(false);
    expect(result[2].isInterval).toBe(true);
  });

  it('all-active laps are not intervals (steady state)', () => {
    const laps = [
      makeLap({ lapIndex: 0, intensity: 'active' }),
      makeLap({ lapIndex: 1, intensity: 'active' }),
    ];
    const result = analyzeLaps(laps);
    expect(result[0].isInterval).toBe(false);
    expect(result[1].isInterval).toBe(false);
  });

  it('uses movingTime for pace when available', () => {
    const laps = [makeLap({ distance: 1000, totalTimerTime: 300, totalMovingTime: 280 })];
    const result = analyzeLaps(laps);
    // 280s / 1km = 280 sec/km
    expect(result[0].paceSecPerKm).toBe(280);
  });
});

describe('detectIntervals', () => {
  it('returns empty for all-active laps (steady state)', () => {
    const laps = [
      makeLap({ lapIndex: 0, intensity: 'active' }),
      makeLap({ lapIndex: 1, intensity: 'active' }),
    ];
    expect(detectIntervals(laps)).toEqual([]);
  });

  it('pairs active laps with following recovery laps', () => {
    const laps = [
      makeLap({ lapIndex: 0, intensity: 'active', maxHr: 170 }),
      makeLap({ lapIndex: 1, intensity: 'rest', minHr: 130 }),
      makeLap({ lapIndex: 2, intensity: 'active', maxHr: 175 }),
      makeLap({ lapIndex: 3, intensity: 'rest', minHr: 135 }),
    ];
    const pairs = detectIntervals(laps);
    expect(pairs).toHaveLength(2);
    expect(pairs[0].active.lapIndex).toBe(0);
    expect(pairs[0].recovery?.lapIndex).toBe(1);
    expect(pairs[0].hrRecovery).toBe(40); // 170 - 130
    expect(pairs[1].active.lapIndex).toBe(2);
    expect(pairs[1].recovery?.lapIndex).toBe(3);
    expect(pairs[1].hrRecovery).toBe(40); // 175 - 135
  });

  it('handles trailing active lap without recovery', () => {
    const laps = [
      makeLap({ lapIndex: 0, intensity: 'active', maxHr: 170 }),
      makeLap({ lapIndex: 1, intensity: 'rest', minHr: 130 }),
      makeLap({ lapIndex: 2, intensity: 'active', maxHr: 175 }),
    ];
    const pairs = detectIntervals(laps);
    expect(pairs).toHaveLength(2);
    expect(pairs[1].recovery).toBeUndefined();
    expect(pairs[1].hrRecovery).toBeUndefined();
  });

  it('handles missing HR data gracefully', () => {
    const laps = [
      makeLap({ lapIndex: 0, intensity: 'active' }),
      makeLap({ lapIndex: 1, intensity: 'rest' }),
    ];
    const pairs = detectIntervals(laps);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].hrRecovery).toBeUndefined();
  });
});

describe('detectProgressiveOverload', () => {
  it('returns stable with single lap', () => {
    const result = detectProgressiveOverload([makeLap()]);
    expect(result.trend).toBe('stable');
    expect(result.lapCount).toBe(1);
    expect(result.paceDriftPercent).toBeUndefined();
  });

  it('detects fading: pace slowing across intervals', () => {
    const laps = [
      makeLap({
        lapIndex: 0,
        intensity: 'active',
        distance: 1000,
        totalTimerTime: 300,
        avgHr: 155,
      }),
      makeLap({ lapIndex: 1, intensity: 'rest', distance: 500, totalTimerTime: 180 }),
      makeLap({
        lapIndex: 2,
        intensity: 'active',
        distance: 1000,
        totalTimerTime: 330,
        avgHr: 162,
      }),
      makeLap({ lapIndex: 3, intensity: 'rest', distance: 500, totalTimerTime: 180 }),
      makeLap({
        lapIndex: 4,
        intensity: 'active',
        distance: 1000,
        totalTimerTime: 360,
        avgHr: 168,
      }),
    ];
    const result = detectProgressiveOverload(laps);
    expect(result.trend).toBe('fading');
    expect(result.lapCount).toBe(3);
    expect(result.paceDriftPercent).toBeDefined();
    expect(result.paceDriftPercent!).toBeGreaterThan(3);
  });

  it('detects stable: minimal drift', () => {
    const laps = [
      makeLap({
        lapIndex: 0,
        intensity: 'active',
        distance: 1000,
        totalTimerTime: 300,
        avgHr: 155,
      }),
      makeLap({ lapIndex: 1, intensity: 'rest', distance: 500, totalTimerTime: 180 }),
      makeLap({
        lapIndex: 2,
        intensity: 'active',
        distance: 1000,
        totalTimerTime: 303,
        avgHr: 156,
      }),
      makeLap({ lapIndex: 3, intensity: 'rest', distance: 500, totalTimerTime: 180 }),
      makeLap({
        lapIndex: 4,
        intensity: 'active',
        distance: 1000,
        totalTimerTime: 302,
        avgHr: 157,
      }),
    ];
    const result = detectProgressiveOverload(laps);
    expect(result.trend).toBe('stable');
  });

  it('detects building: pace improving (negative drift)', () => {
    const laps = [
      makeLap({
        lapIndex: 0,
        intensity: 'active',
        distance: 1000,
        totalTimerTime: 330,
        avgHr: 155,
      }),
      makeLap({ lapIndex: 1, intensity: 'rest', distance: 500, totalTimerTime: 180 }),
      makeLap({
        lapIndex: 2,
        intensity: 'active',
        distance: 1000,
        totalTimerTime: 300,
        avgHr: 162,
      }),
    ];
    const result = detectProgressiveOverload(laps);
    expect(result.trend).toBe('building');
    expect(result.paceDriftPercent!).toBeLessThan(-3);
  });

  it('uses all laps when no intervals detected (steady state)', () => {
    const laps = [
      makeLap({
        lapIndex: 0,
        intensity: 'active',
        distance: 1000,
        totalTimerTime: 300,
        avgHr: 150,
      }),
      makeLap({
        lapIndex: 1,
        intensity: 'active',
        distance: 1000,
        totalTimerTime: 330,
        avgHr: 158,
      }),
    ];
    const result = detectProgressiveOverload(laps);
    expect(result.lapCount).toBe(2);
    expect(result.paceDriftPercent).toBeDefined();
  });
});

describe('filterRecordsByLap', () => {
  it('returns records within lap bounds', () => {
    const lap = makeLap({ startTime: 0, endTime: 300_000 });
    const records: SessionRecord[] = [
      { sessionId: 'test', timestamp: 0 },
      { sessionId: 'test', timestamp: 150 },
      { sessionId: 'test', timestamp: 299 },
      { sessionId: 'test', timestamp: 300 }, // excluded (endTime boundary)
      { sessionId: 'test', timestamp: 500 },
    ];
    const result = filterRecordsByLap(records, lap, 0);
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.timestamp)).toEqual([0, 150, 299]);
  });

  it('handles non-zero session start (ms-to-seconds conversion)', () => {
    const sessionStartMs = 1_000_000;
    const lap = makeLap({
      startTime: sessionStartMs + 300_000,
      endTime: sessionStartMs + 600_000,
    });
    const records: SessionRecord[] = [
      { sessionId: 'test', timestamp: 200 },
      { sessionId: 'test', timestamp: 300 }, // lap start
      { sessionId: 'test', timestamp: 450 },
      { sessionId: 'test', timestamp: 599 },
      { sessionId: 'test', timestamp: 600 }, // excluded
    ];
    const result = filterRecordsByLap(records, lap, sessionStartMs);
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.timestamp)).toEqual([300, 450, 599]);
  });

  it('returns empty for empty records', () => {
    const lap = makeLap({ startTime: 0, endTime: 300_000 });
    expect(filterRecordsByLap([], lap, 0)).toHaveLength(0);
  });

  it('returns empty when no records fall within the lap', () => {
    const lap = makeLap({ startTime: 0, endTime: 300_000 });
    const records: SessionRecord[] = [
      { sessionId: 'test', timestamp: 400 },
      { sessionId: 'test', timestamp: 500 },
    ];
    expect(filterRecordsByLap(records, lap, 0)).toHaveLength(0);
  });
});

describe('enrichLapFromRecords', () => {
  it('computes power metrics from cycling records', () => {
    const records = makeCyclingRecords('test', 100);
    const result = enrichLapFromRecords(0, records);
    expect(result.lapIndex).toBe(0);
    expect(result.avgPower).toBeDefined();
    expect(result.minPower).toBeDefined();
    expect(result.maxPower).toBeDefined();
    expect(result.minPower!).toBeLessThanOrEqual(result.avgPower!);
    expect(result.maxPower!).toBeGreaterThanOrEqual(result.avgPower!);
  });

  it('computes minSpeed from running records', () => {
    const records = makeRunningRecords('test', 100);
    const result = enrichLapFromRecords(0, records);
    expect(result.minSpeed).toBeDefined();
    expect(result.minSpeed!).toBeGreaterThan(0);
    // running records don't have power
    expect(result.avgPower).toBeUndefined();
  });

  it('returns undefined fields when data is absent', () => {
    const records: SessionRecord[] = [
      { sessionId: 'test', timestamp: 0 },
      { sessionId: 'test', timestamp: 1 },
    ];
    const result = enrichLapFromRecords(0, records);
    expect(result.minSpeed).toBeUndefined();
    expect(result.avgPower).toBeUndefined();
    expect(result.minPower).toBeUndefined();
    expect(result.maxPower).toBeUndefined();
    expect(result.minCadence).toBeUndefined();
    expect(result.minHr).toBeUndefined();
  });

  it('excludes zero-speed records from minSpeed', () => {
    const records: SessionRecord[] = [
      { sessionId: 'test', timestamp: 0, speed: 0 },
      { sessionId: 'test', timestamp: 1, speed: 3.5 },
      { sessionId: 'test', timestamp: 2, speed: 4.0 },
    ];
    const result = enrichLapFromRecords(0, records);
    expect(result.minSpeed).toBe(3.5);
  });

  it('excludes near-zero speeds below MIN_SPEED_MS threshold', () => {
    const records: SessionRecord[] = [
      { sessionId: 'test', timestamp: 0, speed: 0.01 },
      { sessionId: 'test', timestamp: 1, speed: 0.3 },
      { sessionId: 'test', timestamp: 2, speed: 2.5 },
      { sessionId: 'test', timestamp: 3, speed: 3.0 },
    ];
    const result = enrichLapFromRecords(0, records);
    // speeds 0.01 and 0.3 are below 0.5 m/s threshold
    expect(result.minSpeed).toBe(2.5);
  });

  it('returns undefined minSpeed when all speeds are below threshold', () => {
    const records: SessionRecord[] = [
      { sessionId: 'test', timestamp: 0, speed: 0.1 },
      { sessionId: 'test', timestamp: 1, speed: 0.2 },
      { sessionId: 'test', timestamp: 2, speed: 0.4 },
    ];
    const result = enrichLapFromRecords(0, records);
    expect(result.minSpeed).toBeUndefined();
  });

  it('computes minHr from per-second records', () => {
    const records: SessionRecord[] = Array.from({ length: 20 }, (_, i) => ({
      sessionId: 'test',
      timestamp: i,
      hr: 130 + i,
    }));
    const result = enrichLapFromRecords(0, records);
    expect(result.minHr).toBeDefined();
    expect(result.minHr).toBe(130);
  });

  it('returns true minimum for power (zero excluded by pre-filter)', () => {
    const records: SessionRecord[] = [
      { sessionId: 'test', timestamp: 0, power: 0 },
      ...Array.from({ length: 19 }, (_, i) => ({
        sessionId: 'test',
        timestamp: i + 1,
        power: 180 + i * 2,
      })),
    ];
    const result = enrichLapFromRecords(0, records);
    // The 0W record is excluded by the > 0 filter; true min is 180
    expect(result.minPower).toBe(180);
  });

  it('returns true minimum HR including outliers', () => {
    const records: SessionRecord[] = [
      { sessionId: 'test', timestamp: 0, hr: 50 }, // sensor glitch — now included as true min
      ...Array.from({ length: 20 }, (_, i) => ({
        sessionId: 'test',
        timestamp: i + 1,
        hr: 140 + i,
      })),
    ];
    const result = enrichLapFromRecords(0, records);
    // sorted: [50, 140, 141, ..., 159] — true min is 50
    expect(result.minHr).toBe(50);
  });

  it('excludes zero-power coasting from minPower', () => {
    const records: SessionRecord[] = [
      { sessionId: 'test', timestamp: 0, power: 0 },
      { sessionId: 'test', timestamp: 1, power: 0 },
      { sessionId: 'test', timestamp: 2, power: 150 },
      { sessionId: 'test', timestamp: 3, power: 200 },
      { sessionId: 'test', timestamp: 4, power: 180 },
    ];
    const result = enrichLapFromRecords(0, records);
    // Zero-power records filtered out; remaining: [150, 180, 200]
    expect(result.minPower).toBe(150);
  });

  it('excludes zero-cadence from minCadence', () => {
    const records: SessionRecord[] = [
      { sessionId: 'test', timestamp: 0, cadence: 0 },
      { sessionId: 'test', timestamp: 1, cadence: 70 },
      { sessionId: 'test', timestamp: 2, cadence: 80 },
      { sessionId: 'test', timestamp: 3, cadence: 85 },
    ];
    const result = enrichLapFromRecords(0, records);
    expect(result.minCadence).toBe(70);
  });
});

describe('enrichAllLaps', () => {
  it('enriches each lap with correct record slice (cycling)', () => {
    const laps = makeLaps('test', 5);
    // makeLaps: 300s per lap → total 1500s. Generate matching records.
    const records = makeCyclingRecords('test', 1500);
    const result = enrichAllLaps(laps, records);
    expect(result).toHaveLength(5);
    result.forEach((e, i) => {
      expect(e.lapIndex).toBe(i);
      expect(e.avgPower).toBeDefined();
    });
  });

  it('enriches each lap with correct record slice (running)', () => {
    const laps = makeLaps('test', 5);
    const records = makeRunningRecords('test', 1500);
    const result = enrichAllLaps(laps, records);
    expect(result).toHaveLength(5);
    result.forEach((e, i) => {
      expect(e.lapIndex).toBe(i);
      expect(e.minSpeed).toBeDefined();
      expect(e.avgPower).toBeUndefined();
    });
  });

  it('returns empty for empty laps', () => {
    const records = makeCyclingRecords('test', 100);
    expect(enrichAllLaps([], records)).toHaveLength(0);
  });

  it('returns empty for empty records', () => {
    const laps = makeLaps('test', 3);
    expect(enrichAllLaps(laps, [])).toHaveLength(0);
  });
});

import { describe, it, expect } from 'vitest';
import { analyzeLaps, detectIntervals, detectProgressiveOverload } from '../../src/engine/laps.ts';
import type { SessionLap } from '../../src/engine/types.ts';

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
      makeLap({ lapIndex: 0, intensity: 'active', distance: 1000, totalTimerTime: 300, avgHr: 155 }),
      makeLap({ lapIndex: 1, intensity: 'rest', distance: 500, totalTimerTime: 180 }),
      makeLap({ lapIndex: 2, intensity: 'active', distance: 1000, totalTimerTime: 330, avgHr: 162 }),
      makeLap({ lapIndex: 3, intensity: 'rest', distance: 500, totalTimerTime: 180 }),
      makeLap({ lapIndex: 4, intensity: 'active', distance: 1000, totalTimerTime: 360, avgHr: 168 }),
    ];
    const result = detectProgressiveOverload(laps);
    expect(result.trend).toBe('fading');
    expect(result.lapCount).toBe(3);
    expect(result.paceDriftPercent).toBeDefined();
    expect(result.paceDriftPercent!).toBeGreaterThan(3);
  });

  it('detects stable: minimal drift', () => {
    const laps = [
      makeLap({ lapIndex: 0, intensity: 'active', distance: 1000, totalTimerTime: 300, avgHr: 155 }),
      makeLap({ lapIndex: 1, intensity: 'rest', distance: 500, totalTimerTime: 180 }),
      makeLap({ lapIndex: 2, intensity: 'active', distance: 1000, totalTimerTime: 303, avgHr: 156 }),
      makeLap({ lapIndex: 3, intensity: 'rest', distance: 500, totalTimerTime: 180 }),
      makeLap({ lapIndex: 4, intensity: 'active', distance: 1000, totalTimerTime: 302, avgHr: 157 }),
    ];
    const result = detectProgressiveOverload(laps);
    expect(result.trend).toBe('stable');
  });

  it('detects building: pace improving (negative drift)', () => {
    const laps = [
      makeLap({ lapIndex: 0, intensity: 'active', distance: 1000, totalTimerTime: 330, avgHr: 155 }),
      makeLap({ lapIndex: 1, intensity: 'rest', distance: 500, totalTimerTime: 180 }),
      makeLap({ lapIndex: 2, intensity: 'active', distance: 1000, totalTimerTime: 300, avgHr: 162 }),
    ];
    const result = detectProgressiveOverload(laps);
    expect(result.trend).toBe('building');
    expect(result.paceDriftPercent!).toBeLessThan(-3);
  });

  it('uses all laps when no intervals detected (steady state)', () => {
    const laps = [
      makeLap({ lapIndex: 0, intensity: 'active', distance: 1000, totalTimerTime: 300, avgHr: 150 }),
      makeLap({ lapIndex: 1, intensity: 'active', distance: 1000, totalTimerTime: 330, avgHr: 158 }),
    ];
    const result = detectProgressiveOverload(laps);
    expect(result.lapCount).toBe(2);
    expect(result.paceDriftPercent).toBeDefined();
  });
});

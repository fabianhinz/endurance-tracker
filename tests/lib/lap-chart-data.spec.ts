import { describe, it, expect } from 'vitest';
import {
  prepareLapSplitsData,
  prepareLapHrData,
  prepareHrRecoveryData,
} from '../../src/lib/lap-chart-data.ts';
import { makeLaps } from '../factories/records.ts';

describe('prepareLapSplitsData', () => {
  it('converts laps to split points with pace and speed', () => {
    const laps = makeLaps('s1', 5);
    const result = prepareLapSplitsData(laps);
    expect(result).toHaveLength(5);
    expect(result[0]).toHaveProperty('lap');
    expect(result[0]).toHaveProperty('pace');
    expect(result[0]).toHaveProperty('speed');
    expect(result[0]).toHaveProperty('intensity');
  });

  it('labels laps sequentially', () => {
    const laps = makeLaps('s1', 3);
    const result = prepareLapSplitsData(laps);
    expect(result.map((r) => r.lap)).toEqual(['Lap 1', 'Lap 2', 'Lap 3']);
  });

  it('filters out laps with zero distance', () => {
    const laps = makeLaps('s1', 3);
    laps[1].distance = 0;
    const result = prepareLapSplitsData(laps);
    expect(result).toHaveLength(2);
  });

  it('converts speed to km/h correctly', () => {
    const laps = makeLaps('s1', 1);
    laps[0].avgSpeed = 10; // 10 m/s = 36 km/h
    const result = prepareLapSplitsData(laps);
    expect(result[0].speed).toBe(36);
  });

  it('returns empty for empty laps', () => {
    expect(prepareLapSplitsData([])).toHaveLength(0);
  });
});

describe('prepareLapHrData', () => {
  it('groups avg/min/max HR per lap', () => {
    const laps = makeLaps('s1', 4);
    const result = prepareLapHrData(laps);
    expect(result).toHaveLength(4);
    expect(result[0]).toHaveProperty('avgHr');
    expect(result[0]).toHaveProperty('minHr');
    expect(result[0]).toHaveProperty('maxHr');
  });

  it('uses avgHr as fallback for missing min/max', () => {
    const laps = makeLaps('s1', 1);
    laps[0].minHr = undefined;
    laps[0].maxHr = undefined;
    laps[0].avgHr = 150;
    const result = prepareLapHrData(laps);
    expect(result[0].minHr).toBe(150);
    expect(result[0].maxHr).toBe(150);
  });

  it('filters out laps without HR data', () => {
    const laps = makeLaps('s1', 3);
    laps[1].avgHr = undefined;
    const result = prepareLapHrData(laps);
    expect(result).toHaveLength(2);
  });

  it('returns empty for empty laps', () => {
    expect(prepareLapHrData([])).toHaveLength(0);
  });
});

describe('prepareHrRecoveryData', () => {
  it('detects active→rest pairs and computes HR drop', () => {
    const laps = makeLaps('s1', 6);
    // makeLaps gives intensity: i % 3 === 0 ? 'rest' : 'active'
    // So: rest(0), active(1), active(2), rest(3), active(4), active(5)
    // Pairs: active(1)→rest(not next is active), active(2)→rest(3) ✓, active(4)→active(5) ✗
    // Only pair: lap2 (active) → lap3 (rest)
    const result = prepareHrRecoveryData(laps);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('drop');
    expect(result[0]).toHaveProperty('color');
  });

  it('colors green for drop > 25 bpm', () => {
    const laps = makeLaps('s1', 2);
    laps[0].intensity = 'active';
    laps[0].maxHr = 180;
    laps[1].intensity = 'rest';
    laps[1].minHr = 140; // drop = 40
    const result = prepareHrRecoveryData(laps);
    expect(result).toHaveLength(1);
    expect(result[0].drop).toBe(40);
    expect(result[0].color).toBe('#4ade80'); // green
  });

  it('colors yellow for drop 15-25 bpm', () => {
    const laps = makeLaps('s1', 2);
    laps[0].intensity = 'active';
    laps[0].maxHr = 175;
    laps[1].intensity = 'rest';
    laps[1].minHr = 155; // drop = 20
    const result = prepareHrRecoveryData(laps);
    expect(result[0].drop).toBe(20);
    expect(result[0].color).toBe('#facc15'); // yellow
  });

  it('colors red for drop < 15 bpm', () => {
    const laps = makeLaps('s1', 2);
    laps[0].intensity = 'active';
    laps[0].maxHr = 175;
    laps[1].intensity = 'rest';
    laps[1].minHr = 165; // drop = 10
    const result = prepareHrRecoveryData(laps);
    expect(result[0].drop).toBe(10);
    expect(result[0].color).toBe('#f87171'); // red
  });

  it('returns empty when no active→rest pairs exist', () => {
    const laps = makeLaps('s1', 3);
    laps[0].intensity = 'active';
    laps[1].intensity = 'active';
    laps[2].intensity = 'active';
    expect(prepareHrRecoveryData(laps)).toHaveLength(0);
  });

  it('returns empty for empty laps', () => {
    expect(prepareHrRecoveryData([])).toHaveLength(0);
  });
});

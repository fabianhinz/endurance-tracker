import { describe, it, expect } from 'vitest';
import {
  prepareLapSplitsData,
  prepareLapHrData,
} from '../../src/lib/lapChartData.ts';
import { analyzeLaps } from '../../src/engine/laps.ts';
import { makeLaps } from '../factories/records.ts';

describe('prepareLapSplitsData', () => {
  it('converts laps to split points with pace and speed', () => {
    const analysis = analyzeLaps(makeLaps('s1', 5));
    const result = prepareLapSplitsData(analysis);
    expect(result).toHaveLength(5);
    expect(result[0]).toHaveProperty('lap');
    expect(result[0]).toHaveProperty('pace');
    expect(result[0]).toHaveProperty('speed');
  });

  it('labels laps sequentially', () => {
    const analysis = analyzeLaps(makeLaps('s1', 3));
    const result = prepareLapSplitsData(analysis);
    expect(result.map((r) => r.lap)).toEqual(['Lap 1', 'Lap 2', 'Lap 3']);
  });

  it('filters out laps with zero distance', () => {
    const laps = makeLaps('s1', 3);
    laps[1].distance = 0;
    const analysis = analyzeLaps(laps);
    const result = prepareLapSplitsData(analysis);
    expect(result).toHaveLength(2);
  });

  it('derives speed from paceSecPerKm consistently with pace', () => {
    const analysis = analyzeLaps(makeLaps('s1', 1));
    const result = prepareLapSplitsData(analysis);
    // pace is sec/km, speed is km/h = 3600 / pace
    expect(result[0].speed).toBeCloseTo(3600 / result[0].pace, 1);
  });

  it('returns empty for empty laps', () => {
    expect(prepareLapSplitsData([])).toHaveLength(0);
  });
});

describe('prepareLapHrData', () => {
  it('groups avg/min/max HR per lap', () => {
    const analysis = analyzeLaps(makeLaps('s1', 4));
    const result = prepareLapHrData(analysis);
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
    const analysis = analyzeLaps(laps);
    const result = prepareLapHrData(analysis);
    expect(result[0].minHr).toBe(150);
    expect(result[0].maxHr).toBe(150);
  });

  it('filters out laps without HR data', () => {
    const laps = makeLaps('s1', 3);
    laps[1].avgHr = undefined;
    const analysis = analyzeLaps(laps);
    const result = prepareLapHrData(analysis);
    expect(result).toHaveLength(2);
  });

  it('returns empty for empty laps', () => {
    expect(prepareLapHrData([])).toHaveLength(0);
  });
});

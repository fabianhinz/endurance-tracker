import { describe, it, expect } from 'vitest';
import {
  prepareLapSplitsData,
  prepareLapHrData,
  prepareLapPowerData,
} from '../../src/lib/lapChartData.ts';
import { analyzeLaps, enrichAllLaps } from '../../src/engine/laps.ts';
import type { LapRecordEnrichment } from '../../src/engine/laps.ts';
import { makeLaps, makeCyclingRecords, makeRunningRecords } from '../factories/records.ts';

describe('prepareLapSplitsData', () => {
  it('converts laps to split points with pace, speed, and max values', () => {
    const analysis = analyzeLaps(makeLaps('s1', 5));
    const result = prepareLapSplitsData(analysis);
    expect(result).toHaveLength(5);
    expect(result[0]).toHaveProperty('lap');
    expect(result[0]).toHaveProperty('pace');
    expect(result[0]).toHaveProperty('speed');
    expect(result[0]).toHaveProperty('maxPace');
    expect(result[0]).toHaveProperty('maxSpeed');
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

  it('derives maxSpeed and maxPace from LapAnalysis.maxSpeed', () => {
    const laps = makeLaps('s1', 1);
    // makeLaps sets maxSpeed to 4.0 m/s for the first lap
    const analysis = analyzeLaps(laps);
    const result = prepareLapSplitsData(analysis);
    // maxSpeed in km/h = 4.0 * 3.6 = 14.4
    expect(result[0].maxSpeed).toBeCloseTo(14.4, 1);
    // maxPace in sec/km = 1000 / 4.0 = 250
    expect(result[0].maxPace).toBeCloseTo(250, 0);
  });

  it('falls back to avg values when maxSpeed is undefined', () => {
    const laps = makeLaps('s1', 1);
    laps[0].maxSpeed = undefined;
    const analysis = analyzeLaps(laps);
    const result = prepareLapSplitsData(analysis);
    expect(result[0].maxSpeed).toBe(result[0].speed);
    expect(result[0].maxPace).toBe(result[0].pace);
  });

  it('returns empty for empty laps', () => {
    expect(prepareLapSplitsData([])).toHaveLength(0);
  });

  it('populates minSpeed/minPace from enrichments', () => {
    const laps = makeLaps('s1', 5);
    const records = makeRunningRecords('s1', 1500);
    const analysis = analyzeLaps(laps);
    const enrichments = enrichAllLaps(laps, records);
    const result = prepareLapSplitsData(analysis, enrichments);
    expect(result.length).toBeGreaterThan(0);
    const withMin = result.filter((r) => r.minSpeed !== undefined);
    expect(withMin.length).toBeGreaterThan(0);
    withMin.forEach((r) => {
      expect(r.minPace).toBeDefined();
      expect(r.minSpeed!).toBeGreaterThan(0);
      expect(r.minPace!).toBeGreaterThan(0);
    });
  });

  it('leaves minSpeed/minPace undefined without enrichments', () => {
    const analysis = analyzeLaps(makeLaps('s1', 3));
    const result = prepareLapSplitsData(analysis);
    result.forEach((r) => {
      expect(r.minSpeed).toBeUndefined();
      expect(r.minPace).toBeUndefined();
    });
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

describe('prepareLapPowerData', () => {
  it('produces power points from cycling enrichments', () => {
    const laps = makeLaps('s1', 5);
    const records = makeCyclingRecords('s1', 1500);
    const enrichments = enrichAllLaps(laps, records);
    const result = prepareLapPowerData(enrichments);
    expect(result.length).toBeGreaterThan(0);
    result.forEach((p) => {
      expect(p.avgPower).toBeDefined();
      expect(p.minPower).toBeLessThanOrEqual(p.avgPower);
      expect(p.maxPower).toBeGreaterThanOrEqual(p.avgPower);
    });
  });

  it('filters out enrichments without power data', () => {
    const enrichments: LapRecordEnrichment[] = [
      { lapIndex: 0, minSpeed: 3.0, avgPower: 200, minPower: 180, maxPower: 240, minCadence: 80 },
      { lapIndex: 1, minSpeed: 3.2, avgPower: undefined, minPower: undefined, maxPower: undefined, minCadence: 82 },
    ];
    const result = prepareLapPowerData(enrichments);
    expect(result).toHaveLength(1);
    expect(result[0].lap).toBe('Lap 1');
  });

  it('returns empty for empty input', () => {
    expect(prepareLapPowerData([])).toHaveLength(0);
  });
});

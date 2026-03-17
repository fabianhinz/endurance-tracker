import { describe, it, expect } from 'vitest';
import { toSeries, normalizeTime, buildSparklineData } from '@/lib/sparklineData.ts';
import { makeRunningRecords } from '@tests/factories/records.ts';

describe('toSeries', () => {
  it('returns null for empty input', () => {
    expect(toSeries([], 'hr')).toBeNull();
  });

  it('computes min, avg, max from points', () => {
    const points = [
      { time: 0, hr: 100 },
      { time: 1, hr: 120 },
      { time: 2, hr: 140 },
    ];
    const result = toSeries(points, 'hr');
    expect(result).not.toBeNull();
    expect(result!.min).toBe(100);
    expect(result!.max).toBe(140);
    expect(result!.avg).toBeCloseTo(120);
    expect(result!.points).toBe(points);
  });

  it('handles single point', () => {
    const points = [{ time: 0, hr: 150 }];
    const result = toSeries(points, 'hr');
    expect(result!.min).toBe(150);
    expect(result!.max).toBe(150);
    expect(result!.avg).toBe(150);
  });
});

describe('normalizeTime', () => {
  it('resets time to sequential indices and preserves originalTime', () => {
    const points = [
      { time: 5.5, hr: 100 },
      { time: 10.2, hr: 110 },
      { time: 15.8, hr: 120 },
    ];
    const result = normalizeTime(points);
    expect(result[0].time).toBe(0);
    expect(result[1].time).toBe(1);
    expect(result[2].time).toBe(2);
    expect(result[0].originalTime).toBe(5.5);
    expect(result[1].originalTime).toBe(10.2);
    expect(result[2].originalTime).toBe(15.8);
  });

  it('returns empty array for empty input', () => {
    expect(normalizeTime([])).toEqual([]);
  });
});

describe('buildSparklineData', () => {
  it('returns all-null series for empty records', () => {
    const result = buildSparklineData([]);
    expect(result.hr).toBeNull();
    expect(result.power).toBeNull();
    expect(result.pace).toBeNull();
    expect(result.speed).toBeNull();
  });

  it('produces series from valid running records', () => {
    const records = makeRunningRecords('test', 10);
    const result = buildSparklineData(records);
    expect(result.hr).not.toBeNull();
    expect(result.pace).not.toBeNull();
  });
});

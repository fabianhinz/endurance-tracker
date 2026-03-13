import { describe, it, expect } from 'vitest';
import {
  toSeries,
  normalizeTime,
  computeDomains,
  recomputeDomains,
  emptyDomains,
  buildSparklineData,
  type SparklineData,
} from '@/lib/sparklineData.ts';
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

describe('computeDomains', () => {
  it('returns all null for empty map', () => {
    const result = computeDomains(new Map());
    expect(result.hr).toBeNull();
    expect(result.power).toBeNull();
    expect(result.pace).toBeNull();
    expect(result.speed).toBeNull();
  });

  it('computes domains across multiple entries', () => {
    const data = new Map<string, SparklineData>([
      [
        'a',
        {
          hr: { points: [], min: 100, avg: 120, max: 140 },
          power: null,
          pace: null,
          speed: null,
        },
      ],
      [
        'b',
        {
          hr: { points: [], min: 90, avg: 115, max: 160 },
          power: null,
          pace: null,
          speed: null,
        },
      ],
    ]);
    const result = computeDomains(data);
    expect(result.hr).not.toBeNull();
    expect(result.hr![0]).toBeLessThan(90);
    expect(result.hr![1]).toBeGreaterThan(160);
    expect(result.power).toBeNull();
  });
});

describe('recomputeDomains', () => {
  const cache = new Map<string, SparklineData>([
    [
      'a',
      {
        hr: { points: [], min: 100, avg: 120, max: 140 },
        power: null,
        pace: null,
        speed: null,
      },
    ],
    [
      'b',
      {
        hr: { points: [], min: 90, avg: 115, max: 160 },
        power: null,
        pace: null,
        speed: null,
      },
    ],
  ]);

  it('returns emptyDomains when no ids are toggled', () => {
    const result = recomputeDomains(new Set(), cache);
    expect(result).toBe(emptyDomains);
  });

  it('filters cache to only toggled ids', () => {
    const result = recomputeDomains(new Set(['a']), cache);
    expect(result.hr).not.toBeNull();
    expect(result.hr![0]).toBeLessThanOrEqual(100);
    expect(result.hr![1]).toBeGreaterThanOrEqual(140);
  });

  it('includes all toggled ids present in cache', () => {
    const result = recomputeDomains(new Set(['a', 'b']), cache);
    expect(result.hr).not.toBeNull();
    expect(result.hr![0]).toBeLessThan(90);
    expect(result.hr![1]).toBeGreaterThan(160);
  });

  it('ignores toggled ids not in cache', () => {
    const result = recomputeDomains(new Set(['missing']), cache);
    expect(result).toBe(emptyDomains);
  });
});

describe('emptyDomains', () => {
  it('has all null fields', () => {
    expect(emptyDomains.hr).toBeNull();
    expect(emptyDomains.power).toBeNull();
    expect(emptyDomains.pace).toBeNull();
    expect(emptyDomains.speed).toBeNull();
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

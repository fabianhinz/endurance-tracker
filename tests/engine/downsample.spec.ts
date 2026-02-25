import { describe, it, expect } from 'vitest';
import { downsample } from '../../src/engine/downsample.ts';

describe('downsample', () => {
  it('returns all records when count is below target', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({ i }));
    const result = downsample(records, 1500);
    expect(result).toHaveLength(100);
    expect(result).toBe(records); // same reference, no copy
  });

  it('returns empty array for empty input', () => {
    const result = downsample([], 1500);
    expect(result).toHaveLength(0);
  });

  it('downsamples a 1-hour session (3600 recs) to ~1800 points', () => {
    const records = Array.from({ length: 3600 }, (_, i) => ({ i }));
    const result = downsample(records, 1500);
    // step = floor(3600 / 1500) = 2 → 3600 / 2 = 1800
    expect(result).toHaveLength(1800);
  });

  it('downsamples a 3-hour session (10800 recs) to ~1543 points', () => {
    const records = Array.from({ length: 10800 }, (_, i) => ({ i }));
    const result = downsample(records, 1500);
    // step = floor(10800 / 1500) = 7 → ceil(10800 / 7) = 1543
    expect(result.length).toBeGreaterThan(1500);
    expect(result.length).toBeLessThanOrEqual(1600);
  });

  it('passes through 30-min session (1800 recs) with step=1', () => {
    const records = Array.from({ length: 1800 }, (_, i) => ({ i }));
    const result = downsample(records, 1500);
    // step = floor(1800 / 1500) = 1 → every point included
    expect(result).toHaveLength(1800);
  });

  it('preserves record order', () => {
    const records = Array.from({ length: 5000 }, (_, i) => ({ val: i }));
    const result = downsample(records, 1500);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].val).toBeGreaterThan(result[i - 1].val);
    }
  });

  it('respects custom target', () => {
    const records = Array.from({ length: 1000 }, (_, i) => ({ i }));
    const result = downsample(records, 100);
    // step = floor(1000 / 100) = 10 → 100 points
    expect(result).toHaveLength(100);
  });

  it('includes first record', () => {
    const records = Array.from({ length: 5000 }, (_, i) => ({ i }));
    const result = downsample(records, 1500);
    expect(result[0]).toEqual({ i: 0 });
  });
});

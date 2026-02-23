import { describe, it, expect } from 'vitest';
import { getMondayOfWeek, buildPlanCacheKey } from '../../src/engine/week-key.ts';

describe('getMondayOfWeek', () => {
  it('returns the same date when input is a Monday', () => {
    expect(getMondayOfWeek('2026-02-09')).toBe('2026-02-09');
  });

  it('returns previous Monday for a mid-week date', () => {
    // Wednesday
    expect(getMondayOfWeek('2026-02-11')).toBe('2026-02-09');
  });

  it('returns previous Monday for a Sunday', () => {
    expect(getMondayOfWeek('2026-02-15')).toBe('2026-02-09');
  });

  it('handles year boundary (Jan 1 is Thursday)', () => {
    // 2026-01-01 is a Thursday, Monday is 2025-12-29
    expect(getMondayOfWeek('2026-01-01')).toBe('2025-12-29');
  });

  it('handles month boundary', () => {
    // 2026-03-01 is a Sunday, Monday is 2026-02-23
    expect(getMondayOfWeek('2026-03-01')).toBe('2026-02-23');
  });

  it('returns Saturday Monday correctly', () => {
    expect(getMondayOfWeek('2026-02-14')).toBe('2026-02-09');
  });
});

describe('buildPlanCacheKey', () => {
  it('builds a colon-separated key', () => {
    expect(buildPlanCacheKey('2026-02-09', 5, 300)).toBe('2026-02-09:5:300');
  });

  it('handles zero sessions', () => {
    expect(buildPlanCacheKey('2026-02-09', 0, 300)).toBe('2026-02-09:0:300');
  });

  it('produces different keys for different inputs', () => {
    const a = buildPlanCacheKey('2026-02-09', 5, 300);
    const b = buildPlanCacheKey('2026-02-09', 6, 300);
    const c = buildPlanCacheKey('2026-02-16', 5, 300);
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });
});

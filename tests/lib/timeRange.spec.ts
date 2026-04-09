import { describe, it, expect } from 'vitest';
import { formatCustomRangeShort } from '@/lib/timeRange.ts';

describe('formatCustomRangeShort', () => {
  it('returns days for ranges under 7', () => {
    expect(formatCustomRangeShort({ from: '2026-01-15', to: '2026-01-15' })).toBe('1d');
    expect(formatCustomRangeShort({ from: '2026-01-01', to: '2026-01-05' })).toBe('5d');
  });

  it('returns weeks for ranges 7-27 days', () => {
    expect(formatCustomRangeShort({ from: '2026-01-01', to: '2026-01-07' })).toBe('1w');
    expect(formatCustomRangeShort({ from: '2026-01-01', to: '2026-01-15' })).toBe('2w');
    expect(formatCustomRangeShort({ from: '2026-01-01', to: '2026-01-21' })).toBe('3w');
  });

  it('returns months for ranges >= 28 days', () => {
    expect(formatCustomRangeShort({ from: '2026-01-01', to: '2026-01-31' })).toBe('1m');
    expect(formatCustomRangeShort({ from: '2026-01-01', to: '2026-03-31' })).toBe('3m');
    expect(formatCustomRangeShort({ from: '2026-01-01', to: '2026-06-15' })).toBe('6m');
    expect(formatCustomRangeShort({ from: '2025-09-01', to: '2026-03-10' })).toBe('6m');
  });

  it('returns years for ranges >= 335 days', () => {
    expect(formatCustomRangeShort({ from: '2025-01-01', to: '2025-12-31' })).toBe('1y');
    expect(formatCustomRangeShort({ from: '2025-01-01', to: '2026-01-01' })).toBe('1y');
  });
});

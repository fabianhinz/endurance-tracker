import { describe, it, expect } from 'vitest';
import { compareTSS } from '../../src/engine/stress.ts';

describe('compareTSS', () => {
  it('returns null when deviceTss is undefined', () => {
    expect(compareTSS(undefined, 100)).toBeNull();
  });

  it('exact match returns high confidence', () => {
    const result = compareTSS(100, 100)!;
    expect(result.confidence).toBe('high');
    expect(result.delta).toBe(0);
    expect(result.divergencePercent).toBe(0);
    expect(result.warning).toBeUndefined();
  });

  it('<5% divergence returns high confidence', () => {
    const result = compareTSS(100, 96)!;
    expect(result.confidence).toBe('high');
    expect(result.divergencePercent).toBe(4);
    expect(result.warning).toBeUndefined();
  });

  it('5% divergence (boundary) returns high confidence', () => {
    const result = compareTSS(100, 95)!;
    expect(result.confidence).toBe('high');
    expect(result.divergencePercent).toBe(5);
    expect(result.warning).toBeUndefined();
  });

  it('just over 5% divergence returns moderate confidence', () => {
    const result = compareTSS(100, 94)!;
    expect(result.confidence).toBe('moderate');
    expect(result.divergencePercent).toBe(6);
    expect(result.warning).toBeUndefined();
  });

  it('15% divergence returns moderate confidence', () => {
    const result = compareTSS(100, 85)!;
    expect(result.confidence).toBe('moderate');
    expect(result.divergencePercent).toBe(15);
    expect(result.warning).toBeUndefined();
  });

  it('>15% divergence returns low confidence with warning', () => {
    const result = compareTSS(100, 80)!;
    expect(result.confidence).toBe('low');
    expect(result.divergencePercent).toBe(20);
    expect(result.warning).toContain('20%');
    expect(result.warning).toContain('device: 100');
    expect(result.warning).toContain('app: 80');
  });

  it('computed higher than device also triggers warning', () => {
    const result = compareTSS(80, 100)!;
    expect(result.confidence).toBe('low');
    expect(result.delta).toBe(20);
    expect(result.divergencePercent).toBe(25);
    expect(result.warning).toBeDefined();
  });

  it('device TSS of 0 returns high confidence with 0 divergence', () => {
    const result = compareTSS(0, 50)!;
    expect(result.confidence).toBe('high');
    expect(result.divergencePercent).toBe(0);
  });

  it('returns correct delta values', () => {
    const result = compareTSS(86, 75)!;
    expect(result.deviceTss).toBe(86);
    expect(result.computedTss).toBe(75);
    expect(result.delta).toBe(11);
  });
});

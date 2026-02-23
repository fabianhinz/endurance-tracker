import { describe, it, expect } from 'vitest';
import { calculateVdot, thresholdPaceFromRace, RACE_DISTANCE_METERS } from '../../src/engine/vdot.ts';

describe('calculateVdot', () => {
  it('5K in 20:00 → VDOT ~50', () => {
    const vdot = calculateVdot(5000, 20);
    expect(vdot).toBeGreaterThan(48);
    expect(vdot).toBeLessThan(52);
  });

  it('10K in 41:00 → VDOT ~50', () => {
    const vdot = calculateVdot(10000, 41);
    expect(vdot).toBeGreaterThan(48);
    expect(vdot).toBeLessThan(52);
  });

  it('marathon in 3:20:00 → VDOT ~47', () => {
    const vdot = calculateVdot(42195, 200);
    expect(vdot).toBeGreaterThan(45);
    expect(vdot).toBeLessThan(49);
  });

  it('faster race → higher VDOT', () => {
    const slow = calculateVdot(5000, 25);
    const fast = calculateVdot(5000, 18);
    expect(fast).toBeGreaterThan(slow);
  });

  it('equivalent performances at different distances yield similar VDOT', () => {
    // Daniels table: VDOT 50 ≈ 5K 20:00, 10K 41:30
    const vdot5k = calculateVdot(5000, 20);
    const vdot10k = calculateVdot(10000, 41.5);
    expect(Math.abs(vdot5k - vdot10k)).toBeLessThan(2);
  });
});

describe('thresholdPaceFromRace', () => {
  it('5K in 20:00 → threshold pace ~4:10-4:20/km', () => {
    const pace = thresholdPaceFromRace(5000, 20);
    expect(pace).toBeGreaterThanOrEqual(250); // 4:10
    expect(pace).toBeLessThanOrEqual(260);    // 4:20
  });

  it('10K in 45:00 → threshold pace ~4:30-4:45/km', () => {
    const pace = thresholdPaceFromRace(10000, 45);
    expect(pace).toBeGreaterThanOrEqual(270); // ~4:30
    expect(pace).toBeLessThanOrEqual(285);    // ~4:45
  });

  it('marathon in 3:30:00 → threshold pace ~4:40-4:55/km', () => {
    const pace = thresholdPaceFromRace(42195, 210);
    expect(pace).toBeGreaterThanOrEqual(280); // ~4:40
    expect(pace).toBeLessThanOrEqual(295);    // ~4:55
  });

  it('returns an integer (sec/km)', () => {
    const pace = thresholdPaceFromRace(5000, 20);
    expect(Number.isInteger(pace)).toBe(true);
  });

  it('faster race → faster threshold pace', () => {
    const slow = thresholdPaceFromRace(5000, 25);
    const fast = thresholdPaceFromRace(5000, 18);
    expect(fast).toBeLessThan(slow);
  });
});

describe('RACE_DISTANCE_METERS', () => {
  it('maps all standard distances', () => {
    expect(RACE_DISTANCE_METERS['5k']).toBe(5000);
    expect(RACE_DISTANCE_METERS['10k']).toBe(10000);
    expect(RACE_DISTANCE_METERS['half-marathon']).toBe(21097.5);
    expect(RACE_DISTANCE_METERS['marathon']).toBe(42195);
  });
});

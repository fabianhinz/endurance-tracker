import { describe, it, expect } from 'vitest';
import {
  calculateTrainingEffect,
  getTrainingEffectLabel,
  getTrainingEffectSummary,
} from '../../src/engine/training-effect.ts';
import { makeRunningRecords, makeCyclingRecords } from '../factories/records.ts';

describe('calculateTrainingEffect', () => {
  it('returns undefined when maxHr <= restHr', () => {
    const records = makeRunningRecords('s1', 3600);
    expect(calculateTrainingEffect(records, 50, 50, 'male', 0)).toBeUndefined();
    expect(calculateTrainingEffect(records, 40, 50, 'male', 0)).toBeUndefined();
  });

  it('returns undefined when no records have HR data', () => {
    const records = makeRunningRecords('s1', 100).map((r) => ({
      ...r,
      hr: undefined,
    }));
    expect(calculateTrainingEffect(records, 190, 50, 'male', 0)).toBeUndefined();
  });

  it('computes aerobic TE > 0 for a 1-hour running session with HR data', () => {
    const records = makeRunningRecords('s1', 3600, { baseHr: 155 });
    const result = calculateTrainingEffect(records, 190, 50, 'male', 0);

    expect(result).toBeDefined();
    expect(result!.aerobic).toBeGreaterThan(0);
    expect(result!.aerobic).toBeLessThanOrEqual(5);
  });

  it('aerobic TE is clamped to [0, 5]', () => {
    // Very long, very hard session should still cap at 5
    const records = makeRunningRecords('s1', 7200, { baseHr: 185 });
    const result = calculateTrainingEffect(records, 190, 50, 'male', 0);

    expect(result).toBeDefined();
    expect(result!.aerobic).toBeLessThanOrEqual(5);
    expect(result!.aerobic).toBeGreaterThanOrEqual(0);
  });

  it('anaerobic TE is 0 when HR stays well below 90% HRR', () => {
    // baseHr=100 with maxHr=190, restHr=50 → HRR ≈ 0.36, well below 0.9
    const records = makeRunningRecords('s1', 3600, { baseHr: 100 });
    const result = calculateTrainingEffect(records, 190, 50, 'male', 0);

    expect(result).toBeDefined();
    expect(result!.anaerobic).toBe(0);
  });

  it('anaerobic TE > 0 when HR is above 90% HRR threshold', () => {
    // baseHr=180 with maxHr=190, restHr=50 → HRR ≈ 0.93, above 0.9
    const records = makeRunningRecords('s1', 600, { baseHr: 180 });
    const result = calculateTrainingEffect(records, 190, 50, 'male', 0);

    expect(result).toBeDefined();
    expect(result!.anaerobic).toBeGreaterThan(0);
  });

  it('higher CTL reduces TE for the same effort', () => {
    const records = makeRunningRecords('s1', 3600, { baseHr: 155 });

    const lowFitness = calculateTrainingEffect(records, 190, 50, 'male', 0);
    const highFitness = calculateTrainingEffect(records, 190, 50, 'male', 100);

    expect(lowFitness).toBeDefined();
    expect(highFitness).toBeDefined();
    expect(lowFitness!.aerobic).toBeGreaterThan(highFitness!.aerobic);
  });

  it('gender affects the result due to different Banister constants', () => {
    const records = makeRunningRecords('s1', 3600, { baseHr: 155 });

    const male = calculateTrainingEffect(records, 190, 50, 'male', 50);
    const female = calculateTrainingEffect(records, 190, 50, 'female', 50);

    expect(male).toBeDefined();
    expect(female).toBeDefined();
    expect(male!.aerobic).not.toBe(female!.aerobic);
  });

  it('works with cycling records that have HR data', () => {
    const records = makeCyclingRecords('s1', 3600, { baseHr: 150 });
    const result = calculateTrainingEffect(records, 190, 50, 'male', 50);

    expect(result).toBeDefined();
    expect(result!.aerobic).toBeGreaterThan(0);
  });

  it('short session produces lower TE than long session at same intensity', () => {
    const short = makeRunningRecords('s1', 600, { baseHr: 155 });
    const long = makeRunningRecords('s2', 3600, { baseHr: 155 });

    const shortTE = calculateTrainingEffect(short, 190, 50, 'male', 0);
    const longTE = calculateTrainingEffect(long, 190, 50, 'male', 0);

    expect(shortTE).toBeDefined();
    expect(longTE).toBeDefined();
    expect(shortTE!.aerobic).toBeLessThan(longTE!.aerobic);
  });

  it('results are rounded to 1 decimal place', () => {
    const records = makeRunningRecords('s1', 3600, { baseHr: 155 });
    const result = calculateTrainingEffect(records, 190, 50, 'male', 0);

    expect(result).toBeDefined();
    expect(result!.aerobic.toString()).toMatch(/^\d+(\.\d)?$/);
    expect(result!.anaerobic.toString()).toMatch(/^\d+(\.\d)?$/);
  });

  describe('calibration regression — aerobic TE vs Garmin ranges', () => {
    // All tests: male, maxHr=190, restHr=50
    const maxHr = 190;
    const restHr = 50;

    it('30-min easy run (baseHr≈100) at CTL=50 → TE 1.5–2.5', () => {
      const records = makeRunningRecords('s1', 1800, { baseHr: 100 });
      const result = calculateTrainingEffect(records, maxHr, restHr, 'male', 50);
      expect(result).toBeDefined();
      expect(result!.aerobic).toBeGreaterThanOrEqual(1.5);
      expect(result!.aerobic).toBeLessThanOrEqual(2.5);
    });

    it('1-hr easy run (baseHr≈145) at CTL=0 → TE 2.0–3.5', () => {
      const records = makeRunningRecords('s1', 3600, { baseHr: 145 });
      const result = calculateTrainingEffect(records, maxHr, restHr, 'male', 0);
      expect(result).toBeDefined();
      expect(result!.aerobic).toBeGreaterThanOrEqual(2.0);
      expect(result!.aerobic).toBeLessThanOrEqual(3.5);
    });

    it('1-hr moderate run (baseHr≈155) at CTL=50 → TE 2.5–3.5', () => {
      const records = makeRunningRecords('s1', 3600, { baseHr: 155 });
      const result = calculateTrainingEffect(records, maxHr, restHr, 'male', 50);
      expect(result).toBeDefined();
      expect(result!.aerobic).toBeGreaterThanOrEqual(2.5);
      expect(result!.aerobic).toBeLessThanOrEqual(3.5);
    });

    it('1-hr tempo run (baseHr≈170) at CTL=0 → TE 3.0–4.5', () => {
      const records = makeRunningRecords('s1', 3600, { baseHr: 170 });
      const result = calculateTrainingEffect(records, maxHr, restHr, 'male', 0);
      expect(result).toBeDefined();
      expect(result!.aerobic).toBeGreaterThanOrEqual(3.0);
      expect(result!.aerobic).toBeLessThanOrEqual(4.5);
    });

    it('higher CTL reduces TE but not drastically (power-law softens scaling)', () => {
      const records = makeRunningRecords('s1', 3600, { baseHr: 155 });
      const ctl0 = calculateTrainingEffect(records, maxHr, restHr, 'male', 0);
      const ctl100 = calculateTrainingEffect(records, maxHr, restHr, 'male', 100);
      expect(ctl0).toBeDefined();
      expect(ctl100).toBeDefined();
      // CTL=100 should reduce TE but by less than 33%
      const reduction = 1 - ctl100!.aerobic / ctl0!.aerobic;
      expect(reduction).toBeGreaterThan(0);
      expect(reduction).toBeLessThan(0.33);
    });
  });

  describe('calibration regression — anaerobic TE', () => {
    it('10-min intervals at HRR≈0.93 at CTL=0 → anaerobic TE 1.5–3.0', () => {
      // baseHr=180 → HRR≈0.93 with maxHr=190, restHr=50
      const records = makeRunningRecords('s1', 600, { baseHr: 180 });
      const result = calculateTrainingEffect(records, 190, 50, 'male', 0);
      expect(result).toBeDefined();
      expect(result!.anaerobic).toBeGreaterThanOrEqual(1.5);
      expect(result!.anaerobic).toBeLessThanOrEqual(3.0);
    });
  });
});

describe('getTrainingEffectLabel', () => {
  it('maps 0–0.9 to No Effect (neutral)', () => {
    expect(getTrainingEffectLabel(0)).toEqual({ label: 'No Effect', color: 'neutral' });
    expect(getTrainingEffectLabel(0.9)).toEqual({ label: 'No Effect', color: 'neutral' });
  });

  it('maps 1.0–1.9 to Minor (blue)', () => {
    expect(getTrainingEffectLabel(1.0)).toEqual({ label: 'Minor', color: 'blue' });
    expect(getTrainingEffectLabel(1.9)).toEqual({ label: 'Minor', color: 'blue' });
  });

  it('maps 2.0–2.9 to Maintaining (green)', () => {
    expect(getTrainingEffectLabel(2.0)).toEqual({ label: 'Maintaining', color: 'green' });
    expect(getTrainingEffectLabel(2.9)).toEqual({ label: 'Maintaining', color: 'green' });
  });

  it('maps 3.0–3.9 to Improving (amber)', () => {
    expect(getTrainingEffectLabel(3.0)).toEqual({ label: 'Improving', color: 'amber' });
    expect(getTrainingEffectLabel(3.9)).toEqual({ label: 'Improving', color: 'amber' });
  });

  it('maps 4.0–4.9 to Highly Improving (orange)', () => {
    expect(getTrainingEffectLabel(4.0)).toEqual({ label: 'Highly Improving', color: 'orange' });
    expect(getTrainingEffectLabel(4.9)).toEqual({ label: 'Highly Improving', color: 'orange' });
  });

  it('maps 5.0 to Overreaching (red)', () => {
    expect(getTrainingEffectLabel(5.0)).toEqual({ label: 'Overreaching', color: 'red' });
  });
});

describe('getTrainingEffectSummary', () => {
  it('returns easy message when both are below 1', () => {
    expect(getTrainingEffectSummary(0.5, 0.5)).toBe('Too easy to stimulate adaptation');
  });

  it('returns extreme message when both are >= 4', () => {
    expect(getTrainingEffectSummary(4.0, 4.0)).toBe(
      'Extreme session — both aerobic and anaerobic systems pushed hard',
    );
  });

  it('returns aerobic message for steady effort', () => {
    expect(getTrainingEffectSummary(3.5, 1.0)).toBe(
      'Steady aerobic effort — improved endurance base',
    );
  });

  it('returns anaerobic message for high-intensity session', () => {
    expect(getTrainingEffectSummary(1.5, 3.5)).toBe(
      'High-intensity session — anaerobic capacity stimulus',
    );
  });

  it('returns mixed message for balanced effort', () => {
    expect(getTrainingEffectSummary(3.0, 2.5)).toBe(
      'Mixed-intensity effort — both energy systems challenged',
    );
  });

  it('returns maintenance message for moderate aerobic', () => {
    expect(getTrainingEffectSummary(2.5, 0.5)).toBe(
      'Easy aerobic maintenance — good recovery day',
    );
  });
});

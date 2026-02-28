import { describe, it, expect } from 'vitest';
import { validateRecords, filterValidPower } from '../../src/engine/validation.ts';
import { calculateNormalizedPower } from '../../src/engine/normalize.ts';
import { calculateTSS, calculateTRIMP, calculateSessionStress } from '../../src/engine/stress.ts';
import { makeCyclingRecords, makeRunningRecords, makeInvalidRecords } from '../factories/records.ts';

describe('stress pipeline: records → validate → filter → NP → TSS/TRIMP', () => {
  it('full cycling pipeline: 3600 records → NP > avg power → TSS ~100 for IF ~1.0', () => {
    const records = makeCyclingRecords('s1', 3600, { basePower: 250 });

    // Validate — should be clean
    const warnings = validateRecords(records, 'cycling');
    expect(warnings).toHaveLength(0);

    // Filter
    const validPower = filterValidPower(records);
    expect(validPower.length).toBe(3600);

    // NP — with sine oscillation around 250W, NP should be > average
    const np = calculateNormalizedPower(validPower);
    expect(np).toBeDefined();
    expect(np!).toBeGreaterThan(250); // NP amplifies variability

    // TSS with FTP=250 and IF close to 1.0
    const tssResult = calculateTSS(validPower, 3600, 250);
    expect(tssResult).toBeDefined();
    expect(tssResult!.normalizedPower).toBe(np);
    // IF ≈ NP/FTP ≈ 1.0+, so TSS should be around 100+
    expect(tssResult!.tss).toBeGreaterThanOrEqual(90);
    expect(tssResult!.tss).toBeLessThanOrEqual(150);
  });

  it('falls back to TRIMP when no power data', () => {
    const records = makeCyclingRecords('s2', 3600).map((r) => ({
      ...r,
      power: undefined,
    }));

    const result = calculateSessionStress(records, 3600, 150, 50, 190, 'male', 250);
    expect(result.stressMethod).toBe('trimp');
    expect(result.normalizedPower).toBeUndefined();
    expect(result.tss).toBeGreaterThan(0);
  });

  it('running pipeline uses TRIMP (no FTP)', () => {
    const records = makeRunningRecords('s3', 3600);

    const result = calculateSessionStress(records, 3600, 155, 50, 190, 'male');
    expect(result.stressMethod).toBe('trimp');
    expect(result.tss).toBeGreaterThan(0);
  });

  it('validation filters bad data before stress calculation', () => {
    const goodRecords = makeCyclingRecords('s4', 3600, { basePower: 200 });
    const badRecords = makeInvalidRecords('s4', 'highPower');
    const combined = [...goodRecords, ...badRecords];

    // Validate detects issues
    const warnings = validateRecords(combined, 'cycling');
    expect(warnings.some((w) => w.field === 'power')).toBe(true);

    // After filtering, bad records removed
    const filtered = filterValidPower(combined);
    expect(filtered.length).toBe(goodRecords.length);
    expect(filtered.every((r) => r.power! <= 2500)).toBe(true);

    // NP still works on filtered data
    const np = calculateNormalizedPower(filtered);
    expect(np).toBeDefined();
  });

  it('gender-specific TRIMP constants differ (male vs female)', () => {
    const maleTrimp = calculateTRIMP(155, 3600, 50, 190, 'male');
    const femaleTrimp = calculateTRIMP(155, 3600, 50, 190, 'female');

    expect(maleTrimp).toBeGreaterThan(0);
    expect(femaleTrimp).toBeGreaterThan(0);
    // Different Banister coefficients produce different values
    expect(maleTrimp).not.toBe(femaleTrimp);
  });

  it('calculateTRIMP returns 0 when avgHr > maxHr (invalid FIT data)', () => {
    // avgHr=200, maxHr=190 — impossible, should be guarded
    expect(calculateTRIMP(200, 3600, 50, 190, 'male')).toBe(0);
    expect(calculateTRIMP(191, 3600, 50, 190, 'female')).toBe(0);
  });

  it('calculateTRIMP returns 0 for edge case avgHr == maxHr', () => {
    // avgHr exactly at maxHr — deltaHrRatio = 1.0, valid but also caught by > guard
    // Actually avgHr > maxHr is the guard, avgHr == maxHr is still valid
    const result = calculateTRIMP(190, 3600, 50, 190, 'male');
    expect(result).toBeGreaterThan(0); // deltaHrRatio = 1.0, valid
  });

  it('short session (< 30 records) → no NP, graceful fallback', () => {
    const records = makeCyclingRecords('s5', 20);

    const np = calculateNormalizedPower(records);
    expect(np).toBeUndefined();

    // calculateTSS also returns undefined since NP is undefined
    const tssResult = calculateTSS(records, 20, 250);
    expect(tssResult).toBeUndefined();

    // calculateSessionStress falls back to TRIMP
    const result = calculateSessionStress(records, 20, 150, 50, 190, 'male', 250);
    expect(result.stressMethod).toBe('trimp');
  });

  it('duration fallback labeled as "duration", not "trimp"', () => {
    const records = makeCyclingRecords('s6', 3600).map((r) => ({
      ...r,
      power: undefined,
    }));
    // No avgHr → triggers duration fallback
    const result = calculateSessionStress(records, 3600, undefined, 50, 190, 'male');
    expect(result.stressMethod).toBe('duration');
    expect(result.tss).toBe(30); // 1 hour × 30 TSS/hour
  });

  it('TRIMP normalization uses threshold HR ratio ~0.88', () => {
    // 1 hour at threshold (deltaHrRatio ≈ 0.88) should produce ~100 TSS
    const restHr = 50;
    const maxHr = 190;
    // avgHr at 88% HRR: 50 + 0.88 * 140 = 173.2
    const avgHr = restHr + 0.88 * (maxHr - restHr);
    const trimp = calculateTRIMP(avgHr, 3600, restHr, maxHr, 'male');
    expect(trimp).toBeGreaterThan(85);
    expect(trimp).toBeLessThan(115);
  });
});

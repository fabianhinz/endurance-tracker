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
});

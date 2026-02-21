import { describe, it, expect } from 'vitest';
import { calculateGAP } from '../../src/engine/normalize.ts';
import type { SessionRecord } from '../../src/types/index.ts';

function makeRecord(overrides: Partial<SessionRecord>): SessionRecord {
  return { sessionId: 'test', timestamp: 0, ...overrides };
}

describe('calculateGAP with native grade', () => {
  it('uses native grade field when available', () => {
    // 5% uphill grade, records spaced 1s apart with 3m/s speed
    const records: SessionRecord[] = [];
    for (let i = 0; i < 10; i++) {
      records.push(
        makeRecord({
          timestamp: i,
          speed: 3.0,
          distance: i * 3,
          grade: 5, // 5% grade (FIT percentage format)
        }),
      );
    }

    const gap = calculateGAP(records);
    expect(gap).toBeDefined();
    // Uphill grade should make GAP faster (lower sec/km) than actual pace
    // because metabolic cost is higher uphill
    const flatPace = (1 / 3.0) * 1000; // ~333 sec/km
    expect(gap!).toBeGreaterThan(flatPace);
  });

  it('falls back to elevation delta when grade is missing', () => {
    const records: SessionRecord[] = [];
    for (let i = 0; i < 10; i++) {
      records.push(
        makeRecord({
          timestamp: i,
          speed: 3.0,
          distance: i * 3,
          elevation: 100 + i * 0.15, // ~5% grade
          // no grade field
        }),
      );
    }

    const gap = calculateGAP(records);
    expect(gap).toBeDefined();
    expect(gap!).toBeGreaterThan(0);
  });

  it('records with grade but no elevation still produce valid GAP', () => {
    const records: SessionRecord[] = [];
    for (let i = 0; i < 10; i++) {
      records.push(
        makeRecord({
          timestamp: i,
          speed: 3.0,
          distance: i * 3,
          grade: 0, // flat
          // no elevation field
        }),
      );
    }

    const gap = calculateGAP(records);
    expect(gap).toBeDefined();
  });

  it('grade normalization: FIT percentage converted to fraction', () => {
    // Grade of 10% = 0.10 fraction. gradeAdjustedPaceFactor expects fraction.
    const recordsWithGrade: SessionRecord[] = [];
    const recordsWithElevation: SessionRecord[] = [];
    for (let i = 0; i < 10; i++) {
      recordsWithGrade.push(
        makeRecord({
          timestamp: i,
          speed: 3.0,
          distance: i * 3,
          grade: 10, // 10% in FIT format
        }),
      );
      recordsWithElevation.push(
        makeRecord({
          timestamp: i,
          speed: 3.0,
          distance: i * 3,
          elevation: 100 + i * 0.3, // 0.3m per 3m = 10% grade
        }),
      );
    }

    const gapFromGrade = calculateGAP(recordsWithGrade);
    const gapFromElevation = calculateGAP(recordsWithElevation);

    expect(gapFromGrade).toBeDefined();
    expect(gapFromElevation).toBeDefined();
    // Both should produce similar results (within 5% tolerance)
    const ratio = gapFromGrade! / gapFromElevation!;
    expect(ratio).toBeGreaterThan(0.95);
    expect(ratio).toBeLessThan(1.05);
  });

  it('flat grade produces GAP close to actual pace', () => {
    const records: SessionRecord[] = [];
    for (let i = 0; i < 10; i++) {
      records.push(
        makeRecord({
          timestamp: i,
          speed: 3.0,
          distance: i * 3,
          grade: 0,
        }),
      );
    }

    const gap = calculateGAP(records);
    const actualPace = (1 / 3.0) * 1000;
    expect(gap).toBeDefined();
    // Should be very close to actual pace on flat terrain
    expect(Math.abs(gap! - actualPace)).toBeLessThan(1);
  });

  it('returns undefined for fewer than 2 records', () => {
    const records = [makeRecord({ timestamp: 0, speed: 3, distance: 0, grade: 0 })];
    expect(calculateGAP(records)).toBeUndefined();
  });
});

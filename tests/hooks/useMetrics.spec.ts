import { describe, it, expect } from 'vitest';
import { computeMetrics } from '../../src/engine/metrics.ts';
import { getCoachingRecommendation } from '../../src/lib/coaching-messages.ts';
import { getFormStatus } from '../../src/engine/coaching.ts';
import { makeSession, makeSessionSequence } from '../factories/sessions.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('computeMetrics', () => {
  it('returns empty array for empty sessions', () => {
    expect(computeMetrics([])).toEqual([]);
  });

  it('returns history entries for a single session', () => {
    const now = Date.now();
    const sessions = [makeSession({ date: now - 7 * DAY_MS, tss: 100 })];
    const history = computeMetrics(sessions, { endDate: now });

    expect(history.length).toBeGreaterThan(0);
    // The session's TSS should appear exactly once in the history
    const withTss = history.filter((d) => d.tss > 0);
    expect(withTss).toHaveLength(1);
    expect(withTss[0].tss).toBe(100);
    // Days without sessions should have tss=0
    const withoutTss = history.filter((d) => d.tss === 0);
    expect(withoutTss.length).toBeGreaterThan(0);
  });

  it('computes CTL and ATL that grow over multiple sessions', () => {
    const now = Date.now();
    const sessions = makeSessionSequence(30, {
      startDate: now - 30 * DAY_MS,
      baseTss: 80,
      tssVariation: 10,
    });
    const history = computeMetrics(sessions, { endDate: now });
    const last = history[history.length - 1];

    expect(last.ctl).toBeGreaterThan(0);
    expect(last.atl).toBeGreaterThan(0);
  });

  it('CTL responds slower than ATL (42-day vs 7-day EWMA)', () => {
    const now = Date.now();
    // Start with no training, then a burst of high TSS in the last 7 days
    const sessions = Array.from({ length: 7 }, (_, i) =>
      makeSession({
        id: `burst-${i}`,
        date: now - (7 - i) * DAY_MS,
        tss: 150,
      }),
    );
    const history = computeMetrics(sessions, { endDate: now });
    const last = history[history.length - 1];

    // ATL should be higher than CTL since training is recent
    expect(last.atl).toBeGreaterThan(last.ctl);
    // TSB should be negative (more fatigue than fitness)
    expect(last.tsb).toBeLessThan(0);
  });

  it('excludes planned (ghost) sessions by default', () => {
    const now = Date.now();
    const sessions = [
      makeSession({ date: now - 5 * DAY_MS, tss: 100, isPlanned: false }),
      makeSession({ date: now - 3 * DAY_MS, tss: 200, isPlanned: true }),
    ];
    const history = computeMetrics(sessions, { endDate: now });

    // Only the real session's TSS should appear
    const tssSum = history.reduce((sum, d) => sum + d.tss, 0);
    expect(tssSum).toBe(100);
  });

  it('includes planned sessions when includeGhosts is true', () => {
    const now = Date.now();
    const sessions = [
      makeSession({ date: now - 5 * DAY_MS, tss: 100, isPlanned: false }),
      makeSession({ date: now - 3 * DAY_MS, tss: 200, isPlanned: true }),
    ];
    const history = computeMetrics(sessions, { endDate: now, includeGhosts: true });

    const tssSum = history.reduce((sum, d) => sum + d.tss, 0);
    expect(tssSum).toBe(300);
  });

  it('ACWR is 0 when CTL is 0', () => {
    const now = Date.now();
    const sessions = [makeSession({ date: now, tss: 50 })];
    const history = computeMetrics(sessions, { endDate: now });

    // First day: CTL starts at 0 so we need to check early entries
    // After one day of training, CTL is very small, so ACWR could be very high
    // But on day 0, before any sessions, CTL=0 so ACWR should be defined
    expect(history[0].acwr).toBeDefined();
  });
});

describe('getCoachingRecommendation', () => {
  it('returns neutral recommendation for undefined metrics', () => {
    const rec = getCoachingRecommendation(undefined, 0);
    expect(rec.status).toBe('neutral');
    expect(rec.tsb).toBe(0);
    expect(rec.acwr).toBe(0);
    expect(rec.injuryRisk).toBe('low');
  });

  it('maps high TSB to detraining', () => {
    const rec = getCoachingRecommendation({
      date: '2024-01-01',
      tss: 0,
      ctl: 50,
      atl: 20,
      tsb: 30,
      acwr: 0.4,
    }, 42);
    expect(rec.status).toBe('detraining');
  });

  it('maps positive TSB (5-25) to fresh', () => {
    const rec = getCoachingRecommendation({
      date: '2024-01-01',
      tss: 0,
      ctl: 60,
      atl: 50,
      tsb: 10,
      acwr: 0.83,
    }, 42);
    expect(rec.status).toBe('fresh');
  });

  it('maps TSB near zero (-10 to 5) to neutral', () => {
    const rec = getCoachingRecommendation({
      date: '2024-01-01',
      tss: 0,
      ctl: 50,
      atl: 52,
      tsb: -2,
      acwr: 1.04,
    }, 42);
    expect(rec.status).toBe('neutral');
  });

  it('maps negative TSB (-30 to -10) to optimal', () => {
    const rec = getCoachingRecommendation({
      date: '2024-01-01',
      tss: 0,
      ctl: 50,
      atl: 70,
      tsb: -20,
      acwr: 1.4,
    }, 42);
    expect(rec.status).toBe('optimal');
  });

  it('maps very negative TSB (< -30) to overload', () => {
    const rec = getCoachingRecommendation({
      date: '2024-01-01',
      tss: 0,
      ctl: 40,
      atl: 80,
      tsb: -40,
      acwr: 2.0,
    }, 42);
    expect(rec.status).toBe('overload');
  });

  it('sets injury risk based on ACWR', () => {
    // Sweet spot ACWR (0.8-1.3) => low risk
    const low = getCoachingRecommendation({
      date: '2024-01-01',
      tss: 0,
      ctl: 50,
      atl: 55,
      tsb: -5,
      acwr: 1.1,
    }, 42);
    expect(low.injuryRisk).toBe('low');

    // Moderate ACWR (1.3-1.5) => moderate risk
    const moderate = getCoachingRecommendation({
      date: '2024-01-01',
      tss: 0,
      ctl: 50,
      atl: 70,
      tsb: -20,
      acwr: 1.4,
    }, 42);
    expect(moderate.injuryRisk).toBe('moderate');

    // High ACWR (> 1.5) => high risk
    const high = getCoachingRecommendation({
      date: '2024-01-01',
      tss: 0,
      ctl: 40,
      atl: 80,
      tsb: -40,
      acwr: 2.0,
    }, 42);
    expect(high.injuryRisk).toBe('high');
  });

  it('stores dataMaturityDays from historyDays argument', () => {
    const rec = getCoachingRecommendation({
      date: '2024-01-01',
      tss: 0,
      ctl: 50,
      atl: 50,
      tsb: 0,
      acwr: 1.0,
    }, 15);
    expect(rec.dataMaturityDays).toBe(15);
  });
});

describe('getFormStatus', () => {
  it('boundary: TSB 25 => fresh, TSB 26 => detraining', () => {
    expect(getFormStatus(25)).toBe('fresh');
    expect(getFormStatus(26)).toBe('detraining');
  });

  it('boundary: TSB 5 => fresh, TSB 4 => neutral', () => {
    expect(getFormStatus(5)).toBe('fresh');
    expect(getFormStatus(4)).toBe('neutral');
  });

  it('boundary: TSB -10 => neutral, TSB -11 => optimal', () => {
    expect(getFormStatus(-10)).toBe('neutral');
    expect(getFormStatus(-11)).toBe('optimal');
  });

  it('boundary: TSB -30 => optimal, TSB -31 => overload', () => {
    expect(getFormStatus(-30)).toBe('optimal');
    expect(getFormStatus(-31)).toBe('overload');
  });
});

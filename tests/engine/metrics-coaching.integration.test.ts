import { describe, it, expect } from 'vitest';
import { computeMetrics, getCurrentMetrics } from '../../src/engine/metrics.ts';
import { getCoachingRecommendation, getFormStatus, getInjuryRisk } from '../../src/engine/coaching.ts';
import { makeSession } from '../factories/sessions.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('metrics → coaching pipeline', () => {
  it('single session produces initial CTL/ATL/TSB', () => {
    const session = makeSession({
      date: Date.now() - 1 * DAY_MS,
      tss: 100,
    });

    const metrics = computeMetrics([session]);
    expect(metrics.length).toBeGreaterThanOrEqual(1);

    const last = metrics[metrics.length - 1];
    expect(last.ctl).toBeGreaterThan(0);
    expect(last.atl).toBeGreaterThan(0);
    // ATL reacts faster than CTL (alpha=0.25 vs alpha≈0.047)
    expect(last.atl).toBeGreaterThan(last.ctl);
    // TSB = CTL - ATL, should be negative initially
    expect(last.tsb).toBeLessThan(0);
  });

  it('42-day constant TSS=100 → CTL converges (ATL converges faster)', () => {
    const now = Date.now();
    const lastSessionDate = now - 1 * DAY_MS;
    const sessions = Array.from({ length: 42 }, (_, i) =>
      makeSession({
        id: `day-${i}`,
        date: now - (42 - i) * DAY_MS,
        tss: 100,
      }),
    );

    const metrics = computeMetrics(sessions, { endDate: lastSessionDate });
    const last = metrics[metrics.length - 1];

    // CTL with alpha = 2/43: after 42 days at TSS=100, CTL ≈ 86
    expect(last.ctl).toBeGreaterThan(75);
    expect(last.ctl).toBeLessThan(95);

    // ATL with alpha = 2/8 = 0.25: converges much faster, close to 100
    expect(last.atl).toBeGreaterThan(90);
    expect(last.atl).toBeLessThan(105);
  });

  it('rest period after training block → TSB rises (ATL decays faster than CTL)', () => {
    const now = Date.now();
    // 30 days of training
    const trainingSessions = Array.from({ length: 30 }, (_, i) =>
      makeSession({
        id: `train-${i}`,
        date: now - (37 - i) * DAY_MS, // days -37 to -8
        tss: 100,
      }),
    );

    const metricsAfterTraining = computeMetrics(trainingSessions);

    // Now 7 days of rest (no sessions, but computeMetrics fills to today)
    // The end date is today, so metrics run through rest period

    // Final metrics include the rest period
    const finalMetrics = metricsAfterTraining[metricsAfterTraining.length - 1];

    // After rest: ATL decays faster → TSB should rise
    // TSB at end of training block (around day 30)
    const dayOfLastSession = 29; // 0-indexed, last training day
    const tsbAtEndOfTraining = metricsAfterTraining[dayOfLastSession].tsb;
    // TSB should be higher at the end (after rest) than right after training
    expect(finalMetrics.tsb).toBeGreaterThan(tsbAtEndOfTraining);
  });

  it('escalating TSS over 8 days → TSB < -30 → coaching: overload', () => {
    const now = Date.now();
    // 8 days of very high, escalating TSS
    const sessions = Array.from({ length: 8 }, (_, i) =>
      makeSession({
        id: `hard-${i}`,
        date: now - (8 - i) * DAY_MS,
        tss: 150 + i * 20, // 150, 170, 190, 210, 230, 250, 270, 290
      }),
    );

    const current = getCurrentMetrics(sessions);
    expect(current).toBeDefined();
    expect(current!.tsb).toBeLessThan(-30);

    const coaching = getCoachingRecommendation(current);
    expect(coaching.status).toBe('overload');
  });

  it('rest after long training block → TSB > 25 → coaching: detraining', () => {
    const now = Date.now();
    // 60 days of consistent training, then 14 days of complete rest
    // CTL builds up high (~94), ATL also high (~100)
    // After 14 days rest: ATL decays fast → ~2, CTL decays slow → ~48
    // TSB = CTL - ATL ≈ 46 → detraining
    const sessions = Array.from({ length: 60 }, (_, i) =>
      makeSession({
        id: `train-${i}`,
        date: now - (74 - i) * DAY_MS, // days -74 to -15
        tss: 100,
      }),
    );

    const current = getCurrentMetrics(sessions);
    expect(current).toBeDefined();
    expect(current!.tsb).toBeGreaterThan(25);

    const coaching = getCoachingRecommendation(current);
    expect(coaching.status).toBe('detraining');
  });

  it('ghost sessions excluded by default', () => {
    const now = Date.now();
    const realSession = makeSession({
      id: 'real',
      date: now - 1 * DAY_MS,
      tss: 100,
    });
    const ghost = makeSession({
      id: 'ghost',
      date: now - 1 * DAY_MS,
      tss: 200,
      isPlanned: true,
      hasDetailedRecords: false,
      sensorWarnings: [],
    });

    const metricsWithout = computeMetrics([realSession, ghost]);
    const metricsOnlyReal = computeMetrics([realSession]);

    // Ghost should be excluded, so metrics should be the same
    const lastWith = metricsWithout[metricsWithout.length - 1];
    const lastReal = metricsOnlyReal[metricsOnlyReal.length - 1];
    expect(lastWith.ctl).toBe(lastReal.ctl);
    expect(lastWith.atl).toBe(lastReal.atl);
  });

  it('ACWR thresholds: <0.8 low, 0.8–1.3 low, 1.3–1.5 moderate, >1.5 high', () => {
    expect(getInjuryRisk(0.5)).toBe('low');    // undertraining
    expect(getInjuryRisk(0.8)).toBe('low');    // sweet spot boundary
    expect(getInjuryRisk(1.0)).toBe('low');    // sweet spot
    expect(getInjuryRisk(1.3)).toBe('low');    // upper sweet spot boundary
    expect(getInjuryRisk(1.4)).toBe('moderate');
    expect(getInjuryRisk(1.5)).toBe('moderate');
    expect(getInjuryRisk(1.6)).toBe('high');
    expect(getInjuryRisk(2.0)).toBe('high');
  });

  it('empty sessions → empty metrics, neutral coaching', () => {
    const metrics = computeMetrics([]);
    expect(metrics).toEqual([]);

    const current = getCurrentMetrics([]);
    expect(current).toBeUndefined();

    const coaching = getCoachingRecommendation(undefined);
    expect(coaching.status).toBe('neutral');
    expect(coaching.tsb).toBe(0);
    expect(coaching.acwr).toBe(0);
    expect(coaching.injuryRisk).toBe('low');
  });

  it('form status boundaries', () => {
    expect(getFormStatus(30)).toBe('detraining');
    expect(getFormStatus(25.1)).toBe('detraining');
    expect(getFormStatus(25)).toBe('fresh');
    expect(getFormStatus(5)).toBe('fresh');
    expect(getFormStatus(4)).toBe('neutral');
    expect(getFormStatus(-10)).toBe('neutral');
    expect(getFormStatus(-11)).toBe('optimal');
    expect(getFormStatus(-30)).toBe('optimal');
    expect(getFormStatus(-31)).toBe('overload');
  });
});

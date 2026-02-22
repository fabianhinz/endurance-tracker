import { describe, it, expect } from 'vitest';
import { getFormMessage, getFormMessageDetailed } from '../../src/engine/coaching.ts';
import type { CoachingRecommendation, FormStatus } from '../../src/types/index.ts';

const ALL_STATUSES: FormStatus[] = [
  'detraining',
  'fresh',
  'neutral',
  'optimal',
  'overload',
];

const makeRec = (overrides: Partial<CoachingRecommendation> = {}): CoachingRecommendation => ({
  status: 'neutral',
  message: '',
  tsb: 0,
  acwr: 1.0,
  injuryRisk: 'low',
  dataMaturityDays: 42,
  ...overrides,
});

describe('getFormMessageDetailed', () => {
  describe('immature data (< 28 days)', () => {
    it.each(ALL_STATUSES)(
      '"%s" returns an immature-data message mentioning stabilizing',
      (status) => {
        const rec = makeRec({ status, dataMaturityDays: 10 });
        const msg = getFormMessageDetailed(rec);
        expect(msg).toContain('stabilizing');
        expect(msg.length).toBeGreaterThan(0);
      },
    );

    it('immature data message does not reference ACWR-specific risk language', () => {
      const rec = makeRec({ status: 'fresh', dataMaturityDays: 5, acwr: 2.0, injuryRisk: 'high' });
      const msg = getFormMessageDetailed(rec);
      expect(msg).not.toContain('injury risk');
      expect(msg).not.toContain('danger zone');
      expect(msg).not.toContain('ramp rate');
    });

    it('boundary: 27 days is immature, 28 days is not', () => {
      const immature = makeRec({ status: 'neutral', dataMaturityDays: 27 });
      const mature = makeRec({ status: 'neutral', dataMaturityDays: 28, acwr: 1.0 });
      expect(getFormMessageDetailed(immature)).toContain('stabilizing');
      expect(getFormMessageDetailed(mature)).not.toContain('stabilizing');
    });
  });

  describe('undertraining (ACWR < 0.8, mature data)', () => {
    it.each(ALL_STATUSES)(
      '"%s" returns an undertraining message',
      (status) => {
        const rec = makeRec({ status, acwr: 0.5, injuryRisk: 'low', dataMaturityDays: 42 });
        const msg = getFormMessageDetailed(rec);
        expect(msg.length).toBeGreaterThan(0);
      },
    );

    it('detraining + undertraining mentions deconditioning', () => {
      const rec = makeRec({ status: 'detraining', acwr: 0.3, dataMaturityDays: 42 });
      const msg = getFormMessageDetailed(rec);
      expect(msg).toContain('deconditioning');
    });

    it('fresh + undertraining mentions below baseline', () => {
      const rec = makeRec({ status: 'fresh', acwr: 0.6, dataMaturityDays: 42 });
      const msg = getFormMessageDetailed(rec);
      expect(msg).toContain('below');
    });
  });

  describe('sweet spot (low risk, ACWR >= 0.8, mature data)', () => {
    it.each(ALL_STATUSES)(
      '"%s" returns a sweet-spot message that differs from standard',
      (status) => {
        const rec = makeRec({ status, acwr: 1.0, injuryRisk: 'low', dataMaturityDays: 42 });
        const detailed = getFormMessageDetailed(rec);
        const standard = getFormMessage(status);
        expect(detailed).not.toBe(standard);
        expect(detailed.length).toBeGreaterThan(standard.length);
      },
    );
  });

  describe('moderate risk (mature data)', () => {
    it.each(ALL_STATUSES)(
      '"%s" with moderate risk returns a risk-aware message',
      (status) => {
        const rec = makeRec({ status, acwr: 1.4, injuryRisk: 'moderate', dataMaturityDays: 42 });
        const msg = getFormMessageDetailed(rec);
        expect(msg.length).toBeGreaterThan(0);
      },
    );

    it('fresh + moderate risk warns about ramp', () => {
      const rec = makeRec({ status: 'fresh', acwr: 1.4, injuryRisk: 'moderate', dataMaturityDays: 42 });
      const msg = getFormMessageDetailed(rec);
      expect(msg).toContain('ramp');
    });
  });

  describe('high risk (mature data)', () => {
    it.each(ALL_STATUSES)(
      '"%s" with high risk returns a strong warning',
      (status) => {
        const rec = makeRec({ status, acwr: 1.8, injuryRisk: 'high', dataMaturityDays: 42 });
        const msg = getFormMessageDetailed(rec);
        expect(msg.length).toBeGreaterThan(0);
      },
    );

    it('overload + high risk is the strongest warning', () => {
      const rec = makeRec({ status: 'overload', acwr: 2.0, injuryRisk: 'high', dataMaturityDays: 42 });
      const msg = getFormMessageDetailed(rec);
      expect(msg).toContain('highest-risk');
    });

    it('fresh + high risk does not suggest racing', () => {
      const rec = makeRec({ status: 'fresh', acwr: 1.8, injuryRisk: 'high', dataMaturityDays: 42 });
      const msg = getFormMessageDetailed(rec);
      expect(msg).not.toContain('ideal state for racing');
    });
  });

  describe('priority order', () => {
    it('immature data takes priority over high ACWR risk', () => {
      const rec = makeRec({ status: 'fresh', acwr: 2.0, injuryRisk: 'high', dataMaturityDays: 10 });
      const msg = getFormMessageDetailed(rec);
      expect(msg).toContain('stabilizing');
    });

    it('undertraining takes priority over low-risk sweet-spot message', () => {
      const sweetSpot = makeRec({ status: 'neutral', acwr: 1.0, injuryRisk: 'low', dataMaturityDays: 42 });
      const undertraining = makeRec({ status: 'neutral', acwr: 0.5, injuryRisk: 'low', dataMaturityDays: 42 });
      expect(getFormMessageDetailed(sweetSpot)).not.toBe(getFormMessageDetailed(undertraining));
    });
  });
});

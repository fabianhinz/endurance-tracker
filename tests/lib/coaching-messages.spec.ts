import { describe, it, expect } from 'vitest';
import {
  getFormMessage,
  getFormMessageDetailed,
} from '../../src/lib/coaching-messages.ts';
import {
  getLoadState,
  getInjuryRisk,
  ACWR_MODERATE_THRESHOLD,
  ACWR_HIGH_THRESHOLD,
  ACWR_UNDERTRAINING_THRESHOLD,
} from '../../src/engine/coaching.ts';
import type { FormStatus } from '../../src/engine/types.ts';
import type { CoachingRecommendation } from '../../src/types/index.ts';

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

    it('boundary: 20 days is immature, 21-27 transitioning (same messages), 28 is mature', () => {
      const immature = makeRec({ status: 'neutral', dataMaturityDays: 20 });
      const transitioning = makeRec({ status: 'neutral', dataMaturityDays: 25 });
      const mature = makeRec({ status: 'neutral', dataMaturityDays: 28, acwr: 1.0 });
      expect(getFormMessageDetailed(immature)).toContain('stabilizing');
      expect(getFormMessageDetailed(transitioning)).toContain('stabilizing');
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

    it('transitioning with extreme ACWR returns risk message, not immature', () => {
      const rec = makeRec({ status: 'fresh', acwr: 1.8, injuryRisk: 'high', dataMaturityDays: 25 });
      const msg = getFormMessageDetailed(rec);
      expect(msg).not.toContain('stabilizing');
      expect(msg.length).toBeGreaterThan(0);
    });

    it('undertraining takes priority over low-risk sweet-spot message', () => {
      const sweetSpot = makeRec({ status: 'neutral', acwr: 1.0, injuryRisk: 'low', dataMaturityDays: 42 });
      const undertraining = makeRec({ status: 'neutral', acwr: 0.5, injuryRisk: 'low', dataMaturityDays: 42 });
      expect(getFormMessageDetailed(sweetSpot)).not.toBe(getFormMessageDetailed(undertraining));
    });
  });
});

describe('getLoadState', () => {
  it('returns immature when dataMaturityDays < 21', () => {
    expect(getLoadState(1.0, 0)).toBe('immature');
    expect(getLoadState(1.0, 20)).toBe('immature');
    expect(getLoadState(2.0, 10)).toBe('immature'); // immature overrides high ACWR
    expect(getLoadState(0.5, 10)).toBe('immature'); // immature overrides low ACWR
  });

  it('returns transitioning when dataMaturityDays 21-27', () => {
    expect(getLoadState(1.0, 21)).toBe('transitioning');
    expect(getLoadState(1.0, 27)).toBe('transitioning');
    expect(getLoadState(0.5, 25)).toBe('transitioning'); // low ACWR still transitioning
    expect(getLoadState(1.4, 25)).toBe('transitioning'); // moderate ACWR still transitioning
  });

  it('returns high-risk during transition when ACWR > 1.5', () => {
    expect(getLoadState(1.51, 21)).toBe('high-risk');
    expect(getLoadState(2.0, 25)).toBe('high-risk');
    expect(getLoadState(1.6, 27)).toBe('high-risk');
  });

  it('boundary: 20 days is immature, 21 days is transitioning, 28 days is fully mature', () => {
    expect(getLoadState(1.0, 20)).toBe('immature');
    expect(getLoadState(1.0, 21)).toBe('transitioning');
    expect(getLoadState(1.0, 27)).toBe('transitioning');
    expect(getLoadState(1.0, 28)).toBe('sweet-spot');
  });

  it('returns high-risk when ACWR > 1.5 and data mature', () => {
    expect(getLoadState(1.51, 42)).toBe('high-risk');
    expect(getLoadState(2.0, 42)).toBe('high-risk');
  });

  it('returns moderate-risk when ACWR > 1.3 and <= 1.5', () => {
    expect(getLoadState(1.31, 42)).toBe('moderate-risk');
    expect(getLoadState(1.5, 42)).toBe('moderate-risk');
  });

  it('boundary: 1.3 is sweet-spot, 1.31 is moderate-risk', () => {
    expect(getLoadState(1.3, 42)).toBe('sweet-spot');
    expect(getLoadState(1.31, 42)).toBe('moderate-risk');
  });

  it('boundary: 1.5 is moderate-risk, 1.51 is high-risk', () => {
    expect(getLoadState(1.5, 42)).toBe('moderate-risk');
    expect(getLoadState(1.51, 42)).toBe('high-risk');
  });

  it('returns undertraining when ACWR < 0.8 and data mature', () => {
    expect(getLoadState(0.79, 42)).toBe('undertraining');
    expect(getLoadState(0.5, 42)).toBe('undertraining');
    expect(getLoadState(0.0, 42)).toBe('undertraining');
  });

  it('boundary: 0.8 is sweet-spot, 0.79 is undertraining', () => {
    expect(getLoadState(0.8, 42)).toBe('sweet-spot');
    expect(getLoadState(0.79, 42)).toBe('undertraining');
  });

  it('returns sweet-spot when ACWR 0.8-1.3 and data mature', () => {
    expect(getLoadState(0.8, 42)).toBe('sweet-spot');
    expect(getLoadState(1.0, 42)).toBe('sweet-spot');
    expect(getLoadState(1.3, 42)).toBe('sweet-spot');
  });

  it('dataMaturityDays=0 returns immature regardless of ACWR', () => {
    expect(getLoadState(0.0, 0)).toBe('immature');
    expect(getLoadState(1.0, 0)).toBe('immature');
    expect(getLoadState(1.5, 0)).toBe('immature');
    expect(getLoadState(2.0, 0)).toBe('immature');
    expect(getLoadState(100, 0)).toBe('immature');
  });
});

describe('threshold consistency: getLoadState and getInjuryRisk agree at boundaries', () => {
  it('ACWR at ACWR_MODERATE_THRESHOLD is low risk and sweet-spot', () => {
    expect(getInjuryRisk(ACWR_MODERATE_THRESHOLD)).toBe('low');
    expect(getLoadState(ACWR_MODERATE_THRESHOLD, 42)).toBe('sweet-spot');
  });

  it('ACWR just above ACWR_MODERATE_THRESHOLD is moderate risk and moderate-risk state', () => {
    const above = ACWR_MODERATE_THRESHOLD + 0.01;
    expect(getInjuryRisk(above)).toBe('moderate');
    expect(getLoadState(above, 42)).toBe('moderate-risk');
  });

  it('ACWR at ACWR_HIGH_THRESHOLD is moderate risk and moderate-risk state', () => {
    expect(getInjuryRisk(ACWR_HIGH_THRESHOLD)).toBe('moderate');
    expect(getLoadState(ACWR_HIGH_THRESHOLD, 42)).toBe('moderate-risk');
  });

  it('ACWR just above ACWR_HIGH_THRESHOLD is high risk and high-risk state', () => {
    const above = ACWR_HIGH_THRESHOLD + 0.01;
    expect(getInjuryRisk(above)).toBe('high');
    expect(getLoadState(above, 42)).toBe('high-risk');
  });

  it('ACWR below ACWR_UNDERTRAINING_THRESHOLD is low risk and undertraining', () => {
    const below = ACWR_UNDERTRAINING_THRESHOLD - 0.01;
    expect(getInjuryRisk(below)).toBe('low');
    expect(getLoadState(below, 42)).toBe('undertraining');
  });

  it('ACWR at ACWR_UNDERTRAINING_THRESHOLD is low risk and sweet-spot', () => {
    expect(getInjuryRisk(ACWR_UNDERTRAINING_THRESHOLD)).toBe('low');
    expect(getLoadState(ACWR_UNDERTRAINING_THRESHOLD, 42)).toBe('sweet-spot');
  });
});

describe('message uniqueness', () => {
  it('all 25 status x load-state messages are unique and non-trivial', () => {
    const messages = new Set<string>();
    const loadConfigs: Array<{ acwr: number; dataMaturityDays: number; injuryRisk: CoachingRecommendation['injuryRisk'] }> = [
      { acwr: 1.0, dataMaturityDays: 10, injuryRisk: 'low' },      // immature
      { acwr: 0.5, dataMaturityDays: 42, injuryRisk: 'low' },      // undertraining
      { acwr: 1.0, dataMaturityDays: 42, injuryRisk: 'low' },      // sweet-spot
      { acwr: 1.4, dataMaturityDays: 42, injuryRisk: 'moderate' }, // moderate-risk
      { acwr: 1.8, dataMaturityDays: 42, injuryRisk: 'high' },    // high-risk
    ];

    for (const config of loadConfigs) {
      for (const status of ALL_STATUSES) {
        const rec = makeRec({ status, ...config });
        const msg = getFormMessageDetailed(rec);
        expect(msg.length).toBeGreaterThan(50);
        messages.add(msg);
      }
    }

    expect(messages.size).toBe(25);
  });
});

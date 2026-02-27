import { describe, it, expect } from 'vitest';
import { calculateEF, calculateDecoupling, getEFTrend } from '../../src/engine/efficiency.ts';
import { makeCyclingRecords } from '../factories/records.ts';
import { makeSession } from '../factories/sessions.ts';
import type { SessionRecord } from '../../src/engine/types.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('efficiency factor & decoupling', () => {
  it('cycling EF = NP / avgHR', () => {
    const ef = calculateEF(220, undefined, 150, 'cycling');
    expect(ef).toBeDefined();
    expect(ef).toBeCloseTo(220 / 150, 2);
  });

  it('running EF = (speed * 100) / avgHR', () => {
    const ef = calculateEF(undefined, 3.5, 150, 'running');
    expect(ef).toBeDefined();
    expect(ef).toBeCloseTo((3.5 * 100) / 150, 2);
  });

  it('decoupling ~0% with stable power/HR', () => {
    // Create records with constant power and HR
    const records: SessionRecord[] = [];
    for (let i = 0; i < 100; i++) {
      records.push({
        sessionId: 's1',
        timestamp: i,
        power: 200,
        hr: 150,
      });
    }

    const decoupling = calculateDecoupling(records);
    expect(decoupling).toBeDefined();
    expect(Math.abs(decoupling!)).toBeLessThan(1); // ~0%
  });

  it('positive decoupling with HR drift in second half', () => {
    const records: SessionRecord[] = [];
    for (let i = 0; i < 100; i++) {
      records.push({
        sessionId: 's2',
        timestamp: i,
        power: 200,
        // HR stable in first half, drifts up in second half
        hr: i < 50 ? 150 : 150 + (i - 50) * 0.4,
      });
    }

    const decoupling = calculateDecoupling(records);
    expect(decoupling).toBeDefined();
    expect(decoupling!).toBeGreaterThan(0); // positive = fatigue
  });

  it('EF trend over 4 weeks, excludes planned sessions', () => {
    const now = Date.now();
    const sessions = [
      // Recent real sessions
      makeSession({
        id: 's1',
        sport: 'cycling',
        date: now - 7 * DAY_MS,
        normalizedPower: 220,
        avgHr: 150,
        distance: 30000,
        duration: 3600,
      }),
      makeSession({
        id: 's2',
        sport: 'cycling',
        date: now - 3 * DAY_MS,
        normalizedPower: 225,
        avgHr: 148,
        distance: 35000,
        duration: 4200,
      }),
      // Planned session — should be excluded
      makeSession({
        id: 'g1',
        sport: 'cycling',
        date: now - 1 * DAY_MS,
        normalizedPower: 200,
        avgHr: 140,
        isPlanned: true,
        hasDetailedRecords: false,
        sensorWarnings: [],
      }),
      // Old session (>4 weeks) — should be excluded
      makeSession({
        id: 's-old',
        sport: 'cycling',
        date: now - 35 * DAY_MS,
        normalizedPower: 210,
        avgHr: 155,
        distance: 25000,
        duration: 3000,
      }),
    ];

    const trend = getEFTrend(sessions, 'cycling');
    expect(trend).toHaveLength(2); // only the 2 recent real sessions
    expect(trend[0].ef).toBeCloseTo(220 / 150, 2);
    expect(trend[1].ef).toBeCloseTo(225 / 148, 2);
  });

  it('missing HR → undefined', () => {
    const ef = calculateEF(220, undefined, undefined, 'cycling');
    expect(ef).toBeUndefined();
  });

  it('insufficient records for decoupling → undefined', () => {
    const records = makeCyclingRecords('s3', 5); // < 10 with both power + HR
    const decoupling = calculateDecoupling(records);
    expect(decoupling).toBeUndefined();
  });
});

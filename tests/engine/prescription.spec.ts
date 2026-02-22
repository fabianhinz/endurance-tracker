import { describe, it, expect } from 'vitest';
import { generateWeeklyPlan, estimateWorkoutTss, estimateWorkoutDistance } from '../../src/engine/prescription.ts';
import { computeRunningZones } from '../../src/engine/zones.ts';
import type { DailyMetrics, PrescribedWorkout } from '../../src/types/index.ts';

const zones = computeRunningZones(270); // 4:30/km threshold

const makeMetrics = (overrides: Partial<DailyMetrics> = {}): DailyMetrics => ({
  date: '2026-02-20',
  tss: 50,
  ctl: 40,
  atl: 50,
  tsb: -10,
  acwr: 1.0,
  ...overrides,
});

describe('generateWeeklyPlan', () => {
  it('returns 7 workouts', () => {
    const plan = generateWeeklyPlan(makeMetrics(), [], zones, '2026-02-20');
    expect(plan.workouts).toHaveLength(7);
  });

  it('starts on Monday of the current week', () => {
    // 2026-02-20 is a Saturday → Monday is 2026-02-15
    const plan = generateWeeklyPlan(makeMetrics(), [], zones, '2026-02-20');
    expect(plan.weekOf).toBe('2026-02-15');
    expect(plan.workouts[0].dayLabel).toBe('Monday');
    expect(plan.workouts[6].dayLabel).toBe('Sunday');
  });

  it('assigns consecutive dates Mon-Sun', () => {
    const plan = generateWeeklyPlan(makeMetrics(), [], zones, '2026-02-20');
    for (let i = 1; i < plan.workouts.length; i++) {
      const prev = new Date(plan.workouts[i - 1].date + 'T00:00:00');
      const curr = new Date(plan.workouts[i].date + 'T00:00:00');
      expect(curr.getTime() - prev.getTime()).toBe(86400000);
    }
  });

  it('has totalEstimatedTss matching sum of individual workouts', () => {
    const plan = generateWeeklyPlan(makeMetrics(), [], zones, '2026-02-20');
    const sum = plan.workouts.reduce((s, w) => s + w.estimatedTss, 0);
    expect(plan.totalEstimatedTss).toBe(sum);
  });

  it('rest workouts have 0 TSS and no steps', () => {
    const plan = generateWeeklyPlan(makeMetrics(), [], zones, '2026-02-20');
    const rests = plan.workouts.filter((w) => w.type === 'rest');
    for (const r of rests) {
      expect(r.estimatedTss).toBe(0);
      expect(r.steps).toHaveLength(0);
    }
  });

  it('all non-rest workouts have steps with pace targets', () => {
    const plan = generateWeeklyPlan(makeMetrics(), [], zones, '2026-02-20');
    const active = plan.workouts.filter((w) => w.type !== 'rest');
    for (const w of active) {
      expect(w.steps.length).toBeGreaterThan(0);
      for (const s of w.steps) {
        expect(s.targetPaceMin).toBeGreaterThan(0);
        expect(s.targetPaceMax).toBeGreaterThan(0);
        expect(s.targetPaceMin).toBeGreaterThanOrEqual(s.targetPaceMax); // min pace is slower
      }
    }
  });
});

describe('form status templates', () => {
  it('overload (TSB < -30) generates mostly rest/recovery', () => {
    const plan = generateWeeklyPlan(
      makeMetrics({ tsb: -35, acwr: 1.0 }),
      [], zones, '2026-02-16',
    );
    const types = plan.workouts.map((w) => w.type);
    const restCount = types.filter((t) => t === 'rest').length;
    const recoveryCount = types.filter((t) => t === 'recovery').length;
    expect(restCount + recoveryCount).toBeGreaterThanOrEqual(4);
  });

  it('optimal (TSB -10 to -30) includes intensity sessions', () => {
    const plan = generateWeeklyPlan(
      makeMetrics({ tsb: -15, acwr: 1.0 }),
      [], zones, '2026-02-16',
    );
    const types = plan.workouts.map((w) => w.type);
    expect(types).toContain('threshold-intervals');
    expect(types).toContain('long-run');
  });

  it('detraining (TSB > 25) includes high-intensity sessions', () => {
    const plan = generateWeeklyPlan(
      makeMetrics({ tsb: 30, acwr: 0.5 }),
      [], zones, '2026-02-16',
    );
    const types = plan.workouts.map((w) => w.type);
    expect(types).toContain('vo2max-intervals');
    expect(types).toContain('threshold-intervals');
  });

  it('no-data generates conservative plan', () => {
    const plan = generateWeeklyPlan(undefined, [], zones, '2026-02-16');
    expect(plan.context).toEqual({ mode: 'no-data' });
    const types = plan.workouts.map((w) => w.type);
    const easyCount = types.filter((t) => t === 'easy').length;
    expect(easyCount).toBeGreaterThanOrEqual(4);
  });
});

describe('ACWR guards', () => {
  it('ACWR > 1.3 downgrades hardest session to easy', () => {
    const plan = generateWeeklyPlan(
      makeMetrics({ tsb: -15, acwr: 1.4 }),
      [], zones, '2026-02-16',
    );
    const types = plan.workouts.map((w) => w.type);
    // Optimal template has vo2max which should be downgraded
    expect(types).not.toContain('vo2max-intervals');
  });

  it('ACWR > 1.5 forces extra rest day', () => {
    const plan = generateWeeklyPlan(
      makeMetrics({ tsb: -15, acwr: 1.6 }),
      [], zones, '2026-02-16',
    );
    const types = plan.workouts.map((w) => w.type);
    expect(types).not.toContain('vo2max-intervals');
    const restCount = types.filter((t) => t === 'rest').length;
    expect(restCount).toBeGreaterThanOrEqual(2);
  });
});

describe('hard/easy alternation', () => {
  it('never has two intensity sessions back to back', () => {
    const intensityTypes = new Set([
      'threshold-intervals', 'vo2max-intervals', 'tempo', 'long-run',
    ]);

    // Test across all form statuses
    const tsbValues = [-35, -15, 0, 10, 30];
    for (const tsb of tsbValues) {
      const plan = generateWeeklyPlan(
        makeMetrics({ tsb, acwr: 1.0 }),
        [], zones, '2026-02-16',
      );
      for (let i = 1; i < plan.workouts.length; i++) {
        const prev = plan.workouts[i - 1].type;
        const curr = plan.workouts[i].type;
        if (intensityTypes.has(curr) && intensityTypes.has(prev)) {
          // This should never happen
          expect(`${prev} followed by ${curr}`).toBe('not back-to-back intensity');
        }
      }
    }
  });
});

describe('estimateWorkoutTss', () => {
  it('rest workout returns 0', () => {
    const rest: PrescribedWorkout = {
      id: 'test', date: '2026-02-20', dayLabel: 'Monday',
      type: 'rest', title: 'Rest', steps: [],
      estimatedDurationSec: 0, estimatedTss: 0,
      rationale: '', isTaper: false,
    };
    expect(estimateWorkoutTss(rest)).toBe(0);
  });

  it('45min easy workout returns ~37 TSS (50 TSS/hr)', () => {
    const easy: PrescribedWorkout = {
      id: 'test', date: '2026-02-20', dayLabel: 'Monday',
      type: 'easy', title: 'Easy', steps: [],
      estimatedDurationSec: 45 * 60, estimatedTss: 0,
      rationale: '', isTaper: false,
    };
    expect(estimateWorkoutTss(easy)).toBe(38); // 0.75 * 50 = 37.5 → 38
  });
});

describe('estimateWorkoutDistance', () => {
  it('rest workout returns 0', () => {
    const rest: PrescribedWorkout = {
      id: 'test', date: '2026-02-20', dayLabel: 'Monday',
      type: 'rest', title: 'Rest', steps: [],
      estimatedDurationSec: 0, estimatedTss: 0,
      rationale: '', isTaper: false,
    };
    expect(estimateWorkoutDistance(rest, zones)).toBe(0);
  });

  it('easy workout returns reasonable distance', () => {
    const plan = generateWeeklyPlan(makeMetrics(), [], zones, '2026-02-20');
    const easy = plan.workouts.find((w) => w.type === 'easy')!;
    const dist = estimateWorkoutDistance(easy, zones);
    // 45min at ~5:30/km pace ≈ 8.2km
    expect(dist).toBeGreaterThan(5000);
    expect(dist).toBeLessThan(15000);
  });
});

describe('workout structure', () => {
  it('threshold-intervals has warmup, work intervals, recovery intervals, cooldown', () => {
    const plan = generateWeeklyPlan(
      makeMetrics({ tsb: -15, acwr: 1.0 }),
      [], zones, '2026-02-16',
    );
    const threshold = plan.workouts.find((w) => w.type === 'threshold-intervals')!;
    expect(threshold).toBeDefined();
    expect(threshold.steps[0].type).toBe('warmup');
    expect(threshold.steps[1].type).toBe('work');
    expect(threshold.steps[1].repeat).toBe(5);
    expect(threshold.steps[1].zone).toBe('threshold');
    expect(threshold.steps[2].type).toBe('recovery');
    expect(threshold.steps[2].repeat).toBe(5);
    expect(threshold.steps[3].type).toBe('cooldown');
  });

  it('long-run has easy portion followed by tempo portion', () => {
    const plan = generateWeeklyPlan(
      makeMetrics({ tsb: -15, acwr: 1.0 }),
      [], zones, '2026-02-16',
    );
    const longRun = plan.workouts.find((w) => w.type === 'long-run')!;
    expect(longRun).toBeDefined();
    expect(longRun.steps).toHaveLength(2);
    expect(longRun.steps[0].zone).toBe('easy');
    expect(longRun.steps[1].zone).toBe('tempo');
  });
});

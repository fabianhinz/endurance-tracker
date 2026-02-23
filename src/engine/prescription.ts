import type {
  DailyMetrics,
  FormStatus,
  PrescribedWorkout,
  RunningZone,
  RunningZoneName,
  TrainingSession,
  WeeklyPlan,
  WorkoutStep,
  WorkoutType,
  PlanContext,
} from '../types/index.ts';
import { toDateString } from '../lib/utils.ts';
import { getFormStatus, getInjuryRisk, getLoadState } from './coaching.ts';
import { getZoneMidPace } from './zones.ts';

// --- TSS per hour by workout type ---

const TSS_PER_HOUR: Record<Exclude<WorkoutType, 'rest'>, number> = {
  recovery: 30,
  easy: 50,
  'long-run': 55,
  tempo: 65,
  'threshold-intervals': 75,
  'vo2max-intervals': 85,
};

// --- Workout template builders ---

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const zoneRange = (
  zoneName: RunningZoneName,
  zones: RunningZone[],
): { min: number; max: number } => {
  const zone = zones.find((z) => z.name === zoneName)!;
  return { min: zone.minPace, max: zone.maxPace };
};

const step = (
  type: WorkoutStep['type'],
  durationSec: number,
  zoneName: RunningZoneName,
  zones: RunningZone[],
  repeat?: number,
): WorkoutStep => {
  const range = zoneRange(zoneName, zones);
  return {
    type,
    durationSec,
    zone: zoneName,
    targetPaceMin: range.min,
    targetPaceMax: range.max,
    ...(repeat !== undefined ? { repeat } : {}),
  };
};

const buildWorkout = (
  type: WorkoutType,
  zones: RunningZone[],
): { title: string; steps: WorkoutStep[] } => {
  switch (type) {
    case 'rest':
      return { title: 'Rest Day', steps: [] };
    case 'recovery':
      return {
        title: '25min Recovery',
        steps: [step('work', 25 * 60, 'recovery', zones)],
      };
    case 'easy':
      return {
        title: '45min Easy',
        steps: [step('work', 45 * 60, 'easy', zones)],
      };
    case 'long-run':
      return {
        title: '90min Long Run',
        steps: [
          step('work', 75 * 60, 'easy', zones),
          step('work', 15 * 60, 'tempo', zones),
        ],
      };
    case 'tempo':
      return {
        title: '45min Tempo',
        steps: [
          step('warmup', 10 * 60, 'easy', zones),
          step('work', 25 * 60, 'tempo', zones),
          step('cooldown', 10 * 60, 'easy', zones),
        ],
      };
    case 'threshold-intervals':
      return {
        title: '5x5min @ Threshold',
        steps: [
          step('warmup', 10 * 60, 'easy', zones),
          step('work', 5 * 60, 'threshold', zones, 5),
          step('recovery', 2 * 60, 'recovery', zones, 5),
          step('cooldown', 10 * 60, 'easy', zones),
        ],
      };
    case 'vo2max-intervals':
      return {
        title: '5x3min @ VO2max',
        steps: [
          step('warmup', 15 * 60, 'easy', zones),
          step('work', 3 * 60, 'vo2max', zones, 5),
          step('recovery', 3 * 60, 'recovery', zones, 5),
          step('cooldown', 10 * 60, 'easy', zones),
        ],
      };
  }
};

// --- TSS & distance estimation ---

export const estimateWorkoutTss = (workout: PrescribedWorkout): number => {
  if (workout.type === 'rest') return 0;
  const tssRate = TSS_PER_HOUR[workout.type];
  return Math.round((workout.estimatedDurationSec / 3600) * tssRate);
};

const computeStepsDuration = (steps: WorkoutStep[]): number => {
  return steps.reduce((total, s) => total + s.durationSec * (s.repeat ?? 1), 0);
};

export const estimateWorkoutDistance = (
  workout: PrescribedWorkout,
  zones: RunningZone[],
): number => {
  if (workout.type === 'rest') return 0;
  let meters = 0;
  for (const s of workout.steps) {
    const zone = zones.find((z) => z.name === s.zone);
    if (!zone) continue;
    const midPace = getZoneMidPace(zone); // sec/km
    const reps = s.repeat ?? 1;
    meters += (s.durationSec * reps / midPace) * 1000;
  }
  return Math.round(meters);
};

// --- Week template selection ---

type WeekTemplate = WorkoutType[];

const WEEK_TEMPLATES: Record<FormStatus | 'no-data', WeekTemplate> = {
  overload: ['rest', 'recovery', 'rest', 'recovery', 'rest', 'easy', 'easy'],
  optimal: ['easy', 'threshold-intervals', 'recovery', 'vo2max-intervals', 'tempo', 'rest', 'long-run'],
  neutral: ['easy', 'threshold-intervals', 'recovery', 'tempo', 'easy', 'rest', 'long-run'],
  fresh: ['easy', 'vo2max-intervals', 'recovery', 'threshold-intervals', 'tempo', 'rest', 'long-run'],
  detraining: ['easy', 'vo2max-intervals', 'recovery', 'threshold-intervals', 'tempo', 'easy', 'long-run'],
  'no-data': ['rest', 'easy', 'rest', 'easy', 'easy', 'easy', 'easy'],
};

const getRationale = (context: PlanContext): string => {
  if (context.mode === 'no-data') {
    return 'No training history. Starting with a conservative plan of easy runs.';
  }
  if (context.mode === 'taper') {
    return `Taper plan for race on ${context.raceDate}. ${context.daysToRace} days to race.`;
  }
  const risk = getInjuryRisk(context.acwr);
  const base = `TSB is ${context.tsb > 0 ? '+' : ''}${Math.round(context.tsb)}. Form: ${context.formStatus}. ACWR ${context.acwr.toFixed(2)} (${risk} injury risk).`;
  if (context.dataMaturityDays < 28) {
    return `${base} Metrics are still stabilizing (${context.dataMaturityDays} days of data) — plan is conservative until 4 weeks of history.`;
  }
  return base;
};

// --- Load guards ---

const HIGH_INTENSITY: Set<WorkoutType> = new Set(['vo2max-intervals', 'threshold-intervals']);

const downgradeToRecoveryWeek = (template: WeekTemplate): WeekTemplate =>
  template.map((t) => {
    if (HIGH_INTENSITY.has(t)) return 'rest';
    if (t === 'tempo' || t === 'long-run') return 'easy';
    return t;
  });

const downgradeModerately = (template: WeekTemplate): WeekTemplate =>
  template.map((t) => {
    if (HIGH_INTENSITY.has(t) || t === 'long-run') return 'easy';
    return t;
  });

const upgradeForUndertraining = (template: WeekTemplate): WeekTemplate => {
  const result = [...template];
  // Upgrade first rest day (not Saturday index 5) to easy
  const restIndex = result.findIndex((t, i) => t === 'rest' && i !== 5);
  if (restIndex !== -1) {
    result[restIndex] = 'easy';
    return result;
  }
  // Fallback: upgrade first recovery to easy
  const recoveryIndex = result.findIndex((t) => t === 'recovery');
  if (recoveryIndex !== -1) {
    result[recoveryIndex] = 'easy';
  }
  return result;
};

const applyLoadGuards = (template: WeekTemplate, acwr: number, dataMaturityDays: number): WeekTemplate => {
  const state = getLoadState(acwr, dataMaturityDays);
  switch (state) {
    case 'immature':
      return WEEK_TEMPLATES['no-data'];
    case 'high-risk':
      return downgradeToRecoveryWeek(template);
    case 'moderate-risk':
      return downgradeModerately(template);
    case 'undertraining':
      return upgradeForUndertraining(template);
    case 'sweet-spot':
      return [...template];
  }
};

// --- Hard/easy validation ---

const INTENSITY_TYPES = new Set<WorkoutType>([
  'threshold-intervals',
  'vo2max-intervals',
  'tempo',
  'long-run',
]);

const fixBackToBackIntensity = (template: WeekTemplate): WeekTemplate => {
  const result = [...template];
  for (let i = 1; i < result.length; i++) {
    if (INTENSITY_TYPES.has(result[i]) && INTENSITY_TYPES.has(result[i - 1])) {
      result[i] = 'easy';
    }
  }
  return result;
};

// --- Main entry point ---

const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toDateString(d.getTime());
};

const getDayOfWeek = (dateStr: string): number => {
  const d = new Date(dateStr + 'T00:00:00');
  // Convert JS day (0=Sun) to Mon-based (0=Mon)
  return (d.getDay() + 6) % 7;
};

export const generateWeeklyPlan = (
  currentMetrics: DailyMetrics | undefined,
  _recentSessions: TrainingSession[],
  zones: RunningZone[],
  today: string,
  historyDays: number,
): WeeklyPlan => {
  // Determine context
  const context: PlanContext = currentMetrics
    ? {
        mode: 'normal',
        formStatus: getFormStatus(currentMetrics.tsb),
        tsb: currentMetrics.tsb,
        acwr: currentMetrics.acwr,
        dataMaturityDays: historyDays,
      }
    : { mode: 'no-data' };

  const formKey = context.mode === 'no-data' ? 'no-data' : context.formStatus;

  // Get base template and apply guards
  let template = WEEK_TEMPLATES[formKey];

  if (context.mode === 'normal') {
    template = applyLoadGuards(template, context.acwr, context.dataMaturityDays);
    template = fixBackToBackIntensity(template);
  }

  // Calculate Monday of current week
  const dayOfWeek = getDayOfWeek(today);
  const monday = addDays(today, -dayOfWeek);

  // Build workouts
  const workouts: PrescribedWorkout[] = template.map((type, i) => {
    const date = addDays(monday, i);
    const built = buildWorkout(type, zones);
    const durationSec = computeStepsDuration(built.steps);
    const tssRate = type === 'rest' ? 0 : TSS_PER_HOUR[type];
    const estimatedTss = Math.round((durationSec / 3600) * tssRate);

    return {
      id: `plan-${date}`,
      date,
      dayLabel: DAY_NAMES[i],
      type,
      title: built.title,
      steps: built.steps,
      estimatedDurationSec: durationSec,
      estimatedTss,
      rationale: getRationale(context),
      isTaper: false,
    };
  });

  return {
    weekOf: monday,
    workouts,
    totalEstimatedTss: workouts.reduce((sum, w) => sum + w.estimatedTss, 0),
    context,
  };
};

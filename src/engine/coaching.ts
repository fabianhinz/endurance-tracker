import type {
  CoachingRecommendation,
  DailyMetrics,
  FormStatus,
  InjuryRisk,
  LoadState,
} from '../types/index.ts';

export const getFormStatus = (tsb: number): FormStatus => {
  if (tsb > 25) return 'detraining';
  if (tsb >= 5) return 'fresh';
  if (tsb >= -10) return 'neutral';
  if (tsb >= -30) return 'optimal';
  return 'overload';
};

export const getFormMessage = (status: FormStatus): string => {
  switch (status) {
    case 'detraining':
      return 'Detraining risk. Increase volume.';
    case 'fresh':
      return 'Prime State. Ready to Race.';
    case 'neutral':
      return 'Neutral Zone. Maintain aerobic focus.';
    case 'optimal':
      return 'Productive Overload. Keep pushing.';
    case 'overload':
      return 'Deep Fatigue. High Risk. Rest recommended.';
  }
};

// ---------------------------------------------------------------------------
// Shared ACWR thresholds
// ---------------------------------------------------------------------------

export const ACWR_UNDERTRAINING_THRESHOLD = 0.8;
export const ACWR_MODERATE_THRESHOLD = 1.3;
export const ACWR_HIGH_THRESHOLD = 1.5;

// ---------------------------------------------------------------------------
// Shared load-state classification
// ---------------------------------------------------------------------------

export const getLoadState = (acwr: number, dataMaturityDays: number): LoadState => {
  if (dataMaturityDays < 21) return 'immature';
  if (dataMaturityDays < 28) {
    if (acwr > ACWR_HIGH_THRESHOLD) return 'high-risk';
    return 'transitioning';
  }
  if (acwr > ACWR_HIGH_THRESHOLD) return 'high-risk';
  if (acwr > ACWR_MODERATE_THRESHOLD) return 'moderate-risk';
  if (acwr < ACWR_UNDERTRAINING_THRESHOLD) return 'undertraining';
  return 'sweet-spot';
};

// ---------------------------------------------------------------------------
// ACWR-aware detailed messages
// ---------------------------------------------------------------------------

const IMMATURE_MESSAGES: Record<FormStatus, string> = {
  detraining:
    'Your fitness metrics are still stabilizing (less than 4 weeks of data). Current readings suggest training has been light recently. Focus on building consistency — the numbers will become more reliable as your history grows.',
  fresh:
    'Your fitness metrics are still stabilizing (less than 4 weeks of data). You appear well-rested based on early readings. Keep training consistently and the picture will sharpen over the coming weeks.',
  neutral:
    'Your fitness metrics are still stabilizing (less than 4 weeks of data). Your training load looks balanced so far. Keep logging sessions — reliable coaching insights need about 4 weeks of history.',
  optimal:
    'Your fitness metrics are still stabilizing (less than 4 weeks of data). Early signs suggest a solid training load. Stay consistent and monitor how you feel — the metrics will become more meaningful soon.',
  overload:
    'Your fitness metrics are still stabilizing (less than 4 weeks of data). Early readings suggest high fatigue relative to your short history. Consider an easy day, but keep in mind these numbers are preliminary.',
};

const UNDERTRAINING_MESSAGES: Record<FormStatus, string> = {
  detraining:
    'Your fitness is declining and your recent training load is well below your long-term average. You are at risk of deconditioning. Gradually ramp volume back up to arrest the fitness loss.',
  fresh:
    'You are well-rested, but your recent training load is significantly below your baseline. While you are ready to perform now, sustained underloading will erode your fitness. Consider adding volume.',
  neutral:
    'Your readiness is balanced, but your weekly load has dropped well below your chronic average. Maintaining this level too long leads to deconditioning. A moderate increase would keep fitness on track.',
  optimal:
    'You have been training hard recently, yet your acute load is still below your long-term average. This can happen after a sudden taper. Ensure the reduced load is intentional and time-limited.',
  overload:
    'You are carrying significant fatigue despite a low recent training load relative to your history. This may indicate accumulated stress from non-training factors. Prioritize recovery before adding volume.',
};

const SWEET_SPOT_MESSAGES: Record<FormStatus, string> = {
  detraining:
    'Your fitness is starting to decline because training has been too light recently. Your body has fully recovered and is ready for more stimulus. Consider gradually increasing your training volume to get back on track.',
  fresh:
    'You are well-rested and your fitness is high relative to your fatigue. This is the ideal state for racing or key workouts. If you have a target event coming up, now is the time to perform.',
  neutral:
    'Your training load is balanced with your recovery. This is normal day-to-day training territory. Keep following your plan and focus on aerobic development and consistency.',
  optimal:
    'You have been training hard recently and your body is adapting. This is a good place to be — your fitness is growing. Just make sure you are sleeping well and eating enough to support recovery.',
  overload:
    'You are carrying significant fatigue from recent training. Your body needs rest to absorb the training stress and come back stronger. Take easy days or a full rest day before pushing hard again.',
};

const RISK_MESSAGES: Record<FormStatus, Record<Exclude<InjuryRisk, 'low'>, string>> = {
  detraining: {
    moderate:
      'Your fitness is declining, and your training ramp rate is elevated. Avoid jumping back in too aggressively — a moderate, progressive return to training is safer than a sudden spike.',
    high:
      'Your fitness is declining and your recent load spike is in the high-risk zone. Back off immediately. Rebuild volume gradually over 2-3 weeks rather than trying to make up for lost time.',
  },
  fresh: {
    moderate:
      'You are well-rested, but your training has ramped up faster than usual. You can still perform well, but monitor for early signs of strain. Avoid stacking another big increase this week.',
    high:
      'You are rested, but your load has spiked sharply — putting you at elevated injury risk. Scale back intensity or volume this week. Being fresh does not protect against a load spike.',
  },
  neutral: {
    moderate:
      'Your readiness is balanced, but your training ramp rate is above the safe zone. Hold steady or slightly reduce this week to let your body catch up before pushing further.',
    high:
      'Your readiness is balanced, but your load has increased dangerously fast. Reduce volume or intensity for the next few days. A sharp ramp at any readiness level raises injury risk.',
  },
  optimal: {
    moderate:
      'You are in a productive training phase, and your load ramp is moderately elevated. This is a fine line — keep pushing, but do not stack another big increase on top. Listen to your body.',
    high:
      'You are training hard and your load has spiked into the danger zone. The combination of high fatigue and rapid ramp-up is the highest-risk scenario. Take a recovery day now.',
  },
  overload: {
    moderate:
      'You are carrying deep fatigue and your load ramp is elevated. Your body is under significant stress. Easy days or complete rest are strongly recommended before resuming hard training.',
    high:
      'You are deeply fatigued with a dangerous load spike. This is the highest-risk state — injury likelihood is significantly elevated. Rest immediately and do not resume hard training until fatigue subsides.',
  },
};

export const getFormMessageDetailed = (rec: CoachingRecommendation): string => {
  const state = getLoadState(rec.acwr, rec.dataMaturityDays);

  switch (state) {
    case 'immature':
    case 'transitioning':
      return IMMATURE_MESSAGES[rec.status];
    case 'undertraining':
      return UNDERTRAINING_MESSAGES[rec.status];
    case 'sweet-spot':
      return SWEET_SPOT_MESSAGES[rec.status];
    case 'moderate-risk':
    case 'high-risk':
      return RISK_MESSAGES[rec.status][rec.injuryRisk as Exclude<InjuryRisk, 'low'>];
  }
};

export const getInjuryRisk = (acwr: number): InjuryRisk => {
  if (acwr <= ACWR_MODERATE_THRESHOLD) return 'low';
  if (acwr <= ACWR_HIGH_THRESHOLD) return 'moderate';
  return 'high';
};

export const getACWRColor = (acwr: number): 'green' | 'yellow' | 'red' => {
  if (acwr < ACWR_UNDERTRAINING_THRESHOLD) return 'yellow';
  if (acwr <= ACWR_MODERATE_THRESHOLD) return 'green';
  if (acwr <= ACWR_HIGH_THRESHOLD) return 'yellow';
  return 'red';
};

export const getCoachingRecommendation = (
  metrics: DailyMetrics | undefined,
  historyDays: number,
): CoachingRecommendation => {
  if (!metrics) {
    return {
      status: 'neutral',
      message: 'Not enough data yet. Upload sessions to get recommendations.',
      tsb: 0,
      acwr: 0,
      injuryRisk: 'low',
      dataMaturityDays: historyDays,
    };
  }

  const status = getFormStatus(metrics.tsb);
  const message = getFormMessage(status);
  const injuryRisk = getInjuryRisk(metrics.acwr);

  return {
    status,
    message,
    tsb: metrics.tsb,
    acwr: metrics.acwr,
    injuryRisk,
    dataMaturityDays: historyDays,
  };
};

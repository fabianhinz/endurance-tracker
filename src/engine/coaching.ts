import type {
  CoachingRecommendation,
  DailyMetrics,
  FormStatus,
  InjuryRisk,
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

export const getFormMessageDetailed = (status: FormStatus): string => {
  switch (status) {
    case 'detraining':
      return 'Your fitness is starting to decline because training has been too light recently. Your body has fully recovered and is ready for more stimulus. Consider gradually increasing your training volume to get back on track.';
    case 'fresh':
      return 'You are well-rested and your fitness is high relative to your fatigue. This is the ideal state for racing or key workouts. If you have a target event coming up, now is the time to perform.';
    case 'neutral':
      return 'Your training load is balanced with your recovery. This is normal day-to-day training territory. Keep following your plan and focus on aerobic development and consistency.';
    case 'optimal':
      return 'You have been training hard recently and your body is adapting. This is a good place to be — your fitness is growing. Just make sure you are sleeping well and eating enough to support recovery.';
    case 'overload':
      return 'You are carrying significant fatigue from recent training. Your body needs rest to absorb the training stress and come back stronger. Take easy days or a full rest day before pushing hard again.';
  }
};

export const getInjuryRisk = (acwr: number): InjuryRisk => {
  if (acwr < 0.8) return 'low'; // undertraining
  if (acwr <= 1.3) return 'low'; // sweet spot
  if (acwr <= 1.5) return 'moderate';
  return 'high';
};

export const getACWRColor = (acwr: number): 'green' | 'yellow' | 'red' => {
  if (acwr < 0.8) return 'yellow';
  if (acwr <= 1.3) return 'green';
  if (acwr <= 1.5) return 'yellow';
  return 'red';
};

export const getCoachingRecommendation = (
  metrics: DailyMetrics | undefined,
): CoachingRecommendation => {
  if (!metrics) {
    return {
      status: 'neutral',
      message: 'Not enough data yet. Upload sessions to get recommendations.',
      tsb: 0,
      acwr: 0,
      injuryRisk: 'low',
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
  };
};

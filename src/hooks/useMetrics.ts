import { useMemo } from 'react';
import { useSessionsStore } from '../store/sessions.ts';
import { computeMetrics } from '../engine/metrics.ts';
import { getCoachingRecommendation } from '../engine/coaching.ts';
import type { DailyMetrics, CoachingRecommendation } from '../types/index.ts';

export const useMetrics = (): {
  history: DailyMetrics[];
  current: DailyMetrics | undefined;
  coaching: CoachingRecommendation;
} => {
  const sessions = useSessionsStore((s) => s.sessions);

  return useMemo(() => {
    const history = computeMetrics(sessions);
    const current = history.length > 0 ? history[history.length - 1] : undefined;
    const coaching = getCoachingRecommendation(current, history.length);
    return { history, current, coaching };
  }, [sessions]);
};

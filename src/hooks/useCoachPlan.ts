import { useEffect, useMemo, useState } from 'react';
import { useSessionsStore } from '../store/sessions.ts';
import { useUserStore } from '../store/user.ts';
import { useCoachPlanStore } from '../store/coach-plan.ts';
import { computeMetrics } from '../engine/metrics.ts';
import { computeRunningZones } from '../engine/zones.ts';
import { generateWeeklyPlan } from '../lib/prescription.ts';
import { getMondayOfWeek, buildPlanCacheKey } from '../lib/week-key.ts';
import { toDateString } from '../lib/utils.ts';
import type { RunningZone } from '../engine/types.ts';
import type { WeeklyPlan } from '../types/index.ts';

export const useCoachPlan = (): {
  plan: WeeklyPlan | null;
  zones: RunningZone[];
  hasThresholdPace: boolean;
} => {
  const sessions = useSessionsStore((s) => s.sessions);
  const profile = useUserStore((s) => s.profile);
  const cachedPlan = useCoachPlanStore((s) => s.cachedPlan);
  const cacheKey = useCoachPlanStore((s) => s.cacheKey);

  const [today] = useState(() => toDateString(Date.now()));

  const result = useMemo(() => {
    const thresholdPace = profile?.thresholds.thresholdPace;

    if (!thresholdPace) {
      return { plan: null, zones: [], hasThresholdPace: false, freshPlan: null, freshKey: null };
    }

    const weekOf = getMondayOfWeek(today);
    const currentKey = buildPlanCacheKey(weekOf, sessions.length, thresholdPace);

    if (cachedPlan && cacheKey === currentKey) {
      const zones = computeRunningZones(thresholdPace);
      return { plan: cachedPlan, zones, hasThresholdPace: true, freshPlan: null, freshKey: null };
    }

    const zones = computeRunningZones(thresholdPace);
    const history = computeMetrics(sessions);
    const current = history.length > 0 ? history[history.length - 1] : undefined;
    const plan = generateWeeklyPlan(current, zones, today, history.length);

    return { plan, zones, hasThresholdPace: true, freshPlan: plan, freshKey: currentKey };
  }, [sessions, profile, today, cachedPlan, cacheKey]);

  useEffect(() => {
    if (result.freshPlan && result.freshKey) {
      useCoachPlanStore.getState().setPlan(result.freshPlan, result.freshKey);
    }
  }, [result.freshPlan, result.freshKey]);

  return { plan: result.plan, zones: result.zones, hasThresholdPace: result.hasThresholdPace };
};

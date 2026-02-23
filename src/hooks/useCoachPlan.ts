import { useMemo, useState } from 'react';
import { useSessionsStore } from '../store/sessions.ts';
import { useUserStore } from '../store/user.ts';
import { computeMetrics } from '../engine/metrics.ts';
import { computeRunningZones } from '../engine/zones.ts';
import { generateWeeklyPlan } from '../engine/prescription.ts';
import { toDateString } from '../lib/utils.ts';
import type { RunningZone, WeeklyPlan } from '../types/index.ts';

export const useCoachPlan = (): {
  plan: WeeklyPlan | null;
  zones: RunningZone[];
  hasThresholdPace: boolean;
  today: string;
} => {
  const sessions = useSessionsStore((s) => s.sessions);
  const profile = useUserStore((s) => s.profile);
  const [today] = useState(() => toDateString(Date.now()));

  return useMemo(() => {
    const thresholdPace = profile?.thresholds.thresholdPace;

    if (!thresholdPace) {
      return { plan: null, zones: [], hasThresholdPace: false, today };
    }

    const zones = computeRunningZones(thresholdPace);
    const history = computeMetrics(sessions);
    const current = history.length > 0 ? history[history.length - 1] : undefined;
    const plan = generateWeeklyPlan(current, sessions, zones, today, history.length);

    return { plan, zones, hasThresholdPace: true, today };
  }, [sessions, profile, today]);
};

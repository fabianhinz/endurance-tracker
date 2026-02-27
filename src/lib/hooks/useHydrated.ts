import { useSyncExternalStore } from 'react';
import { useUserStore } from '../../store/user.ts';
import { useSessionsStore } from '../../store/sessions.ts';
import { useCoachPlanStore } from '../../store/coachPlan.ts';

const subscribe = (cb: () => void): (() => void) => {
  const unsubs = [
    useUserStore.persist.onFinishHydration(cb),
    useSessionsStore.persist.onFinishHydration(cb),
    useCoachPlanStore.persist.onFinishHydration(cb),
  ];
  return () => unsubs.forEach((u) => u());
};

const getSnapshot = (): boolean => {
  return (
    useUserStore.persist.hasHydrated() &&
    useSessionsStore.persist.hasHydrated() &&
    useCoachPlanStore.persist.hasHydrated()
  );
};

export const useStoresHydrated = (): boolean => {
  return useSyncExternalStore(subscribe, getSnapshot);
};

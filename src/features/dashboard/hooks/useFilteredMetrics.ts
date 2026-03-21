import { useMemo } from 'react';
import { useSessionsStore } from '@/store/sessions.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { computeMetrics } from '@/packages/engine/metrics.ts';
import type { DailyMetrics } from '@/packages/engine/types.ts';

export const useFilteredMetrics = (): {
  history: DailyMetrics[];
  current: DailyMetrics | undefined;
} => {
  const sessions = useSessionsStore((s) => s.sessions);
  const sportFilter = useFiltersStore((s) => s.sportFilter);

  return useMemo(() => {
    let filtered = sessions;
    if (sportFilter !== 'all') {
      filtered = sessions.filter((s) => s.sport === sportFilter);
    }
    const history = computeMetrics(filtered);
    let current: DailyMetrics | undefined = undefined;
    if (history.length > 0) {
      current = history[history.length - 1];
    }
    return { history, current };
  }, [sessions, sportFilter]);
};

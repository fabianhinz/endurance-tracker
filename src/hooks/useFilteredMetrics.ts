import { useMemo } from "react";
import { useSessionsStore } from "../store/sessions.ts";
import { useFiltersStore } from "../store/filters.ts";
import { computeMetrics } from "../engine/metrics.ts";
import type { DailyMetrics } from "../engine/types.ts";

export const useFilteredMetrics = (): {
  history: DailyMetrics[];
  current: DailyMetrics | undefined;
} => {
  const sessions = useSessionsStore((s) => s.sessions);
  const sportFilter = useFiltersStore((s) => s.sportFilter);

  return useMemo(() => {
    const filtered =
      sportFilter === "all"
        ? sessions
        : sessions.filter((s) => s.sport === sportFilter);
    const history = computeMetrics(filtered);
    const current = history.length > 0 ? history[history.length - 1] : undefined;
    return { history, current };
  }, [sessions, sportFilter]);
};

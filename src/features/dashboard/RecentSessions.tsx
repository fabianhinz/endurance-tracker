import { useMemo } from "react";
import { useSessionsStore } from "../../store/sessions.ts";
import { useFiltersStore } from "../../store/filters.ts";
import { useMapFocusStore } from "../../store/map-focus.ts";
import { useHoverIntent } from "../../hooks/useHoverIntent.ts";
import { Card } from "../../components/ui/Card.tsx";
import { CardHeader } from "../../components/ui/CardHeader.tsx";
import { SessionItem } from "../../components/ui/SessionItem.tsx";
import type { TimeRange } from "../../lib/time-range.ts";
import { rangeToCutoff, customRangeToCutoffs } from "../../lib/time-range.ts";

export const RecentSessions = () => {
  const sessions = useSessionsStore((s) => s.sessions);
  const timeRange = useFiltersStore((s) => s.timeRange);
  const customRange = useFiltersStore((s) => s.customRange);
  const sportFilter = useFiltersStore((s) => s.sportFilter);
  const hover = useHoverIntent(useMapFocusStore((s) => s.setHoveredSession));

  const recent = useMemo(() => {
    let list: typeof sessions;

    if (timeRange === "custom" && customRange) {
      const bounds = customRangeToCutoffs(customRange);
      list = sessions.filter(
        (s) =>
          !s.isPlanned &&
          s.date >= bounds.from &&
          s.date <= bounds.to &&
          (sportFilter === "all" || s.sport === sportFilter),
      );
    } else {
      const cutoff = rangeToCutoff(timeRange as Exclude<TimeRange, "custom">);
      list = sessions.filter(
        (s) =>
          !s.isPlanned &&
          s.date >= cutoff &&
          (sportFilter === "all" || s.sport === sportFilter),
      );
    }

    return list.sort((a, b) => b.date - a.date).slice(0, 3);
  }, [sessions, timeRange, customRange, sportFilter]);

  return (
    <Card>
      <CardHeader title="Recent Sessions" subtitle="Your latest training sessions" />
      <div className="flex-1 space-y-2">
        {recent.map((s) => (
          <SessionItem
            key={s.id}
            session={s}
            size="sm"
            onPointerEnter={() => hover.onPointerEnter(s.id)}
            onPointerLeave={hover.onPointerLeave}
          />
        ))}
      </div>
    </Card>
  );
};

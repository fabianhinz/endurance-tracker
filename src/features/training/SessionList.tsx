import { useMemo } from "react";
import { useSessionsStore } from "../../store/sessions.ts";
import { useFiltersStore } from "../../store/filters.ts";
import { useMapFocusStore } from "../../store/map-focus.ts";
import { useHoverIntent } from "../../hooks/useHoverIntent.ts";
import { SessionItem } from "../../components/ui/SessionItem.tsx";
import {
  type TimeRange,
  rangeToCutoff,
  customRangeToCutoffs,
} from "../../lib/time-range.ts";

export const SessionList = () => {
  const sessions = useSessionsStore((s) => s.sessions);
  const timeRange = useFiltersStore((s) => s.timeRange);
  const customRange = useFiltersStore((s) => s.customRange);
  const sportFilter = useFiltersStore((s) => s.sportFilter);
  const setHoveredSession = useMapFocusStore((s) => s.setHoveredSession);
  const hover = useHoverIntent(setHoveredSession);

  const filtered = useMemo(() => {
    let list: typeof sessions;

    if (timeRange === "custom" && customRange) {
      const bounds = customRangeToCutoffs(customRange);
      list = sessions.filter((s) => !s.isPlanned && s.date >= bounds.from && s.date <= bounds.to);
    } else {
      const cutoff = rangeToCutoff(timeRange as Exclude<TimeRange, "custom">);
      list = sessions.filter((s) => !s.isPlanned && s.date >= cutoff);
    }

    if (sportFilter !== "all") {
      list = list.filter((s) => s.sport === sportFilter);
    }
    return list.sort((a, b) => b.date - a.date);
  }, [sessions, sportFilter, timeRange, customRange]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {filtered.map((session) => (
          <SessionItem
            key={session.id}
            session={session}
            onPointerEnter={() => hover.onPointerEnter(session.id)}
            onPointerLeave={hover.onPointerLeave}
          />
        ))}
      </div>
    </div>
  );
};

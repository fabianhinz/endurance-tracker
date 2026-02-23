import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useSessionsStore } from "../../store/sessions.ts";
import { useFiltersStore } from "../../store/filters.ts";
import { useMapFocusStore } from "../../store/map-focus.ts";
import { useHoverIntent } from "../../hooks/useHoverIntent.ts";
import { Card } from "../../components/ui/Card.tsx";
import { CardHeader } from "../../components/ui/CardHeader.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { formatDuration, formatDistance, formatDate } from "../../lib/utils.ts";
import { SportBadge } from "../../components/ui/SportBadge.tsx";
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
          <Link
            key={s.id}
            to={`/training/${s.id}`}
            onPointerEnter={() => hover.onPointerEnter(s.id)}
            onPointerLeave={hover.onPointerLeave}
            className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/10 cursor-pointer"
          >
            <SportBadge sport={s.sport} size="sm" />
            <div className="flex-1 min-w-0">
              <Typography variant="body" className="truncate">
                {s.name ?? formatDate(s.date)}
              </Typography>
              <Typography variant="caption" as="p">
                {s.name && <>{formatDate(s.date)} &middot; </>}
                {formatDistance(s.distance)} &middot;{" "}
                {formatDuration(s.duration)}
              </Typography>
            </div>
            <div className="text-right">
              <Typography variant="emphasis">{s.tss.toFixed(0)}</Typography>
              <Typography variant="caption" as="p">
                TSS
              </Typography>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
};

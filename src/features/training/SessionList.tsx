import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { useSessionsStore } from "../../store/sessions.ts";
import { useFiltersStore } from "../../store/filters.ts";
import { useMapFocusStore } from "../../store/map-focus.ts";
import { useHoverIntent } from "../../hooks/useHoverIntent.ts";
import { formatDate, formatDuration, formatDistance } from "../../lib/utils.ts";
import { Typography } from "../../components/ui/Typography.tsx";
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/Dialog.tsx";
import { Button } from "../../components/ui/Button.tsx";
import { SportBadge } from "../../components/ui/SportBadge.tsx";
import { glassClass } from "../../components/ui/Card.tsx";
import {
  type TimeRange,
  rangeToCutoff,
  customRangeToCutoffs,
} from "../../lib/time-range.ts";
import type { TrainingSession } from "../../types/index.ts";
import { METRIC_EXPLANATIONS } from "../../engine/explanations.ts";

export const SessionList = () => {
  const sessions = useSessionsStore((s) => s.sessions);
  const deleteSession = useSessionsStore((s) => s.deleteSession);
  const timeRange = useFiltersStore((s) => s.timeRange);
  const customRange = useFiltersStore((s) => s.customRange);
  const sportFilter = useFiltersStore((s) => s.sportFilter);
  const setHoveredSession = useMapFocusStore((s) => s.setHoveredSession);
  const hover = useHoverIntent(setHoveredSession);
  const [sessionToDelete, setSessionToDelete] =
    useState<TrainingSession | null>(null);

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
          <Link
            key={session.id}
            to={`/training/${session.id}`}
            onPointerEnter={() => hover.onPointerEnter(session.id)}
            onPointerLeave={hover.onPointerLeave}
            className={`flex items-center gap-4 rounded-xl ${glassClass} p-4 transition-colors hover:bg-white/10`}
          >
            <SportBadge sport={session.sport} />
            <div className="flex-1 min-w-0">
              <Typography variant="emphasis" className="truncate">
                {session.name ?? formatDate(session.date)}
              </Typography>
              <Typography variant="caption" as="p">
                {session.name && <>{formatDate(session.date)} &middot; </>}
                {formatDistance(session.distance)} &middot;{" "}
                {formatDuration(session.duration)}
                {session.avgHr ? <> &middot; {session.avgHr} bpm</> : ""}
              </Typography>
            </div>
            <div className="text-right">
              <Typography variant="h3" as="p">
                {session.tss.toFixed(0)}
              </Typography>
              <Typography variant="caption" as="p">
                {METRIC_EXPLANATIONS[session.stressMethod].shortLabel}
              </Typography>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSessionToDelete(session);
              }}
              className="text-text-quaternary hover:bg-white/10 hover:text-status-danger"
            >
              <X size={16} strokeWidth={1.5} />
            </Button>
          </Link>
        ))}
      </div>
      <DialogRoot
        open={sessionToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setSessionToDelete(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Delete Session</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the {sessionToDelete?.sport} session
            from {sessionToDelete ? formatDate(sessionToDelete.date) : ""}? This
            action cannot be undone.
          </DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setSessionToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              className="bg-status-danger text-white hover:bg-status-danger/80"
              onClick={() => {
                if (!sessionToDelete) return;
                deleteSession(sessionToDelete.id);
                setSessionToDelete(null);
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </DialogRoot>
    </div>
  );
};

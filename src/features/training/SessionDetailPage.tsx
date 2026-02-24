import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { useSessionsStore } from "../../store/sessions.ts";
import { useMapFocusStore } from "../../store/map-focus.ts";
import { getSessionRecords, getSessionLaps } from "../../lib/indexeddb.ts";
import { Button } from "../../components/ui/Button.tsx";
import { MetricCard } from "../../components/ui/MetricCard.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { PageGrid } from "../../components/ui/PageGrid.tsx";
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/Dialog.tsx";
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/ui/DropdownMenu.tsx";
import {
  formatDate,
  formatDuration,
  formatDistance,
  formatSubSport,
} from "../../lib/utils.ts";
import { SportChip } from "../../components/ui/SportChip.tsx";
import { SessionStatsGrid } from "./SessionStatsGrid.tsx";
import { SessionChartsExplorer } from "./SessionChartsExplorer.tsx";
import type { SessionRecord, SessionLap } from "../../types/index.ts";
import { METRIC_EXPLANATIONS } from "../../engine/explanations.ts";

export const SessionDetailPage = () => {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sessions = useSessionsStore((s) => s.sessions);
  const deleteSession = useSessionsStore((s) => s.deleteSession);
  const renameSession = useSessionsStore((s) => s.renameSession);
  const session = sessions.find((s) => s.id === params.id);
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [laps, setLaps] = useState<SessionLap[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    if (params.id && session?.hasDetailedRecords) {
      getSessionRecords(params.id).then(setRecords);
      getSessionLaps(params.id).then(setLaps);
    }
  }, [params.id, session?.hasDetailedRecords]);

  const setFocusedLaps = useMapFocusStore((s) => s.setFocusedLaps);
  const clearFocusedLaps = useMapFocusStore((s) => s.clearFocusedLaps);

  useEffect(() => {
    if (laps.length > 0 && session) {
      setFocusedLaps(laps, session.sport);
    }
    return () => {
      clearFocusedLaps();
    };
  }, [laps, session, setFocusedLaps, clearFocusedLaps]);

  if (!session) {
    return (
      <Typography variant="body" color="tertiary">
        Session not found.
      </Typography>
    );
  }

  const subSportLabel =
    session.subSport && session.subSport !== "generic"
      ? formatSubSport(session.subSport)
      : null;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="flex justify-center flex-col">
          <Typography variant="h2" as="h1">
            {session.name ?? formatDate(session.date)}
          </Typography>
          {session.name && (
            <Typography variant="caption" color="tertiary">
              {formatDate(session.date)}
            </Typography>
          )}
        </div>
        <div className="flex flex-grow justify-end flex-wrap gap-3">
          <SportChip sport={session.sport} />
          {subSportLabel && (
            <Typography
              variant="caption"
              color="quaternary"
              className="flex items-center rounded-md bg-white/10 px-2 py-0.5"
            >
              {subSportLabel}
            </Typography>
          )}
          <DropdownMenuRoot>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Session actions">
                <Ellipsis size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => {
                  setNameInput(session.name ?? formatDate(session.date));
                  setShowRenameDialog(true);
                }}
              >
                <Pencil size={14} />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-status-danger focus:text-status-danger"
                onSelect={() => setShowDeleteDialog(true)}
              >
                <Trash2 size={14} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuRoot>
        </div>
      </div>

      <PageGrid>
        <div className="grid grid-cols-2 gap-4 md:col-span-2">
          <MetricCard
            label="Duration"
            subtitle=""
            size="lg"
            value={formatDuration(session.duration)}
          />
          <MetricCard
            label="Distance"
            subtitle=""
            size="lg"
            value={formatDistance(session.distance)}
          />
          <MetricCard
            label={METRIC_EXPLANATIONS[session.stressMethod].friendlyName}
            subtitle=""
            metricId={session.stressMethod}
            size="lg"
            value={session.tss.toFixed(0)}
          />
          <MetricCard
            label="Avg HR"
            subtitle=""
            size="lg"
            value={session.avgHr ?? "--"}
            unit={session.avgHr ? "bpm" : undefined}
          />
        </div>

        {records.length > 0 && (
          <div className="md:col-span-2">
            <SessionChartsExplorer records={records} session={session} />
          </div>
        )}

        <div className="md:col-span-2">
          <SessionStatsGrid session={session} laps={laps} />
        </div>
      </PageGrid>

      <DialogRoot
        open={showRenameDialog}
        onOpenChange={(open) => {
          if (!open) setShowRenameDialog(false);
        }}
      >
        <DialogContent>
          <DialogTitle>Rename Session</DialogTitle>
          <DialogDescription>
            Enter a new name for this session.
          </DialogDescription>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && nameInput.trim()) {
                renameSession(session.id, nameInput.trim());
                setShowRenameDialog(false);
              }
            }}
            className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            autoFocus
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowRenameDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (nameInput.trim()) {
                  renameSession(session.id, nameInput.trim());
                  setShowRenameDialog(false);
                }
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </DialogRoot>

      <DialogRoot
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) setShowDeleteDialog(false);
        }}
      >
        <DialogContent>
          <DialogTitle>Delete Session</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the {session.sport} session from{" "}
            {formatDate(session.date)}? This action cannot be undone.
          </DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-status-danger text-white hover:bg-status-danger/80"
              onClick={() => {
                deleteSession(session.id);
                setShowDeleteDialog(false);
                navigate("/training");
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

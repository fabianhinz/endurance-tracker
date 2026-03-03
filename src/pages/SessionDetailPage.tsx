import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Ellipsis, Pencil, Trash2 } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { useSessionsStore } from '@/store/sessions.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import {
  getSessionRecords,
  getSessionLaps,
  deleteSessionRecords,
  deleteSessionLaps,
  deleteSessionGPS,
  deleteFitFile,
} from '@/lib/indexeddb.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { PageGrid } from '@/components/ui/PageGrid.tsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs.tsx';
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog.tsx';
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/DropdownMenu.tsx';
import { formatDate, formatSubSport } from '@/lib/utils.ts';
import { SportChip } from '@/features/sessions/SportChip.tsx';
import { SessionStatsGrid } from '@/features/sessions/session/SessionStatsGrid.tsx';
import { SessionChartsExplorer } from '@/features/sessions/charts/SessionChartsExplorer.tsx';
import { TrainingEffectCard } from '@/features/sessions/session/TrainingEffectCard.tsx';
import { SessionRecordsCard } from '@/features/sessions/session/SessionRecordsCard.tsx';
import { LapsTab } from '@/features/sessions/laps/LapsTab.tsx';
import type { SessionRecord, SessionLap } from '@/engine/types.ts';

const validTabs = new Set(['overview', 'laps']);

export const SessionDetailPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const tab = rawTab && validTabs.has(rawTab) ? rawTab : 'overview';

  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const session = useSessionsStore((s) => s.sessions.find((session) => session.id === params.id));
  const deleteSession = useSessionsStore((s) => s.deleteSession);
  const renameSession = useSessionsStore((s) => s.renameSession);
  const personalBests = useSessionsStore((s) => s.personalBests);
  const sessionPBs = useMemo(
    () => personalBests.filter((pb) => pb.sessionId === params.id),
    [personalBests, params.id],
  );
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [laps, setLaps] = useState<SessionLap[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [nameInput, setNameInput] = useState('');

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
      <Typography variant="body1" color="textSecondary">
        {m.ui_session_not_found()}
      </Typography>
    );
  }

  const subSportLabel =
    session.subSport && session.subSport !== 'generic' ? formatSubSport(session.subSport) : null;

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // no layout shift
  if (records.length === 0) {
    return;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="flex justify-center flex-col">
          <Typography variant="h2" as="h1">
            {session.name ?? formatDate(session.date)}
          </Typography>
          {session.name && <Typography variant="caption">{formatDate(session.date)}</Typography>}
        </div>
        <div className="flex flex-grow justify-end flex-wrap gap-3">
          <SportChip sport={session.sport} />
          {subSportLabel && (
            <Typography
              variant="caption"
              color="textQuaternary"
              className="flex items-center rounded-md bg-white/10 px-2 py-0.5"
            >
              {subSportLabel}
            </Typography>
          )}
          <DropdownMenuRoot>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={m.ui_session_actions()}>
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
                {m.ui_btn_rename()}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-status-danger focus:text-status-danger"
                onSelect={() => setShowDeleteDialog(true)}
              >
                <Trash2 size={14} />
                {m.ui_btn_delete()}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuRoot>
        </div>
      </div>

      <Tabs defaultValue="overview" value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="overview">{m.ui_session_tab_overview()}</TabsTrigger>
          <TabsTrigger value="laps">{m.ui_session_tab_laps()}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PageGrid>
            <div className="md:col-span-2">
              <TrainingEffectCard records={records} session={session} />
            </div>

            {sessionPBs.length > 0 && (
              <div className="md:col-span-2">
                <SessionRecordsCard sessionPBs={sessionPBs} />
              </div>
            )}

            <div className="md:col-span-2">
              <SessionChartsExplorer records={records} session={session} />
            </div>

            <div className="md:col-span-2">
              <SessionStatsGrid session={session} laps={laps} />
            </div>
          </PageGrid>
        </TabsContent>

        <TabsContent value="laps">
          <LapsTab laps={laps} session={session} records={records} />
        </TabsContent>
      </Tabs>

      <DialogRoot
        open={showRenameDialog}
        onOpenChange={(open) => {
          if (!open) setShowRenameDialog(false);
        }}
      >
        <DialogContent>
          <DialogTitle>{m.ui_session_rename_title()}</DialogTitle>
          <DialogDescription>{m.ui_session_rename_desc()}</DialogDescription>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && nameInput.trim()) {
                renameSession(session.id, nameInput.trim());
                setShowRenameDialog(false);
              }
            }}
            className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            autoFocus
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowRenameDialog(false)}>
              {m.ui_btn_cancel()}
            </Button>
            <Button
              onClick={() => {
                if (nameInput.trim()) {
                  renameSession(session.id, nameInput.trim());
                  setShowRenameDialog(false);
                }
              }}
            >
              {m.ui_btn_save()}
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
          <DialogTitle>{m.ui_session_delete_title()}</DialogTitle>
          <DialogDescription>
            {m.ui_session_delete_desc({ sport: session.sport, date: formatDate(session.date) })}
          </DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowDeleteDialog(false)}>
              {m.ui_btn_cancel()}
            </Button>
            <Button
              className="bg-status-danger text-white hover:bg-status-danger/80"
              onClick={async () => {
                deleteSession(session.id);
                setShowDeleteDialog(false);
                navigate('/sessions');
                await Promise.all([
                  deleteSessionRecords(session.id),
                  deleteSessionLaps(session.id),
                  deleteSessionGPS(session.id),
                  deleteFitFile(session.id),
                ]);
              }}
            >
              {m.ui_btn_delete()}
            </Button>
          </div>
        </DialogContent>
      </DialogRoot>
    </div>
  );
};

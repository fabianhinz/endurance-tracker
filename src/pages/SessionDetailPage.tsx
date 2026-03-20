import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { m } from '@/paraglide/messages.js';
import { useSessionsStore } from '@/store/sessions.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { analyzeLaps, enrichAllLaps } from '@/lib/laps.ts';
import { getSessionRecords, getSessionLaps } from '@/lib/indexeddb.ts';
import { Typography } from '@/components/ui/Typography.tsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs.tsx';
import { formatSubSport } from '@/lib/formatters.ts';
import { useSessionTitle } from '@/features/sessions/hooks/useSessionTitle.ts';
import { SportChip } from '@/features/sessions/SportChip.tsx';
import { SessionActionsMenu } from '@/features/sessions/session/SessionActionsMenu.tsx';
import { OverviewTab } from '@/features/sessions/session/OverviewTab.tsx';
import { LapsTab } from '@/features/sessions/laps/LapsTab.tsx';
import type { SessionRecord, SessionLap } from '@/engine/types.ts';

const validTabs = new Set(['overview', 'laps']);

export const SessionDetailPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const tab = rawTab && validTabs.has(rawTab) ? rawTab : 'overview';

  const params = useParams<{ id: string }>();
  const session = useSessionsStore((s) => s.sessions.find((session) => session.id === params.id));
  const sessionTitle = useSessionTitle(session);
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [laps, setLaps] = useState<SessionLap[]>([]);

  useEffect(() => {
    if (params.id && session?.hasDetailedRecords) {
      getSessionRecords(params.id).then(setRecords);
      getSessionLaps(params.id).then(setLaps);
    }
  }, [params.id, session?.hasDetailedRecords]);

  useEffect(() => {
    if (laps.length > 0 && session) {
      useMapFocusStore.getState().setFocusedLaps(laps, session.sport, records);
      const deviceAnalysis = analyzeLaps(laps);
      const deviceEnrichments = enrichAllLaps(laps, records);
      useMapFocusStore.getState().setActiveLapData(deviceAnalysis, deviceEnrichments, null);
    }
    return () => {
      useMapFocusStore.getState().clearFocusedLaps();
    };
  }, [laps, records, session]);

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
            {sessionTitle.title}
          </Typography>
          <Typography variant="caption">{sessionTitle.subtitle}</Typography>
        </div>
        <div className="flex flex-grow justify-end flex-wrap gap-3">
          <SportChip sport={session.sport} />
          {subSportLabel && (
            <Typography
              variant="caption"
              color="textTertiary"
              className="flex items-center rounded-md bg-white/10 px-2 py-0.5"
            >
              {subSportLabel}
            </Typography>
          )}
          <SessionActionsMenu session={session} />
        </div>
      </div>

      <Tabs defaultValue="overview" value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="overview">{m.ui_session_tab_overview()}</TabsTrigger>
          <TabsTrigger value="laps">{m.ui_session_tab_laps()}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab session={session} records={records} laps={laps} />
        </TabsContent>

        <TabsContent value="laps">
          <LapsTab laps={laps} session={session} records={records} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

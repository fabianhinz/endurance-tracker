import { useState, useEffect, useMemo, useRef } from 'react';
import { getSessionRecords } from '@/lib/indexeddb.ts';
import type { SessionRecord, TrainingSession } from '@/engine/types.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useUserStore } from '@/store/user.ts';
import {
  buildZoneColoredPath,
  buildSportColoredPath,
  type DetailPath,
} from '../zoneColoredPath.ts';
import { sportTrackColor, trackModifiers } from '../trackColors.ts';

export const useSessionDetailPath = (
  hoveredSessionId: string | null,
  openedSessionId: string | null,
  sessions: TrainingSession[],
): DetailPath | null => {
  const zoneColorMode = useMapFocusStore((s) => s.zoneColorMode);
  const profile = useUserStore((s) => s.profile);

  const [loaded, setLoaded] = useState<{ id: string; records: SessionRecord[] } | null>(null);
  const fetchedIdRef = useRef<string | null>(null);

  const targetId = openedSessionId ?? hoveredSessionId;

  useEffect(() => {
    if (!targetId) return;
    if (fetchedIdRef.current === targetId) return;

    const session = sessions.find((s) => s.id === targetId);
    if (!session?.hasDetailedRecords) return;

    fetchedIdRef.current = targetId;
    let cancelled = false;
    getSessionRecords(targetId).then((records) => {
      if (!cancelled) {
        setLoaded({ id: targetId, records });
      }
    });

    return () => {
      cancelled = true;
      fetchedIdRef.current = null;
    };
  }, [targetId, sessions]);

  return useMemo(() => {
    if (!openedSessionId || loaded?.id !== openedSessionId) return null;

    if (zoneColorMode !== null) {
      if (!profile) return null;
      return buildZoneColoredPath(loaded.records, zoneColorMode, {
        maxHr: profile.thresholds.maxHr,
        restHr: profile.thresholds.restHr,
        ftp: profile.thresholds.ftp,
        thresholdPace: profile.thresholds.thresholdPace,
      });
    }

    const session = sessions.find((s) => s.id === openedSessionId);
    if (!session) return null;

    const [r, g, b] = sportTrackColor[session.sport];
    return buildSportColoredPath(loaded.records, [r, g, b, trackModifiers.alpha.highlighted]);
  }, [loaded, openedSessionId, zoneColorMode, profile, sessions]);
};

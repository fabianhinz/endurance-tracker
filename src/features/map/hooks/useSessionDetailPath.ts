import { useState, useEffect, useMemo } from 'react';
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

const recordsCache = new Map<string, SessionRecord[]>();
const loading = new Set<string>();

export const useSessionDetailPath = (
  hoveredSessionId: string | null,
  openedSessionId: string | null,
  sessions: TrainingSession[],
): DetailPath | null => {
  const zoneColorMode = useMapFocusStore((s) => s.zoneColorMode);
  const profile = useUserStore((s) => s.profile);

  const [snapshot, setSnapshot] = useState(() => new Map(recordsCache));

  useEffect(() => {
    const ids = [hoveredSessionId, openedSessionId].filter(
      (id): id is string => id != null,
    );

    for (const id of ids) {
      if (recordsCache.has(id) || loading.has(id)) continue;

      const session = sessions.find((s) => s.id === id);
      if (!session?.hasDetailedRecords) continue;

      loading.add(id);
      getSessionRecords(id)
        .then((records) => {
          recordsCache.set(id, records);
          setSnapshot(new Map(recordsCache));
        })
        .finally(() => {
          loading.delete(id);
        });
    }
  }, [hoveredSessionId, openedSessionId, sessions]);

  return useMemo(() => {
    if (!openedSessionId) return null;

    const records = snapshot.get(openedSessionId);
    if (!records) return null;

    if (zoneColorMode !== null) {
      if (!profile) return null;
      return buildZoneColoredPath(records, zoneColorMode, {
        maxHr: profile.thresholds.maxHr,
        restHr: profile.thresholds.restHr,
        ftp: profile.thresholds.ftp,
        thresholdPace: profile.thresholds.thresholdPace,
      });
    }

    const session = sessions.find((s) => s.id === openedSessionId);
    if (!session) return null;

    const [r, g, b] = sportTrackColor[session.sport];
    return buildSportColoredPath(records, [r, g, b, trackModifiers.alpha.highlighted]);
  }, [snapshot, openedSessionId, zoneColorMode, profile, sessions]);
};

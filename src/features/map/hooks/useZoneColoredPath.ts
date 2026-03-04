import { useState, useEffect, useMemo } from 'react';
import { getSessionRecords } from '@/lib/indexeddb.ts';
import type { SessionRecord } from '@/engine/types.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useUserStore } from '@/store/user.ts';
import { buildZoneColoredPath, type ZoneSegment } from '../zoneColoredPath.ts';

const recordsCache = new Map<string, SessionRecord[]>();
const loading = new Set<string>();

export const useZoneColoredPath = (): ZoneSegment[] => {
  const openedSessionId = useMapFocusStore((s) => s.openedSessionId);
  const zoneColorMode = useMapFocusStore((s) => s.zoneColorMode);
  const profile = useUserStore((s) => s.profile);

  const [snapshot, setSnapshot] = useState(() => new Map(recordsCache));

  useEffect(() => {
    if (!openedSessionId || !zoneColorMode) return;
    if (recordsCache.has(openedSessionId) || loading.has(openedSessionId)) return;

    loading.add(openedSessionId);
    getSessionRecords(openedSessionId).then((records) => {
      recordsCache.set(openedSessionId, records);
      setSnapshot(new Map(recordsCache));
      loading.delete(openedSessionId);
    });
  }, [openedSessionId, zoneColorMode]);

  return useMemo(() => {
    if (!openedSessionId || !zoneColorMode || !profile) return [];
    const records = snapshot.get(openedSessionId);
    if (!records) return [];

    return buildZoneColoredPath(records, zoneColorMode, {
      maxHr: profile.thresholds.maxHr,
      restHr: profile.thresholds.restHr,
      ftp: profile.thresholds.ftp,
      thresholdPace: profile.thresholds.thresholdPace,
    });
  }, [snapshot, openedSessionId, zoneColorMode, profile]);
};

import { useState, useEffect } from 'react';
import { useSessionsStore } from '../../store/sessions.ts';
import { useFiltersStore } from '../../store/filters.ts';
import { useMapFocusStore } from '../../store/map-focus.ts';
import { useUploadProgressStore } from '../../store/upload-progress.ts';
import { getAllSessionGPS, getSessionGPS } from '../../lib/indexeddb.ts';
import { rangeToCutoff, customRangeToCutoffs } from '../../lib/time-range.ts';
import type { SessionGPS } from '../../types/gps.ts';
import type { Sport } from '../../types/index.ts';

export interface MapTrack {
  sessionId: string;
  sport: Sport;
  gps: SessionGPS;
}

export const useMapTracks = (backfillRevision: number) => {
  const sessions = useSessionsStore((s) => s.sessions);
  const timeRange = useFiltersStore((s) => s.timeRange);
  const customRange = useFiltersStore((s) => s.customRange);
  const sportFilter = useFiltersStore((s) => s.sportFilter);
  const focusedSessionId = useMapFocusStore((s) => s.focusedSessionId);
  const backfilling = useUploadProgressStore((s) => s.backfilling);

  const [tracks, setTracks] = useState<MapTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      if (focusedSessionId) {
        const session = sessions.find((s) => s.id === focusedSessionId);
        const gps = await getSessionGPS(focusedSessionId);
        if (cancelled) return;

        if (gps && session) {
          setTracks([{ sessionId: focusedSessionId, sport: session.sport, gps }]);
        } else {
          setTracks([]);
        }
        setLoading(false);
        return;
      }

      const allGPS = await getAllSessionGPS();
      if (cancelled) return;

      const gpsMap = new Map<string, SessionGPS>();
      for (const g of allGPS) {
        gpsMap.set(g.sessionId, g);
      }

      const filtered = sessions.filter((s) => {
        if (sportFilter !== 'all' && s.sport !== sportFilter) return false;
        if (timeRange === 'custom' && customRange) {
          const cutoffs = customRangeToCutoffs(customRange);
          return s.date >= cutoffs.from && s.date <= cutoffs.to;
        }
        if (timeRange !== 'custom') {
          const cutoff = rangeToCutoff(timeRange);
          return s.date >= cutoff;
        }
        return true;
      });

      const result: MapTrack[] = [];
      for (const s of filtered) {
        const gps = gpsMap.get(s.id);
        if (gps) result.push({ sessionId: s.id, sport: s.sport, gps });
      }

      if (!cancelled) {
        setTracks(result);
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [sessions, timeRange, customRange, sportFilter, backfillRevision, backfilling, focusedSessionId]);

  return { tracks, loading };
};

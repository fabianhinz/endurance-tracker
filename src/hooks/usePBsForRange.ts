import { useState, useEffect } from 'react';
import { useFiltersStore } from '@/store/filters.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { getRecordsForSessions } from '@/lib/indexeddb.ts';
import { rangeToCutoff, customRangeToCutoffs, type TimeRange } from '@/lib/timeRange.ts';
import { computePBsForSessions, groupPBsBySport } from '@/lib/records.ts';
import type { PersonalBest, Sport } from '@/packages/engine/types.ts';

export const usePBsForRange = (): {
  grouped: Partial<Record<Sport, PersonalBest[]>>;
  loading: boolean;
} => {
  const [grouped, setGrouped] = useState<Partial<Record<Sport, PersonalBest[]>>>({});
  const [loading, setLoading] = useState(true);

  const timeRange = useFiltersStore((s) => s.timeRange);
  const customRange = useFiltersStore((s) => s.customRange);
  const sportFilter = useFiltersStore((s) => s.sportFilter);
  const sessions = useSessionsStore((s) => s.sessions);

  useEffect(() => {
    let cancelled = false;

    const compute = async () => {
      setLoading(true);

      let eligible: typeof sessions;

      if (timeRange === 'custom' && customRange) {
        const bounds = customRangeToCutoffs(customRange);
        eligible = sessions.filter(
          (s) =>
            !s.isPlanned &&
            s.date >= bounds.from &&
            s.date <= bounds.to &&
            s.hasDetailedRecords &&
            (sportFilter === 'all' || s.sport === sportFilter),
        );
      } else {
        const cutoff = rangeToCutoff(timeRange as Exclude<TimeRange, 'custom'>);
        eligible = sessions.filter(
          (s) =>
            !s.isPlanned &&
            s.date >= cutoff &&
            s.hasDetailedRecords &&
            (sportFilter === 'all' || s.sport === sportFilter),
        );
      }

      if (eligible.length === 0) {
        if (!cancelled) {
          setGrouped({});
          setLoading(false);
        }
        return;
      }

      const eligibleIds = eligible.map((s) => s.id);
      const recordsMap = await getRecordsForSessions(eligibleIds);
      if (cancelled) return;

      const sessionInputs = eligible.map((s) => ({
        sessionId: s.id,
        date: s.date,
        sport: s.sport,
        records: recordsMap.get(s.id) ?? [],
        distance: s.distance,
        elevationGain: s.elevationGain,
      }));

      const pbs = computePBsForSessions(sessionInputs);
      const result = groupPBsBySport(pbs);

      if (!cancelled) {
        setGrouped(result);
        setLoading(false);
      }
    };

    compute();

    return () => {
      cancelled = true;
    };
  }, [timeRange, customRange, sessions, sportFilter]);

  return { grouped, loading };
};

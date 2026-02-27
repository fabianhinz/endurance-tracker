import { useState, useEffect } from "react";
import { useFiltersStore } from "../store/filters.ts";
import { useSessionsStore } from "../store/sessions.ts";
import { getRecordsForSessions } from "../lib/indexeddb.ts";
import { rangeToCutoff, customRangeToCutoffs } from "../lib/timeRange.ts";
import { computePBsForSessions, groupPBsBySport, PB_SLOTS } from "../engine/records.ts";
import type { PersonalBest, Sport } from "../engine/types.ts";

const categoryOrder: Record<string, number> = {
  "peak-power": 0,
  "fastest-distance": 1,
  "longest": 2,
  "most-elevation": 3,
};

export const usePBsForRange = (): {
  grouped: Partial<Record<Sport, PersonalBest[]>>;
  flat: PersonalBest[];
  loading: boolean;
} => {
  const timeRange = useFiltersStore((s) => s.timeRange);
  const customRange = useFiltersStore((s) => s.customRange);
  const sportFilter = useFiltersStore((s) => s.sportFilter);
  const sessions = useSessionsStore((s) => s.sessions);
  const [grouped, setGrouped] = useState<Partial<Record<Sport, PersonalBest[]>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const compute = async () => {
      setLoading(true);

      let eligible: typeof sessions;

      if (timeRange === "custom" && customRange) {
        const bounds = customRangeToCutoffs(customRange);
        eligible = sessions.filter(
          (s) => !s.isPlanned && s.date >= bounds.from && s.date <= bounds.to && s.hasDetailedRecords && (sportFilter === "all" || s.sport === sportFilter),
        );
      } else {
        const cutoff = rangeToCutoff(timeRange as Exclude<import("../lib/timeRange.ts").TimeRange, "custom">);
        eligible = sessions.filter(
          (s) => !s.isPlanned && s.date >= cutoff && s.hasDetailedRecords && (sportFilter === "all" || s.sport === sportFilter),
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

  const sportOrder: Record<Sport, number> = { running: 0, cycling: 1, swimming: 2 };

  const slotIndex = (pb: PersonalBest): number => {
    const slots = PB_SLOTS[pb.sport];
    return slots.findIndex((s) => s.category === pb.category && s.window === pb.window);
  };

  const flat = Object.values(grouped)
    .flat()
    .sort((a, b) =>
      sportOrder[a.sport] - sportOrder[b.sport]
      || categoryOrder[a.category] - categoryOrder[b.category]
      || slotIndex(a) - slotIndex(b),
    );

  return { grouped, flat, loading };
};

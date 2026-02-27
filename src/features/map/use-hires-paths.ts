import { useState, useEffect } from 'react';
import { getSessionRecords } from '../../lib/indexeddb.ts';
import { extractPathFromRecords } from '../../engine/gps.ts';
import type { TrainingSession } from '../../engine/types.ts';

const pathCache = new Map<string, [number, number][]>();
const loading = new Set<string>();

export const useHiresPaths = (
  hoveredSessionId: string | null,
  openedSessionId: string | null,
  sessions: TrainingSession[],
): Map<string, [number, number][]> => {
  const [snapshot, setSnapshot] = useState(() => new Map(pathCache));

  useEffect(() => {
    const ids = [hoveredSessionId, openedSessionId].filter(
      (id): id is string => id != null,
    );

    for (const id of ids) {
      if (pathCache.has(id) || loading.has(id)) continue;

      const session = sessions.find((s) => s.id === id);
      if (!session?.hasDetailedRecords) continue;

      loading.add(id);
      getSessionRecords(id).then((records) => {
        const path = extractPathFromRecords(records);
        if (path.length >= 2) {
          pathCache.set(id, path);
          setSnapshot(new Map(pathCache));
        }
        loading.delete(id);
      });
    }
  }, [hoveredSessionId, openedSessionId, sessions]);

  return snapshot;
};

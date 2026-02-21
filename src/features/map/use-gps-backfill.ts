import { useState, useEffect } from 'react';
import { useSessionsStore } from '../../store/sessions.ts';
import { useUploadProgressStore } from '../../store/upload-progress.ts';
import {
  getAllSessionGPS,
  getSessionRecords,
  saveSessionGPS,
} from '../../lib/indexeddb.ts';
import { buildSessionGPS } from '../../engine/gps.ts';

export const useGPSBackfill = () => {
  const [revision, setRevision] = useState(0);

  const sessions = useSessionsStore((s) => s.sessions);
  const uploading = useUploadProgressStore((s) => s.uploading);

  useEffect(() => {
    if (uploading) return;

    let cancelled = false;

    const run = async () => {
      const existingGPS = await getAllSessionGPS();
      if (cancelled) return;
      const processedIds = new Set(existingGPS.map((g) => g.sessionId));

      const missing = sessions.filter(
        (s) => s.hasDetailedRecords && !processedIds.has(s.id),
      );

      if (missing.length === 0) {
        setRevision((r) => r + 1);
        return;
      }

      useUploadProgressStore.getState().startBackfill(missing.length);

      for (let i = 0; i < missing.length; i++) {
        if (cancelled) return;
        const records = await getSessionRecords(missing[i].id);
        const gpsData = buildSessionGPS(missing[i].id, records);
        if (gpsData) await saveSessionGPS(gpsData);
        useUploadProgressStore.getState().advance();
      }

      if (!cancelled) {
        setRevision((r) => r + 1);
        useUploadProgressStore.getState().reset();
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [sessions, uploading]);

  return { revision };
};

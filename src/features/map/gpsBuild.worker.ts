import { getSessionRecords, saveSessionGPS } from '@/lib/indexeddb.ts';
import { buildSessionGPS } from '@/packages/engine/gps.ts';

export type WorkerMessageIn = { type: 'build'; sessionIds: string[] };

export type WorkerMessageOut =
  | { type: 'progress'; processed: number; total: number }
  | { type: 'done' };

self.onmessage = async (e: MessageEvent<WorkerMessageIn>) => {
  const { sessionIds } = e.data;
  const total = sessionIds.length;

  for (let i = 0; i < sessionIds.length; i++) {
    const sid = sessionIds[i];
    if (!sid) continue;
    try {
      const records = await getSessionRecords(sid);
      const gpsData = buildSessionGPS(sid, records);
      if (gpsData) await saveSessionGPS(gpsData);
    } catch (err) {
      console.error(`GPS build failed for ${sid}:`, err);
    }
    self.postMessage({ type: 'progress', processed: i + 1, total } satisfies WorkerMessageOut);
  }

  self.postMessage({ type: 'done' } satisfies WorkerMessageOut);
};

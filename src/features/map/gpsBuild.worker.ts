import { getSessionRecords, saveSessionGPS } from '../../lib/indexeddb.ts';
import { buildSessionGPS } from '../../engine/gps.ts';

export type WorkerMessageIn = { type: 'build'; sessionIds: string[] };

export type WorkerMessageOut =
  | { type: 'progress'; processed: number; total: number }
  | { type: 'done' };

self.onmessage = async (e: MessageEvent<WorkerMessageIn>) => {
  const { sessionIds } = e.data;
  const total = sessionIds.length;

  for (let i = 0; i < sessionIds.length; i++) {
    try {
      const records = await getSessionRecords(sessionIds[i]);
      const gpsData = buildSessionGPS(sessionIds[i], records);
      if (gpsData) await saveSessionGPS(gpsData);
    } catch (err) {
      console.error(`GPS build failed for ${sessionIds[i]}:`, err);
    }
    self.postMessage({ type: 'progress', processed: i + 1, total } satisfies WorkerMessageOut);
  }

  self.postMessage({ type: 'done' } satisfies WorkerMessageOut);
};

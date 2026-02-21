import type { SessionRecord, SessionLap } from '../types/index.ts';
import type { SessionGPS } from '../types/gps.ts';
import { getDB } from './db.ts';

export const saveSessionRecords = async (
  records: SessionRecord[],
): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('session-records', 'readwrite');
  for (const record of records) {
    tx.store.add(record);
  }
  await tx.done;
};

export const getSessionRecords = async (
  sessionId: string,
): Promise<SessionRecord[]> => {
  const db = await getDB();
  return db.getAllFromIndex('session-records', 'sessionId', sessionId);
};

export const deleteSessionRecords = async (
  sessionId: string,
): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('session-records', 'readwrite');
  const keys = await tx.store.index('sessionId').getAllKeys(sessionId);
  for (const key of keys) {
    tx.store.delete(key);
  }
  await tx.done;
};

export const clearAllRecords = async (): Promise<void> => {
  const db = await getDB();
  await db.clear('session-records');
  await db.clear('session-laps');
  await db.clear('session-gps');
  await db.clear('kv');
};

export const saveSessionLaps = async (
  laps: SessionLap[],
): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('session-laps', 'readwrite');
  for (const lap of laps) {
    tx.store.add(lap);
  }
  await tx.done;
};

export const getSessionLaps = async (
  sessionId: string,
): Promise<SessionLap[]> => {
  const db = await getDB();
  return db.getAllFromIndex('session-laps', 'sessionId', sessionId);
};

export const deleteSessionLaps = async (
  sessionId: string,
): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('session-laps', 'readwrite');
  const keys = await tx.store.index('sessionId').getAllKeys(sessionId);
  for (const key of keys) {
    tx.store.delete(key);
  }
  await tx.done;
};

export const saveSessionGPS = async (gps: SessionGPS): Promise<void> => {
  const db = await getDB();
  await db.add('session-gps', gps);
};

export const getSessionGPS = async (
  sessionId: string,
): Promise<SessionGPS | undefined> => {
  const db = await getDB();
  const results = await db.getAllFromIndex(
    'session-gps',
    'sessionId',
    sessionId,
  );
  return results[0];
};

export const getAllSessionGPS = async (): Promise<SessionGPS[]> => {
  const db = await getDB();
  return db.getAll('session-gps');
};

export const deleteSessionGPS = async (
  sessionId: string,
): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('session-gps', 'readwrite');
  const keys = await tx.store.index('sessionId').getAllKeys(sessionId);
  for (const key of keys) {
    tx.store.delete(key);
  }
  await tx.done;
};

export const bulkSaveSessionData = async (
  entries: Array<{
    records: (SessionRecord & { sessionId: string })[];
    laps: (SessionLap & { sessionId: string })[];
    gps: SessionGPS | null;
  }>,
  options?: { chunkSize?: number; onChunkDone?: (chunkIndex: number) => void },
): Promise<void> => {
  const size = options?.chunkSize ?? 10;
  const db = await getDB();

  for (let ci = 0; ci < entries.length; ci += size) {
    const chunk = entries.slice(ci, ci + size);
    const tx = db.transaction(
      ['session-records', 'session-laps', 'session-gps'],
      'readwrite',
    );
    const recordStore = tx.objectStore('session-records');
    const lapStore = tx.objectStore('session-laps');
    const gpsStore = tx.objectStore('session-gps');

    for (const entry of chunk) {
      for (const record of entry.records) {
        recordStore.add(record);
      }
      for (const lap of entry.laps) {
        lapStore.add(lap);
      }
      if (entry.gps) {
        gpsStore.add(entry.gps);
      }
    }

    await tx.done;
    options?.onChunkDone?.(ci / size);
  }
};

export const getRecordsForSessions = async (
  sessionIds: string[],
): Promise<Map<string, SessionRecord[]>> => {
  const db = await getDB();
  const tx = db.transaction('session-records', 'readonly');
  const index = tx.store.index('sessionId');
  const queries = sessionIds.map((id) => index.getAll(id));
  const results = await Promise.all(queries);
  await tx.done;

  const map = new Map<string, SessionRecord[]>();
  for (let i = 0; i < sessionIds.length; i++) {
    map.set(sessionIds[i], results[i]);
  }
  return map;
};

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { SessionRecord, SessionLap } from '../types/index.ts';
import type { SessionGPS } from '../types/gps.ts';

export interface EnduranceTrackerDB extends DBSchema {
  'session-records': {
    key: string;
    value: { sessionId: string; records: SessionRecord[] };
  };
  'session-laps': {
    key: string;
    value: { sessionId: string; laps: SessionLap[] };
  };
  'session-gps': {
    key: number;
    value: SessionGPS;
    indexes: { sessionId: string };
  };
  kv: {
    key: string;
    value: string;
  };
}

const DB_NAME = 'endurance-tracker';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<EnduranceTrackerDB>> | null = null;

export const getDB = (): Promise<IDBPDatabase<EnduranceTrackerDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<EnduranceTrackerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('session-records', { keyPath: 'sessionId' });
        db.createObjectStore('session-laps', { keyPath: 'sessionId' });
        db.createObjectStore('kv');
        const gpsStore = db.createObjectStore('session-gps', {
          autoIncrement: true,
        });
        gpsStore.createIndex('sessionId', 'sessionId', { unique: false });
      },
    });
  }
  return dbPromise;
};

export const resetDBInstance = (): void => {
  dbPromise = null;
};

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { SessionRecord, SessionLap } from '../types/index.ts';
import type { SessionGPS } from '../types/gps.ts';

export interface EnduranceTrackerDB extends DBSchema {
  'session-records': {
    key: number;
    value: SessionRecord;
    indexes: { sessionId: string };
  };
  'session-laps': {
    key: number;
    value: SessionLap;
    indexes: { sessionId: string };
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
const DB_VERSION = 4;

let dbPromise: Promise<IDBPDatabase<EnduranceTrackerDB>> | null = null;

export const getDB = (): Promise<IDBPDatabase<EnduranceTrackerDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<EnduranceTrackerDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 2) {
          const store = db.createObjectStore('session-records', {
            autoIncrement: true,
          });
          store.createIndex('sessionId', 'sessionId', { unique: false });
          db.createObjectStore('kv');
        }
        if (oldVersion < 3) {
          const lapStore = db.createObjectStore('session-laps', {
            autoIncrement: true,
          });
          lapStore.createIndex('sessionId', 'sessionId', { unique: false });
        }
        if (oldVersion < 4) {
          const gpsStore = db.createObjectStore('session-gps', {
            autoIncrement: true,
          });
          gpsStore.createIndex('sessionId', 'sessionId', { unique: false });
        }
      },
    });
  }
  return dbPromise;
};

export const resetDBInstance = (): void => {
  dbPromise = null;
};

import { type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Seeds the app past onboarding by writing directly to IndexedDB's kv store,
 * which is where Zustand persists its state.
 *
 * Must be called BEFORE navigating to the app (or after clearing state),
 * then the page must be reloaded for stores to rehydrate from IDB.
 */
export const seedOnboardingComplete = async (page: Page) => {
  await page.goto('/');

  await page.evaluate(async () => {
    const profileId = crypto.randomUUID();
    const now = Date.now();

    const layoutState = JSON.stringify({
      state: {
        dockExpanded: true,
        compactLayout: true,
        onboardingComplete: true,
      },
      version: 1,
    });

    const userState = JSON.stringify({
      state: {
        profile: {
          id: profileId,
          gender: 'male',
          thresholds: { restHr: 50, maxHr: 185 },
          showMetricHelp: true,
          createdAt: now,
        },
      },
      version: 1,
    });

    const sessionsState = JSON.stringify({
      state: {
        sessions: [],
        personalBests: [],
      },
      version: 1,
    });

    // Open IDB and write store keys
    const openReq = indexedDB.open('endurance-tracker', 2);
    await new Promise<void>((resolve, reject) => {
      openReq.onupgradeneeded = () => {
        const db = openReq.result;
        if (!db.objectStoreNames.contains('kv')) {
          db.createObjectStore('kv');
        }
        if (!db.objectStoreNames.contains('session-records')) {
          db.createObjectStore('session-records', { keyPath: 'sessionId' });
        }
        if (!db.objectStoreNames.contains('session-laps')) {
          db.createObjectStore('session-laps', { keyPath: 'sessionId' });
        }
        if (!db.objectStoreNames.contains('session-gps')) {
          const gps = db.createObjectStore('session-gps', { autoIncrement: true });
          gps.createIndex('sessionId', 'sessionId', { unique: false });
        }
        if (!db.objectStoreNames.contains('fit-files')) {
          db.createObjectStore('fit-files', { keyPath: 'sessionId' });
        }
      };
      openReq.onsuccess = () => {
        const db = openReq.result;
        const tx = db.transaction('kv', 'readwrite');
        const store = tx.objectStore('kv');
        store.put(layoutState, 'store-layout');
        store.put(userState, 'store-user');
        store.put(sessionsState, 'store-sessions');
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      openReq.onerror = () => reject(openReq.error);
    });
  });

  // Reload so the app rehydrates from the seeded IDB state
  await page.reload();
};

/**
 * Minimal session shape matching TrainingSession — only the fields
 * the session list actually reads for rendering and filtering.
 */
interface SeedSession {
  sport: 'running' | 'cycling' | 'swimming';
  date: number;
  name?: string;
  duration?: number;
  distance?: number;
  elevationGain?: number;
}

/**
 * Seeds onboarding + pre-built sessions directly into IDB so tests
 * can start with a known set of sessions without uploading FIT files.
 */
export const seedWithSessions = async (page: Page, sessions: SeedSession[]) => {
  await page.goto('/');

  await page.evaluate(async (sessions: SeedSession[]) => {
    const profileId = crypto.randomUUID();
    const now = Date.now();

    const layoutState = JSON.stringify({
      state: {
        dockExpanded: true,
        compactLayout: true,
        onboardingComplete: true,
      },
      version: 1,
    });

    const userState = JSON.stringify({
      state: {
        profile: {
          id: profileId,
          gender: 'male',
          thresholds: { restHr: 50, maxHr: 185 },
          showMetricHelp: true,
          createdAt: now,
        },
      },
      version: 1,
    });

    const builtSessions = sessions.map((s) => ({
      id: crypto.randomUUID(),
      sport: s.sport,
      date: s.date,
      name: s.name,
      duration: s.duration ?? 3600,
      distance: s.distance ?? 10000,
      elevationGain: s.elevationGain ?? 0,
      tss: 80,
      stressMethod: 'trimp',
      sensorWarnings: [],
      isPlanned: false,
      hasDetailedRecords: false,
      createdAt: now,
    }));

    const sessionsState = JSON.stringify({
      state: {
        sessions: builtSessions,
        personalBests: [],
      },
      version: 1,
    });

    const filtersState = JSON.stringify({
      state: {
        timeRange: 'all',
        customRange: null,
        prevDashboardRange: null,
        sportFilter: 'all',
      },
      version: 1,
    });

    const openReq = indexedDB.open('endurance-tracker', 2);
    await new Promise<void>((resolve, reject) => {
      openReq.onupgradeneeded = () => {
        const db = openReq.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
        if (!db.objectStoreNames.contains('session-records'))
          db.createObjectStore('session-records', { keyPath: 'sessionId' });
        if (!db.objectStoreNames.contains('session-laps'))
          db.createObjectStore('session-laps', { keyPath: 'sessionId' });
        if (!db.objectStoreNames.contains('session-gps')) {
          const gps = db.createObjectStore('session-gps', { autoIncrement: true });
          gps.createIndex('sessionId', 'sessionId', { unique: false });
        }
        if (!db.objectStoreNames.contains('fit-files'))
          db.createObjectStore('fit-files', { keyPath: 'sessionId' });
      };
      openReq.onsuccess = () => {
        const db = openReq.result;
        const tx = db.transaction('kv', 'readwrite');
        const store = tx.objectStore('kv');
        store.put(layoutState, 'store-layout');
        store.put(userState, 'store-user');
        store.put(sessionsState, 'store-sessions');
        store.put(filtersState, 'store-filters');
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      openReq.onerror = () => reject(openReq.error);
    });
  }, sessions);

  await page.reload();
};

interface SeedCoachSession {
  sport: 'running' | 'cycling' | 'swimming';
  date: number;
  tss?: number;
}

/**
 * Seeds onboarding + a user profile with thresholdPace + pre-built sessions
 * directly into IDB so coach plan tests can start with a known state.
 *
 * Also clears store-coach-plan to prevent stale cache between tests.
 */
export const seedCoachWithThresholdPace = async (
  page: Page,
  thresholdPace: number,
  sessions: SeedCoachSession[],
) => {
  await page.goto('/');

  await page.evaluate(
    async ({
      thresholdPace,
      sessions,
    }: {
      thresholdPace: number;
      sessions: SeedCoachSession[];
    }) => {
      const profileId = crypto.randomUUID();
      const now = Date.now();

      const layoutState = JSON.stringify({
        state: { dockExpanded: true, compactLayout: true, onboardingComplete: true },
        version: 1,
      });

      const userState = JSON.stringify({
        state: {
          profile: {
            id: profileId,
            gender: 'male',
            thresholds: { restHr: 50, maxHr: 185, thresholdPace },
            showMetricHelp: true,
            createdAt: now,
          },
        },
        version: 1,
      });

      const builtSessions = sessions.map((s) => ({
        id: crypto.randomUUID(),
        sport: s.sport,
        date: s.date,
        duration: 3600,
        distance: 10000,
        tss: s.tss ?? 80,
        stressMethod: 'trimp',
        sensorWarnings: [],
        isPlanned: false,
        hasDetailedRecords: false,
        createdAt: now,
      }));

      const sessionsState = JSON.stringify({
        state: { sessions: builtSessions, personalBests: [] },
        version: 1,
      });

      const coachPlanState = JSON.stringify({
        state: { cachedPlan: null, cacheKey: null },
        version: 1,
      });

      const openReq = indexedDB.open('endurance-tracker', 2);
      await new Promise<void>((resolve, reject) => {
        openReq.onupgradeneeded = () => {
          const db = openReq.result;
          if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
          if (!db.objectStoreNames.contains('session-records'))
            db.createObjectStore('session-records', { keyPath: 'sessionId' });
          if (!db.objectStoreNames.contains('session-laps'))
            db.createObjectStore('session-laps', { keyPath: 'sessionId' });
          if (!db.objectStoreNames.contains('session-gps')) {
            const gps = db.createObjectStore('session-gps', { autoIncrement: true });
            gps.createIndex('sessionId', 'sessionId', { unique: false });
          }
          if (!db.objectStoreNames.contains('fit-files'))
            db.createObjectStore('fit-files', { keyPath: 'sessionId' });
        };
        openReq.onsuccess = () => {
          const db = openReq.result;
          const tx = db.transaction('kv', 'readwrite');
          const store = tx.objectStore('kv');
          store.put(layoutState, 'store-layout');
          store.put(userState, 'store-user');
          store.put(sessionsState, 'store-sessions');
          store.put(coachPlanState, 'store-coach-plan');
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
        openReq.onerror = () => reject(openReq.error);
      });
    },
    { thresholdPace, sessions },
  );

  await page.reload();
};

export const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');
export const CYCLING_FIT = path.join(FIXTURES_DIR, 'cycling.fit');
export const RUNNING_FIT = path.join(FIXTURES_DIR, 'running.fit');
export const CYCLING_ONLY_ZIP = path.join(FIXTURES_DIR, 'cycling-only.zip');
export const ACTIVITIES_ZIP = path.join(FIXTURES_DIR, 'activities.zip');

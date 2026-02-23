import 'fake-indexeddb/auto';
import { beforeEach, afterEach, vi } from 'vitest';
import { useUserStore } from '../src/store/user.ts';
import { useSessionsStore } from '../src/store/sessions.ts';
import { useCoachPlanStore } from '../src/store/coach-plan.ts';
import { resetDBInstance } from '../src/lib/db.ts';

beforeEach(() => {
  // Only fake Date (not setTimeout/setInterval) to avoid blocking async IndexedDB
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-02-11T00:00:00Z'));

  localStorage.clear();

  // Reset IDB singleton so each test gets a fresh connection
  resetDBInstance();

  // Reset Zustand stores (merge, not replace — keeps action methods)
  useUserStore.setState({ profile: null });
  useSessionsStore.setState({ sessions: [], personalBests: [] });
  useCoachPlanStore.setState({ cachedPlan: null, cacheKey: null });
});

afterEach(() => {
  vi.useRealTimers();
});

import { describe, it, expect } from 'vitest';
import { useSessionsStore } from '../../src/store/sessions.ts';
import { useUserStore } from '../../src/store/user.ts';
import { useCoachPlanStore } from '../../src/store/coachPlan.ts';
import { useLayoutStore } from '../../src/store/layout.ts';
import { useFiltersStore } from '../../src/store/filters.ts';
import { makeSession } from '../factories/sessions.ts';
import { makeUserProfile } from '../factories/profiles.ts';
import { makeCyclingRecords, makeLaps } from '../factories/records.ts';
import {
  saveSessionRecords,
  getSessionRecords,
  clearAllRecords,
  saveSessionLaps,
  getSessionLaps,
} from '../../src/lib/indexeddb.ts';
import { idbStorage } from '../../src/lib/idbStorage.ts';

describe('delete all data', () => {
  it('clears sessions, personal bests, profile, session-records, session-laps, and resets onboarding', async () => {
    // Populate sessions store
    const { id: _id, createdAt: _ca, ...sessionData } = makeSession();
    const sessionId = useSessionsStore.getState().addSession(sessionData);
    useSessionsStore.getState().updatePersonalBests([
      { sport: 'cycling', metric: 'power', duration: 300, value: 280, sessionId, date: Date.now() },
    ]);

    // Populate user store
    const { id: _pid, createdAt: _pca, ...profileData } = makeUserProfile();
    useUserStore.getState().setProfile(profileData);

    // Mark onboarding as complete
    useLayoutStore.getState().completeOnboarding();

    // Populate IDB session-records
    const records = makeCyclingRecords(sessionId, 60, { basePower: 200 });
    await saveSessionRecords(records);

    // Populate IDB session-laps
    const laps = makeLaps(sessionId, 2);
    await saveSessionLaps(laps);

    // Populate IDB kv store (simulates Zustand persist)
    await idbStorage.setItem('store-user', '{"state":{"profile":{}}}');

    // Populate coach plan cache
    useCoachPlanStore.getState().setPlan(
      { weekOf: '2026-02-09', workouts: [], totalEstimatedTss: 0, context: { mode: 'no-data' } },
      '2026-02-09:1:300',
    );

    // Set non-default filters
    useFiltersStore.setState({ timeRange: '90d', sportFilter: 'cycling' });

    // Verify everything is populated
    expect(useFiltersStore.getState().timeRange).toBe('90d');
    expect(useCoachPlanStore.getState().cachedPlan).not.toBeNull();
    expect(useSessionsStore.getState().sessions).toHaveLength(1);
    expect(useSessionsStore.getState().personalBests).toHaveLength(1);
    expect(useUserStore.getState().profile).not.toBeNull();
    expect(useLayoutStore.getState().onboardingComplete).toBe(true);
    expect(await getSessionRecords(sessionId)).toHaveLength(60);
    expect(await getSessionLaps(sessionId)).toHaveLength(2);
    expect(await idbStorage.getItem('store-user')).not.toBeNull();

    // Perform full data wipe (same sequence as DeleteAllDataDialog.handleDelete)
    useSessionsStore.getState().clearAll();
    useUserStore.getState().resetProfile();
    useCoachPlanStore.getState().clearPlan();
    useLayoutStore.setState({ onboardingComplete: false });
    useFiltersStore.setState({ timeRange: 'all', customRange: null, prevDashboardRange: null, sportFilter: 'all' });
    await clearAllRecords();

    // Verify everything is cleared
    expect(useCoachPlanStore.getState().cachedPlan).toBeNull();
    expect(useCoachPlanStore.getState().cacheKey).toBeNull();
    expect(useSessionsStore.getState().sessions).toHaveLength(0);
    expect(useSessionsStore.getState().personalBests).toHaveLength(0);
    expect(await getSessionRecords(sessionId)).toHaveLength(0);
    expect(await getSessionLaps(sessionId)).toHaveLength(0);
    expect(await idbStorage.getItem('store-user')).toBeNull();

    // Verify profile is null (user returns to onboarding)
    expect(useUserStore.getState().profile).toBeNull();
    // Verify onboarding is reset
    expect(useLayoutStore.getState().onboardingComplete).toBe(false);
    // Verify filters are reset
    expect(useFiltersStore.getState().timeRange).toBe('all');
    expect(useFiltersStore.getState().sportFilter).toBe('all');
  });
});

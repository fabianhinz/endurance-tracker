import { describe, it, expect } from 'vitest';
import { useUserStore } from '../../src/store/user.ts';
import { useSessionsStore } from '../../src/store/sessions.ts';
import { computeMetrics, getCurrentMetrics } from '../../src/engine/metrics.ts';
import { getCoachingRecommendation } from '../../src/engine/coaching.ts';
import { detectNewPBs } from '../../src/engine/records.ts';
import { makeUserProfile } from '../factories/profiles.ts';
import { makeSession } from '../factories/sessions.ts';
import { makeCyclingRecords } from '../factories/records.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('store + engine integration (no React)', () => {
  it('full pipeline: profile → sessions → metrics → coaching', () => {
    // Set up profile
    const { id: _id, createdAt: _ca, ...profileData } = makeUserProfile();
    useUserStore.getState().setProfile(profileData);
    expect(useUserStore.getState().profile).not.toBeNull();

    // Add 30 sessions over 30 days
    const now = Date.now();
    for (let i = 0; i < 30; i++) {
      const { id: _sid, createdAt: _sca, ...sessionData } = makeSession({
        date: now - (30 - i) * DAY_MS,
        tss: 80 + 20 * Math.sin(i * 0.5),
      });
      useSessionsStore.getState().addSession(sessionData);
    }

    expect(useSessionsStore.getState().sessions).toHaveLength(30);

    // Compute metrics from store's sessions
    const sessions = useSessionsStore.getState().sessions;
    const metrics = computeMetrics(sessions);
    expect(metrics.length).toBeGreaterThan(0);

    const current = getCurrentMetrics(sessions);
    expect(current).toBeDefined();
    expect(current!.ctl).toBeGreaterThan(0);
    expect(current!.atl).toBeGreaterThan(0);

    // Get coaching recommendation
    const coaching = getCoachingRecommendation(current);
    expect(coaching.status).toBeTruthy();
    expect(coaching.message).toBeTruthy();
    expect(['detraining', 'fresh', 'neutral', 'optimal', 'overload']).toContain(coaching.status);
    expect(['low', 'moderate', 'high']).toContain(coaching.injuryRisk);
  });

  it('PB pipeline: session + records → detectNewPBs → updatePersonalBests', () => {
    const now = Date.now();

    // Add a session
    const { id: _id, createdAt: _ca, ...sessionData } = makeSession({
      sport: 'cycling',
      date: now,
    });
    const sessionId = useSessionsStore.getState().addSession(sessionData);

    // Generate records and detect PBs
    const records = makeCyclingRecords(sessionId, 3600, { basePower: 260 });
    const existingBests = useSessionsStore.getState().personalBests;
    const newPBs = detectNewPBs(sessionId, now, 'cycling', records, existingBests);

    expect(newPBs.length).toBeGreaterThan(0);

    // Store PBs
    useSessionsStore.getState().updatePersonalBests(newPBs);
    expect(useSessionsStore.getState().personalBests.length).toBe(newPBs.length);
  });

  it('full reset: populate everything → clear all stores → verify empty', () => {
    // Populate
    const { id: _id, createdAt: _ca, ...profileData } = makeUserProfile();
    useUserStore.getState().setProfile(profileData);

    const { id: _sid, createdAt: _sca, ...sessionData } = makeSession();
    useSessionsStore.getState().addSession(sessionData);
    useSessionsStore.getState().updatePersonalBests([
      { sport: 'cycling', metric: 'power', duration: 300, value: 280, sessionId: 's1', date: Date.now() },
    ]);
    // Verify populated
    expect(useUserStore.getState().profile).not.toBeNull();
    expect(useSessionsStore.getState().sessions).toHaveLength(1);
    expect(useSessionsStore.getState().personalBests).toHaveLength(1);

    // Clear all
    useUserStore.getState().resetProfile();
    useSessionsStore.getState().clearAll();

    // Verify empty
    expect(useUserStore.getState().profile).toBeNull();
    expect(useSessionsStore.getState().sessions).toHaveLength(0);
    expect(useSessionsStore.getState().personalBests).toHaveLength(0);
  });
});

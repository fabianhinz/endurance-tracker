import { describe, it, expect } from 'vitest';
import { useSessionsStore } from '../../src/store/sessions.ts';
import { makeSession } from '../factories/sessions.ts';
import type { PersonalBest } from '../../src/engine/types.ts';

describe('sessions store', () => {
  it('addSession returns UUID, session in state', () => {
    const { id: _id, createdAt: _ca, ...sessionData } = makeSession();
    const id = useSessionsStore.getState().addSession(sessionData);

    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');

    const sessions = useSessionsStore.getState().sessions;
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe(id);
    expect(sessions[0].sport).toBe('cycling');
  });

  it('deleteSession removes it', () => {
    const { id: _id, createdAt: _ca, ...data } = makeSession();
    const id = useSessionsStore.getState().addSession(data);
    expect(useSessionsStore.getState().sessions).toHaveLength(1);

    useSessionsStore.getState().deleteSession(id);
    expect(useSessionsStore.getState().sessions).toHaveLength(0);
  });

  it('updatePersonalBests upserts (no duplicates by sport+category+window)', () => {
    const firstBatch: PersonalBest[] = [
      { sport: 'cycling', category: 'peak-power', window: 300, value: 280, sessionId: 's1', date: Date.now() },
      { sport: 'cycling', category: 'peak-power', window: 1200, value: 250, sessionId: 's1', date: Date.now() },
    ];
    useSessionsStore.getState().updatePersonalBests(firstBatch);
    expect(useSessionsStore.getState().personalBests).toHaveLength(2);

    // Update with better value for 300s and new 3600s
    const secondBatch: PersonalBest[] = [
      { sport: 'cycling', category: 'peak-power', window: 300, value: 295, sessionId: 's2', date: Date.now() },
      { sport: 'cycling', category: 'peak-power', window: 3600, value: 220, sessionId: 's2', date: Date.now() },
    ];
    useSessionsStore.getState().updatePersonalBests(secondBatch);

    const pbs = useSessionsStore.getState().personalBests;
    expect(pbs).toHaveLength(3); // 300, 1200, 3600

    const pb300 = pbs.find((p) => p.window === 300);
    expect(pb300!.value).toBe(295); // upserted to new value
    expect(pb300!.sessionId).toBe('s2');
  });

  it('addSessions batch-adds multiple sessions and returns IDs', () => {
    const batch = [makeSession(), makeSession({ sport: 'running' }), makeSession({ sport: 'swimming' })];
    const inputs = batch.map(({ id: _id, createdAt: _ca, ...data }) => data);

    const ids = useSessionsStore.getState().addSessions(inputs);

    expect(ids).toHaveLength(3);
    ids.forEach((id) => {
      expect(typeof id).toBe('string');
      expect(id).toBeTruthy();
    });

    const sessions = useSessionsStore.getState().sessions;
    expect(sessions).toHaveLength(3);
    expect(sessions[0].sport).toBe('cycling');
    expect(sessions[1].sport).toBe('running');
    expect(sessions[2].sport).toBe('swimming');

    // IDs returned match stored sessions
    ids.forEach((id, i) => {
      expect(sessions[i].id).toBe(id);
    });
  });

  it('addSessions with empty array is a no-op', () => {
    const ids = useSessionsStore.getState().addSessions([]);
    expect(ids).toHaveLength(0);
    expect(useSessionsStore.getState().sessions).toHaveLength(0);
  });

  it('renameSession updates the session name', () => {
    const { id: _id, createdAt: _ca, ...data } = makeSession();
    const id = useSessionsStore.getState().addSession(data);

    useSessionsStore.getState().renameSession(id, 'Morning Ride');

    const session = useSessionsStore.getState().sessions.find((s) => s.id === id);
    expect(session!.name).toBe('Morning Ride');
  });

  it('renameSession with unknown id is a no-op', () => {
    const { id: _id, createdAt: _ca, ...data } = makeSession();
    useSessionsStore.getState().addSession(data);
    const before = useSessionsStore.getState().sessions;

    useSessionsStore.getState().renameSession('nonexistent', 'Nope');

    const after = useSessionsStore.getState().sessions;
    expect(after).toEqual(before);
  });

  it('clearAll resets both arrays', () => {
    const { id: _id, createdAt: _ca, ...data } = makeSession();
    useSessionsStore.getState().addSession(data);
    useSessionsStore.getState().updatePersonalBests([
      { sport: 'cycling', category: 'peak-power', window: 300, value: 280, sessionId: 's1', date: Date.now() },
    ]);

    expect(useSessionsStore.getState().sessions).toHaveLength(1);
    expect(useSessionsStore.getState().personalBests).toHaveLength(1);

    useSessionsStore.getState().clearAll();
    expect(useSessionsStore.getState().sessions).toHaveLength(0);
    expect(useSessionsStore.getState().personalBests).toHaveLength(0);
  });

  it('persistence to IndexedDB', async () => {
    const { id: _id, createdAt: _ca, ...data } = makeSession();
    useSessionsStore.getState().addSession(data);

    // Allow async IDB write to complete
    await new Promise((r) => setTimeout(r, 50));

    const { getDB } = await import('../../src/lib/db.ts');
    const db = await getDB();
    const stored = await db.get('kv', 'store-sessions');
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored!);
    expect(parsed.state.sessions).toHaveLength(1);
  });
});

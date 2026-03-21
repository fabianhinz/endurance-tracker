import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { TrainingSession } from '@/packages/engine/types.ts';
import { idbStorage } from '@/lib/idbStorage.ts';

interface SessionsState {
  sessions: TrainingSession[];
  addSession: (session: Omit<TrainingSession, 'id' | 'createdAt'>) => string;
  addSessions: (sessions: Omit<TrainingSession, 'id' | 'createdAt'>[]) => string[];
  deleteSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
  replaceSessions: (
    updates: Array<{ id: string; session: Omit<TrainingSession, 'id' | 'createdAt'> }>,
  ) => void;
  clearAll: () => void;
}

export const useSessionsStore = create<SessionsState>()(
  immer(
    persist(
      (set) => ({
        sessions: [],
        addSession: (sessionData) => {
          const id = crypto.randomUUID();
          const session: TrainingSession = {
            ...sessionData,
            id,
            createdAt: Date.now(),
          };
          set((draft) => {
            draft.sessions.push(session);
          });
          return id;
        },
        addSessions: (sessionsData) => {
          const newSessions = sessionsData.map((s) => ({
            ...s,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
          }));
          set((draft) => {
            draft.sessions.push(...newSessions);
          });
          return newSessions.map((s) => s.id);
        },
        deleteSession: (id) =>
          set((draft) => {
            draft.sessions = draft.sessions.filter((s) => s.id !== id);
          }),
        renameSession: (id, name) =>
          set((draft) => {
            const session = draft.sessions.find((s) => s.id === id);
            if (session) {
              session.name = name;
            }
          }),
        replaceSessions: (updates) =>
          set((draft) => {
            const updateMap = new Map(updates.map((u) => [u.id, u.session]));
            for (const s of draft.sessions) {
              const updated = updateMap.get(s.id);
              if (updated) {
                Object.assign(s, updated, { id: s.id, createdAt: s.createdAt });
              }
            }
          }),
        clearAll: () => set({ sessions: [] }),
      }),
      {
        name: 'store-sessions',
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 1,
      },
    ),
  ),
);

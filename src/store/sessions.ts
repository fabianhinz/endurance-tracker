import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TrainingSession, PersonalBest } from '../types/index.ts';
import { idbStorage } from '../lib/idb-storage.ts';
import { mergePBs } from '../engine/records.ts';

interface SessionsState {
  sessions: TrainingSession[];
  personalBests: PersonalBest[];
  addSession: (session: Omit<TrainingSession, 'id' | 'createdAt'>) => string;
  addSessions: (sessions: Omit<TrainingSession, 'id' | 'createdAt'>[]) => string[];
  deleteSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
  updatePersonalBests: (newBests: PersonalBest[]) => void;
  clearAll: () => void;
}

export const useSessionsStore = create<SessionsState>()(
  persist(
    (set) => ({
      sessions: [],
      personalBests: [],

      addSession: (sessionData) => {
        const id = crypto.randomUUID();
        const session: TrainingSession = {
          ...sessionData,
          id,
          createdAt: Date.now(),
        };
        set((state) => ({
          sessions: [...state.sessions, session],
        }));
        return id;
      },

      addSessions: (sessionsData) => {
        const newSessions = sessionsData.map((s) => ({
          ...s,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
        }));
        set((state) => ({ sessions: [...state.sessions, ...newSessions] }));
        return newSessions.map((s) => s.id);
      },

      deleteSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        })),

      renameSession: (id, name) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, name } : s,
          ),
        })),

      updatePersonalBests: (newBests) =>
        set((state) => ({
          personalBests: mergePBs(state.personalBests, newBests),
        })),

      clearAll: () => set({ sessions: [], personalBests: [] }),
    }),
    {
      name: 'endurance-tracker-sessions',
      storage: createJSONStorage(() => idbStorage),
      skipHydration: true,
      version: 1,
    },
  ),
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile } from '../types/index.ts';
import { idbStorage } from '../lib/idb-storage.ts';
import { createDefaultProfile } from '../engine/defaults.ts';

interface UserState {
  profile: UserProfile | null;
  initializeProfile: () => void;
  setProfile: (profile: Omit<UserProfile, 'id' | 'createdAt'>) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateThresholds: (thresholds: UserProfile['thresholds']) => void;
  toggleMetricHelp: () => void;
  resetProfile: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,

      initializeProfile: () => {
        if (get().profile) return;
        set({ profile: createDefaultProfile(crypto.randomUUID()) });
      },

      setProfile: (data) =>
        set({
          profile: {
            ...data,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
          },
        }),

      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, ...updates }
            : null,
        })),

      updateThresholds: (thresholds) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, thresholds }
            : null,
        })),

      toggleMetricHelp: () =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, showMetricHelp: !state.profile.showMetricHelp }
            : null,
        })),

      resetProfile: () => set({ profile: null }),
    }),
    {
      name: 'endurance-tracker-user',
      storage: createJSONStorage(() => idbStorage),
      skipHydration: true,
      version: 1,
    },
  ),
);

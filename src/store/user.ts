import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { UserProfile } from '@/types/index.ts';
import { idbStorage } from '@/lib/idbStorage.ts';

interface UserState {
  profile: UserProfile | null;
  setProfile: (profile: Omit<UserProfile, 'id' | 'createdAt'>) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateThresholds: (thresholds: UserProfile['thresholds']) => void;
  toggleMetricHelp: () => void;
  resetProfile: () => void;
}

export const useUserStore = create<UserState>()(
  immer(
    persist(
      (set) => ({
        profile: null,

        setProfile: (data) =>
          set({
            profile: {
              ...data,
              id: crypto.randomUUID(),
              createdAt: Date.now(),
            },
          }),

        updateProfile: (updates) =>
          set((draft) => {
            if (draft.profile) {
              Object.assign(draft.profile, updates);
            }
          }),

        updateThresholds: (thresholds) =>
          set((draft) => {
            if (draft.profile) {
              draft.profile.thresholds = thresholds;
            }
          }),

        toggleMetricHelp: () =>
          set((draft) => {
            if (draft.profile) {
              draft.profile.showMetricHelp = !draft.profile.showMetricHelp;
            }
          }),

        resetProfile: () => set({ profile: null }),
      }),
      {
        name: 'store-user',
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 1,
      },
    ),
  ),
);

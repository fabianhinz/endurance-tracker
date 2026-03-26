import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { idbStorage } from '@/lib/idbStorage.ts';

interface LayoutState {
  dockExpanded: boolean;
  toggleDock: () => void;
  compactLayout: boolean;
  toggleCompactLayout: () => void;
  onboardingComplete: boolean;
  completeOnboarding: () => void;
  mapPitch: 0 | 30 | 60;
  setMapPitch: (pitch: 0 | 30 | 60) => void;
  demoMode: boolean;
  setDemoMode: (v: boolean) => void;
  mobileMapActive: boolean;
  toggleMobileMap: () => void;
}

export const useLayoutStore = create<LayoutState>()(
  immer(
    persist(
      (set) => ({
        dockExpanded: true,
        toggleDock: () =>
          set((draft) => {
            draft.dockExpanded = !draft.dockExpanded;
          }),
        compactLayout: false,
        toggleCompactLayout: () =>
          set((draft) => {
            draft.compactLayout = !draft.compactLayout;
          }),
        onboardingComplete: false,
        completeOnboarding: () => set({ onboardingComplete: true, compactLayout: true }),
        mapPitch: 0,
        setMapPitch: (pitch) => set({ mapPitch: pitch }),
        demoMode: false,
        setDemoMode: (v) => set({ demoMode: v }),
        mobileMapActive: false,
        toggleMobileMap: () =>
          set((draft) => {
            draft.mobileMapActive = !draft.mobileMapActive;
          }),
      }),
      {
        name: 'store-layout',
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 3,
        migrate: (persisted, version) => {
          const state = persisted as Record<string, unknown>;
          if (version < 2) {
            state.demoMode = false;
          }
          if (version < 3) {
            state.mobileMapActive = false;
          }
          return state as unknown as LayoutState;
        },
      },
    ),
  ),
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      dockExpanded: true,
      toggleDock: () => set((state) => ({ dockExpanded: !state.dockExpanded })),
      compactLayout: false,
      toggleCompactLayout: () => set((state) => ({ compactLayout: !state.compactLayout })),
      onboardingComplete: false,
      completeOnboarding: () => set({ onboardingComplete: true, compactLayout: true }),
      mapPitch: 0,
      setMapPitch: (pitch) => set({ mapPitch: pitch }),
      demoMode: false,
      setDemoMode: (v) => set({ demoMode: v }),
    }),
    {
      name: 'store-layout',
      storage: createJSONStorage(() => idbStorage),
      skipHydration: true,
      version: 2,
      migrate: (persisted, version) => {
        if (version < 2) {
          return { ...(persisted as object), demoMode: false };
        }
        return persisted as LayoutState;
      },
    },
  ),
);

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { idbStorage } from "../lib/idbStorage.ts";

interface LayoutState {
  dockExpanded: boolean;
  toggleDock: () => void;
  compactLayout: boolean;
  toggleCompactLayout: () => void;
  onboardingComplete: boolean;
  completeOnboarding: () => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      dockExpanded: true,
      toggleDock: () => set((state) => ({ dockExpanded: !state.dockExpanded })),
      compactLayout: false,
      toggleCompactLayout: () =>
        set((state) => ({ compactLayout: !state.compactLayout })),
      onboardingComplete: false,
      completeOnboarding: () => set({ onboardingComplete: true, compactLayout: true }),
    }),
    { name: "store-layout", storage: createJSONStorage(() => idbStorage), skipHydration: true, version: 1 },
  ),
);

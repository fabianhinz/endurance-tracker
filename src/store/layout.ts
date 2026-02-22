import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LayoutState {
  dockExpanded: boolean;
  toggleDock: () => void;
  compactLayout: boolean;
  toggleCompactLayout: () => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      dockExpanded: true,
      toggleDock: () => set((state) => ({ dockExpanded: !state.dockExpanded })),
      compactLayout: true,
      toggleCompactLayout: () =>
        set((state) => ({ compactLayout: !state.compactLayout })),
    }),
    { name: "endurance-tracker-layout" },
  ),
);

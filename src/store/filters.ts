import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TimeRange } from "../lib/time-range.ts";
import type { Sport } from "../types/index.ts";

interface FiltersState {
  timeRange: TimeRange;
  customRange: { from: string; to: string } | null;
  previousTimeRange: Exclude<TimeRange, "custom"> | null;
  sportFilter: Sport | "all";
  setTimeRange: (r: TimeRange) => void;
  setCustomRange: (from: string, to: string) => void;
  clearCustomRange: () => void;
  setSportFilter: (s: Sport | "all") => void;
}

export const useFiltersStore = create<FiltersState>()(
  persist((set) => ({
  timeRange: "all",
  customRange: null,
  previousTimeRange: null,
  sportFilter: "all",
  setTimeRange: (r) =>
    set({ timeRange: r, customRange: null, previousTimeRange: null }),
  setCustomRange: (from, to) =>
    set((state) => ({
      timeRange: "custom",
      customRange: { from, to },
      previousTimeRange:
        state.timeRange === "custom"
          ? state.previousTimeRange
          : (state.timeRange as Exclude<TimeRange, "custom">),
    })),
  clearCustomRange: () =>
    set((state) => ({
      timeRange: state.previousTimeRange ?? "90d",
      customRange: null,
      previousTimeRange: null,
    })),
  setSportFilter: (s) => set({ sportFilter: s }),
}), { name: "endurance-tracker-filters" }));

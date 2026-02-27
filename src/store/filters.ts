import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TimeRange } from "../lib/time-range.ts";
import type { Sport } from "../engine/types.ts";

interface FiltersState {
  timeRange: TimeRange;
  customRange: { from: string; to: string } | null;
  prevDashboardRange: Exclude<TimeRange, "custom"> | null;
  sportFilter: Sport | "all";
  setTimeRange: (r: TimeRange) => void;
  setDashboardChartRange: (from: string, to: string) => void;
  clearDashboardChartRange: () => void;
  setSportFilter: (s: Sport | "all") => void;
}

export const useFiltersStore = create<FiltersState>()(
  persist((set) => ({
  timeRange: "all",
  customRange: null,
  prevDashboardRange: null,
  sportFilter: "all",
  setTimeRange: (r) =>
    set({ timeRange: r, customRange: null, prevDashboardRange: null }),
  setDashboardChartRange: (from, to) =>
    set((state) => ({
      timeRange: "custom",
      customRange: { from, to },
      prevDashboardRange:
        state.timeRange === "custom"
          ? state.prevDashboardRange
          : (state.timeRange as Exclude<TimeRange, "custom">),
    })),
  clearDashboardChartRange: () =>
    set((state) => ({
      timeRange: state.prevDashboardRange ?? "90d",
      customRange: null,
      prevDashboardRange: null,
    })),
  setSportFilter: (s) => set({ sportFilter: s }),
}), { name: "endurance-tracker-filters" }));

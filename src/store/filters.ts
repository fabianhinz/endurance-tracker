import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '@/lib/idbStorage.ts';
import type { TimeRange } from '@/lib/timeRange.ts';
import type { Sport } from '@/engine/types.ts';

interface FiltersState {
  timeRange: TimeRange;
  customRange: { from: string; to: string } | null;
  prevDashboardRange: Exclude<TimeRange, 'custom'> | null;
  sportFilter: Sport | 'all';
  setTimeRange: (r: TimeRange) => void;
  setDashboardChartRange: (from: string, to: string) => void;
  clearDashboardChartRange: () => void;
  setSportFilter: (s: Sport | 'all') => void;
}

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      timeRange: 'all',
      customRange: null,
      prevDashboardRange: null,
      sportFilter: 'all',
      setTimeRange: (r) => set({ timeRange: r, customRange: null, prevDashboardRange: null }),
      setDashboardChartRange: (from, to) =>
        set((state) => {
          let prevDashboardRange = state.timeRange as Exclude<TimeRange, 'custom'>;
          if (state.timeRange === 'custom') {
            prevDashboardRange = state.prevDashboardRange as Exclude<TimeRange, 'custom'>;
          }
          return {
            timeRange: 'custom' as const,
            customRange: { from, to },
            prevDashboardRange,
          };
        }),
      clearDashboardChartRange: () =>
        set((state) => ({
          timeRange: state.prevDashboardRange ?? '90d',
          customRange: null,
          prevDashboardRange: null,
        })),
      setSportFilter: (s) => set({ sportFilter: s }),
    }),
    {
      name: 'store-filters',
      storage: createJSONStorage(() => idbStorage),
      skipHydration: true,
      version: 1,
    },
  ),
);

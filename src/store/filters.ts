import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { idbStorage } from '@/lib/idbStorage.ts';
import type { TimeRange } from '@/lib/timeRange.ts';
import type { Sport } from '@/packages/engine/types.ts';

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
  immer(
    persist(
      (set) => ({
        timeRange: 'all',
        customRange: null,
        prevDashboardRange: null,
        sportFilter: 'all',
        setTimeRange: (r) => set({ timeRange: r, customRange: null, prevDashboardRange: null }),
        setDashboardChartRange: (from, to) =>
          set((draft) => {
            if (draft.timeRange !== 'custom') {
              draft.prevDashboardRange = draft.timeRange as Exclude<TimeRange, 'custom'>;
            }
            draft.timeRange = 'custom';
            draft.customRange = { from, to };
          }),
        clearDashboardChartRange: () =>
          set((draft) => {
            draft.timeRange = draft.prevDashboardRange ?? '90d';
            draft.customRange = null;
            draft.prevDashboardRange = null;
          }),
        setSportFilter: (s) => set({ sportFilter: s }),
      }),
      {
        name: 'store-filters',
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 1,
      },
    ),
  ),
);

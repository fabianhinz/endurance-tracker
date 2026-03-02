import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Sport } from '../engine/types.ts';
import { idbStorage } from '../lib/idbStorage.ts';

interface LapOptionsState {
  splitDistance: Partial<Record<Sport, number | undefined>>;
  setLapSplitDistance: (sport: Sport, distance: number | undefined) => void;
}

export const useLapOptionsStore = create<LapOptionsState>()(
  persist(
    (set) => ({
      splitDistance: {},
      setLapSplitDistance: (sport, distance) =>
        set((state) => ({
          splitDistance: { ...state.splitDistance, [sport]: distance },
        })),
    }),
    { name: 'store-lap-options', storage: createJSONStorage(() => idbStorage), skipHydration: true, version: 1 },
  ),
);

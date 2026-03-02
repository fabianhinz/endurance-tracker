import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Sport } from '../engine/types.ts';
import { idbStorage } from '../lib/idbStorage.ts';

interface LapOptionsState {
  splitDistance: Partial<Record<Sport, number | undefined>>;
  lastCustomDistance: Partial<Record<Sport, number>>;
  setLapSplitDistance: (sport: Sport, distance: number | undefined) => void;
}

export const useLapOptionsStore = create<LapOptionsState>()(
  persist(
    (set) => ({
      splitDistance: {},
      lastCustomDistance: {},
      setLapSplitDistance: (sport, distance) =>
        set((state) => ({
          splitDistance: { ...state.splitDistance, [sport]: distance },
          lastCustomDistance:
            distance !== undefined
              ? { ...state.lastCustomDistance, [sport]: distance }
              : state.lastCustomDistance,
        })),
    }),
    { name: 'store-lap-options', storage: createJSONStorage(() => idbStorage), skipHydration: true, version: 1 },
  ),
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Sport } from '../engine/types.ts';
import { idbStorage } from '../lib/idbStorage.ts';

export const DEFAULT_CUSTOM_DISTANCE: Record<Sport, number> = {
  running: 1000,
  cycling: 5000,
  swimming: 1000,
};

interface LapOptionsState {
  splitDistance: Partial<Record<Sport, number>>;
  useDeviceLaps: Partial<Record<Sport, boolean>>;
  setLapSplitDistance: (sport: Sport, distance: number) => void;
  setUseDeviceLaps: (sport: Sport, useDevice: boolean) => void;
}

export const useLapOptionsStore = create<LapOptionsState>()(
  persist(
    (set) => ({
      splitDistance: {},
      useDeviceLaps: {},
      setLapSplitDistance: (sport, distance) =>
        set((state) => ({
          splitDistance: { ...state.splitDistance, [sport]: distance },
        })),
      setUseDeviceLaps: (sport, useDevice) =>
        set((state) => ({
          useDeviceLaps: { ...state.useDeviceLaps, [sport]: useDevice },
        })),
    }),
    { name: 'store-lap-options', storage: createJSONStorage(() => idbStorage), skipHydration: true, version: 1 },
  ),
);

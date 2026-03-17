import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface DeckMetrics {
  fps: number;
  gpuTime: number;
  gpuTimePerFrame: number;
  cpuTime: number;
  cpuTimePerFrame: number;
  setPropsTime: number;
  updateAttributesTime: number;
  framesRedrawn: number;
  pickTime: number;
  pickCount: number;
  bufferMemory: number;
  textureMemory: number;
  renderbufferMemory: number;
  gpuMemory: number;
}

interface DeckMetricsState {
  expanded: boolean;
  metrics: DeckMetrics | null;
  toggle: () => void;
  update: (m: Record<string, number>) => void;
}

export const useDeckMetricsStore = create<DeckMetricsState>()(
  immer((set, get) => ({
    expanded: false,
    metrics: null,
    toggle: () =>
      set((draft) => {
        draft.expanded = !draft.expanded;
      }),
    update: (m) => {
      if (!get().expanded) return;
      set({ metrics: m as unknown as DeckMetrics });
    },
  })),
);

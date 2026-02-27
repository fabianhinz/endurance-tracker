import { create } from 'zustand';

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

export const useDeckMetricsStore = create<DeckMetricsState>()((set, get) => ({
  expanded: false,
  metrics: null,
  toggle: () => set((s) => ({ expanded: !s.expanded })),
  update: (m) => {
    if (!get().expanded) return;
    set({ metrics: m as unknown as DeckMetrics });
  },
}));

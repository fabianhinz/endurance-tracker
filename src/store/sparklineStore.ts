import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { getSessionRecords } from '@/lib/indexeddb.ts';
import {
  buildSparklineData,
  computeDomains,
  type SparklineData,
  type SparklineDomains,
} from '@/lib/sparklineData.ts';

enableMapSet();

interface SparklineStoreState {
  toggledIds: Set<string>;
  cache: Map<string, SparklineData>;
  loadingIds: Set<string>;
  domains: SparklineDomains;
  toggleSparkline: (id: string) => void;
  loadSparklineData: (id: string) => Promise<void>;
}

const emptyDomains: SparklineDomains = {
  hr: null,
  power: null,
  pace: null,
  speed: null,
};

const recomputeDomains = (
  toggledIds: Set<string>,
  cache: Map<string, SparklineData>,
): SparklineDomains => {
  const filtered = new Map<string, SparklineData>();
  for (const id of toggledIds) {
    const d = cache.get(id);
    if (d) {
      filtered.set(id, d);
    }
  }
  if (filtered.size === 0) return emptyDomains;
  return computeDomains(filtered);
};

export const useSparklineStore = create<SparklineStoreState>()(
  immer((set, get) => ({
    toggledIds: new Set<string>(),
    cache: new Map<string, SparklineData>(),
    loadingIds: new Set<string>(),
    domains: emptyDomains,

    toggleSparkline: (id) => {
      const state = get();
      const wasToggled = state.toggledIds.has(id);

      set((draft) => {
        if (wasToggled) {
          draft.toggledIds.delete(id);
        } else {
          draft.toggledIds.add(id);
        }
        draft.domains = recomputeDomains(draft.toggledIds, draft.cache);
      });

      if (!wasToggled && !state.cache.has(id) && !state.loadingIds.has(id)) {
        get().loadSparklineData(id);
      }
    },

    loadSparklineData: async (id) => {
      set((draft) => {
        draft.loadingIds.add(id);
      });

      try {
        const records = await getSessionRecords(id);
        const data = buildSparklineData(records);

        set((draft) => {
          draft.cache.set(id, data);
          draft.loadingIds.delete(id);
          draft.domains = recomputeDomains(draft.toggledIds, draft.cache);
        });
      } catch {
        set((draft) => {
          draft.loadingIds.delete(id);
        });
      }
    },
  })),
);

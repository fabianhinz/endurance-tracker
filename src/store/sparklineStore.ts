import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { getSessionRecords } from '@/lib/indexeddb.ts';
import { buildSparklineData, type SparklineData } from '@/lib/sparklineData.ts';

enableMapSet();

interface SparklineStoreState {
  cache: Map<string, SparklineData>;
  loadingIds: Set<string>;
  loadSparklineData: (id: string) => Promise<void>;
}

export const useSparklineStore = create<SparklineStoreState>()(
  immer((set, get) => ({
    cache: new Map<string, SparklineData>(),
    loadingIds: new Set<string>(),

    loadSparklineData: async (id) => {
      if (get().cache.has(id) || get().loadingIds.has(id)) return;

      set((draft) => {
        draft.loadingIds.add(id);
      });

      try {
        const records = await getSessionRecords(id);
        const data = buildSparklineData(records);

        set((draft) => {
          draft.cache.set(id, data);
          draft.loadingIds.delete(id);
        });
      } catch {
        set((draft) => {
          draft.loadingIds.delete(id);
        });
      }
    },
  })),
);

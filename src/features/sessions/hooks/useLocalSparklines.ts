import { useCallback, useMemo, useState } from 'react';
import { useSparklineStore } from '@/store/sparklineStore.ts';
import { recomputeDomains, emptyDomains } from '@/lib/sparklineData.ts';

export const useLocalSparklines = () => {
  const [toggledIds, setToggledIds] = useState(() => new Set<string>());
  const cache = useSparklineStore((s) => s.cache);

  const domains = useMemo(() => {
    if (toggledIds.size === 0) return emptyDomains;
    return recomputeDomains(toggledIds, cache);
  }, [toggledIds, cache]);

  const toggle = useCallback((id: string) => {
    setToggledIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        useSparklineStore.getState().loadSparklineData(id);
      }
      return next;
    });
  }, []);

  return { toggledIds, domains, toggle };
};

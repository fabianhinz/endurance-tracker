import { useCallback, useState } from 'react';
import { useSparklineStore } from '@/store/sparklineStore.ts';

export const useLocalSparklines = () => {
  const [toggledIds, setToggledIds] = useState(() => new Set<string>());

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

  return { toggledIds, toggle };
};

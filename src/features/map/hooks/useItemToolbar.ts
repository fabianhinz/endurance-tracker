import { useCallback, useState } from 'react';

interface ItemToolbarState {
  toggledIds: Set<string>;
  toggleSparkline: (id: string) => void;
}

export const useItemToolbar = (): ItemToolbarState => {
  const [toggledIds, setToggledIds] = useState<Set<string>>(() => new Set());

  const toggleSparkline = useCallback((id: string) => {
    setToggledIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return { toggledIds, toggleSparkline };
};

import { useCallback, useState } from 'react';

interface ItemToolbarState {
  hoveredId: string | null;
  toggledIds: Set<string>;
  onPointerEnter: (id: string) => void;
  onPointerLeave: () => void;
  toggleSparkline: (id: string) => void;
}

export const useItemToolbar = (): ItemToolbarState => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [toggledIds, setToggledIds] = useState<Set<string>>(() => new Set());

  const onPointerEnter = useCallback((id: string) => {
    setHoveredId(id);
  }, []);

  const onPointerLeave = useCallback(() => {
    setHoveredId(null);
  }, []);

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

  return { hoveredId, toggledIds, onPointerEnter, onPointerLeave, toggleSparkline };
};

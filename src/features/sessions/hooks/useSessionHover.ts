import { useCallback, useEffect } from 'react';
import { useMapFocusStore } from '@/store/mapFocus.ts';

export const useSessionHover = (sessionId: string) => {
  useEffect(() => {
    return () => {
      useMapFocusStore.getState().setHoveredSession(null);
    };
  }, []);

  const onPointerEnter = useCallback(() => {
    useMapFocusStore.getState().setHoveredSession(sessionId);
  }, [sessionId]);

  const onPointerLeave = useCallback(() => {
    useMapFocusStore.getState().setHoveredSession(null);
  }, []);

  return { onPointerEnter, onPointerLeave };
};

import { useRef, useEffect, useLayoutEffect } from 'react';

export const useHoverIntent = (setter: (id: string | null) => void, delay = 150) => {
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const setterRef = useRef(setter);

  useLayoutEffect(() => {
    setterRef.current = setter;
  });

  useEffect(() => {
    return () => {
      clearTimeout(leaveTimer.current);
      setterRef.current(null);
    };
  }, []);

  return {
    onPointerEnter: (id: string) => {
      clearTimeout(leaveTimer.current);
      setterRef.current(id);
    },
    onPointerLeave: () => {
      leaveTimer.current = setTimeout(() => setterRef.current(null), delay);
    },
  };
};

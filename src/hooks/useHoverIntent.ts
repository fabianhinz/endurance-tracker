import { useRef, useEffect } from "react";

export const useHoverIntent = (setter: (id: string | null) => void, delay = 150) => {
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      clearTimeout(leaveTimer.current);
      setter(null);
    };
  }, [setter]);

  return {
    onPointerEnter: (id: string) => {
      clearTimeout(leaveTimer.current);
      setter(id);
    },
    onPointerLeave: () => {
      leaveTimer.current = setTimeout(() => setter(null), delay);
    },
  };
};

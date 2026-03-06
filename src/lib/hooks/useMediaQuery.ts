import { useCallback, useMemo, useSyncExternalStore } from 'react';

export const useMediaQuery = (query: string) => {
  const mql = useMemo(() => window.matchMedia(query), [query]);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      mql.addEventListener('change', onStoreChange);
      return () => mql.removeEventListener('change', onStoreChange);
    },
    [mql],
  );

  const getSnapshot = useCallback(() => mql.matches, [mql]);

  return useSyncExternalStore(subscribe, getSnapshot);
};

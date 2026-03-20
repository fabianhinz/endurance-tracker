import { useMediaQuery } from './useMediaQuery';

export const useIsDesktop = () => {
  // tailwind breakpoint lg
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return isDesktop;
};

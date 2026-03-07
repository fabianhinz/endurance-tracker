import { useMediaQuery } from './useMediaQuery';

export const useIsDesktop = () => {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return isDesktop;
};

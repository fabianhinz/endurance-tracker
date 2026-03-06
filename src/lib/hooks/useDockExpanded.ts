import { useLayoutStore } from '@/store/layout.ts';
import { useMediaQuery } from './useMediaQuery.ts';

export const useDockExpanded = () => {
  const dockExpanded = useLayoutStore((s) => s.dockExpanded);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  return dockExpanded && isDesktop;
};

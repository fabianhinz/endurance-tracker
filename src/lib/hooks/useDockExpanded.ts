import { useLayoutStore } from '@/store/layout.ts';
import { useIsDesktop } from './useIsDesktop.ts';

export const useDockExpanded = () => {
  const dockExpanded = useLayoutStore((s) => s.dockExpanded);
  const isDesktop = useIsDesktop();

  return dockExpanded && isDesktop;
};

import { Map } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { cn } from '@/lib/utils.ts';
import { ToggleButton } from '@/components/ui/ToggleButton.tsx';
import { useLayoutStore } from '@/store/layout.ts';

export const MobileMapFab = () => {
  const mobileMapActive = useLayoutStore((s) => s.mobileMapActive);

  return (
    <ToggleButton
      pressed={mobileMapActive}
      onPressedChange={() => useLayoutStore.getState().toggleMobileMap()}
      aria-label={mobileMapActive ? m.ui_dock_hide_map() : m.ui_dock_show_map()}
      className={cn('lg:hidden absolute z-10 -top-6 right-3')}
    >
      <Map size={20} strokeWidth={1.5} />
    </ToggleButton>
  );
};

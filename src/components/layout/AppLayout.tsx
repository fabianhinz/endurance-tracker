import { cn } from '@/lib/utils.ts';
import { useLayoutStore } from '@/store/layout.ts';
import { useDockExpanded } from '@/lib/hooks/useDockExpanded.ts';
import { MapBackground } from '@/features/map/MapBackground.tsx';
import { Dock } from './Dock.tsx';
import { DemoBanner } from './DemoBanner.tsx';
import { OnboardingPage } from '@/pages/OnboardingPage.tsx';
import { Outlet } from 'react-router-dom';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';

export const AppLayout = () => {
  const compactLayout = useLayoutStore((s) => s.compactLayout);
  const mobileMapActive = useLayoutStore((s) => s.mobileMapActive);
  const dockExpanded = useDockExpanded();
  const onboardingComplete = useLayoutStore((s) => s.onboardingComplete);
  const isDesktop = useIsDesktop();

  const mapClassName = cn(
    'transition-all duration-300 ease-in-out',
    !isDesktop && !mobileMapActive && 'opacity-0 scale-95 pointer-events-none',
  );

  if (!onboardingComplete) {
    return (
      <div className="min-h-screen">
        <MapBackground className={mapClassName} />
        <main data-layout="main" className="relative z-10 p-6 pt-24 w-full mx-auto max-w-2xl">
          <OnboardingPage />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden">
      <MapBackground className={mapClassName} />
      <Dock />
      <main
        data-layout="main"
        className={cn(
          'relative z-10 p-6 w-full transition-all duration-300 ease-in-out',
          compactLayout
            ? 'mx-auto max-w-[1280px] lg:pl-0 lg:ml-auto lg:mr-0 lg:max-w-[40dvw]'
            : 'mx-auto max-w-[1280px]',
          dockExpanded ? 'pb-28' : 'pb-20',
          !isDesktop && mobileMapActive && 'translate-x-full opacity-0 pointer-events-none',
        )}
      >
        <DemoBanner />
        <Outlet />
      </main>
    </div>
  );
};

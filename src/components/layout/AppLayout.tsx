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
  const dockExpanded = useDockExpanded();
  const onboardingComplete = useLayoutStore((s) => s.onboardingComplete);

  const isDesktop = useIsDesktop();
  const background = isDesktop ? <MapBackground /> : <div />;

  if (!onboardingComplete) {
    return (
      <div className="min-h-screen">
        {background}
        <main data-layout="main" className="relative z-10 p-6 pt-24 w-full mx-auto max-w-2xl">
          <OnboardingPage />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {background}
      <Dock />
      <main
        data-layout="main"
        className={cn(
          'relative z-10 p-6 w-full transition-[padding,max-width,margin] duration-300',
          compactLayout
            ? 'mx-auto max-w-[1280px] md:pl-0 md:ml-auto md:mr-0 md:max-w-[40dvw]'
            : 'mx-auto max-w-[1280px]',
          dockExpanded ? 'pb-28' : 'pb-20',
        )}
      >
        <DemoBanner />
        <Outlet />
      </main>
    </div>
  );
};

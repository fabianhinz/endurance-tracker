import { Outlet } from "react-router-dom";
import { cn } from "../../lib/utils.ts";
import { useLayoutStore } from "../../store/layout.ts";
import { MapBackground } from "../../features/map/MapBackground.tsx";
import { Dock } from "./Dock.tsx";
import { UploadProgress } from "./UploadProgress.tsx";
import { OnboardingPage } from "../../features/onboarding/OnboardingPage.tsx";

export const AppLayout = () => {
  const compactLayout = useLayoutStore((s) => s.compactLayout);
  const dockExpanded = useLayoutStore((s) => s.dockExpanded);
  const onboardingComplete = useLayoutStore((s) => s.onboardingComplete);

  if (!onboardingComplete) {
    return (
      <div className="min-h-screen">
        <MapBackground />
        <main
          data-layout="main"
          className="relative z-10 p-6 pt-24 w-full mx-auto max-w-2xl"
        >
          <OnboardingPage />
        </main>
        <UploadProgress />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <MapBackground />
      <Dock />
      <main
        data-layout="main"
        className={cn(
          "relative z-10 p-6 w-full transition-[padding,max-width,margin] duration-300",
          compactLayout
            ? "mx-auto max-w-[1280px] md:pl-0 md:ml-auto md:mr-0 md:max-w-[40dvw]"
            : "mx-auto max-w-[1280px]",
          dockExpanded ? "pb-28" : "pb-20",
        )}
      >
        <Outlet />
      </main>
      <UploadProgress />
    </div>
  );
};

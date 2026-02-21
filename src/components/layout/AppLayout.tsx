import { Outlet } from "react-router-dom";
import { cn } from "../../lib/utils.ts";
import { useLayoutStore } from "../../store/layout.ts";
import { MapBackground } from "../../features/map/MapBackground.tsx";
import { Dock } from "./Dock.tsx";
import { UploadProgress } from "./UploadProgress.tsx";

export const AppLayout = () => {
  const compactLayout = useLayoutStore((s) => s.compactLayout);
  const dockExpanded = useLayoutStore((s) => s.dockExpanded);

  return (
    <div className="min-h-screen">
      <MapBackground />
      <Dock />
      <main
        className={cn(
          "relative z-10 p-6 w-full transition-[padding,max-width,margin] duration-300",
          compactLayout
            ? "mx-auto max-w-[1280px] md:ml-auto md:mr-0 md:max-w-[40dvw]"
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

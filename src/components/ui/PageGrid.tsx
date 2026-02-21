import type { ReactNode } from "react";
import { useLayoutStore } from "../../store/layout.ts";
import { cn } from "../../lib/utils.ts";

interface PageGridProps {
  children: ReactNode;
  className?: string;
}

export const PageGrid = (props: PageGridProps) => {
  const compactLayout = useLayoutStore((s) => s.compactLayout);

  return (
    <div
      className={cn(
        compactLayout
          ? "flex flex-col gap-4"
          : "grid grid-cols-1 md:grid-cols-2 gap-4",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
};

import { useEffect } from "react";

const INDICATOR_SIZE = 20;

export const useSlideIndicator = (
  containerRef: React.RefObject<HTMLElement | null>,
  itemRefs: React.RefObject<(HTMLElement | null)[]>,
  activeIndex: number,
  recalcKey?: string | number | boolean,
) => {
  useEffect(() => {
    const container = containerRef.current;

    const update = () => {
      const el = itemRefs.current[activeIndex];
      if (!container || !el || activeIndex < 0) return;
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      container.style.setProperty(
        "--tab-x",
        `${elRect.left - containerRect.left + (elRect.width - INDICATOR_SIZE) / 2}px`,
      );
      container.style.setProperty(
        "--tab-y",
        `${elRect.top - containerRect.top + (elRect.height - INDICATOR_SIZE) / 2}px`,
      );
    };

    update();
    window.addEventListener("resize", update);

    // Recalculate after CSS transitions complete
    const handleTransitionEnd = () => update();
    if (container) {
      container.addEventListener("transitionend", handleTransitionEnd);
    }

    return () => {
      window.removeEventListener("resize", update);
      if (container) {
        container.removeEventListener("transitionend", handleTransitionEnd);
      }
    };
  }, [containerRef, itemRefs, activeIndex, recalcKey]);

  return activeIndex >= 0 ? (
    <span className="absolute bg-accent rounded-full transition-all duration-300 bottom-1 left-[var(--tab-x)] h-1 w-5 md:bottom-auto md:left-1 md:top-[var(--tab-y)] md:w-1 md:h-5" />
  ) : null;
};

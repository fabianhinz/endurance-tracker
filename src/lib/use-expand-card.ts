import { useState, useRef, useEffect, useCallback } from "react";

// ── Pure helpers (testable) ────────────────────────────────────────

interface FlipDeltas {
  deltaX: number;
  deltaY: number;
  scaleX: number;
  scaleY: number;
}

export const computeFlipDeltas = (
  firstRect: DOMRect,
  lastRect: DOMRect,
): FlipDeltas => {
  const lastWidth = lastRect.width || 1;
  const lastHeight = lastRect.height || 1;
  return {
    deltaX: firstRect.left - lastRect.left,
    deltaY: firstRect.top - lastRect.top,
    scaleX: firstRect.width / lastWidth,
    scaleY: firstRect.height / lastHeight,
  };
};

interface ExpandedSize {
  width: number;
  height: number;
}

interface ExpandPadding {
  x?: number;
  top?: number;
  bottom?: number;
}

const DEFAULT_PADDING: Required<ExpandPadding> = { x: 200, top: 200, bottom: 200 };
const SMALL_PADDING: Required<ExpandPadding> = { x: 24, top: 24, bottom: 24 };
const SMALL_BREAKPOINT = 768;

export const getResponsivePadding = (viewportWidth: number): Required<ExpandPadding> =>
  viewportWidth < SMALL_BREAKPOINT ? SMALL_PADDING : DEFAULT_PADDING;

export const computeExpandedSize = (
  viewportWidth: number,
  viewportHeight: number,
  padding?: ExpandPadding,
): ExpandedSize => {
  const px = padding?.x ?? DEFAULT_PADDING.x;
  const pt = padding?.top ?? DEFAULT_PADDING.top;
  const pb = padding?.bottom ?? DEFAULT_PADDING.bottom;
  return {
    width: viewportWidth - px * 2,
    height: viewportHeight - pt - pb,
  };
};

// ── Hook ───────────────────────────────────────────────────────────

type Phase = "idle" | "expanding" | "expanded" | "collapsing";

interface UseExpandCardOptions {
  duration?: number;
}

interface UseExpandCardReturn {
  isExpanded: boolean;
  isAnimating: boolean;
  expand: () => void;
  collapse: () => void;
  toggle: () => void;
}

const EASING = "cubic-bezier(0.4, 0, 0.2, 1)";

export const useExpandCard = (
  cardRef: React.RefObject<HTMLDivElement | null>,
  options?: UseExpandCardOptions,
): UseExpandCardReturn => {
  const baseDuration = options?.duration ?? 350;
  const placeholderRef = useRef<HTMLDivElement | null>(null);
  const guardRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const getDuration = useCallback(() => {
    if (typeof window === "undefined") return baseDuration;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    return mq.matches ? 0 : baseDuration;
  }, [baseDuration]);

  const expand = useCallback(() => {
    const el = cardRef.current;
    if (!el || guardRef.current || phase !== "idle") return;
    guardRef.current = true;

    // First: capture current position
    const firstRect = el.getBoundingClientRect();

    // Insert placeholder to prevent layout shift
    const placeholder = document.createElement("div");
    placeholder.style.visibility = "hidden";
    placeholder.style.width = `${firstRect.width}px`;
    placeholder.style.height = `${firstRect.height}px`;
    placeholder.style.flexShrink = "0";
    el.parentNode?.insertBefore(placeholder, el);
    placeholderRef.current = placeholder;

    // Last: apply fixed centered positioning
    const padding = getResponsivePadding(window.innerWidth);
    const size = computeExpandedSize(window.innerWidth, window.innerHeight, padding);
    el.style.position = "fixed";
    el.style.inset = `${padding.top}px ${padding.x}px ${padding.bottom}px ${padding.x}px`;
    el.style.margin = "auto";
    el.style.width = `${size.width}px`;
    el.style.height = `${size.height}px`;
    el.style.zIndex = "50";

    const lastRect = el.getBoundingClientRect();

    // Invert + Play
    const deltas = computeFlipDeltas(firstRect, lastRect);
    const duration = getDuration();

    const anim = el.animate(
      [
        {
          transform: `translate(${deltas.deltaX}px, ${deltas.deltaY}px) scale(${deltas.scaleX}, ${deltas.scaleY})`,
          transformOrigin: "0 0",
        },
        { transform: "translate(0, 0) scale(1, 1)", transformOrigin: "0 0" },
      ],
      { duration, easing: EASING, fill: "none" },
    );

    // Lock scroll
    document.body.style.overflow = "hidden";
    setPhase("expanding");

    anim.finished.then(() => {
      guardRef.current = false;
      setPhase("expanded");
    });
  }, [cardRef, phase, getDuration]);

  const collapse = useCallback(() => {
    const el = cardRef.current;
    const placeholder = placeholderRef.current;
    if (!el || !placeholder || guardRef.current || phase !== "expanded") return;
    guardRef.current = true;

    setPhase("collapsing");

    const expandedRect = el.getBoundingClientRect();
    const placeholderRect = placeholder.getBoundingClientRect();

    // Animate card from expanded position toward placeholder
    const deltas = computeFlipDeltas(placeholderRect, expandedRect);
    const duration = getDuration();

    const anim = el.animate(
      [
        { transform: "translate(0, 0) scale(1, 1)", transformOrigin: "0 0" },
        {
          transform: `translate(${deltas.deltaX}px, ${deltas.deltaY}px) scale(${deltas.scaleX}, ${deltas.scaleY})`,
          transformOrigin: "0 0",
        },
      ],
      { duration, easing: EASING, fill: "forwards" },
    );

    anim.finished.then(() => {
      anim.cancel();
      el.style.cssText = "";
      placeholder.remove();
      placeholderRef.current = null;
      document.body.style.overflow = "";
      guardRef.current = false;
      setPhase("idle");
    });
  }, [cardRef, phase, getDuration]);

  const toggle = useCallback(() => {
    if (phase === "idle") expand();
    else if (phase === "expanded") collapse();
  }, [phase, expand, collapse]);

  // Escape key listener
  useEffect(() => {
    if (phase !== "expanded") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") collapse();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, collapse]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      placeholderRef.current?.remove();
      document.body.style.overflow = "";
    };
  }, []);

  const isExpanded = phase === "expanding" || phase === "expanded";
  const isAnimating = phase === "expanding" || phase === "collapsing";

  return { isExpanded, isAnimating, expand, collapse, toggle };
};

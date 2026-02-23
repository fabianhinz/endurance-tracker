import { useMemo } from "react";

const POPUP_WIDTH = 320;
const POPUP_HEIGHT = 300;
const GAP = 8;
const SAFE_ZONE_PADDING = 16;

export interface SafeZone {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface PopupPosition {
  left: number;
  top: number;
}

export const computePopupPosition = (
  x: number,
  y: number,
  safeZone: SafeZone,
): PopupPosition => {
  const safeWidth = safeZone.right - safeZone.left;
  const safeHeight = safeZone.bottom - safeZone.top;

  const popupW = Math.min(POPUP_WIDTH, safeWidth);
  const popupH = Math.min(POPUP_HEIGHT, safeHeight);

  // Try below-right of click
  let left = x + GAP;
  let top = y + GAP;

  // Flip horizontally if overflows right edge
  if (left + popupW > safeZone.right) {
    left = x - GAP - popupW;
  }

  // Flip vertically if overflows bottom edge
  if (top + popupH > safeZone.bottom) {
    top = y - GAP - popupH;
  }

  // Clamp to safe zone edges
  left = Math.max(safeZone.left, Math.min(left, safeZone.right - popupW));
  top = Math.max(safeZone.top, Math.min(top, safeZone.bottom - popupH));

  return { left, top };
};

export const usePopupPosition = (
  x: number,
  y: number,
): React.CSSProperties => {
  return useMemo(() => {
    const dock = document.querySelector<HTMLElement>('[data-layout="dock"]');
    const main = document.querySelector<HTMLElement>('[data-layout="main"]');

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;

    const safeZone: SafeZone = { left: 0, top: 0, right: vw, bottom: vh };

    if (dock) {
      const dockRect = dock.getBoundingClientRect();
      if (isDesktop) {
        safeZone.left = dockRect.right + SAFE_ZONE_PADDING;
      } else {
        safeZone.bottom = dockRect.top - SAFE_ZONE_PADDING;
      }
    }

    if (main && isDesktop) {
      const mainRect = main.getBoundingClientRect();
      safeZone.right = mainRect.left - SAFE_ZONE_PADDING;
    }

    const pos = computePopupPosition(x, y, safeZone);

    return {
      position: "fixed" as const,
      left: pos.left,
      top: pos.top,
      zIndex: 50,
    };
  }, [x, y]);
};

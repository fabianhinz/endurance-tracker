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
  flipX: boolean;
  flipY: boolean;
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

  // Horizontal: try right of click
  let left = x + GAP;
  let flipX = false;
  if (left + popupW > safeZone.right) {
    left = x - GAP;
    flipX = true;
  }

  // Vertical: try below click
  let top = y + GAP;
  let flipY = false;
  if (top + popupH > safeZone.bottom) {
    top = y - GAP;
    flipY = true;
  }

  // Clamp (accounts for transform offset)
  if (flipX) {
    left = Math.max(safeZone.left + popupW, Math.min(left, safeZone.right));
  } else {
    left = Math.max(safeZone.left, Math.min(left, safeZone.right - popupW));
  }
  if (flipY) {
    top = Math.max(safeZone.top + popupH, Math.min(top, safeZone.bottom));
  } else {
    top = Math.max(safeZone.top, Math.min(top, safeZone.bottom - popupH));
  }

  return { left, top, flipX, flipY };
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

    const transforms: string[] = [];
    if (pos.flipX) transforms.push("translateX(-100%)");
    if (pos.flipY) transforms.push("translateY(-100%)");

    return {
      position: "fixed" as const,
      left: pos.left,
      top: pos.top,
      ...(transforms.length > 0 && { transform: transforms.join(" ") }),
      zIndex: 50,
    };
  }, [x, y]);
};

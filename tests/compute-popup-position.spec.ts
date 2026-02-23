import { describe, it, expect } from "vitest";
import {
  computePopupPosition,
  type SafeZone,
} from "../src/features/map/use-popup-position.ts";

// Popup dimensions from the module: 380x300, gap: 8

const largeSafeZone: SafeZone = {
  left: 0,
  top: 0,
  right: 1920,
  bottom: 1080,
};

describe("computePopupPosition", () => {
  it("places popup below-right of click in center of large safe zone", () => {
    const pos = computePopupPosition(500, 400, largeSafeZone);
    expect(pos.left).toBe(508); // x + 8 gap
    expect(pos.top).toBe(408); // y + 8 gap
    expect(pos.flipX).toBe(false);
    expect(pos.flipY).toBe(false);
  });

  it("flips left when click is near right edge", () => {
    const pos = computePopupPosition(1800, 400, largeSafeZone);
    // 1800 + 8 + 380 = 2188 > 1920, so flips: anchor at 1800 - 8 = 1792
    expect(pos.left).toBe(1792);
    expect(pos.top).toBe(408);
    expect(pos.flipX).toBe(true);
    expect(pos.flipY).toBe(false);
  });

  it("flips up when click is near bottom edge", () => {
    const pos = computePopupPosition(500, 900, largeSafeZone);
    // 900 + 8 + 300 = 1208 > 1080, so flips: anchor at 900 - 8 = 892
    expect(pos.left).toBe(508);
    expect(pos.top).toBe(892);
    expect(pos.flipX).toBe(false);
    expect(pos.flipY).toBe(true);
  });

  it("flips both when click is near bottom-right corner", () => {
    const pos = computePopupPosition(1800, 900, largeSafeZone);
    expect(pos.left).toBe(1792);
    expect(pos.top).toBe(892);
    expect(pos.flipX).toBe(true);
    expect(pos.flipY).toBe(true);
  });

  it("clamps inside when click is under a page content area", () => {
    // Safe zone: dock at left=80, page panel starts at right=1200
    const constrained: SafeZone = {
      left: 80,
      top: 0,
      right: 1200,
      bottom: 1080,
    };
    // Click at x=1100: 1100+8+380=1488 > 1200 → flip: anchor at 1100-8=1092
    const pos = computePopupPosition(1100, 400, constrained);
    expect(pos.left).toBe(1092);
    expect(pos.top).toBe(408);
    expect(pos.flipX).toBe(true);
    expect(pos.flipY).toBe(false);
  });

  it("clamps to safe zone edges in narrow safe zone", () => {
    // Safe zone barely fits the popup (380 wide, 300 tall)
    const narrow: SafeZone = {
      left: 100,
      top: 50,
      right: 480, // 380 available
      bottom: 350, // 300 available
    };
    // Click at top-left of narrow zone
    // 100+8+380=488 > 480 → flip: 100-8=92 → clamped to left+popupW=480
    // 50+8+300=358 > 350 → flip: 50-8=42 → clamped to top+popupH=350
    const pos = computePopupPosition(100, 50, narrow);
    expect(pos.left).toBe(480);
    expect(pos.top).toBe(350);
    expect(pos.flipX).toBe(true);
    expect(pos.flipY).toBe(true);
  });
});

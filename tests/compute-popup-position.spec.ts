import { describe, it, expect } from "vitest";
import {
  computePopupPosition,
  type SafeZone,
} from "../src/features/map/use-popup-position.ts";

// Popup dimensions from the module: 320x300, gap: 8

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
  });

  it("flips left when click is near right edge", () => {
    const pos = computePopupPosition(1800, 400, largeSafeZone);
    // 1800 + 8 + 320 = 2128 > 1920, so flips: 1800 - 8 - 320 = 1472
    expect(pos.left).toBe(1472);
    expect(pos.top).toBe(408);
  });

  it("flips up when click is near bottom edge", () => {
    const pos = computePopupPosition(500, 900, largeSafeZone);
    // 900 + 8 + 300 = 1208 > 1080, so flips: 900 - 8 - 300 = 592
    expect(pos.left).toBe(508);
    expect(pos.top).toBe(592);
  });

  it("flips both when click is near bottom-right corner", () => {
    const pos = computePopupPosition(1800, 900, largeSafeZone);
    expect(pos.left).toBe(1472);
    expect(pos.top).toBe(592);
  });

  it("clamps inside when click is under a page content area", () => {
    // Safe zone: dock at left=80, page panel starts at right=1200
    const constrained: SafeZone = {
      left: 80,
      top: 0,
      right: 1200,
      bottom: 1080,
    };
    // Click at x=1100: 1100+8+320=1428 > 1200 → flip: 1100-8-320=772
    const pos = computePopupPosition(1100, 400, constrained);
    expect(pos.left).toBe(772);
    expect(pos.top).toBe(408);
  });

  it("clamps to safe zone edges in narrow safe zone", () => {
    // Safe zone barely fits the popup (320 wide, 300 tall)
    const narrow: SafeZone = {
      left: 100,
      top: 50,
      right: 420, // 320 available
      bottom: 350, // 300 available
    };
    // Click at top-left of narrow zone
    const pos = computePopupPosition(100, 50, narrow);
    // 100+8+320=428 > 420 → flip: 100-8-320=-228 → clamped to 100
    // 50+8+300=358 > 350 → flip: 50-8-300=-258 → clamped to 50
    expect(pos.left).toBe(100);
    expect(pos.top).toBe(50);
  });
});

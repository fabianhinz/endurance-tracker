import { describe, it, expect } from "vitest";
import {
  computeFlipDeltas,
  computeExpandedSize,
  getResponsivePadding,
} from "../../src/lib/use-expand-card.ts";

// Helper to create a DOMRect-like object
const rect = (
  x: number,
  y: number,
  width: number,
  height: number,
): DOMRect => ({
  x,
  y,
  width,
  height,
  top: y,
  left: x,
  right: x + width,
  bottom: y + height,
  toJSON: () => ({}),
});

describe("computeFlipDeltas", () => {
  it("computes deltas when card moves from top-left to center", () => {
    const first = rect(20, 30, 300, 200);
    const last = rect(200, 150, 600, 400);
    const deltas = computeFlipDeltas(first, last);

    expect(deltas.deltaX).toBe(-180);
    expect(deltas.deltaY).toBe(-120);
    expect(deltas.scaleX).toBe(0.5);
    expect(deltas.scaleY).toBe(0.5);
  });

  it("returns identity when rects are identical", () => {
    const r = rect(100, 100, 400, 300);
    const deltas = computeFlipDeltas(r, r);

    expect(deltas.deltaX).toBe(0);
    expect(deltas.deltaY).toBe(0);
    expect(deltas.scaleX).toBe(1);
    expect(deltas.scaleY).toBe(1);
  });

  it("handles zero-width last rect without dividing by zero", () => {
    const first = rect(10, 10, 200, 100);
    const last = rect(50, 50, 0, 0);
    const deltas = computeFlipDeltas(first, last);

    // 0-width last => denominator clamped to 1
    expect(deltas.scaleX).toBe(200);
    expect(deltas.scaleY).toBe(100);
    expect(Number.isFinite(deltas.deltaX)).toBe(true);
    expect(Number.isFinite(deltas.deltaY)).toBe(true);
  });

  it("handles card moving right and down (positive deltas)", () => {
    const first = rect(500, 400, 300, 200);
    const last = rect(200, 100, 300, 200);
    const deltas = computeFlipDeltas(first, last);

    expect(deltas.deltaX).toBe(300);
    expect(deltas.deltaY).toBe(300);
    expect(deltas.scaleX).toBe(1);
    expect(deltas.scaleY).toBe(1);
  });
});

describe("computeExpandedSize", () => {
  it("subtracts default padding from viewport (200px all edges)", () => {
    const size = computeExpandedSize(1920, 1080);

    expect(size.width).toBe(1520); // 1920 - 200*2
    expect(size.height).toBe(680); // 1080 - 200 - 200
  });

  it("uses custom padding", () => {
    const size = computeExpandedSize(1920, 1080, { x: 64, top: 64, bottom: 64 });

    expect(size.width).toBe(1792); // 1920 - 64*2
    expect(size.height).toBe(952); // 1080 - 64 - 64
  });

  it("handles small viewport where padding dominates", () => {
    const size = computeExpandedSize(100, 80, { x: 60, top: 60, bottom: 60 });

    // Negative is fine — the CSS will clamp via the browser
    expect(size.width).toBe(-20);
    expect(size.height).toBe(-40);
  });

  it("handles zero padding", () => {
    const size = computeExpandedSize(800, 600, { x: 0, top: 0, bottom: 0 });

    expect(size.width).toBe(800);
    expect(size.height).toBe(600);
  });
});

describe("getResponsivePadding", () => {
  it("returns 24px padding for small viewports", () => {
    const padding = getResponsivePadding(375);
    expect(padding).toEqual({ x: 24, top: 24, bottom: 24 });
  });

  it("returns 24px padding at 767px", () => {
    const padding = getResponsivePadding(767);
    expect(padding).toEqual({ x: 24, top: 24, bottom: 24 });
  });

  it("returns 200px padding at 768px", () => {
    const padding = getResponsivePadding(768);
    expect(padding).toEqual({ x: 200, top: 200, bottom: 200 });
  });

  it("returns 200px padding for large viewports", () => {
    const padding = getResponsivePadding(1920);
    expect(padding).toEqual({ x: 200, top: 200, bottom: 200 });
  });
});

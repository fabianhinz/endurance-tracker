import { describe, it, expect } from "vitest";
import { getTrackWidth } from "../../../src/features/map/trackColors.ts";

describe("getTrackWidth", () => {
  it("returns default width when no session is highlighted", () => {
    expect(getTrackWidth(null, "s1")).toBe(1);
  });

  it("returns highlighted width for the highlighted session", () => {
    expect(getTrackWidth("s1", "s1")).toBe(4);
  });

  it("returns default width for non-highlighted sessions", () => {
    expect(getTrackWidth("s2", "s1")).toBe(1);
  });
});

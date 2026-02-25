import { describe, it, expect } from "vitest";
import {
  sportTrackColor,
  getTrackColor,
  getTrackWidth,
} from "../../../src/features/map/track-colors.ts";

describe("getTrackColor", () => {
  it("returns default sport color when no session is highlighted", () => {
    expect(getTrackColor("running", null, "s1")).toEqual(sportTrackColor.running);
    expect(getTrackColor("cycling", null, "s2")).toEqual(sportTrackColor.cycling);
  });

  it("returns highlighted alpha for the highlighted session", () => {
    const color = getTrackColor("running", "s1", "s1");
    expect(color).toEqual([74, 222, 128, 200]);
  });

  it("returns zero alpha for non-highlighted sessions", () => {
    const color = getTrackColor("running", "s2", "s1");
    expect(color).toEqual([74, 222, 128, 0]);
  });

  it("preserves sport-specific RGB values", () => {
    const cycling = getTrackColor("cycling", "s1", "s1");
    expect(cycling.slice(0, 3)).toEqual([96, 165, 250]);

    const swimming = getTrackColor("swimming", "s1", "s1");
    expect(swimming.slice(0, 3)).toEqual([34, 211, 238]);
  });

  it("returns alpha=0 when session is hidden, regardless of highlight", () => {
    expect(getTrackColor("running", "s1", "s1", "s1")).toEqual([74, 222, 128, 0]);
    expect(getTrackColor("running", null, "s1", "s1")).toEqual([74, 222, 128, 0]);
    expect(getTrackColor("cycling", "s2", "s1", "s1")).toEqual([96, 165, 250, 0]);
  });

  it("does not affect non-hidden sessions", () => {
    expect(getTrackColor("running", "s1", "s1", "s2")).toEqual([74, 222, 128, 200]);
    expect(getTrackColor("running", null, "s1", "s2")).toEqual(sportTrackColor.running);
  });

  it("has no effect when hiddenSessionId is undefined or null", () => {
    expect(getTrackColor("running", "s1", "s1", undefined)).toEqual([74, 222, 128, 200]);
    expect(getTrackColor("running", "s1", "s1", null)).toEqual([74, 222, 128, 200]);
    expect(getTrackColor("running", null, "s1", undefined)).toEqual(sportTrackColor.running);
  });
});

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

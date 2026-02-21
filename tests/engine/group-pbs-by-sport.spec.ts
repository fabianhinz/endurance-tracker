import { describe, it, expect } from "vitest";
import { groupPBsBySport } from "../../src/engine/records.ts";
import type { PersonalBest } from "../../src/types/index.ts";

const makePB = (
  sport: "running" | "cycling" | "swimming",
  window: number,
): PersonalBest => ({
  sport,
  category: sport === "cycling" ? "peak-power" : "fastest-distance",
  window,
  value: sport === "cycling" ? 250 : 300,
  sessionId: crypto.randomUUID(),
  date: Date.now(),
});

describe("groupPBsBySport", () => {
  it("returns empty object for empty input", () => {
    expect(groupPBsBySport([])).toEqual({});
  });

  it("groups PBs by single sport", () => {
    const pbs = [makePB("running", 1000), makePB("running", 5000)];
    const result = groupPBsBySport(pbs);
    expect(Object.keys(result)).toEqual(["running"]);
    expect(result.running).toHaveLength(2);
  });

  it("groups PBs by multiple sports", () => {
    const pbs = [
      makePB("running", 1000),
      makePB("cycling", 300),
      makePB("running", 5000),
      makePB("cycling", 1200),
    ];
    const result = groupPBsBySport(pbs);
    expect(result.running).toHaveLength(2);
    expect(result.cycling).toHaveLength(2);
    expect(result.swimming).toBeUndefined();
  });

  it("preserves PB data within groups", () => {
    const pb = makePB("cycling", 300);
    const result = groupPBsBySport([pb]);
    expect(result.cycling![0]).toBe(pb);
  });
});

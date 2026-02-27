import { describe, it, expect } from "vitest";
import { formatCustomRangeDuration } from "../../src/lib/timeRange.ts";

describe("formatCustomRangeDuration", () => {
  it("returns ~Xd for single-day range", () => {
    expect(formatCustomRangeDuration({ from: "2026-01-15", to: "2026-01-15" })).toBe("~1d");
  });

  it("returns ~Xd for a two-week range", () => {
    expect(formatCustomRangeDuration({ from: "2026-01-01", to: "2026-01-14" })).toBe("~14d");
  });

  it("returns ~Xd at the 99-day boundary", () => {
    // Jan 1 – Apr 9 = 99 days inclusive → stays in days
    expect(formatCustomRangeDuration({ from: "2026-01-01", to: "2026-04-09" })).toBe("~99d");
  });

  it("returns ~Xm for ranges over 99 days", () => {
    // Jan 1 – Apr 10 = 100 days inclusive → switches to months
    expect(formatCustomRangeDuration({ from: "2026-01-01", to: "2026-04-10" })).toBe("~3m");
  });

  it("returns ~Xm for a full year", () => {
    expect(formatCustomRangeDuration({ from: "2025-01-01", to: "2025-12-31" })).toBe("~12m");
  });

  it("result is always ≤ 5 chars", () => {
    const cases = [
      { from: "2026-01-01", to: "2026-01-01" },
      { from: "2026-01-01", to: "2026-01-14" },
      { from: "2026-01-01", to: "2026-04-09" },
      { from: "2026-01-01", to: "2026-07-01" },
      { from: "2025-01-01", to: "2025-12-31" },
    ];
    for (const range of cases) {
      expect(formatCustomRangeDuration(range).length).toBeLessThanOrEqual(5);
    }
  });
});

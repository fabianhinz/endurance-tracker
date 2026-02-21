import { describe, it, expect, beforeEach } from "vitest";
import { useFiltersStore } from "../../src/store/filters.ts";

describe("useFiltersStore", () => {
  beforeEach(() => {
    useFiltersStore.setState({
      timeRange: "90d",
      sportFilter: "all",
    });
  });

  it("has correct default state", () => {
    const state = useFiltersStore.getState();
    expect(state.timeRange).toBe("90d");
    expect(state.sportFilter).toBe("all");
  });

  it("updates time range", () => {
    useFiltersStore.getState().setTimeRange("7d");
    expect(useFiltersStore.getState().timeRange).toBe("7d");
  });

  it("updates sport filter", () => {
    useFiltersStore.getState().setSportFilter("cycling");
    expect(useFiltersStore.getState().sportFilter).toBe("cycling");
  });
});

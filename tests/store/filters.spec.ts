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

  describe("setDashboardChartRange", () => {
    it("sets custom range and switches to custom timeRange", () => {
      useFiltersStore.getState().setDashboardChartRange("2025-01-01", "2025-01-31");
      const state = useFiltersStore.getState();
      expect(state.timeRange).toBe("custom");
      expect(state.customRange).toEqual({ from: "2025-01-01", to: "2025-01-31" });
    });

    it("saves previous time range on first zoom", () => {
      useFiltersStore.setState({ timeRange: "30d" });
      useFiltersStore.getState().setDashboardChartRange("2025-01-01", "2025-01-15");
      expect(useFiltersStore.getState().prevDashboardRange).toBe("30d");
    });

    it("preserves previous time range on subsequent zooms", () => {
      useFiltersStore.setState({ timeRange: "30d" });
      useFiltersStore.getState().setDashboardChartRange("2025-01-01", "2025-01-15");
      useFiltersStore.getState().setDashboardChartRange("2025-01-05", "2025-01-10");
      expect(useFiltersStore.getState().prevDashboardRange).toBe("30d");
    });
  });

  describe("clearDashboardChartRange", () => {
    it("restores previous time range", () => {
      useFiltersStore.setState({ timeRange: "30d" });
      useFiltersStore.getState().setDashboardChartRange("2025-01-01", "2025-01-15");
      useFiltersStore.getState().clearDashboardChartRange();
      const state = useFiltersStore.getState();
      expect(state.timeRange).toBe("30d");
      expect(state.customRange).toBeNull();
      expect(state.prevDashboardRange).toBeNull();
    });

    it("falls back to 90d when no previous range", () => {
      useFiltersStore.setState({ timeRange: "custom", customRange: { from: "2025-01-01", to: "2025-01-15" }, prevDashboardRange: null });
      useFiltersStore.getState().clearDashboardChartRange();
      expect(useFiltersStore.getState().timeRange).toBe("90d");
    });
  });
});

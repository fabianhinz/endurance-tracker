import { describe, it, expect, beforeEach } from "vitest";
import { useMapFocusStore } from "../../src/store/map-focus.ts";
import type { SessionLap } from "../../src/types/index.ts";

const makeLap = (overrides: Partial<SessionLap> = {}): SessionLap => ({
  sessionId: "s1",
  lapIndex: 0,
  startTime: 0,
  endTime: 300,
  totalElapsedTime: 300,
  totalTimerTime: 300,
  distance: 1000,
  avgSpeed: 3.33,
  ...overrides,
});

describe("useMapFocusStore", () => {
  beforeEach(() => {
    useMapFocusStore.setState({
      openedSessionId: null,
      hoveredSessionId: null,
      focusedLaps: [],
      focusedSport: null,
      hoveredPoint: null,
    });
  });

  it("defaults openedSessionId to null", () => {
    expect(useMapFocusStore.getState().openedSessionId).toBeNull();
  });

  it("setOpenedSession sets the id", () => {
    useMapFocusStore.getState().setOpenedSession("abc-123");
    expect(useMapFocusStore.getState().openedSessionId).toBe("abc-123");
  });

  it("setOpenedSession(null) clears the id", () => {
    useMapFocusStore.getState().setOpenedSession("abc-123");
    useMapFocusStore.getState().setOpenedSession(null);
    expect(useMapFocusStore.getState().openedSessionId).toBeNull();
  });

  it("defaults hoveredSessionId to null", () => {
    expect(useMapFocusStore.getState().hoveredSessionId).toBeNull();
  });

  it("setHoveredSession sets the id", () => {
    useMapFocusStore.getState().setHoveredSession("xyz-456");
    expect(useMapFocusStore.getState().hoveredSessionId).toBe("xyz-456");
  });

  it("setHoveredSession(null) clears the id", () => {
    useMapFocusStore.getState().setHoveredSession("xyz-456");
    useMapFocusStore.getState().setHoveredSession(null);
    expect(useMapFocusStore.getState().hoveredSessionId).toBeNull();
  });

  it("defaults focusedLaps to empty array", () => {
    expect(useMapFocusStore.getState().focusedLaps).toEqual([]);
  });

  it("defaults focusedSport to null", () => {
    expect(useMapFocusStore.getState().focusedSport).toBeNull();
  });

  it("setFocusedLaps stores laps and sport", () => {
    const laps = [makeLap({ lapIndex: 0 }), makeLap({ lapIndex: 1 })];
    useMapFocusStore.getState().setFocusedLaps(laps, "running");
    expect(useMapFocusStore.getState().focusedLaps).toEqual(laps);
    expect(useMapFocusStore.getState().focusedSport).toBe("running");
  });

  it("clearFocusedLaps resets laps and sport", () => {
    useMapFocusStore.getState().setFocusedLaps([makeLap()], "cycling");
    useMapFocusStore.getState().clearFocusedLaps();
    expect(useMapFocusStore.getState().focusedLaps).toEqual([]);
    expect(useMapFocusStore.getState().focusedSport).toBeNull();
  });

  it("setOpenedSession(null) also clears laps and sport", () => {
    useMapFocusStore.getState().setOpenedSession("abc-123");
    useMapFocusStore.getState().setFocusedLaps([makeLap()], "running");
    useMapFocusStore.getState().setOpenedSession(null);
    expect(useMapFocusStore.getState().openedSessionId).toBeNull();
    expect(useMapFocusStore.getState().focusedLaps).toEqual([]);
    expect(useMapFocusStore.getState().focusedSport).toBeNull();
  });

  it("setOpenedSession(id) preserves existing laps", () => {
    const laps = [makeLap()];
    useMapFocusStore.getState().setFocusedLaps(laps, "cycling");
    useMapFocusStore.getState().setOpenedSession("new-id");
    expect(useMapFocusStore.getState().focusedLaps).toEqual(laps);
    expect(useMapFocusStore.getState().focusedSport).toBe("cycling");
  });

});

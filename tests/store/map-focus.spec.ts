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
      focusedSessionId: null,
      hoveredSessionId: null,
      focusedLaps: [],
      focusedSport: null,
    });
  });

  it("defaults focusedSessionId to null", () => {
    expect(useMapFocusStore.getState().focusedSessionId).toBeNull();
  });

  it("setFocusedSession sets the id", () => {
    useMapFocusStore.getState().setFocusedSession("abc-123");
    expect(useMapFocusStore.getState().focusedSessionId).toBe("abc-123");
  });

  it("setFocusedSession(null) clears the id", () => {
    useMapFocusStore.getState().setFocusedSession("abc-123");
    useMapFocusStore.getState().setFocusedSession(null);
    expect(useMapFocusStore.getState().focusedSessionId).toBeNull();
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

  it("setFocusedSession(null) also clears laps and sport", () => {
    useMapFocusStore.getState().setFocusedSession("abc-123");
    useMapFocusStore.getState().setFocusedLaps([makeLap()], "running");
    useMapFocusStore.getState().setFocusedSession(null);
    expect(useMapFocusStore.getState().focusedSessionId).toBeNull();
    expect(useMapFocusStore.getState().focusedLaps).toEqual([]);
    expect(useMapFocusStore.getState().focusedSport).toBeNull();
  });

  it("setFocusedSession(id) preserves existing laps", () => {
    const laps = [makeLap()];
    useMapFocusStore.getState().setFocusedLaps(laps, "cycling");
    useMapFocusStore.getState().setFocusedSession("new-id");
    expect(useMapFocusStore.getState().focusedLaps).toEqual(laps);
    expect(useMapFocusStore.getState().focusedSport).toBe("cycling");
  });
});

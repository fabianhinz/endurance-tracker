import { describe, it, expect, beforeEach } from "vitest";
import { useMapFocusStore } from "../../src/store/map-focus.ts";

describe("useMapFocusStore", () => {
  beforeEach(() => {
    useMapFocusStore.setState({ focusedSessionId: null, hoveredSessionId: null });
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
});

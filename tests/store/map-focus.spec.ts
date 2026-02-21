import { describe, it, expect, beforeEach } from "vitest";
import { useMapFocusStore } from "../../src/store/map-focus.ts";

describe("useMapFocusStore", () => {
  beforeEach(() => {
    useMapFocusStore.setState({ focusedSessionId: null });
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
});

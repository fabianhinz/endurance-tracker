import { describe, it, expect, beforeEach } from "vitest";
import { useLayoutStore } from "../../src/store/layout.ts";

describe("useLayoutStore", () => {
  beforeEach(() => {
    useLayoutStore.setState({ dockExpanded: false, compactLayout: false });
  });

  it("defaults dockExpanded to false", () => {
    expect(useLayoutStore.getState().dockExpanded).toBe(false);
  });

  it("toggleDock flips to true", () => {
    useLayoutStore.getState().toggleDock();
    expect(useLayoutStore.getState().dockExpanded).toBe(true);
  });

  it("double toggle returns to false", () => {
    useLayoutStore.getState().toggleDock();
    useLayoutStore.getState().toggleDock();
    expect(useLayoutStore.getState().dockExpanded).toBe(false);
  });

  it("defaults compactLayout to false", () => {
    expect(useLayoutStore.getState().compactLayout).toBe(false);
  });

  it("toggleCompactLayout flips to true", () => {
    useLayoutStore.getState().toggleCompactLayout();
    expect(useLayoutStore.getState().compactLayout).toBe(true);
  });

  it("double toggleCompactLayout returns to false", () => {
    useLayoutStore.getState().toggleCompactLayout();
    useLayoutStore.getState().toggleCompactLayout();
    expect(useLayoutStore.getState().compactLayout).toBe(false);
  });
});

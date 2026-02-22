import { describe, it, expect, beforeEach } from "vitest";
import { useLayoutStore } from "../../src/store/layout.ts";

describe("useLayoutStore", () => {
  beforeEach(() => {
    useLayoutStore.setState({ dockExpanded: true, compactLayout: true });
  });

  it("defaults dockExpanded to true", () => {
    expect(useLayoutStore.getState().dockExpanded).toBe(true);
  });

  it("toggleDock flips to false", () => {
    useLayoutStore.getState().toggleDock();
    expect(useLayoutStore.getState().dockExpanded).toBe(false);
  });

  it("double toggle returns to true", () => {
    useLayoutStore.getState().toggleDock();
    useLayoutStore.getState().toggleDock();
    expect(useLayoutStore.getState().dockExpanded).toBe(true);
  });

  it("defaults compactLayout to true", () => {
    expect(useLayoutStore.getState().compactLayout).toBe(true);
  });

  it("toggleCompactLayout flips to false", () => {
    useLayoutStore.getState().toggleCompactLayout();
    expect(useLayoutStore.getState().compactLayout).toBe(false);
  });

  it("double toggleCompactLayout returns to true", () => {
    useLayoutStore.getState().toggleCompactLayout();
    useLayoutStore.getState().toggleCompactLayout();
    expect(useLayoutStore.getState().compactLayout).toBe(true);
  });
});

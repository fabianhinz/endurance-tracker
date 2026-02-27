import { create } from "zustand";
import type { SessionLap, Sport } from "../engine/types.ts";

interface MapFocusState {
  openedSessionId: string | null;
  setOpenedSession: (id: string | null) => void;
  hoveredSessionId: string | null;
  setHoveredSession: (id: string | null) => void;
  focusedLaps: SessionLap[];
  focusedSport: Sport | null;
  setFocusedLaps: (laps: SessionLap[], sport: Sport) => void;
  clearFocusedLaps: () => void;
  hoveredPoint: [number, number] | null;
  setHoveredPoint: (point: [number, number]) => void;
  clearHoveredPoint: () => void;
}

export const useMapFocusStore = create<MapFocusState>()((set) => ({
  openedSessionId: null,
  setOpenedSession: (id) =>
    set(
      id === null
        ? { openedSessionId: null, focusedLaps: [], focusedSport: null, hoveredPoint: null }
        : { openedSessionId: id },
    ),
  hoveredSessionId: null,
  setHoveredSession: (id) => set({ hoveredSessionId: id }),
  focusedLaps: [],
  focusedSport: null,
  setFocusedLaps: (laps, sport) => set({ focusedLaps: laps, focusedSport: sport }),
  clearFocusedLaps: () => set({ focusedLaps: [], focusedSport: null }),
  hoveredPoint: null,
  setHoveredPoint: (point) => set({ hoveredPoint: point }),
  clearHoveredPoint: () => set({ hoveredPoint: null }),
}));

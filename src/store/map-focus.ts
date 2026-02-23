import { create } from "zustand";
import type { SessionLap, Sport } from "../types/index.ts";

interface MapFocusState {
  focusedSessionId: string | null;
  setFocusedSession: (id: string | null) => void;
  hoveredSessionId: string | null;
  setHoveredSession: (id: string | null) => void;
  focusedLaps: SessionLap[];
  focusedSport: Sport | null;
  setFocusedLaps: (laps: SessionLap[], sport: Sport) => void;
  clearFocusedLaps: () => void;
}

export const useMapFocusStore = create<MapFocusState>()((set) => ({
  focusedSessionId: null,
  setFocusedSession: (id) =>
    set(
      id === null
        ? { focusedSessionId: null, focusedLaps: [], focusedSport: null }
        : { focusedSessionId: id },
    ),
  hoveredSessionId: null,
  setHoveredSession: (id) => set({ hoveredSessionId: id }),
  focusedLaps: [],
  focusedSport: null,
  setFocusedLaps: (laps, sport) => set({ focusedLaps: laps, focusedSport: sport }),
  clearFocusedLaps: () => set({ focusedLaps: [], focusedSport: null }),
}));

import { create } from "zustand";

interface MapFocusState {
  focusedSessionId: string | null;
  setFocusedSession: (id: string | null) => void;
}

export const useMapFocusStore = create<MapFocusState>()((set) => ({
  focusedSessionId: null,
  setFocusedSession: (id) => set({ focusedSessionId: id }),
}));

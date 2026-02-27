import { useState, useCallback } from "react";
import { useMapFocusStore } from "../../../store/mapFocus.ts";
import { decodeCached } from "./useDeckLayers.ts";
import { PICK_RADIUS } from "../DeckGLOverlay.tsx";
import {
  pickBoundsFromCorners,
  filterTracksByPickBounds,
} from "../trackPicking.ts";
import type { MapRef } from "react-map-gl/maplibre";
import type { PickingInfo } from "@deck.gl/core";
import type { TrackPickData } from "./useDeckLayers.ts";
import type { MapTrack } from "./useMapTracks.ts";
import type { PopupInfo } from "../MapPickPopup.tsx";
import type { LapPopupInfo } from "../LapPickPopup.tsx";

export const useMapPopupState = (
  mapRef: React.RefObject<MapRef | null>,
  tracks: MapTrack[],
) => {
  const openedSessionId = useMapFocusStore((s) => s.openedSessionId);
  const focusedLaps = useMapFocusStore((s) => s.focusedLaps);

  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [lapPopup, setLapPopup] = useState<LapPopupInfo | null>(null);
  const [hoveringTrack, setHoveringTrack] = useState(false);

  const interactive = !popup && !lapPopup;

  const onClick = useCallback(
    (info: PickingInfo<TrackPickData>) => {
      if (!info.object || !mapRef.current) return;

      const center = mapRef.current.unproject([info.x, info.y]);

      if (openedSessionId && focusedLaps.length > 0) {
        useMapFocusStore
          .getState()
          .setPickCircle([center.lng, center.lat]);
        setLapPopup({ x: info.x, y: info.y });
        return;
      }

      const topLeft = mapRef.current.unproject([
        info.x - PICK_RADIUS,
        info.y - PICK_RADIUS,
      ]);
      const bottomRight = mapRef.current.unproject([
        info.x + PICK_RADIUS,
        info.y + PICK_RADIUS,
      ]);

      const pickBounds = pickBoundsFromCorners(topLeft, bottomRight);
      const pickable = tracks.map((t) => ({
        sessionId: t.sessionId,
        bounds: t.gps.bounds,
        path: decodeCached(t.sessionId, t.gps.encodedPolyline),
      }));
      const hitIds = filterTracksByPickBounds(pickable, pickBounds);

      if (hitIds.length === 0) return;

      const hitSet = new Set(hitIds);
      const sessions = tracks
        .filter((t) => hitSet.has(t.sessionId))
        .map((t) => t.session);

      useMapFocusStore
        .getState()
        .setPickCircle([center.lng, center.lat]);
      setPopup({ x: info.x, y: info.y, sessions });
    },
    [tracks, openedSessionId, focusedLaps, mapRef],
  );

  const closePopup = useCallback(() => {
    setPopup(null);
    setLapPopup(null);
    useMapFocusStore.getState().clearPickCircle();
  }, []);

  const onHover = useCallback(
    (info: PickingInfo<TrackPickData>) => {
      setHoveringTrack(!!info.object);
      if (!popup && !lapPopup) {
        if (info.object && info.coordinate) {
          useMapFocusStore
            .getState()
            .setPickCircle([info.coordinate[0], info.coordinate[1]]);
        } else {
          useMapFocusStore.getState().clearPickCircle();
        }
      }
    },
    [popup, lapPopup],
  );

  const onPointerLeave = useCallback(() => {
    setHoveringTrack(false);
    if (!popup && !lapPopup)
      useMapFocusStore.getState().clearPickCircle();
  }, [popup, lapPopup]);

  return {
    popup,
    lapPopup,
    hoveringTrack,
    interactive,
    onClick,
    onHover,
    closePopup,
    onPointerLeave,
  };
};

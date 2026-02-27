import { useEffect } from "react";
import { densestClusterBounds } from "../../../engine/gps.ts";
import type { MapRef } from "react-map-gl/maplibre";
import type { MapTrack } from "./useMapTracks.ts";

export const useMapCameraEffect = (
  mapRef: React.RefObject<MapRef | null>,
  tracks: MapTrack[],
  openedSessionId: string | null,
  compactLayout: boolean,
  mapLoaded: boolean,
) => {
  useEffect(() => {
    if (tracks.length === 0 || !mapRef.current || !mapLoaded) return;

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    const rightPad = compactLayout && isDesktop ? window.innerWidth * 0.4 : 0;

    if (openedSessionId) {
      const b = tracks[0].gps.bounds;
      mapRef.current.fitBounds(
        [
          [b.minLng, b.minLat],
          [b.maxLng, b.maxLat],
        ],
        {
          padding: { top: 80, bottom: 80, left: 80, right: 80 + rightPad },
          duration: 1200,
        },
      );
      return;
    }

    const bounds = densestClusterBounds(tracks.map((t) => t.gps.bounds));
    if (!bounds) return;
    mapRef.current.fitBounds(
      [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat],
      ],
      {
        padding: { top: 50, bottom: 50, left: 50, right: 50 + rightPad },
        duration: 1000,
      },
    );
  }, [tracks, openedSessionId, compactLayout, mapLoaded, mapRef]);
};

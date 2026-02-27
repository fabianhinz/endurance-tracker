import { useRef, useEffect, useState, useCallback } from "react";
import { useMatch } from "react-router-dom";
import MapGL from "react-map-gl/maplibre";
import { darkMatterStyle } from "./mapStyle.ts";
import { useMapTracks } from "./hooks/useMapTracks.ts";
import { decodeCached } from "./hooks/useDeckLayers.ts";
import { useGPSBackfill } from "./hooks/useGpsBackfill.ts";
import { DeckGLOverlay, PICK_RADIUS } from "./DeckGLOverlay.tsx";
import { DeckMetricsOverlay } from "./DeckMetricsOverlay.tsx";
import { MapPickPopup } from "./MapPickPopup.tsx";
import { LapPickPopup } from "./LapPickPopup.tsx";
import {
  densestClusterBounds,
  boundsOverlap,
  segmentIntersectsBounds,
} from "../../engine/gps.ts";
import { useMapFocusStore } from "../../store/mapFocus.ts";
import { useLayoutStore } from "../../store/layout.ts";
import type { MapRef } from "react-map-gl/maplibre";
import type { PickingInfo } from "@deck.gl/core";
import type { PopupInfo } from "./MapPickPopup.tsx";
import type { LapPopupInfo } from "./LapPickPopup.tsx";
import type { TrackPickData } from "./hooks/useDeckLayers.ts";
import type { GPSBounds } from "../../engine/types.ts";
import "maplibre-gl/dist/maplibre-gl.css";
import "./map-attribution.css";

const PROGRESS_SIZE = 20;
const PROGRESS_STROKE = 2.5;
const PROGRESS_RADIUS = (PROGRESS_SIZE - PROGRESS_STROKE) / 2;
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;

export const MapBackground = () => {
  const mapRef = useRef<MapRef>(null);
  const backfill = useGPSBackfill();
  const mapTracks = useMapTracks(backfill.gpsData);
  const openedSessionId = useMapFocusStore((s) => s.openedSessionId);
  const setOpenedSession = useMapFocusStore((s) => s.setOpenedSession);
  const focusedLaps = useMapFocusStore((s) => s.focusedLaps);
  const focusedSport = useMapFocusStore((s) => s.focusedSport);

  const match = useMatch("/training/:id");
  useEffect(() => {
    setOpenedSession(match?.params.id ?? null);
  }, [match?.params.id, setOpenedSession]);
  const compactLayout = useLayoutStore((s) => s.compactLayout);
  const [mapLoaded, setMapLoaded] = useState(false);

  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [lapPopup, setLapPopup] = useState<LapPopupInfo | null>(null);
  const [hoveringTrack, setHoveringTrack] = useState(false);

  const interactive = !popup && !lapPopup;

  const onClick = useCallback(
    (info: PickingInfo<TrackPickData>) => {
      if (!info.object || !mapRef.current) return;

      const center = mapRef.current.unproject([info.x, info.y]);

      // On session detail page with laps available, show lap popup instead
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

      const geoBounds: GPSBounds = {
        minLat: Math.min(topLeft.lat, bottomRight.lat),
        maxLat: Math.max(topLeft.lat, bottomRight.lat),
        minLng: Math.min(topLeft.lng, bottomRight.lng),
        maxLng: Math.max(topLeft.lng, bottomRight.lng),
      };

      const seen = new Set<string>();
      const sessions = mapTracks.tracks
        .filter((t) => {
          if (seen.has(t.sessionId)) return false;
          if (!boundsOverlap(t.gps.bounds, geoBounds)) return false;
          const path = decodeCached(t.sessionId, t.gps.encodedPolyline);
          const hit = path.some(
            (p, i) =>
              i > 0 && segmentIntersectsBounds(path[i - 1], p, geoBounds),
          );
          if (hit) seen.add(t.sessionId);
          return hit;
        })
        .map((t) => t.session);

      if (sessions.length === 0) return;

      useMapFocusStore
        .getState()
        .setPickCircle([center.lng, center.lat]);
      setPopup({ x: info.x, y: info.y, sessions });
    },
    [mapTracks.tracks, openedSessionId, focusedLaps],
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

  useEffect(() => {
    if (mapTracks.tracks.length === 0 || !mapRef.current || !mapLoaded) return;

    // When compact mode is on (desktop only), reserve right side for the content panel
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    const rightPad = compactLayout && isDesktop ? window.innerWidth * 0.4 : 0;

    if (openedSessionId) {
      const b = mapTracks.tracks[0].gps.bounds;
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

    const bounds = densestClusterBounds(
      mapTracks.tracks.map((t) => t.gps.bounds),
    );
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
  }, [mapTracks.tracks, openedSessionId, compactLayout, mapLoaded]);

  const backfillPct =
    backfill.total > 0
      ? Math.min(backfill.processed, backfill.total) / backfill.total
      : 0;
  const backfillOffset = PROGRESS_CIRCUMFERENCE * (1 - backfillPct);

  return (
    <div
      className="fixed inset-0 z-0"
      onPointerLeave={() => {
        setHoveringTrack(false);
        if (!popup && !lapPopup)
          useMapFocusStore.getState().clearPickCircle();
      }}
    >
      <MapGL
        ref={mapRef}
        onLoad={() => setMapLoaded(true)}
        mapStyle={darkMatterStyle}
        cursor={hoveringTrack ? "pointer" : undefined}
        initialViewState={{
          longitude: 10,
          latitude: 50,
          zoom: 4,
        }}
        scrollZoom={interactive}
        dragPan={interactive}
        dragRotate={interactive}
        doubleClickZoom={interactive}
        touchZoomRotate={interactive}
        keyboard={interactive}
        attributionControl={{ compact: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <DeckGLOverlay
          tracks={mapTracks.tracks}
          onClick={onClick}
          onHover={onHover}
        />
      </MapGL>
      <DeckMetricsOverlay />
      {popup && <MapPickPopup info={popup} onClose={closePopup} />}
      {lapPopup && focusedSport && (
        <LapPickPopup
          info={lapPopup}
          laps={focusedLaps}
          sport={focusedSport}
          onClose={closePopup}
        />
      )}
      {backfill.backfilling && (
        <svg
          width={PROGRESS_SIZE}
          height={PROGRESS_SIZE}
          className="absolute top-4 left-4 -rotate-90"
        >
          <circle
            cx={PROGRESS_SIZE / 2}
            cy={PROGRESS_SIZE / 2}
            r={PROGRESS_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={PROGRESS_STROKE}
            className="text-white/10"
          />
          <circle
            cx={PROGRESS_SIZE / 2}
            cy={PROGRESS_SIZE / 2}
            r={PROGRESS_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={PROGRESS_STROKE}
            strokeDasharray={PROGRESS_CIRCUMFERENCE}
            strokeDashoffset={backfillOffset}
            strokeLinecap="round"
            className="text-accent transition-[stroke-dashoffset] duration-500"
          />
        </svg>
      )}
    </div>
  );
};

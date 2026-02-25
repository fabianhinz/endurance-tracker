import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useMatch } from "react-router-dom";
import MapGL from "react-map-gl/maplibre";
import { PathLayer, ScatterplotLayer } from "@deck.gl/layers";
import { darkMatterStyle } from "./map-style.ts";
import { useMapTracks } from "./use-map-tracks.ts";
import { useDeckLayers, decodeCached } from "./use-deck-layers.ts";
import { useGPSBackfill } from "./use-gps-backfill.ts";
import { useHiresPaths } from "./use-hires-paths.ts";
import { sportTrackColor } from "./track-colors.ts";
import { DeckGLOverlay } from "./DeckGLOverlay.tsx";
import { DeckMetricsOverlay } from "./DeckMetricsOverlay.tsx";
import { MapPickPopup } from "./MapPickPopup.tsx";
import { LapPickPopup } from "./LapPickPopup.tsx";
import {
  densestClusterBounds,
  boundsOverlap,
  segmentIntersectsBounds,
} from "../../engine/gps.ts";
import { useSessionsStore } from "../../store/sessions.ts";
import { useMapFocusStore } from "../../store/map-focus.ts";
import { useLayoutStore } from "../../store/layout.ts";
import type { MapRef } from "react-map-gl/maplibre";
import type { PickingInfo } from "@deck.gl/core";
import type { PopupInfo } from "./MapPickPopup.tsx";
import type { LapPopupInfo } from "./LapPickPopup.tsx";
import type { TrackPickData } from "./use-deck-layers.ts";
import type { GPSBounds } from "../../types/gps.ts";
import "maplibre-gl/dist/maplibre-gl.css";
import "./map-attribution.css";

const PROGRESS_SIZE = 20;
const PROGRESS_STROKE = 2.5;
const PROGRESS_RADIUS = (PROGRESS_SIZE - PROGRESS_STROKE) / 2;
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;
export const PICK_RADIUS = 25;

interface PickCircle {
  center: [number, number];
}

export const MapBackground = () => {
  const mapRef = useRef<MapRef>(null);
  const backfill = useGPSBackfill();
  const mapTracks = useMapTracks(backfill.gpsData);
  const hoveredSessionId = useMapFocusStore((s) => s.hoveredSessionId);
  const openedSessionId = useMapFocusStore((s) => s.openedSessionId);
  const setOpenedSession = useMapFocusStore((s) => s.setOpenedSession);
  const focusedLaps = useMapFocusStore((s) => s.focusedLaps);
  const focusedSport = useMapFocusStore((s) => s.focusedSport);
  const hoveredPoint = useMapFocusStore((s) => s.hoveredPoint);

  const sessions = useSessionsStore((s) => s.sessions);

  const match = useMatch("/training/:id");
  useEffect(() => {
    setOpenedSession(match?.params.id ?? null);
  }, [match?.params.id, setOpenedSession]);
  const compactLayout = useLayoutStore((s) => s.compactLayout);
  const onboardingComplete = useLayoutStore((s) => s.onboardingComplete);
  const [mapLoaded, setMapLoaded] = useState(false);

  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [lapPopup, setLapPopup] = useState<LapPopupInfo | null>(null);
  const [pickCircle, setPickCircle] = useState<PickCircle | null>(null);
  const [hoveringTrack, setHoveringTrack] = useState(false);

  const interactive = !popup && !lapPopup;

  const highlightedSessionId = hoveredSessionId ?? match?.params.id ?? null;

  const hiresPaths = useHiresPaths(
    hoveredSessionId,
    openedSessionId,
    sessions,
  );

  const onClick = useCallback(
    (info: PickingInfo<TrackPickData>) => {
      if (!info.object || !mapRef.current) return;

      const center = mapRef.current.unproject([info.x, info.y]);

      // On session detail page with laps available, show lap popup instead
      if (openedSessionId && focusedLaps.length > 0) {
        setPickCircle({ center: [center.lng, center.lat] });
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

      setPickCircle({ center: [center.lng, center.lat] });
      setPopup({ x: info.x, y: info.y, sessions });
    },
    [mapTracks.tracks, openedSessionId, focusedLaps],
  );

  const closePopup = useCallback(() => {
    setPopup(null);
    setLapPopup(null);
    setPickCircle(null);
  }, []);

  const onHover = useCallback(
    (info: PickingInfo<TrackPickData>) => {
      setHoveringTrack(!!info.object);
      if (!popup && !lapPopup) {
        setPickCircle(
          info.object && info.coordinate
            ? { center: [info.coordinate[0], info.coordinate[1]] }
            : null,
        );
      }
    },
    [popup, lapPopup],
  );

  const trackLayers = useDeckLayers(
    mapTracks.tracks,
    highlightedSessionId,
    onboardingComplete
      ? { onClick, onHover, hiddenSessionId: openedSessionId }
      : { hiddenSessionId: openedSessionId },
  );

  const hiresLayer = useMemo(() => {
    if (hiresPaths.size === 0) return null;

    const sportMap = new Map(sessions.map((s) => [s.id, s.sport]));
    const data = [...hiresPaths.entries()].map(([sessionId, path]) => ({
      sessionId,
      path,
      sport: sportMap.get(sessionId) ?? ("running" as const),
    }));

    return new PathLayer<(typeof data)[number]>({
      id: "hires-tracks",
      data,
      getPath: (d) => d.path,
      getColor: (d) => {
        const base = sportTrackColor[d.sport];
        const alpha = d.sessionId === openedSessionId ? 200 : 0;
        return [base[0], base[1], base[2], alpha];
      },
      getWidth: 4,
      widthMinPixels: 1,
      widthMaxPixels: 5,
      jointRounded: true,
      capRounded: true,
      pickable: false,
      updateTriggers: {
        getColor: [openedSessionId],
      },
      parameters: {
        blendColorSrcFactor: "src-alpha",
        blendColorDstFactor: "one",
        blendColorOperation: "add",
        blendAlphaSrcFactor: "one",
        blendAlphaDstFactor: "one",
        blendAlphaOperation: "add",
      },
    });
  }, [hiresPaths, openedSessionId, sessions]);

  const pickCircleLayer = useMemo(() => {
    if (!pickCircle) return null;
    return new ScatterplotLayer<PickCircle>({
      id: "pick-circle",
      data: [pickCircle],
      getPosition: (d) => d.center,
      getRadius: PICK_RADIUS,
      radiusUnits: "pixels",
      getFillColor: [255, 255, 255, 13],
      filled: true,
      stroked: true,
      getLineColor: [255, 255, 255, 25],
      lineWidthUnits: "pixels" as const,
      getLineWidth: 1,
      pickable: false,
    });
  }, [pickCircle]);

  const hoveredPointLayer = useMemo(() => {
    if (!hoveredPoint) return null;
    return new ScatterplotLayer<{ position: [number, number] }>({
      id: "hovered-point",
      data: [{ position: hoveredPoint }],
      getPosition: (d) => d.position,
      getRadius: 6,
      radiusUnits: "pixels",
      getFillColor: [255, 255, 255, 230],
      filled: true,
      stroked: true,
      getLineColor: [0, 0, 0, 180],
      lineWidthUnits: "pixels" as const,
      getLineWidth: 2,
      pickable: false,
    });
  }, [hoveredPoint]);

  const layers = useMemo(
    () => [
      ...trackLayers,
      ...(hiresLayer ? [hiresLayer] : []),
      ...(pickCircleLayer ? [pickCircleLayer] : []),
      ...(hoveredPointLayer ? [hoveredPointLayer] : []),
    ],
    [trackLayers, hiresLayer, pickCircleLayer, hoveredPointLayer],
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
        if (!popup && !lapPopup) setPickCircle(null);
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
        <DeckGLOverlay layers={layers} />
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

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useMatch } from 'react-router-dom';
import MapGL from 'react-map-gl/maplibre';
import { ScatterplotLayer } from '@deck.gl/layers';
import { darkMatterStyle } from './map-style.ts';
import { useMapTracks } from './use-map-tracks.ts';
import { useDeckLayers, decodeCached } from './use-deck-layers.ts';
import { useGPSBackfill } from './use-gps-backfill.ts';
import { DeckGLOverlay } from './DeckGLOverlay.tsx';
import { MapPickPopup } from './MapPickPopup.tsx';
import { densestClusterBounds, boundsOverlap } from '../../engine/gps.ts';
import { useMapFocusStore } from '../../store/map-focus.ts';
import { useLayoutStore } from '../../store/layout.ts';
import type { MapRef } from 'react-map-gl/maplibre';
import type { MapboxOverlay } from '@deck.gl/mapbox';
import type { PickingInfo } from '@deck.gl/core';
import type { PopupInfo } from './MapPickPopup.tsx';
import type { TrackPickData } from './use-deck-layers.ts';
import type { GPSBounds } from '../../types/gps.ts';
import 'maplibre-gl/dist/maplibre-gl.css';
import './map-attribution.css';

const PROGRESS_SIZE = 20;
const PROGRESS_STROKE = 2.5;
const PROGRESS_RADIUS = (PROGRESS_SIZE - PROGRESS_STROKE) / 2;
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;
const PICK_RADIUS = 50;

interface PickCircle {
  center: [number, number];
}

export const MapBackground = () => {
  const mapRef = useRef<MapRef>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const backfill = useGPSBackfill();
  const mapTracks = useMapTracks(backfill.gpsData);
  const hoveredSessionId = useMapFocusStore((s) => s.hoveredSessionId);
  const focusedSessionId = useMapFocusStore((s) => s.focusedSessionId);
  const setFocusedSession = useMapFocusStore((s) => s.setFocusedSession);

  const match = useMatch('/training/:id');
  useEffect(() => {
    setFocusedSession(match?.params.id ?? null);
  }, [match?.params.id, setFocusedSession]);
  const compactLayout = useLayoutStore((s) => s.compactLayout);
  const onboardingComplete = useLayoutStore((s) => s.onboardingComplete);
  const [mapLoaded, setMapLoaded] = useState(false);

  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [pickCircle, setPickCircle] = useState<PickCircle | null>(null);
  const [hoveringTrack, setHoveringTrack] = useState(false);

  const interactive = !popup;

  const highlightedSessionId = hoveredSessionId ?? match?.params.id ?? null;

  const onClick = useCallback((info: PickingInfo<TrackPickData>) => {
    if (!info.object || !mapRef.current) return;

    const center = mapRef.current.unproject([info.x, info.y]);
    const topLeft = mapRef.current.unproject([info.x - PICK_RADIUS, info.y - PICK_RADIUS]);
    const bottomRight = mapRef.current.unproject([info.x + PICK_RADIUS, info.y + PICK_RADIUS]);

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
          (p) =>
            p[1] >= geoBounds.minLat &&
            p[1] <= geoBounds.maxLat &&
            p[0] >= geoBounds.minLng &&
            p[0] <= geoBounds.maxLng,
        );
        if (hit) seen.add(t.sessionId);
        return hit;
      })
      .map((t) => t.session);

    if (sessions.length === 0) return;

    setPickCircle({ center: [center.lng, center.lat] });
    setPopup({ x: info.x, y: info.y, sessions });
  }, [mapTracks.tracks]);

  const closePopup = useCallback(() => {
    setPopup(null);
    setPickCircle(null);
  }, []);

  const onHover = useCallback(
    (info: PickingInfo<TrackPickData>) => {
      setHoveringTrack(!!info.object);
      if (!popup) {
        setPickCircle(
          info.object && info.coordinate
            ? { center: [info.coordinate[0], info.coordinate[1]] }
            : null,
        );
      }
    },
    [popup],
  );

  const onOverlay = useCallback((overlay: MapboxOverlay) => {
    overlayRef.current = overlay;
  }, []);

  const trackLayers = useDeckLayers(
    mapTracks.tracks,
    highlightedSessionId,
    onboardingComplete ? { onClick, onHover } : undefined,
  );

  const pickCircleLayer = useMemo(() => {
    if (!pickCircle) return null;
    return new ScatterplotLayer<PickCircle>({
      id: 'pick-circle',
      data: [pickCircle],
      getPosition: (d) => d.center,
      getRadius: PICK_RADIUS,
      radiusUnits: 'pixels',
      getFillColor: [255, 255, 255, 20],
      filled: true,
      pickable: false,
    });
  }, [pickCircle]);

  const layers = useMemo(
    () => (pickCircleLayer ? [...trackLayers, pickCircleLayer] : trackLayers),
    [trackLayers, pickCircleLayer],
  );

  useEffect(() => {
    if (mapTracks.tracks.length === 0 || !mapRef.current || !mapLoaded) return;

    // When compact mode is on (desktop only), reserve right side for the content panel
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    const rightPad = compactLayout && isDesktop ? window.innerWidth * 0.4 : 0;

    if (focusedSessionId) {
      const b = mapTracks.tracks[0].gps.bounds;
      mapRef.current.fitBounds(
        [
          [b.minLng, b.minLat],
          [b.maxLng, b.maxLat],
        ],
        { padding: { top: 80, bottom: 80, left: 80, right: 80 + rightPad }, duration: 1200 },
      );
      return;
    }

    const bounds = densestClusterBounds(mapTracks.tracks.map((t) => t.gps.bounds));
    if (!bounds) return;
    mapRef.current.fitBounds(
      [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat],
      ],
      { padding: { top: 50, bottom: 50, left: 50, right: 50 + rightPad }, duration: 1000 },
    );
  }, [mapTracks.tracks, focusedSessionId, compactLayout, mapLoaded]);

  const backfillPct = backfill.total > 0 ? Math.min(backfill.processed, backfill.total) / backfill.total : 0;
  const backfillOffset = PROGRESS_CIRCUMFERENCE * (1 - backfillPct);

  return (
    <div className="fixed inset-0 z-0" onPointerLeave={() => {
      setHoveringTrack(false);
      if (!popup) setPickCircle(null);
    }}>
      <MapGL
        ref={mapRef}
        onLoad={() => setMapLoaded(true)}
        mapStyle={darkMatterStyle}
        cursor={hoveringTrack ? 'pointer' : undefined}
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
        style={{ width: '100%', height: '100%' }}
      >
        <DeckGLOverlay layers={layers} onOverlay={onOverlay} />
      </MapGL>
      {popup && <MapPickPopup info={popup} onClose={closePopup} />}
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

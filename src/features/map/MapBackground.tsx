import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import MapGL from 'react-map-gl/maplibre';
import { ScatterplotLayer } from '@deck.gl/layers';
import { darkMatterStyle } from './map-style.ts';
import { useMapTracks } from './use-map-tracks.ts';
import { useDeckLayers } from './use-deck-layers.ts';
import { useGPSBackfill } from './use-gps-backfill.ts';
import { DeckGLOverlay } from './DeckGLOverlay.tsx';
import { MapPickPopup } from './MapPickPopup.tsx';
import { densestClusterBounds } from '../../engine/gps.ts';
import { useMapFocusStore } from '../../store/map-focus.ts';
import { useLayoutStore } from '../../store/layout.ts';
import type { MapRef } from 'react-map-gl/maplibre';
import type { MapboxOverlay } from '@deck.gl/mapbox';
import type { PickingInfo } from '@deck.gl/core';
import type { PopupInfo } from './MapPickPopup.tsx';
import type { TrackPickData } from './use-deck-layers.ts';
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
  const compactLayout = useLayoutStore((s) => s.compactLayout);
  const [mapLoaded, setMapLoaded] = useState(false);

  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [pickCircle, setPickCircle] = useState<PickCircle | null>(null);

  const highlightedSessionId = hoveredSessionId ?? focusedSessionId;

  const onClick = useCallback((info: PickingInfo<TrackPickData>) => {
    if (!info.object || !overlayRef.current || !mapRef.current) return;

    const center = mapRef.current.unproject([info.x, info.y]);

    const picked = overlayRef.current.pickObjects({
      x: info.x - PICK_RADIUS,
      y: info.y - PICK_RADIUS,
      width: PICK_RADIUS * 2,
      height: PICK_RADIUS * 2,
    }) as PickingInfo<TrackPickData>[];
    const seen = new Set<string>();
    const sessions = picked
      .filter((p) => {
        if (!p.object || seen.has(p.object.sessionId)) return false;
        seen.add(p.object.sessionId);
        return true;
      })
      .map((p) => p.object!.track.session);

    if (sessions.length === 0) return;

    setPickCircle({ center: [center.lng, center.lat] });
    setPopup({ x: info.x, y: info.y, sessions });
  }, []);

  const closePopup = useCallback(() => {
    setPopup(null);
    setPickCircle(null);
  }, []);

  const getCursor = useCallback((state: { isHovering: boolean; isDragging: boolean }) => {
    if (state.isDragging) return 'grabbing';
    if (state.isHovering) return 'pointer';
    return 'grab';
  }, []);

  const onOverlay = useCallback((overlay: MapboxOverlay) => {
    overlayRef.current = overlay;
  }, []);

  const trackLayers = useDeckLayers(mapTracks.tracks, highlightedSessionId, { onClick });

  const pickCircleLayer = useMemo(() => {
    if (!pickCircle) return null;
    return new ScatterplotLayer<PickCircle>({
      id: 'pick-circle',
      data: [pickCircle],
      getPosition: (d) => d.center,
      getRadius: PICK_RADIUS,
      radiusUnits: 'pixels',
      getFillColor: [255, 255, 255, 20],
      getLineColor: [255, 255, 255, 60],
      stroked: true,
      filled: true,
      lineWidthMinPixels: 1,
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
    <div className="fixed inset-0 z-0">
      <MapGL
        ref={mapRef}
        onLoad={() => setMapLoaded(true)}
        mapStyle={darkMatterStyle}
        initialViewState={{
          longitude: 10,
          latitude: 50,
          zoom: 4,
        }}
        scrollZoom={!popup}
        dragPan={!popup}
        dragRotate={!popup}
        doubleClickZoom={!popup}
        touchZoomRotate={!popup}
        keyboard={!popup}
        attributionControl={{ compact: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <DeckGLOverlay layers={layers} getCursor={getCursor} onOverlay={onOverlay} />
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

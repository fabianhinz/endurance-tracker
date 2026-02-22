import { useRef, useEffect } from 'react';
import MapGL from 'react-map-gl/maplibre';
import { darkMatterStyle } from './map-style.ts';
import { useMapTracks } from './use-map-tracks.ts';
import { useDeckLayers } from './use-deck-layers.ts';
import { useGPSBackfill } from './use-gps-backfill.ts';
import { DeckGLOverlay } from './DeckGLOverlay.tsx';
import { densestClusterBounds } from '../../engine/gps.ts';
import { useMapFocusStore } from '../../store/map-focus.ts';
import { useLayoutStore } from '../../store/layout.ts';
import type { MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import './map-attribution.css';

const PROGRESS_SIZE = 20;
const PROGRESS_STROKE = 2.5;
const PROGRESS_RADIUS = (PROGRESS_SIZE - PROGRESS_STROKE) / 2;
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;

export const MapBackground = () => {
  const mapRef = useRef<MapRef>(null);
  const backfill = useGPSBackfill();
  const mapTracks = useMapTracks(backfill.gpsData);
  const layers = useDeckLayers(mapTracks.tracks);
  const focusedSessionId = useMapFocusStore((s) => s.focusedSessionId);
  const compactLayout = useLayoutStore((s) => s.compactLayout);

  useEffect(() => {
    if (mapTracks.tracks.length === 0 || !mapRef.current) return;

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
  }, [mapTracks.tracks, focusedSessionId, compactLayout]);

  const backfillPct = backfill.total > 0 ? Math.min(backfill.processed, backfill.total) / backfill.total : 0;
  const backfillOffset = PROGRESS_CIRCUMFERENCE * (1 - backfillPct);

  return (
    <div className="fixed inset-0 z-0">
      <MapGL
        ref={mapRef}
        mapStyle={darkMatterStyle}
        initialViewState={{
          longitude: 10,
          latitude: 50,
          zoom: 4,
        }}
        attributionControl={{ compact: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <DeckGLOverlay layers={layers} />
      </MapGL>
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

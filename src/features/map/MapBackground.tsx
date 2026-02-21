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

export const MapBackground = () => {
  const mapRef = useRef<MapRef>(null);
  const backfill = useGPSBackfill();
  const mapTracks = useMapTracks(backfill.revision);
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
    </div>
  );
};

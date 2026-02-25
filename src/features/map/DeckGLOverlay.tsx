import { useEffect } from 'react';
import { useControl } from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { PICK_RADIUS } from './MapBackground.tsx';
import type { Layer } from '@deck.gl/core';

interface DeckGLOverlayProps {
  layers: Layer[];
  onOverlay?: (overlay: MapboxOverlay) => void;
  onMetrics?: (metrics: Record<string, number>) => void;
}

export const DeckGLOverlay = (props: DeckGLOverlayProps) => {
  const onOverlay = props.onOverlay;
  const overlay = useControl<MapboxOverlay>(
    () => new MapboxOverlay({ interleaved: false, pickingRadius: PICK_RADIUS }),
  );
  overlay.setProps({ layers: props.layers, pickingRadius: PICK_RADIUS, _onMetrics: props.onMetrics });

  useEffect(() => {
    onOverlay?.(overlay);
  }, [overlay, onOverlay]);

  return null;
};

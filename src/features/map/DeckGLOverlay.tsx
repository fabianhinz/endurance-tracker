import { useEffect } from 'react';
import { useControl } from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { Layer } from '@deck.gl/core';

interface InteractionState {
  isHovering: boolean;
  isDragging: boolean;
}

interface DeckGLOverlayProps {
  layers: Layer[];
  getCursor?: (state: InteractionState) => string;
  onOverlay?: (overlay: MapboxOverlay) => void;
}

export const DeckGLOverlay = (props: DeckGLOverlayProps) => {
  const onOverlay = props.onOverlay;
  const overlay = useControl<MapboxOverlay>(
    () => new MapboxOverlay({ interleaved: false, pickingRadius: 30 }),
  );
  overlay.setProps({ layers: props.layers, getCursor: props.getCursor });

  useEffect(() => {
    onOverlay?.(overlay);
  }, [overlay, onOverlay]);

  return null;
};

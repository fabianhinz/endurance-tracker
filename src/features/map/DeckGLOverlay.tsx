import { useControl } from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { Layer } from '@deck.gl/core';

interface DeckGLOverlayProps {
  layers: Layer[];
}

export const DeckGLOverlay = (props: DeckGLOverlayProps) => {
  const overlay = useControl<MapboxOverlay>(
    () => new MapboxOverlay({ interleaved: false }),
  );
  overlay.setProps({ layers: props.layers });
  return null;
};

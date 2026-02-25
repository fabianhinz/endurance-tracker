import { useControl } from "react-map-gl/maplibre";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { PICK_RADIUS } from "./MapBackground.tsx";
import type { Layer } from "@deck.gl/core";
import { useDeckMetricsStore } from "../../store/deck-metrics.ts";

interface DeckGLOverlayProps {
  layers: Layer[];
}

export const DeckGLOverlay = (props: DeckGLOverlayProps) => {
  const updateDeckMetrics = useDeckMetricsStore((s) => s.update);
  const overlay = useControl<MapboxOverlay>(
    () => new MapboxOverlay({ interleaved: false, pickingRadius: PICK_RADIUS }),
  );
  overlay.setProps({
    layers: props.layers,
    pickingRadius: PICK_RADIUS,
    _onMetrics: updateDeckMetrics,
  });

  return null;
};

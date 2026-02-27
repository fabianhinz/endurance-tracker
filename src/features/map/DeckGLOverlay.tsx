import { useMemo } from "react";
import { useMatch } from "react-router-dom";
import { useControl } from "react-map-gl/maplibre";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { PathLayer, ScatterplotLayer } from "@deck.gl/layers";
import { useDeckLayers } from "./hooks/useDeckLayers.ts";
import { useHiresPaths } from "./hooks/useHiresPaths.ts";
import { ADDITIVE_BLEND, sportTrackColor } from "./trackColors.ts";
import { useMapFocusStore } from "../../store/mapFocus.ts";
import { useSessionsStore } from "../../store/sessions.ts";
import { useLayoutStore } from "../../store/layout.ts";
import { useDeckMetricsStore } from "../../store/deckMetrics.ts";
import type { PickingInfo } from "@deck.gl/core";
import type { TrackPickData } from "./hooks/useDeckLayers.ts";
import type { MapTrack } from "./hooks/useMapTracks.ts";

export const PICK_RADIUS = 25;

interface DeckGLOverlayProps {
  tracks: MapTrack[];
  onClick?: (info: PickingInfo<TrackPickData>) => void;
  onHover?: (info: PickingInfo<TrackPickData>) => void;
}

export const DeckGLOverlay = (props: DeckGLOverlayProps) => {
  const hoveredSessionId = useMapFocusStore((s) => s.hoveredSessionId);
  const openedSessionId = useMapFocusStore((s) => s.openedSessionId);
  const hoveredPoint = useMapFocusStore((s) => s.hoveredPoint);
  const pickCircle = useMapFocusStore((s) => s.pickCircle);
  const sessions = useSessionsStore((s) => s.sessions);
  const onboardingComplete = useLayoutStore((s) => s.onboardingComplete);
  const updateDeckMetrics = useDeckMetricsStore((s) => s.update);

  const match = useMatch("/training/:id");
  const highlightedSessionId = hoveredSessionId ?? match?.params.id ?? null;

  const trackLayers = useDeckLayers(
    props.tracks,
    highlightedSessionId,
    onboardingComplete
      ? {
          onClick: props.onClick,
          onHover: props.onHover,
          hiddenSessionId: openedSessionId,
        }
      : { hiddenSessionId: openedSessionId },
  );

  const hiresPaths = useHiresPaths(hoveredSessionId, openedSessionId, sessions);

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
        const alpha = d.sessionId === openedSessionId ? base[3] : 0;
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
      parameters: ADDITIVE_BLEND,
    });
  }, [hiresPaths, openedSessionId, sessions]);

  const pickCircleLayer = useMemo(() => {
    if (!pickCircle) return null;
    return new ScatterplotLayer<{ center: [number, number] }>({
      id: "pick-circle",
      data: [{ center: pickCircle }],
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

  const overlay = useControl<MapboxOverlay>(
    () => new MapboxOverlay({ interleaved: false, pickingRadius: PICK_RADIUS }),
  );
  overlay.setProps({
    layers,
    pickingRadius: PICK_RADIUS,
    _onMetrics: updateDeckMetrics,
  });

  return null;
};

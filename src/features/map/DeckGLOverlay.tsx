import { useMemo } from "react";
import { useMatch } from "react-router-dom";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { PathLayer, ScatterplotLayer } from "@deck.gl/layers";
import { useHiresPaths } from "./hooks/useHiresPaths.ts";
import {
  ADDITIVE_BLEND,
  ALPHA_HIGHLIGHTED,
  getTrackWidth,
  sportTrackColor,
} from "./trackColors.ts";
import { useMapFocusStore } from "../../store/mapFocus.ts";
import { useSessionsStore } from "../../store/sessions.ts";
import { useLayoutStore } from "../../store/layout.ts";
import { useDeckMetricsStore } from "../../store/deckMetrics.ts";
import type { MapTrack } from "./hooks/useMapTracks.ts";
import {
  decodeCached,
  PICK_RADIUS,
  type TrackPickData,
} from "./hooks/types.ts";
import { useControl } from "react-map-gl/maplibre";

interface DeckGLOverlayProps extends Pick<
  PathLayer<TrackPickData>,
  "onClick" | "onHover"
> {
  tracks: MapTrack[];
}

export const DeckGLOverlay: React.FC<DeckGLOverlayProps> = (props) => {
  const hoveredSessionId = useMapFocusStore((s) => s.hoveredSessionId);
  const openedSessionId = useMapFocusStore((s) => s.openedSessionId);
  const hoveredPoint = useMapFocusStore((s) => s.hoveredPoint);
  const pickCircle = useMapFocusStore((s) => s.pickCircle);
  const sessions = useSessionsStore((s) => s.sessions);
  const onboardingComplete = useLayoutStore((s) => s.onboardingComplete);

  const match = useMatch("/training/:id");
  const highlightedSessionId = hoveredSessionId ?? match?.params.id ?? null;

  const trackLayers = useMemo(() => {
    const data: TrackPickData[] = props.tracks.map((t) => ({
      sessionId: t.sessionId,
      track: t,
      path: decodeCached(t.sessionId, t.gps.encodedPolyline),
    }));

    let eventHandlers: Partial<
      Pick<PathLayer<TrackPickData>, "onClick" | "onHover">
    > = {};
    if (onboardingComplete) {
      eventHandlers = {
        onClick: props.onClick,
        onHover: props.onHover,
      };
    }

    return [
      new PathLayer<TrackPickData>({
        id: "gps-tracks",
        data,
        getPath: (d) => d.path,
        getColor: (d) => {
          const [r, g, b, a] = sportTrackColor[d.track.sport];
          let alpha = a;
          if (hoveredSessionId && hoveredSessionId !== d.sessionId) {
            alpha = 0;
          } else if (highlightedSessionId === d.sessionId) {
            alpha = ALPHA_HIGHLIGHTED;
          }

          return [r, g, b, alpha];
        },
        getWidth: (d) => getTrackWidth(highlightedSessionId, d.sessionId),
        widthMinPixels: 1,
        widthMaxPixels: 5,
        jointRounded: true,
        capRounded: true,
        pickable: true,
        updateTriggers: {
          getColor: [highlightedSessionId, hoveredSessionId],
          getWidth: [highlightedSessionId],
        },
        transitions: {
          getColor: 150,
          getWidth: 150,
        },
        parameters: ADDITIVE_BLEND,
        ...eventHandlers,
      }),
    ];
  }, [
    props.tracks,
    props.onClick,
    props.onHover,
    onboardingComplete,
    highlightedSessionId,
    hoveredSessionId,
  ]);

  const hiresPaths = useHiresPaths(hoveredSessionId, openedSessionId, sessions);

  const hiresLayer = useMemo(() => {
    if (hiresPaths.size === 0 || !openedSessionId) {
      return;
    }

    const path = hiresPaths.get(openedSessionId);

    const sport = sessions.find(
      (session) => session.id === openedSessionId,
    )?.sport;
    if (!sport || !path) {
      return;
    }

    const data = {
      openedSessionId,
      path,
      sport,
    };

    return new PathLayer<typeof data>({
      id: "hires-tracks",
      data: [data],
      getPath: (d) => d.path,
      getColor: (d) => {
        const [r, g, b] = sportTrackColor[d.sport];
        return [r, g, b, ALPHA_HIGHLIGHTED];
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
      ...(openedSessionId ? [] : [trackLayers]),
      ...(hiresLayer ? [hiresLayer] : []),
      ...(pickCircleLayer ? [pickCircleLayer] : []),
      ...(hoveredPointLayer ? [hoveredPointLayer] : []),
    ],
    [
      openedSessionId,
      trackLayers,
      hiresLayer,
      pickCircleLayer,
      hoveredPointLayer,
    ],
  );

  const overlay = useControl<MapboxOverlay>(
    () => new MapboxOverlay({ interleaved: false, pickingRadius: PICK_RADIUS }),
  );
  overlay.setProps({
    layers,
    pickingRadius: PICK_RADIUS,
    _onMetrics: useDeckMetricsStore.getState().update,
  });

  return null;
};

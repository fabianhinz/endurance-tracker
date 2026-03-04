import { useMemo } from 'react';
import { useMatch } from 'react-router-dom';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { PickingInfo } from '@deck.gl/core';
import { PathLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { useHiresPaths } from './hooks/useHiresPaths.ts';
import { useZoneColoredPath } from './hooks/useZoneColoredPath.ts';
import type { ZoneSegment } from './zoneColoredPath.ts';
import {
  ADDITIVE_BLEND,
  sportMarkerColor,
  sportTrackColor,
  trackModifiers,
} from './trackColors.ts';
import type { LapMarker } from '@/engine/lapMarkers.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useLayoutStore } from '@/store/layout.ts';
import { useDeckMetricsStore } from '@/store/deckMetrics.ts';
import type { MapTrack } from './hooks/useMapTracks.ts';
import { decodeCached, PICK_RADIUS, type TrackPickData } from './hooks/types.ts';
import { useControl } from 'react-map-gl/maplibre';

type PickHandler = (info: PickingInfo, event: unknown) => boolean | void;

interface DeckGLOverlayProps {
  tracks: MapTrack[];
  onClick?: PickHandler;
  onHover?: PickHandler;
}

export const DeckGLOverlay: React.FC<DeckGLOverlayProps> = (props) => {
  const hoveredSessionId = useMapFocusStore((s) => s.hoveredSessionId);
  const openedSessionId = useMapFocusStore((s) => s.openedSessionId);
  const hoveredPoint = useMapFocusStore((s) => s.hoveredPoint);
  const pickCircle = useMapFocusStore((s) => s.pickCircle);
  const lapMarkers = useMapFocusStore((s) => s.lapMarkers);
  const focusedSport = useMapFocusStore((s) => s.focusedSport);
  const hoveredLapIndex = useMapFocusStore((s) => s.hoveredLapIndex);
  const zoneColorMode = useMapFocusStore((s) => s.zoneColorMode);
  const sessions = useSessionsStore((s) => s.sessions);
  const onboardingComplete = useLayoutStore((s) => s.onboardingComplete);

  const match = useMatch('/sessions/:id');
  const highlightedSessionId = hoveredSessionId ?? match?.params.id ?? null;

  const eventHandlers = useMemo(
    (): { onClick?: PickHandler; onHover?: PickHandler } =>
      onboardingComplete ? { onClick: props.onClick, onHover: props.onHover } : {},
    [onboardingComplete, props.onClick, props.onHover],
  );

  const trackLayers = useMemo(() => {
    const data: TrackPickData[] = props.tracks.map((t) => ({
      sessionId: t.sessionId,
      track: t,
      path: decodeCached(t.sessionId, t.gps.encodedPolyline),
    }));

    return [
      new PathLayer<TrackPickData>({
        id: 'gps-tracks',
        data,
        getPath: (d) => d.path,
        getColor: (d) => {
          const [r, g, b, a] = sportTrackColor[d.track.sport];
          let alpha = a;
          if (hoveredSessionId && hoveredSessionId !== d.sessionId) {
            alpha = 0;
          } else if (highlightedSessionId === d.sessionId) {
            alpha = trackModifiers.alpha.highlighted;
          }

          return [r, g, b, alpha];
        },
        getWidth: (d) =>
          d.sessionId === highlightedSessionId
            ? trackModifiers.width.highlighted
            : trackModifiers.width.default,
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
  }, [props.tracks, eventHandlers, highlightedSessionId, hoveredSessionId]);

  const hiresPaths = useHiresPaths(hoveredSessionId, openedSessionId, sessions);
  const zoneColoredSegments = useZoneColoredPath();

  const hiresLayer = useMemo(() => {
    if (hiresPaths.size === 0 || !openedSessionId) {
      return;
    }

    const path = hiresPaths.get(openedSessionId);

    const sport = sessions.find((session) => session.id === openedSessionId)?.sport;
    if (!sport || !path) {
      return;
    }

    const data = {
      openedSessionId,
      path,
      sport,
    };

    return new PathLayer<typeof data>({
      id: 'hires-tracks',
      data: [data],
      getPath: (d) => d.path,
      getColor: (d) => {
        const [r, g, b] = sportTrackColor[d.sport];
        return [r, g, b, trackModifiers.alpha.highlighted];
      },
      getWidth: trackModifiers.width.highlighted,
      widthMinPixels: 1,
      widthMaxPixels: 5,
      jointRounded: true,
      capRounded: true,
      pickable: true,
      updateTriggers: {
        getColor: [openedSessionId],
      },
      parameters: ADDITIVE_BLEND,
      ...eventHandlers,
    });
  }, [hiresPaths, openedSessionId, sessions, eventHandlers]);

  const pickCircleLayer = useMemo(() => {
    if (!pickCircle) return null;
    return new ScatterplotLayer<{ center: [number, number] }>({
      id: 'pick-circle',
      data: [{ center: pickCircle }],
      getPosition: (d) => d.center,
      getRadius: PICK_RADIUS,
      radiusUnits: 'pixels',
      getFillColor: [255, 255, 255, 13],
      filled: true,
      stroked: true,
      getLineColor: [255, 255, 255, 25],
      lineWidthUnits: 'pixels' as const,
      getLineWidth: 1,
      pickable: false,
    });
  }, [pickCircle]);

  const hoveredPointLayer = useMemo(() => {
    if (!hoveredPoint) return null;
    return new ScatterplotLayer<{ position: [number, number] }>({
      id: 'hovered-point',
      data: [{ position: hoveredPoint }],
      getPosition: (d) => d.position,
      getRadius: 6,
      radiusUnits: 'pixels',
      getFillColor: [255, 255, 255, 230],
      filled: true,
      stroked: true,
      getLineColor: [0, 0, 0, 180],
      lineWidthUnits: 'pixels' as const,
      getLineWidth: 2,
      pickable: false,
    });
  }, [hoveredPoint]);

  const lapMarkerLayers = useMemo(() => {
    if (lapMarkers.length === 0 || !focusedSport) return [];
    const fill = sportMarkerColor[focusedSport];
    const [r, g, b] = sportTrackColor[focusedSport];
    return lapMarkers.flatMap((marker) => {
      const lineAlpha =
        hoveredLapIndex != null ? (marker.lapIndex === hoveredLapIndex ? 255 : 0) : 0;
      return [
        new ScatterplotLayer<LapMarker>({
          id: `lap-marker-circle-${marker.lapIndex}`,
          data: [marker],
          getPosition: (d) => d.position,
          getRadius: 12,
          radiusUnits: 'pixels',
          getFillColor: fill,
          filled: true,
          stroked: true,
          getLineColor: [r, g, b, lineAlpha],
          lineWidthUnits: 'pixels' as const,
          getLineWidth: 4,
          pickable: false,
          updateTriggers: {
            getLineColor: [hoveredLapIndex],
          },
        }),
        new TextLayer<LapMarker>({
          id: `lap-marker-label-${marker.lapIndex}`,
          data: [marker],
          getPosition: (d) => d.position,
          getText: (d) => d.label,
          getSize: 12,
          getColor: [0, 0, 0, 255],
          getTextAnchor: 'middle',
          getAlignmentBaseline: 'center',
          pickable: false,
        }),
      ];
    });
  }, [lapMarkers, focusedSport, hoveredLapIndex]);

  const zoneColoredLayer = useMemo(() => {
    if (zoneColoredSegments.length === 0) return null;
    return new PathLayer<ZoneSegment>({
      id: 'zone-colored-track',
      data: zoneColoredSegments,
      getPath: (d) => d.path,
      getColor: (d) => d.color,
      getWidth: trackModifiers.width.highlighted,
      widthMinPixels: 1,
      widthMaxPixels: 5,
      jointRounded: true,
      capRounded: true,
      pickable: false,
      parameters: ADDITIVE_BLEND,
      updateTriggers: { getColor: [zoneColorMode] },
    });
  }, [zoneColoredSegments, zoneColorMode]);

  const layers = useMemo(
    () => [
      ...(openedSessionId ? [] : [trackLayers]),
      ...(hiresLayer && !zoneColoredLayer ? [hiresLayer] : []),
      ...(zoneColoredLayer ? [zoneColoredLayer] : []),
      ...(pickCircleLayer ? [pickCircleLayer] : []),
      ...(hoveredPointLayer ? [hoveredPointLayer] : []),
      ...lapMarkerLayers,
    ],
    [
      openedSessionId,
      trackLayers,
      zoneColoredLayer,
      hiresLayer,
      pickCircleLayer,
      hoveredPointLayer,
      lapMarkerLayers,
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

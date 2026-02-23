import { useMemo } from 'react';
import { PathLayer } from '@deck.gl/layers';
import { decodeTrackForRendering } from '../../engine/gps.ts';
import { getTrackColor, getTrackWidth } from './track-colors.ts';
import type { MapTrack } from './use-map-tracks.ts';
import type { PickingInfo } from '@deck.gl/core';

const pathCache = new Map<string, [number, number][]>();

export const decodeCached = (sessionId: string, encoded: string): [number, number][] => {
  let path = pathCache.get(sessionId);
  if (!path) {
    path = decodeTrackForRendering(encoded);
    pathCache.set(sessionId, path);
  }
  return path;
};

export interface TrackPickData {
  sessionId: string;
  track: MapTrack;
  path: [number, number][];
}

interface UseDeckLayersOptions {
  onClick?: (info: PickingInfo<TrackPickData>) => void;
  onHover?: (info: PickingInfo<TrackPickData>) => void;
}

export const useDeckLayers = (
  tracks: MapTrack[],
  highlightedSessionId: string | null,
  options?: UseDeckLayersOptions,
) => {
  const onClick = options?.onClick;
  const onHover = options?.onHover;

  return useMemo(() => {
    const data: TrackPickData[] = tracks.map((t) => ({
      sessionId: t.sessionId,
      track: t,
      path: decodeCached(t.sessionId, t.gps.encodedPolyline),
    }));

    return [
      new PathLayer<TrackPickData>({
        id: 'gps-tracks',
        data,
        getPath: (d) => d.path,
        getColor: (d) => getTrackColor(d.track.sport, highlightedSessionId, d.sessionId),
        getWidth: (d) => getTrackWidth(highlightedSessionId, d.sessionId),
        widthMinPixels: 1,
        widthMaxPixels: 5,
        jointRounded: true,
        capRounded: true,
        pickable: true,
        onClick: onClick as PathLayer<TrackPickData>['props']['onClick'],
        onHover: onHover as PathLayer<TrackPickData>['props']['onHover'],
        updateTriggers: {
          getColor: [highlightedSessionId],
          getWidth: [highlightedSessionId],
        },
        transitions: {
          getColor: 150,
          getWidth: 150,
        },
        parameters: {
          blendColorSrcFactor: 'src-alpha',
          blendColorDstFactor: 'one',
          blendColorOperation: 'add',
          blendAlphaSrcFactor: 'one',
          blendAlphaDstFactor: 'one',
          blendAlphaOperation: 'add',
        },
      }),
    ];
  }, [tracks, highlightedSessionId, onClick, onHover]);
};

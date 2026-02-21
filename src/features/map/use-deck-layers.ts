import { useMemo } from 'react';
import { PathLayer } from '@deck.gl/layers';
import { decodeTrackForRendering } from '../../engine/gps.ts';
import { sportTrackColor } from './track-colors.ts';
import type { MapTrack } from './use-map-tracks.ts';

const pathCache = new Map<string, [number, number][]>();

const decodeCached = (sessionId: string, encoded: string): [number, number][] => {
  let path = pathCache.get(sessionId);
  if (!path) {
    path = decodeTrackForRendering(encoded);
    pathCache.set(sessionId, path);
  }
  return path;
};

export const useDeckLayers = (tracks: MapTrack[]) =>
  useMemo(() => {
    const data = tracks.map((t) => ({
      sessionId: t.sessionId,
      sport: t.sport,
      path: decodeCached(t.sessionId, t.gps.encodedPolyline),
    }));

    return [
      new PathLayer({
        id: 'gps-tracks',
        data,
        getPath: (d: (typeof data)[number]) => d.path,
        getColor: (d: (typeof data)[number]) => sportTrackColor[d.sport],
        widthMinPixels: 1,
        widthMaxPixels: 5,
        jointRounded: true,
        capRounded: true,
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
  }, [tracks]);

import type { Sport } from '../../engine/types.ts';

export const sportTrackColor: Record<Sport, [number, number, number, number]> = {
  running: [74, 222, 128, 80],
  cycling: [96, 165, 250, 80],
  swimming: [34, 211, 238, 80],
};

const ALPHA_HIGHLIGHTED = 200;

export const getTrackColor = (
  sport: Sport,
  highlightedSessionId: string | null,
  sessionId: string,
  hiddenSessionId?: string | null,
): [number, number, number, number] => {
  const base = sportTrackColor[sport];
  if (hiddenSessionId && hiddenSessionId === sessionId)
    return [base[0], base[1], base[2], 0];
  if (!highlightedSessionId) return base;
  const alpha = sessionId === highlightedSessionId ? ALPHA_HIGHLIGHTED : 0;
  return [base[0], base[1], base[2], alpha];
};

const WIDTH_DEFAULT = 1;
const WIDTH_HIGHLIGHTED = 4;

export const getTrackWidth = (
  highlightedSessionId: string | null,
  sessionId: string,
): number => {
  if (!highlightedSessionId) return WIDTH_DEFAULT;
  return sessionId === highlightedSessionId ? WIDTH_HIGHLIGHTED : WIDTH_DEFAULT;
};

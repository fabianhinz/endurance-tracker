import type { Sport } from "../../engine/types.ts";

export const ADDITIVE_BLEND = {
  blendColorSrcFactor: "src-alpha",
  blendColorDstFactor: "one",
  blendColorOperation: "add",
  blendAlphaSrcFactor: "one",
  blendAlphaDstFactor: "one",
  blendAlphaOperation: "add",
} as const;

export const sportTrackColor: Record<Sport, [number, number, number, number]> =
  {
    running: [74, 222, 128, 80],
    cycling: [96, 165, 250, 80],
    swimming: [34, 211, 238, 80],
  };

export const ALPHA_HIGHLIGHTED = 200;

const WIDTH_DEFAULT = 1;
const WIDTH_HIGHLIGHTED = 4;

export const getTrackWidth = (
  highlightedSessionId: string | null,
  sessionId: string,
): number => {
  if (!highlightedSessionId) return WIDTH_DEFAULT;
  return sessionId === highlightedSessionId ? WIDTH_HIGHLIGHTED : WIDTH_DEFAULT;
};

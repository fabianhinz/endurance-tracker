import type { Sport } from '../../types/index.ts';

export const sportTrackColor: Record<Sport, [number, number, number, number]> = {
  running: [74, 222, 128, 80],
  cycling: [96, 165, 250, 80],
  swimming: [34, 211, 238, 80],
};

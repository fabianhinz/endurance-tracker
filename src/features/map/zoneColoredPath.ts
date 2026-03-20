import { extractPathFromRecords, isValidCoordinate } from '@/engine/gps.ts';
import type { SessionRecord } from '@/engine/types.ts';
import { HR_ZONE_DEFS, POWER_ZONE_DEFS } from '@/engine/zoneDistribution.ts';
import { computeRunningZones, getZoneForPace } from '@/engine/zones.ts';
import { trackModifiers } from './trackColors';

export type ZoneColorMode = 'hr' | 'power' | 'pace';

type Color = [number, number, number, number];

export interface DetailPath {
  path: [number, number][];
  color: Color | Color[];
}

export interface UserThresholds {
  maxHr: number;
  restHr: number;
  ftp?: number;
  thresholdPace?: number;
}

const hexToRgba = (hex: string, alpha: number): Color => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b, alpha];
};

const FALLBACK_COLOR: Color = [160, 160, 160, 80];

const getHrColor = (hr: number, thresholds: UserThresholds): Color | null => {
  const hrReserve = thresholds.maxHr - thresholds.restHr;
  if (hrReserve <= 0) return null;
  const pct = (hr - thresholds.restHr) / hrReserve;
  const def = HR_ZONE_DEFS.find((z) => pct >= z.minPct && pct < z.maxPct);
  if (def) return hexToRgba(def.color, trackModifiers.alpha.highlighted);
  if (pct >= 1.0)
    return hexToRgba(HR_ZONE_DEFS[HR_ZONE_DEFS.length - 1].color, trackModifiers.alpha.highlighted);
  if (pct < HR_ZONE_DEFS[0].minPct)
    return hexToRgba(HR_ZONE_DEFS[0].color, trackModifiers.alpha.highlighted);
  return null;
};

const getPowerColor = (power: number, ftp: number): Color | null => {
  const pct = power / ftp;
  const def = POWER_ZONE_DEFS.find((z) => pct >= z.minPct && pct < z.maxPct);
  if (def) {
    return hexToRgba(def.color, trackModifiers.alpha.highlighted);
  }
  return null;
};

const getPaceColor = (
  speed: number,
  zones: ReturnType<typeof computeRunningZones>,
): Color | null => {
  const paceSec = 1000 / speed;
  const zone = getZoneForPace(paceSec, zones);
  if (zone) return hexToRgba(zone.color, trackModifiers.alpha.highlighted);
  if (paceSec > zones[0].minPace)
    return hexToRgba(zones[0].color, trackModifiers.alpha.highlighted);
  if (paceSec < zones[zones.length - 1].maxPace)
    return hexToRgba(zones[zones.length - 1].color, trackModifiers.alpha.highlighted);
  return null;
};

export const buildZoneColoredPath = (
  records: SessionRecord[],
  mode: ZoneColorMode,
  thresholds: UserThresholds,
): DetailPath | null => {
  let paceZones: ReturnType<typeof computeRunningZones> | null = null;
  if (mode === 'pace' && thresholds.thresholdPace && thresholds.thresholdPace > 0) {
    paceZones = computeRunningZones(thresholds.thresholdPace);
  }

  const colorForRecord = (r: SessionRecord): Color => {
    if (mode === 'hr' && r.hr != null && r.hr > 0) {
      return getHrColor(r.hr, thresholds) ?? FALLBACK_COLOR;
    }
    if (mode === 'power' && r.power != null && r.power > 0 && thresholds.ftp) {
      return getPowerColor(r.power, thresholds.ftp) ?? FALLBACK_COLOR;
    }
    if (mode === 'pace' && r.speed != null && r.speed > 0.5 && paceZones) {
      return getPaceColor(r.speed, paceZones) ?? FALLBACK_COLOR;
    }
    return FALLBACK_COLOR;
  };

  const path: [number, number][] = [];
  const colors: Color[] = [];

  for (const r of records) {
    if (isValidCoordinate(r)) {
      path.push([r.lng!, r.lat!]);
      colors.push(colorForRecord(r));
    }
  }

  if (path.length < 2) return null;

  return { path, color: colors };
};

export const buildSportColoredPath = (
  records: SessionRecord[],
  sportColor: Color,
): DetailPath | null => {
  const path = extractPathFromRecords(records);
  if (path.length < 2) return null;

  return { path, color: sportColor };
};

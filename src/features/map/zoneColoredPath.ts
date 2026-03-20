import { extractPathFromRecords, isValidCoordinate } from '@/engine/gps.ts';
import type { SessionRecord } from '@/engine/types.ts';
import { HR_ZONE_DEFS, POWER_ZONE_DEFS } from '@/engine/zoneDistribution.ts';
import { computeRunningZones, getZoneForPace } from '@/engine/zones.ts';

export type ZoneColorMode = 'hr' | 'power' | 'pace';

export interface ZoneSegment {
  path: [number, number][];
  color: [number, number, number, number];
}

export interface UserThresholds {
  maxHr: number;
  restHr: number;
  ftp?: number;
  thresholdPace?: number;
}

const hexToRgba = (hex: string, alpha: number): [number, number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b, alpha];
};

const FALLBACK_COLOR: [number, number, number, number] = [160, 160, 160, 80];
const SEGMENT_ALPHA = 220;

const getHrColor = (
  hr: number,
  thresholds: UserThresholds,
): [number, number, number, number] | null => {
  const hrReserve = thresholds.maxHr - thresholds.restHr;
  if (hrReserve <= 0) return null;
  const pct = (hr - thresholds.restHr) / hrReserve;
  const def = HR_ZONE_DEFS.find((z) => pct >= z.minPct && pct < z.maxPct);
  if (def) return hexToRgba(def.color, SEGMENT_ALPHA);
  if (pct >= 1.0) return hexToRgba(HR_ZONE_DEFS[HR_ZONE_DEFS.length - 1].color, SEGMENT_ALPHA);
  if (pct < HR_ZONE_DEFS[0].minPct) return hexToRgba(HR_ZONE_DEFS[0].color, SEGMENT_ALPHA);
  return null;
};

const getPowerColor = (power: number, ftp: number): [number, number, number, number] | null => {
  const pct = power / ftp;
  const def = POWER_ZONE_DEFS.find((z) => pct >= z.minPct && pct < z.maxPct);
  if (def) {
    return hexToRgba(def.color, SEGMENT_ALPHA);
  }
  return null;
};

const getPaceColor = (
  speed: number,
  zones: ReturnType<typeof computeRunningZones>,
): [number, number, number, number] | null => {
  const paceSec = 1000 / speed;
  const zone = getZoneForPace(paceSec, zones);
  if (zone) return hexToRgba(zone.color, SEGMENT_ALPHA);
  if (paceSec > zones[0].minPace) return hexToRgba(zones[0].color, SEGMENT_ALPHA);
  if (paceSec < zones[zones.length - 1].maxPace)
    return hexToRgba(zones[zones.length - 1].color, SEGMENT_ALPHA);
  return null;
};

export const buildZoneColoredPath = (
  records: SessionRecord[],
  mode: ZoneColorMode,
  thresholds: UserThresholds,
): ZoneSegment[] => {
  let paceZones: ReturnType<typeof computeRunningZones> | null = null;
  if (mode === 'pace' && thresholds.thresholdPace && thresholds.thresholdPace > 0) {
    paceZones = computeRunningZones(thresholds.thresholdPace);
  }

  const segments: ZoneSegment[] = [];
  const validRecords = records.filter(isValidCoordinate);
  if (validRecords.length < 2) return segments;

  const colorForRecord = (r: SessionRecord): [number, number, number, number] => {
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

  const colorsEqual = (
    a: [number, number, number, number],
    b: [number, number, number, number],
  ): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];

  let currentColor = colorForRecord(validRecords[0]);
  let currentPath: [number, number][] = [[validRecords[0].lng!, validRecords[0].lat!]];

  for (let i = 1; i < validRecords.length; i++) {
    const r = validRecords[i];
    const color = colorForRecord(r);
    const point: [number, number] = [r.lng!, r.lat!];

    if (colorsEqual(color, currentColor)) {
      currentPath.push(point);
    } else {
      currentPath.push(point);
      segments.push({ path: currentPath, color: currentColor });
      currentColor = color;
      currentPath = [point];
    }
  }

  segments.push({ path: currentPath, color: currentColor });

  return segments;
};

export const buildSportColoredPath = (
  records: SessionRecord[],
  sportColor: [number, number, number, number],
): ZoneSegment[] => {
  const path = extractPathFromRecords(records);
  if (path.length < 2) return [];

  return [{ path, color: sportColor }];
};

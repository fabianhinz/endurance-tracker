import type { SessionRecord } from '@/engine/types.ts';
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

const HR_ZONE_DEFS = [
  { minPct: 0.5, maxPct: 0.6, color: '#60a5fa' },
  { minPct: 0.6, maxPct: 0.7, color: '#34d399' },
  { minPct: 0.7, maxPct: 0.8, color: '#fbbf24' },
  { minPct: 0.8, maxPct: 0.9, color: '#f97316' },
  { minPct: 0.9, maxPct: 1.0, color: '#ef4444' },
];

const POWER_ZONE_DEFS = [
  { minPct: 0, maxPct: 0.55, color: '#94a3b8' },
  { minPct: 0.55, maxPct: 0.75, color: '#60a5fa' },
  { minPct: 0.75, maxPct: 0.9, color: '#34d399' },
  { minPct: 0.9, maxPct: 1.05, color: '#fbbf24' },
  { minPct: 1.05, maxPct: 1.2, color: '#f97316' },
  { minPct: 1.2, maxPct: 1.5, color: '#ef4444' },
  { minPct: 1.5, maxPct: Infinity, color: '#dc2626' },
];

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
  return def ? hexToRgba(def.color, SEGMENT_ALPHA) : null;
};

const getPaceColor = (
  speed: number,
  zones: ReturnType<typeof computeRunningZones>,
): [number, number, number, number] | null => {
  const paceSec = 1000 / speed;
  const zone = getZoneForPace(paceSec, zones);
  return zone ? hexToRgba(zone.color, SEGMENT_ALPHA) : null;
};

export const buildZoneColoredPath = (
  records: SessionRecord[],
  mode: ZoneColorMode,
  thresholds: UserThresholds,
): ZoneSegment[] => {
  const paceZones =
    mode === 'pace' && thresholds.thresholdPace && thresholds.thresholdPace > 0
      ? computeRunningZones(thresholds.thresholdPace)
      : null;

  const segments: ZoneSegment[] = [];
  const validRecords = records.filter((r) => r.lat != null && r.lng != null);

  for (let i = 0; i < validRecords.length - 1; i++) {
    const r = validRecords[i];
    const point: [number, number] = [r.lng!, r.lat!];
    const next: [number, number] = [validRecords[i + 1].lng!, validRecords[i + 1].lat!];

    let color: [number, number, number, number] = FALLBACK_COLOR;

    if (mode === 'hr' && r.hr != null && r.hr > 0) {
      color = getHrColor(r.hr, thresholds) ?? FALLBACK_COLOR;
    } else if (mode === 'power' && r.power != null && r.power > 0 && thresholds.ftp) {
      color = getPowerColor(r.power, thresholds.ftp) ?? FALLBACK_COLOR;
    } else if (mode === 'pace' && r.speed != null && r.speed > 0.5 && paceZones) {
      color = getPaceColor(r.speed, paceZones) ?? FALLBACK_COLOR;
    }

    segments.push({ path: [point, next], color });
  }

  return segments;
};

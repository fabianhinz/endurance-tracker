import type { SessionRecord } from './types.ts';
import { computeRunningZones, getZoneForPace } from './zones.ts';
import type { EngineFormatter } from './formatter.ts';
import { defaultFormatter } from './formatter.ts';

/**
 * A single training-zone bucket produced by a zone-distribution computation.
 */
export interface ZoneBucket {
  /** Short zone identifier, e.g. `"Z1"` or `"Z4"`. */
  zone: string;
  /** Human-readable label combining the zone id and name, e.g. `"Z2 Aerobic"`. */
  label: string;
  /** Number of data-point samples (records) that fell into this zone. */
  seconds: number;
  /** Proportion of total valid samples in this zone, expressed as a percentage (0–100, one decimal). */
  percentage: number;
  /** Hex colour string used to represent this zone in charts. */
  color: string;
  /** Formatted intensity range for display, e.g. `"130–148 bpm"` or `"3:45–4:10 /km"`. */
  rangeLabel: string;
}

// --- HR Zones (5-zone model based on % of HR reserve) ---

const HR_ZONE_DEFS = [
  { zone: 'Z1', label: 'Recovery', minPct: 0.50, maxPct: 0.60, color: '#60a5fa' },
  { zone: 'Z2', label: 'Aerobic', minPct: 0.60, maxPct: 0.70, color: '#34d399' },
  { zone: 'Z3', label: 'Tempo', minPct: 0.70, maxPct: 0.80, color: '#fbbf24' },
  { zone: 'Z4', label: 'Threshold', minPct: 0.80, maxPct: 0.90, color: '#f97316' },
  { zone: 'Z5', label: 'VO2max', minPct: 0.90, maxPct: 1.00, color: '#ef4444' },
];

/**
 * Computes a 5-zone heart-rate distribution using the Karvonen (HR-reserve) method.
 *
 * @param records - Time-series session records; only those with a positive `hr` value are used.
 * @param maxHr - Athlete's maximum heart rate in bpm.
 * @param restHr - Athlete's resting heart rate in bpm.
 * @returns One `ZoneBucket` per HR zone (Z1–Z5), or an empty array when inputs are insufficient.
 */
export const computeHrZoneDistribution = (
  records: SessionRecord[],
  maxHr: number,
  restHr: number,
): ZoneBucket[] => {
  const hrReserve = maxHr - restHr;
  if (hrReserve <= 0) return [];

  const validRecords = records.filter((r) => r.hr !== undefined && r.hr > 0);
  if (validRecords.length === 0) return [];

  const counts = HR_ZONE_DEFS.map(() => 0);

  for (const r of validRecords) {
    const pct = (r.hr! - restHr) / hrReserve;
    const idx = HR_ZONE_DEFS.findIndex((z) => pct >= z.minPct && pct < z.maxPct);
    if (idx >= 0) {
      counts[idx]++;
    } else if (pct >= 1.0) {
      counts[counts.length - 1]++; // cap at Z5
    }
  }

  const total = counts.reduce((s, c) => s + c, 0);
  if (total === 0) return [];

  return HR_ZONE_DEFS.map((def, i) => ({
    zone: def.zone,
    label: `${def.zone} ${def.label}`,
    seconds: counts[i],
    percentage: Math.round((counts[i] / total) * 1000) / 10,
    color: def.color,
    rangeLabel: `${Math.round(restHr + hrReserve * def.minPct)}–${Math.round(restHr + hrReserve * def.maxPct)} bpm`,
  }));
};

// --- Power Zones (7-zone Coggan model based on % FTP) ---

const POWER_ZONE_DEFS = [
  { zone: 'Z1', label: 'Active Recovery', minPct: 0, maxPct: 0.55, color: '#94a3b8' },
  { zone: 'Z2', label: 'Endurance', minPct: 0.55, maxPct: 0.75, color: '#60a5fa' },
  { zone: 'Z3', label: 'Tempo', minPct: 0.75, maxPct: 0.90, color: '#34d399' },
  { zone: 'Z4', label: 'Threshold', minPct: 0.90, maxPct: 1.05, color: '#fbbf24' },
  { zone: 'Z5', label: 'VO2max', minPct: 1.05, maxPct: 1.20, color: '#f97316' },
  { zone: 'Z6', label: 'Anaerobic', minPct: 1.20, maxPct: 1.50, color: '#ef4444' },
  { zone: 'Z7', label: 'Neuromuscular', minPct: 1.50, maxPct: Infinity, color: '#dc2626' },
];

/**
 * Computes a 7-zone power distribution using the Coggan FTP model.
 *
 * @param records - Time-series session records; only those with a positive `power` value are used.
 * @param ftp - Athlete's Functional Threshold Power in watts.
 * @returns One `ZoneBucket` per power zone (Z1–Z7), or an empty array when inputs are insufficient.
 */
export const computePowerZoneDistribution = (
  records: SessionRecord[],
  ftp: number,
): ZoneBucket[] => {
  if (ftp <= 0) return [];

  const validRecords = records.filter((r) => r.power !== undefined && r.power > 0);
  if (validRecords.length === 0) return [];

  const counts = POWER_ZONE_DEFS.map(() => 0);

  for (const r of validRecords) {
    const pct = r.power! / ftp;
    const idx = POWER_ZONE_DEFS.findIndex((z) => pct >= z.minPct && pct < z.maxPct);
    if (idx >= 0) {
      counts[idx]++;
    }
  }

  const total = counts.reduce((s, c) => s + c, 0);
  if (total === 0) return [];

  return POWER_ZONE_DEFS.map((def, i) => ({
    zone: def.zone,
    label: `${def.zone} ${def.label}`,
    seconds: counts[i],
    percentage: Math.round((counts[i] / total) * 1000) / 10,
    color: def.color,
    rangeLabel: def.maxPct === Infinity
      ? `>${Math.round(ftp * def.minPct)} W`
      : `${Math.round(ftp * def.minPct)}–${Math.round(ftp * def.maxPct)} W`,
  }));
};

// --- Pace Zones (reuses computeRunningZones) ---

/**
 * Computes a pace-zone distribution derived from the athlete's running threshold pace.
 *
 * @param records - Time-series session records; only those with a `speed` above 0.5 m/s are used.
 * @param thresholdPace - Athlete's threshold pace in seconds per kilometre.
 * @returns One `ZoneBucket` per pace zone as defined by `computeRunningZones`, or an empty array when inputs are insufficient.
 */
export const computePaceZoneDistribution = (
  records: SessionRecord[],
  thresholdPace: number,
  formatter: EngineFormatter = defaultFormatter,
): ZoneBucket[] => {
  if (thresholdPace <= 0) return [];

  const zones = computeRunningZones(thresholdPace);
  const validRecords = records.filter((r) => r.speed !== undefined && r.speed > 0.5);
  if (validRecords.length === 0) return [];

  const counts = zones.map(() => 0);

  for (const r of validRecords) {
    const paceSec = 1000 / r.speed!; // sec/km
    const zone = getZoneForPace(paceSec, zones);
    if (zone) {
      const idx = zones.indexOf(zone);
      counts[idx]++;
    }
  }

  const total = counts.reduce((s, c) => s + c, 0);
  if (total === 0) return [];

  return zones.map((z, i) => ({
    zone: z.name,
    label: z.label,
    seconds: counts[i],
    percentage: Math.round((counts[i] / total) * 1000) / 10,
    color: z.color,
    rangeLabel: `${formatter.pace(z.maxPace)}–${formatter.pace(z.minPace)}`,
  }));
};

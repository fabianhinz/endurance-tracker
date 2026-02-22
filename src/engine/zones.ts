import type { RunningZone, RunningZoneName } from '../types/index.ts';

const ZONE_DEFS: {
  name: RunningZoneName;
  label: string;
  minPct: number; // slower boundary (higher %)
  maxPct: number; // faster boundary (lower %)
  color: string;
}[] = [
  { name: 'recovery', label: 'Recovery', minPct: 1.40, maxPct: 1.29, color: '#60a5fa' },
  { name: 'easy', label: 'Easy', minPct: 1.29, maxPct: 1.16, color: '#34d399' },
  { name: 'tempo', label: 'Tempo', minPct: 1.16, maxPct: 1.05, color: '#fbbf24' },
  { name: 'threshold', label: 'Threshold', minPct: 1.05, maxPct: 0.97, color: '#f97316' },
  { name: 'vo2max', label: 'VO2max', minPct: 0.97, maxPct: 0.86, color: '#ef4444' },
];

export const computeRunningZones = (thresholdPaceSec: number): RunningZone[] => {
  return ZONE_DEFS.map((def) => ({
    name: def.name,
    label: def.label,
    minPace: Math.round(thresholdPaceSec * def.minPct),
    maxPace: Math.round(thresholdPaceSec * def.maxPct),
    color: def.color,
  }));
};

export const getZoneForPace = (
  paceSec: number,
  zones: RunningZone[],
): RunningZone | undefined => {
  return zones.find((z) => paceSec <= z.minPace && paceSec >= z.maxPace);
};

export const getZoneMidPace = (zone: RunningZone): number => {
  return Math.round((zone.minPace + zone.maxPace) / 2);
};

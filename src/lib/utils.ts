import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};

export const formatPace = (secPerKm: number): string => {
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')} /km`;
};

const localDateFmt = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const toDateString = (timestamp: number): string => {
  const parts = localDateFmt.formatToParts(timestamp);
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  const d = parts.find((p) => p.type === 'day')!.value;
  return `${y}-${m}-${d}`;
};

export const formatSpeed = (metersPerSec: number): string => {
  return `${(metersPerSec * 3.6).toFixed(1)} km/h`;
};

export const formatLapTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const parsePaceInput = (input: string): number | undefined => {
  const match = input.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return undefined;
  const min = Number(match[1]);
  const sec = Number(match[2]);
  if (sec >= 60) return undefined;
  const totalSec = min * 60 + sec;
  if (totalSec < 150 || totalSec > 540) return undefined; // 2:30-9:00/km
  return totalSec;
};

export const formatPaceInput = (seconds: number): string => {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

import type { PersonalBest } from "../engine/types.ts";

const POWER_WINDOW_LABELS: Record<number, string> = {
  5: "5 sec",
  60: "1 min",
  300: "5 min",
  1200: "20 min",
  3600: "60 min",
};

const RUNNING_DISTANCE_LABELS: Record<number, string> = {
  1000: "1 km",
  5000: "5 km",
  10000: "10 km",
  21097: "Half Marathon",
  42195: "Marathon",
};

const SWIMMING_DISTANCE_LABELS: Record<number, string> = {
  100: "100 m",
  400: "400 m",
  1000: "1000 m",
  1500: "1500 m",
};

export const pbLabel = (pb: PersonalBest): string => {
  if (pb.category === "peak-power") {
    return POWER_WINDOW_LABELS[pb.window] ?? `${pb.window}s`;
  }
  if (pb.category === "fastest-distance") {
    if (pb.sport === "swimming") {
      return SWIMMING_DISTANCE_LABELS[pb.window] ?? `${pb.window} m`;
    }
    return RUNNING_DISTANCE_LABELS[pb.window] ?? `${pb.window} m`;
  }
  if (pb.category === "longest") return "Longest";
  return "Elevation Gain";
};

export const formatPBValue = (pb: PersonalBest): string => {
  if (pb.category === "peak-power") return `${pb.value}W`;
  if (pb.category === "fastest-distance") return formatDuration(pb.value);
  if (pb.category === "longest") return formatDistance(pb.value);
  return `${formatDistance(pb.value)} \u2191`;
};

const SUB_SPORT_LABELS: Record<string, string> = {
  road: 'Road',
  trail: 'Trail',
  mountain: 'Mountain',
  virtual_activity: 'Virtual',
  indoor_cycling: 'Indoor',
  indoor_running: 'Indoor',
  track: 'Track',
  gravel_cycling: 'Gravel',
  treadmill: 'Treadmill',
};

export const formatSubSport = (subSport: string): string => {
  return SUB_SPORT_LABELS[subSport] ?? subSport.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

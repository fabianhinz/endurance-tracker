import type { RaceDistance } from '../types/index.ts';

export const RACE_DISTANCE_METERS: Record<RaceDistance, number> = {
  '5k': 5000,
  '10k': 10000,
  'half-marathon': 21097.5,
  'marathon': 42195,
};

// Daniels/Gilbert VO2 from velocity (m/min)
const vo2FromVelocity = (v: number): number =>
  -4.6 + 0.182258 * v + 0.000104 * v * v;

// Daniels/Gilbert percent VO2max sustained over duration (minutes)
const pctVo2max = (t: number): number =>
  0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t);

export const calculateVdot = (distanceMeters: number, timeMinutes: number): number => {
  const velocity = distanceMeters / timeMinutes;
  return vo2FromVelocity(velocity) / pctVo2max(timeMinutes);
};

// Solve velocity from VO2: 0.000104·v² + 0.182258·v − (4.6 + vo2) = 0
const velocityFromVo2 = (vo2: number): number => {
  const a = 0.000104;
  const b = 0.182258;
  const c = -(4.6 + vo2);
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
};

const THRESHOLD_INTENSITY = 0.88;

export const thresholdPaceFromRace = (distanceMeters: number, timeMinutes: number): number => {
  const vdot = calculateVdot(distanceMeters, timeMinutes);
  const targetVo2 = THRESHOLD_INTENSITY * vdot;
  const velocity = velocityFromVo2(targetVo2); // m/min
  return Math.round(1000 / velocity * 60); // sec/km
};

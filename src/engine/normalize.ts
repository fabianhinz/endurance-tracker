import type { SessionRecord } from '../types/index.ts';

/**
 * Calculate Normalized Power (NP) from time-series power data.
 * 1. Calculate 30-second rolling average of power
 * 2. Raise each value to the 4th power
 * 3. Average the 4th-power values
 * 4. Take the 4th root
 */
export const calculateNormalizedPower = (records: SessionRecord[]): number | undefined => {
  const powerData = records
    .filter((r) => r.power !== undefined && r.power > 0)
    .map((r) => r.power!);

  if (powerData.length < 30) return undefined;

  // 30-second rolling average (assuming 1 record per second)
  const rollingAvg: number[] = [];
  for (let i = 29; i < powerData.length; i++) {
    let sum = 0;
    for (let j = i - 29; j <= i; j++) {
      sum += powerData[j];
    }
    rollingAvg.push(sum / 30);
  }

  if (rollingAvg.length === 0) return undefined;

  // Raise to 4th power, average, then 4th root
  const fourthPowerAvg =
    rollingAvg.reduce((sum, val) => sum + Math.pow(val, 4), 0) /
    rollingAvg.length;

  return Math.round(Math.pow(fourthPowerAvg, 0.25));
};

/**
 * Grade Adjusted Pace using Minetti cost-of-transport curve.
 * Adjusts running pace for elevation changes.
 * gradient is expressed as fraction (e.g., 0.05 = 5%).
 */
export const gradeAdjustedPaceFactor = (gradient: number): number => {
  // Simplified Minetti curve: metabolic cost relative to flat running
  // C(i) = 155.4i^5 - 30.4i^4 - 43.3i^3 + 46.3i^2 + 19.5i + 3.6
  // where i = gradient as decimal
  const i = Math.max(-0.45, Math.min(0.45, gradient));
  const cost =
    155.4 * Math.pow(i, 5) -
    30.4 * Math.pow(i, 4) -
    43.3 * Math.pow(i, 3) +
    46.3 * Math.pow(i, 2) +
    19.5 * i +
    3.6;

  const flatCost = 3.6; // cost at 0% grade
  return cost / flatCost;
};

/**
 * Calculate Grade Adjusted Pace (GAP) from time-series records.
 * Returns pace in sec/km adjusted for elevation.
 */
export const calculateGAP = (records: SessionRecord[]): number | undefined => {
  const validRecords = records.filter(
    (r) =>
      r.speed !== undefined &&
      r.speed > 0 &&
      r.distance !== undefined &&
      (r.grade !== undefined || r.elevation !== undefined),
  );

  if (validRecords.length < 2) return undefined;

  let totalAdjustedTime = 0;
  let totalDistance = 0;

  for (let i = 1; i < validRecords.length; i++) {
    const prev = validRecords[i - 1];
    const curr = validRecords[i];
    const dx = (curr.distance ?? 0) - (prev.distance ?? 0);

    if (dx <= 0) continue;

    // Prefer native FIT grade field; fall back to elevation delta
    // FIT grade is percentage (e.g. 5 = 5%); gradeAdjustedPaceFactor expects fraction (0.05)
    const gradient = curr.grade !== undefined
      ? curr.grade / 100
      : dx > 0 ? ((curr.elevation ?? 0) - (prev.elevation ?? 0)) / dx : 0;

    const factor = gradeAdjustedPaceFactor(gradient);
    const dt = curr.timestamp - prev.timestamp;

    totalAdjustedTime += dt * factor;
    totalDistance += dx;
  }

  if (totalDistance === 0) return undefined;

  // Return sec/km
  return (totalAdjustedTime / totalDistance) * 1000;
};

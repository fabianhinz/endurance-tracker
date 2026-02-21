import type { SessionRecord, Gender } from '../types/index.ts';
import { calculateNormalizedPower } from './normalize.ts';

/**
 * Calculate TSS (Training Stress Score) when power data is available.
 * TSS = (duration_sec * NP * IF) / (FTP * 3600) * 100
 * IF = NP / FTP
 */
export const calculateTSS = (
  records: SessionRecord[],
  durationSec: number,
  ftp: number,
): { tss: number; normalizedPower: number } | undefined => {
  const np = calculateNormalizedPower(records);
  if (np === undefined || ftp <= 0) return undefined;

  const intensityFactor = np / ftp;
  const tss = (durationSec * np * intensityFactor) / (ftp * 3600) * 100;

  return {
    tss: Math.round(tss * 10) / 10,
    normalizedPower: np,
  };
};

/**
 * Calculate TRIMP (Training Impulse) using Banister formula.
 * TRIMP = duration_min * deltaHR_ratio * 0.64 * e^(1.92 * deltaHR_ratio)  (male)
 * TRIMP = duration_min * deltaHR_ratio * 0.86 * e^(1.67 * deltaHR_ratio)  (female)
 * deltaHR_ratio = (avgHR - restHR) / (maxHR - restHR)
 */
export const calculateTRIMP = (
  avgHr: number,
  durationSec: number,
  restHr: number,
  maxHr: number,
  gender: Gender,
): number => {
  if (maxHr <= restHr || avgHr <= restHr) return 0;

  const durationMin = durationSec / 60;
  const deltaHrRatio = (avgHr - restHr) / (maxHr - restHr);

  // Gender-specific Banister constants
  const a = gender === 'female' ? 0.86 : 0.64;
  const b = gender === 'female' ? 1.67 : 1.92;

  const trimp = durationMin * deltaHrRatio * a * Math.exp(b * deltaHrRatio);

  // Normalize TRIMP to approximate TSS scale (divide by ~1 hour threshold effort TRIMP)
  // A 1-hour threshold effort for male: 60 * 1.0 * 0.64 * e^1.92 ≈ 262
  // We normalize so that effort produces ~100 TSS
  const normFactor = gender === 'female'
    ? 60 * 1.0 * 0.86 * Math.exp(1.67) / 100
    : 60 * 1.0 * 0.64 * Math.exp(1.92) / 100;

  return Math.round((trimp / normFactor) * 10) / 10;
};

/**
 * Calculate stress for a session, preferring TSS (power) over TRIMP (HR).
 */
export const calculateSessionStress = (
  records: SessionRecord[],
  durationSec: number,
  avgHr: number | undefined,
  restHr: number,
  maxHr: number,
  gender: Gender,
  ftp?: number,
): { tss: number; stressMethod: 'tss' | 'trimp'; normalizedPower?: number } => {
  // Try TSS first (requires power data + FTP)
  if (ftp && ftp > 0) {
    const tssResult = calculateTSS(records, durationSec, ftp);
    if (tssResult) {
      return {
        tss: tssResult.tss,
        stressMethod: 'tss',
        normalizedPower: tssResult.normalizedPower,
      };
    }
  }

  // Fall back to TRIMP (requires HR data)
  if (avgHr && avgHr > 0) {
    const trimp = calculateTRIMP(avgHr, durationSec, restHr, maxHr, gender);
    return {
      tss: trimp,
      stressMethod: 'trimp',
    };
  }

  // No usable data — assign minimal stress estimate based on duration
  return {
    tss: Math.round((durationSec / 3600) * 30),
    stressMethod: 'trimp',
  };
};

export interface TSSComparison {
  deviceTss: number;
  computedTss: number;
  delta: number;
  divergencePercent: number;
  confidence: 'high' | 'moderate' | 'low';
  warning?: string;
}

/**
 * Compare device-reported TSS with app-computed TSS.
 * Returns null when deviceTss is unavailable.
 */
export const compareTSS = (
  deviceTss: number | undefined,
  computedTss: number,
): TSSComparison | null => {
  if (deviceTss === undefined) return null;

  const delta = Math.abs(deviceTss - computedTss);
  const divergencePercent = deviceTss > 0 ? (delta / deviceTss) * 100 : 0;

  let confidence: TSSComparison['confidence'];
  let warning: string | undefined;

  if (divergencePercent <= 5) {
    confidence = 'high';
  } else if (divergencePercent <= 15) {
    confidence = 'moderate';
  } else {
    confidence = 'low';
    warning = `TSS diverges by ${divergencePercent.toFixed(0)}% from device value — check FTP setting (device: ${deviceTss}, app: ${computedTss})`;
  }

  return { deviceTss, computedTss, delta, divergencePercent, confidence, warning };
};

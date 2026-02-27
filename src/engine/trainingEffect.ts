import type { SessionRecord, Gender } from './types.ts';
import { BANISTER } from './stress.ts';

/** Human-readable label and semantic color token for a training effect score. */
export type TrainingEffectLabel = {
  /** Descriptive name for the training effect band (e.g. "Improving"). */
  label: string;
  /** Tailwind color token representing the intensity of the training effect. */
  color: 'neutral' | 'blue' | 'green' | 'amber' | 'orange' | 'red';
};

/**
 * Accumulate per-sample Banister TRIMP across the full session to produce aerobic and anaerobic training effect scores.
 * @param records - Time-series session records; only records with an `hr` field contribute.
 * @param maxHr - Athlete's maximum heart rate in bpm.
 * @param restHr - Athlete's resting heart rate in bpm.
 * @param gender - Biological sex used to select the Banister gender coefficient.
 * @param ctl - Current chronic training load; scales the fitness baseline so fitter athletes require more stimulus.
 * @returns Object with `aerobic` and `anaerobic` scores on a 0–5 scale, or `undefined` when no HR data is present or `maxHr <= restHr`.
 */
export const calculateTrainingEffect = (
  records: SessionRecord[],
  maxHr: number,
  restHr: number,
  gender: Gender,
  ctl: number,
): { aerobic: number; anaerobic: number } | undefined => {
  if (maxHr <= restHr) return undefined;

  const hrRange = maxHr - restHr;
  const { a, b } = BANISTER[gender === 'female' ? 'female' : 'male'];

  let aerobicTrimp = 0;
  let anaerobicImpulse = 0;
  let prevTimestamp: number | undefined;
  let hasHr = false;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    if (record.hr === undefined) continue;

    hasHr = true;
    const hrr = Math.max(0, Math.min(1, (record.hr - restHr) / hrRange));
    const dt =
      prevTimestamp !== undefined
        ? (record.timestamp - prevTimestamp) / 60
        : 1 / 60; // assume 1s for first record
    prevTimestamp = record.timestamp;

    if (dt <= 0) continue;

    // Aerobic TRIMP: per-sample Banister
    aerobicTrimp += dt * hrr * a * Math.exp(b * hrr);

    // Anaerobic impulse: intensity above 90% HRR
    if (hrr > 0.9) {
      anaerobicImpulse += dt * (hrr - 0.9) / 0.1;
    }
  }

  if (!hasHr) return undefined;

  // Fitness scaling: CTL 0 → 1.0x, CTL 100 → 1.5x, CTL 200 → 2.0x
  const fitnessScale = 1 + Math.max(0, Math.min(200, ctl)) / 200;

  // Aerobic TE: power-law mapping with diminishing returns from duration
  const AEROBIC_K = 1.0;
  const AEROBIC_P = 0.25;
  const aerobic = Math.max(
    0,
    Math.min(5, AEROBIC_K * Math.pow(aerobicTrimp / fitnessScale, AEROBIC_P)),
  );

  // Anaerobic TE: 6-min reference at VO2max, scaled to 2.0
  const anaerobic = Math.max(
    0,
    Math.min(5, (anaerobicImpulse / (6 * fitnessScale)) * 2.0),
  );

  return {
    aerobic: Math.round(aerobic * 10) / 10,
    anaerobic: Math.round(anaerobic * 10) / 10,
  };
};

/**
 * Map a 0–5 training effect value to a human-readable label and Tailwind color token matching Garmin's industry-standard scale.
 * @param te - Training effect score in the range 0–5.
 * @returns `TrainingEffectLabel` containing a descriptive `label` string and a semantic `color` token.
 */
export const getTrainingEffectLabel = (te: number): TrainingEffectLabel => {
  if (te >= 5.0) return { label: 'Overreaching', color: 'red' };
  if (te >= 4.0) return { label: 'Highly Improving', color: 'orange' };
  if (te >= 3.0) return { label: 'Improving', color: 'amber' };
  if (te >= 2.0) return { label: 'Maintaining', color: 'green' };
  if (te >= 1.0) return { label: 'Minor', color: 'blue' };
  return { label: 'No Effect', color: 'neutral' };
};

/**
 * Generate a short, plain-language interpretation combining aerobic and anaerobic training effect scores.
 * @param aerobic - Aerobic training effect score (0–5).
 * @param anaerobic - Anaerobic training effect score (0–5).
 * @returns A single sentence describing the dominant physiological stimulus of the session.
 */
export const getTrainingEffectSummary = (
  aerobic: number,
  anaerobic: number,
): string => {
  if (aerobic < 1.0 && anaerobic < 1.0) return 'Too easy to stimulate adaptation';
  if (aerobic >= 4.0 && anaerobic >= 4.0)
    return 'Extreme session — both aerobic and anaerobic systems pushed hard';
  if (aerobic >= 3.0 && anaerobic < 2.0)
    return 'Steady aerobic effort — improved endurance base';
  if (anaerobic >= 3.0 && aerobic < 2.0)
    return 'High-intensity session — anaerobic capacity stimulus';
  if (aerobic >= 3.0 && anaerobic >= 2.0)
    return 'Mixed-intensity effort — both energy systems challenged';
  if (aerobic >= 2.0 && anaerobic < 1.0)
    return 'Easy aerobic maintenance — good recovery day';
  if (aerobic >= 2.0)
    return 'Moderate effort — maintaining fitness with some intensity';
  return 'Light effort — minor training stimulus';
};

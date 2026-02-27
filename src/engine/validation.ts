import type { SessionRecord, Sport } from '../types/index.ts';

/** Maximum physiologically plausible heart rate in bpm before a reading is considered a sensor error. */
export const MAX_VALID_HR = 230;

/** Number of out-of-range readings that must be sustained before a sensor warning is emitted. */
export const SUSTAINED_ERROR_THRESHOLD = 10;

/** Maximum physiologically plausible power output in watts before a reading is considered a sensor error. */
export const MAX_VALID_POWER = 2500;

/** Maximum plausible speed in km/h for each sport, used to detect GPS or speed-sensor errors. */
export const MAX_SPEED_KMH: Record<Sport, number> = {
  cycling: 80,
  running: 25,
  swimming: 15,
};

/** A warning produced when a sensor metric contains sustained implausible values. */
export interface SensorWarning {
  /** The name of the data field that triggered the warning (e.g. `'hr'`, `'power'`, `'speed'`). */
  field: string;
  /** Human-readable description of the anomaly detected. */
  message: string;
}

/**
 * Validates session records for sustained sensor anomalies and returns a list of warnings.
 *
 * @param records - Array of time-series records from a parsed session.
 * @param sport - The sport type, used to apply sport-specific speed thresholds.
 * @returns An array of `SensorWarning` objects; empty when no anomalies are detected.
 */
export const validateRecords = (
  records: SessionRecord[],
  sport: Sport,
): SensorWarning[] => {
  const warnings: SensorWarning[] = [];

  const hrValues = records.filter((r) => r.hr !== undefined).map((r) => r.hr!);
  const powerValues = records
    .filter((r) => r.power !== undefined)
    .map((r) => r.power!);
  const speedValues = records
    .filter((r) => r.speed !== undefined)
    .map((r) => r.speed!);

  if (hrValues.length > 0) {
    const sustainedHighHr = hrValues.filter((hr) => hr > MAX_VALID_HR).length;
    if (sustainedHighHr > SUSTAINED_ERROR_THRESHOLD) {
      warnings.push({
        field: 'hr',
        message: `Heart rate exceeded ${MAX_VALID_HR} bpm in ${sustainedHighHr} records — likely sensor error`,
      });
    }

    const zeroHrCount = hrValues.filter((hr) => hr === 0).length;
    if (zeroHrCount === hrValues.length) {
      warnings.push({
        field: 'hr',
        message: 'Heart rate is zero for entire session — sensor not connected',
      });
    }
  }

  if (powerValues.length > 0) {
    const sustainedHighPower = powerValues.filter((p) => p > MAX_VALID_POWER).length;
    if (sustainedHighPower > SUSTAINED_ERROR_THRESHOLD) {
      warnings.push({
        field: 'power',
        message: `Power exceeded ${MAX_VALID_POWER}W in ${sustainedHighPower} records — likely sensor error`,
      });
    }
  }

  if (speedValues.length > 0) {
    const speedKmh = speedValues.map((s) => s * 3.6);
    const maxThreshold = MAX_SPEED_KMH[sport];
    const sustainedHighSpeed = speedKmh.filter(
      (s) => s > maxThreshold,
    ).length;
    if (sustainedHighSpeed > SUSTAINED_ERROR_THRESHOLD) {
      warnings.push({
        field: 'speed',
        message: `Speed exceeded ${maxThreshold} km/h in ${sustainedHighSpeed} records — likely sensor error`,
      });
    }
  }

  return warnings;
};

/**
 * Filters session records to those with a valid, positive power reading at or below `MAX_VALID_POWER`.
 *
 * @param records - Array of time-series records to filter.
 * @returns A new array containing only records where `power` is defined, greater than zero, and within the valid range.
 */
export const filterValidPower = (records: SessionRecord[]): SessionRecord[] => {
  return records.filter(
    (r) => r.power !== undefined && r.power > 0 && r.power <= MAX_VALID_POWER,
  );
};

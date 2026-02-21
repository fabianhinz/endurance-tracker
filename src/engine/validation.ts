import type { SessionRecord, Sport } from '../types/index.ts';

export interface SensorWarning {
  field: string;
  message: string;
}

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
    const sustainedHighHr = hrValues.filter((hr) => hr > 230).length;
    if (sustainedHighHr > 10) {
      warnings.push({
        field: 'hr',
        message: `Heart rate exceeded 230 bpm in ${sustainedHighHr} records — likely sensor error`,
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
    const sustainedHighPower = powerValues.filter((p) => p > 2500).length;
    if (sustainedHighPower > 10) {
      warnings.push({
        field: 'power',
        message: `Power exceeded 2500W in ${sustainedHighPower} records — likely sensor error`,
      });
    }
  }

  if (speedValues.length > 0) {
    const speedKmh = speedValues.map((s) => s * 3.6);
    const maxThreshold = sport === 'cycling' ? 80 : sport === 'running' ? 25 : 15;
    const sustainedHighSpeed = speedKmh.filter(
      (s) => s > maxThreshold,
    ).length;
    if (sustainedHighSpeed > 10) {
      warnings.push({
        field: 'speed',
        message: `Speed exceeded ${maxThreshold} km/h in ${sustainedHighSpeed} records — likely sensor error`,
      });
    }
  }

  return warnings;
};

export const filterValidPower = (records: SessionRecord[]): SessionRecord[] => {
  return records.filter(
    (r) => r.power !== undefined && r.power > 0 && r.power <= 2500,
  );
};

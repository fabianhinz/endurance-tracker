/**
 * Adaptive downsampling targeting ~1500 points for Recharts performance.
 * step = max(1, floor(records.length / target))
 */
export const downsample = <T>(records: T[], target = 1500): T[] => {
  if (records.length <= target) return records;

  const step = Math.max(1, Math.floor(records.length / target));
  const result: T[] = [];

  for (let i = 0; i < records.length; i += step) {
    result.push(records[i]);
  }

  return result;
};

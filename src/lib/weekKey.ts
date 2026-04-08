import { toDateString } from './formatters.ts';

/**
 * Returns the Monday (YYYY-MM-DD) of the ISO week containing `dateStr`.
 */
export const getMondayOfWeek = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  d.setDate(d.getDate() - day);
  return toDateString(d.getTime());
};

/**
 * Returns the month key (YYYY-MM) for a given date string.
 */
export const getMonthKey = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${month}`;
};

export const buildPlanCacheKey = (
  weekOf: string,
  sessionCount: number,
  thresholdPace: number,
): string => `${weekOf}:${sessionCount}:${thresholdPace}`;

import type { FilterOption } from '@/components/layout/DockFilterOptions';
import { m } from '@/paraglide/messages.js';

export type TimeRange = '7d' | '30d' | '90d' | 'all' | 'custom';

export const rangeMap: Record<Exclude<TimeRange, 'custom'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  all: Infinity,
};

export const rangeLabelMap: Record<TimeRange, string> = {
  '7d': m.ui_range_7d(),
  '30d': m.ui_range_30d(),
  '90d': m.ui_range_90d(),
  all: m.ui_range_all_time(),
  custom: m.ui_range_custom(),
};

export const rangeToCutoff = (
  range: Exclude<TimeRange, 'custom'>,
  now: number = Date.now(),
): number => {
  const days = rangeMap[range];
  if (days === Infinity) {
    return 0;
  }
  return now - days * 24 * 60 * 60 * 1000;
};

export const customRangeToCutoffs = (range: {
  from: string;
  to: string;
}): { from: number; to: number } => ({
  from: new Date(range.from).setHours(0, 0, 0, 0),
  to: new Date(range.to).setHours(23, 59, 59, 999),
});

const rangeDays = (range: { from: string; to: string }): number =>
  Math.round(
    (new Date(range.to).getTime() - new Date(range.from).getTime()) / (24 * 60 * 60 * 1000),
  ) + 1;

export const formatCustomRangeShort = (range: { from: string; to: string }): string => {
  const days = rangeDays(range);

  if (days >= 335) {
    return m.ui_range_years_short({ value: String(Math.round(days / 365)) });
  }

  if (days >= 28) {
    return m.ui_range_months_short({ value: String(Math.round(days / 30)) });
  }

  if (days >= 7) {
    return m.ui_range_weeks_short({ value: String(Math.round(days / 7)) });
  }

  return m.ui_range_days_short({ value: String(days) });
};

export const timeRangeOptions: FilterOption<TimeRange>[] = [
  { value: 'all', label: m.ui_range_all_short() },
  { value: '7d', label: m.ui_range_7d_short() },
  { value: '30d', label: m.ui_range_30d_short() },
  { value: '90d', label: m.ui_range_90d_short() },
];

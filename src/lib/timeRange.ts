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
  return days === Infinity ? 0 : now - days * 24 * 60 * 60 * 1000;
};

export const customRangeToCutoffs = (range: {
  from: string;
  to: string;
}): { from: number; to: number } => ({
  from: new Date(range.from).setHours(0, 0, 0, 0),
  to: new Date(range.to).setHours(23, 59, 59, 999),
});

export const formatCustomRangeDuration = (range: { from: string; to: string }): string => {
  const days =
    Math.round(
      (new Date(range.to).getTime() - new Date(range.from).getTime()) / (24 * 60 * 60 * 1000),
    ) + 1;
  return days > 99 ? `~${Math.round(days / 30)}m` : `~${days}d`;
};

export const timeRangeOptions = [
  { value: 'all', label: m.ui_range_all_short() },
  { value: '7d', label: m.ui_range_7d_short() },
  { value: '30d', label: m.ui_range_30d_short() },
  { value: '90d', label: m.ui_range_90d_short() },
];

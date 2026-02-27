export type TimeRange = "7d" | "30d" | "90d" | "all" | "custom";

export const rangeMap: Record<Exclude<TimeRange, "custom">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: Infinity,
};

export const rangeLabelMap: Record<TimeRange, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  all: "All time",
  custom: "Custom",
};

export const rangeToCutoff = (range: Exclude<TimeRange, "custom">, now: number = Date.now()): number => {
  const days = rangeMap[range];
  return days === Infinity ? 0 : now - days * 24 * 60 * 60 * 1000;
};

export const customRangeToCutoffs = (range: { from: string; to: string }): { from: number; to: number } => ({
  from: new Date(range.from).setHours(0, 0, 0, 0),
  to: new Date(range.to).setHours(23, 59, 59, 999),
});

export const formatCustomRangeDuration = (range: { from: string; to: string }): string => {
  const days = Math.round(
    (new Date(range.to).getTime() - new Date(range.from).getTime()) / (24 * 60 * 60 * 1000),
  ) + 1;
  return days > 99 ? `~${Math.round(days / 30)}m` : `~${days}d`;
};

export const timeRangeOptions = [
  { value: "all", label: "All" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
];

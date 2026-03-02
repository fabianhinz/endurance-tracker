import { tokens } from "./tokens";

export const formatChartTime = (minutes: number): string => {
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

/**
 * Computes a Y-axis domain from avg values with ~10% padding.
 * Area range bands that exceed the domain get clipped by the SVG container.
 */
export const avgDomain = (values: number[]): [number, number] => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.round((max - min) * 0.2);
  return [min - padding, max + padding];
};

export const chartTheme = {
  tick: { fill: tokens.textTertiary, fontSize: 11 },
  axisLine: { stroke: tokens.border },
  grid: { stroke: tokens.border },
  tooltip: {
    contentStyle: {
      backgroundColor: "rgba(17, 19, 24, 0.85)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: tokens.radiusMd,
      fontSize: "12px",
    },
    labelStyle: { color: tokens.textSecondary },
    isAnimationActive: false,
  },
} as const;

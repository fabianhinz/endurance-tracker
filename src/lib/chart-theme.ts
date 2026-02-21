import { tokens } from './tokens';

export const chartTheme = {
  tick: { fill: tokens.textTertiary, fontSize: 11 },
  axisLine: { stroke: tokens.border },
  grid: { stroke: tokens.border },
  tooltip: {
    contentStyle: {
      backgroundColor: 'rgba(17, 19, 24, 0.85)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: tokens.radiusMd,
      fontSize: '12px',
    },
    labelStyle: { color: tokens.textSecondary },
    isAnimationActive: false,
  },
} as const;

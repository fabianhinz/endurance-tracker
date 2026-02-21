import { tokens } from './tokens';

/** Tailwind text classes for coaching status */
export const statusTextClass: Record<string, string> = {
  detraining: 'text-status-warning',
  fresh: 'text-status-success',
  neutral: 'text-text-secondary',
  optimal: 'text-accent-hover',
  overload: 'text-status-danger',
};

/** Raw hex fills for Recharts (coaching status) */
export const statusFill: Record<string, string> = {
  detraining: tokens.statusWarning,
  fresh: tokens.statusSuccessStrong,
  neutral: tokens.statusNeutral,
  optimal: tokens.accent,
  overload: tokens.statusDangerStrong,
};

/** ACWR traffic-light color sets */
export const acwrColorMap = {
  green: { bg: 'bg-status-success-strong', text: 'text-status-success', ring: 'ring-status-success-strong/20' },
  yellow: { bg: 'bg-status-warning-strong', text: 'text-status-warning', ring: 'ring-status-warning-strong/20' },
  red: { bg: 'bg-status-danger-strong', text: 'text-status-danger', ring: 'ring-status-danger-strong/20' },
};

/** Raw hex fills for Recharts (ACWR traffic-light) */
export const acwrFill = {
  green: tokens.statusSuccessStrong,
  yellow: tokens.statusWarningStrong,
  red: tokens.statusDangerStrong,
};

/** Sport identification colors — Tailwind classes */
export const sportColorClass: Record<string, string> = {
  running: 'bg-sport-running-muted text-sport-running',
  cycling: 'bg-sport-cycling-muted text-sport-cycling',
  swimming: 'bg-sport-swimming-muted text-sport-swimming',
};

/** Sport icon watermark classes — very subtle tinted icon */
export const sportIconWatermarkClass: Record<string, string> = {
  running: "text-sport-running/10",
  cycling: "text-sport-cycling/10",
  swimming: "text-sport-swimming/10",
};

// ---------------------------------------------------------------------------
// Metric Explanation Registry
// Pure data — no React, no state, no side effects.
// Source of truth for all metric labels, descriptions, and scientific context.
// ---------------------------------------------------------------------------

import { m } from '@/paraglide/messages.js';

export type MetricId =
  | 'tss'
  | 'trimp'
  | 'duration'
  | 'ctl'
  | 'atl'
  | 'tsb'
  | 'acwr'
  | 'normalizedPower'
  | 'gradeAdjustedPace'
  | 'recovery'
  | 'pacingTrend'
  | 'trainingZones'
  | 'aerobicTE'
  | 'anaerobicTE'
  | 'avgHr'
  | 'avgPace'
  | 'avgSpeed'
  | 'avgPower'
  | 'elevation'
  | 'cadence'
  | 'vdot';

export interface MetricExplanation {
  id: MetricId;
  shortLabel: string;
  friendlyName: string;
  name: string;
  oneLiner: string;
  fullExplanation: string;
  formula?: string;
  analogy: string;
  whyItMatters: string;
  range: string;
  limitations: string;
  unit?: string;
  sports: ('running' | 'cycling' | 'swimming' | 'all')[];
  displayContext: string;
}

// ---------------------------------------------------------------------------
// Stress metrics (src/engine/stress.ts)
// ---------------------------------------------------------------------------

const tss: MetricExplanation = {
  id: 'tss',
  shortLabel: m.exp_tss_shortLabel(),
  friendlyName: m.exp_tss_friendlyName(),
  name: m.exp_tss_name(),
  oneLiner: m.exp_tss_oneLiner(),
  fullExplanation: m.exp_tss_fullExplanation(),
  formula: 'TSS = (duration_sec x NP x IF) / (FTP x 3600) x 100, where IF = NP / FTP',
  analogy: m.exp_tss_analogy(),
  whyItMatters: m.exp_tss_whyItMatters(),
  range: m.exp_tss_range(),
  limitations: m.exp_tss_limitations(),
  unit: 'TSS',
  sports: ['cycling'],
  displayContext:
    'Session detail view, session list, and weekly/monthly summaries. Display alongside the stress method label.',
};

const trimp: MetricExplanation = {
  id: 'trimp',
  shortLabel: m.exp_trimp_shortLabel(),
  friendlyName: m.exp_trimp_friendlyName(),
  name: m.exp_trimp_name(),
  oneLiner: m.exp_trimp_oneLiner(),
  fullExplanation: m.exp_trimp_fullExplanation(),
  formula:
    'TRIMP = duration_min x deltaHR_ratio x a x e^(b x deltaHR_ratio), where deltaHR_ratio = (avgHR - restHR) / (maxHR - restHR)',
  analogy: m.exp_trimp_analogy(),
  whyItMatters: m.exp_trimp_whyItMatters(),
  range: m.exp_trimp_range(),
  limitations: m.exp_trimp_limitations(),
  unit: 'TSS-equivalent',
  sports: ['all'],
  displayContext:
    'Session detail as the stress metric when power data is unavailable. Labeled as "estimated from heart rate".',
};

const duration: MetricExplanation = {
  id: 'duration',
  shortLabel: m.exp_duration_shortLabel(),
  friendlyName: m.exp_duration_friendlyName(),
  name: m.exp_duration_name(),
  oneLiner: m.exp_duration_oneLiner(),
  fullExplanation: m.exp_duration_fullExplanation(),
  analogy: m.exp_duration_analogy(),
  whyItMatters: m.exp_duration_whyItMatters(),
  range: m.exp_duration_range(),
  limitations: m.exp_duration_limitations(),
  unit: 'TSS-equivalent',
  sports: ['all'],
  displayContext:
    'Session detail as the stress metric when no sensor data is available. Labeled as "estimated from duration".',
};

// ---------------------------------------------------------------------------
// Load metrics (src/engine/metrics.ts)
// ---------------------------------------------------------------------------

const ctl: MetricExplanation = {
  id: 'ctl',
  shortLabel: m.exp_ctl_shortLabel(),
  friendlyName: m.exp_ctl_friendlyName(),
  name: m.exp_ctl_name(),
  oneLiner: m.exp_ctl_oneLiner(),
  fullExplanation: m.exp_ctl_fullExplanation(),
  formula: 'CTL_today = CTL_yesterday + (TSS_today - CTL_yesterday) x (1 - e^(-1/42))',
  analogy: m.exp_ctl_analogy(),
  whyItMatters: m.exp_ctl_whyItMatters(),
  range: m.exp_ctl_range(),
  limitations: m.exp_ctl_limitations(),
  unit: 'TSS/day',
  sports: ['all'],
  displayContext:
    'Main dashboard PMC chart as a trend line. Label as "Fitness" for beginners. Warn when data history is under 6 weeks.',
};

const atl: MetricExplanation = {
  id: 'atl',
  shortLabel: m.exp_atl_shortLabel(),
  friendlyName: m.exp_atl_friendlyName(),
  name: m.exp_atl_name(),
  oneLiner: m.exp_atl_oneLiner(),
  fullExplanation: m.exp_atl_fullExplanation(),
  formula: 'ATL_today = ATL_yesterday + (TSS_today - ATL_yesterday) x (1 - e^(-1/7))',
  analogy: m.exp_atl_analogy(),
  whyItMatters: m.exp_atl_whyItMatters(),
  range: m.exp_atl_range(),
  limitations: m.exp_atl_limitations(),
  unit: 'TSS/day',
  sports: ['all'],
  displayContext:
    'PMC chart alongside CTL. Label as "Fatigue" for beginners. Color-code the gap between CTL and ATL.',
};

const tsb: MetricExplanation = {
  id: 'tsb',
  shortLabel: m.exp_tsb_shortLabel(),
  friendlyName: m.exp_tsb_friendlyName(),
  name: m.exp_tsb_name(),
  oneLiner: m.exp_tsb_oneLiner(),
  fullExplanation: m.exp_tsb_fullExplanation(),
  formula: 'TSB = CTL - ATL',
  analogy: m.exp_tsb_analogy(),
  whyItMatters: m.exp_tsb_whyItMatters(),
  range: m.exp_tsb_range(),
  limitations: m.exp_tsb_limitations(),
  unit: 'TSS/day',
  sports: ['all'],
  displayContext:
    'Headline metric on the coaching/dashboard view. Show historical trend on PMC chart. Use form status labels for actionable advice.',
};

const acwr: MetricExplanation = {
  id: 'acwr',
  shortLabel: m.exp_acwr_shortLabel(),
  friendlyName: m.exp_acwr_friendlyName(),
  name: m.exp_acwr_name(),
  oneLiner: m.exp_acwr_oneLiner(),
  fullExplanation: m.exp_acwr_fullExplanation(),
  formula: 'ACWR = ATL / CTL (returns 0 when CTL = 0)',
  analogy: m.exp_acwr_analogy(),
  whyItMatters: m.exp_acwr_whyItMatters(),
  range: m.exp_acwr_range(),
  limitations: m.exp_acwr_limitations(),
  sports: ['all'],
  displayContext:
    'Coaching dashboard alongside injury risk status. Use a color-coded gauge (green/yellow/red). Hide or grey out when data history is under 4 weeks.',
};

// ---------------------------------------------------------------------------
// Normalized metrics (src/engine/normalize.ts)
// ---------------------------------------------------------------------------

const normalizedPower: MetricExplanation = {
  id: 'normalizedPower',
  shortLabel: m.exp_normalizedPower_shortLabel(),
  friendlyName: m.exp_normalizedPower_friendlyName(),
  name: m.exp_normalizedPower_name(),
  oneLiner: m.exp_normalizedPower_oneLiner(),
  fullExplanation: m.exp_normalizedPower_fullExplanation(),
  formula: '30s rolling average of power -> raise each to 4th power -> average -> 4th root',
  analogy: m.exp_normalizedPower_analogy(),
  whyItMatters: m.exp_normalizedPower_whyItMatters(),
  range: m.exp_normalizedPower_range(),
  limitations: m.exp_normalizedPower_limitations(),
  unit: 'W',
  sports: ['cycling'],
  displayContext: 'Session detail view for cycling activities. Always pair with Average Power.',
};

const gradeAdjustedPace: MetricExplanation = {
  id: 'gradeAdjustedPace',
  shortLabel: m.exp_gradeAdjustedPace_shortLabel(),
  friendlyName: m.exp_gradeAdjustedPace_friendlyName(),
  name: m.exp_gradeAdjustedPace_name(),
  oneLiner: m.exp_gradeAdjustedPace_oneLiner(),
  fullExplanation: m.exp_gradeAdjustedPace_fullExplanation(),
  formula:
    'C(i) = 155.4i^5 - 30.4i^4 - 43.3i^3 + 46.3i^2 + 19.5i + 3.6, normalized against flat cost of 3.6',
  analogy: m.exp_gradeAdjustedPace_analogy(),
  whyItMatters: m.exp_gradeAdjustedPace_whyItMatters(),
  range: m.exp_gradeAdjustedPace_range(),
  limitations: m.exp_gradeAdjustedPace_limitations(),
  unit: 'sec/km',
  sports: ['running'],
  displayContext:
    'Session detail for running activities with elevation data. Display alongside actual pace.',
};

// ---------------------------------------------------------------------------
// Session analysis (src/engine/laps.ts)
// ---------------------------------------------------------------------------

const recovery: MetricExplanation = {
  id: 'recovery',
  shortLabel: m.exp_recovery_shortLabel(),
  friendlyName: m.exp_recovery_friendlyName(),
  name: m.exp_recovery_name(),
  oneLiner: m.exp_recovery_oneLiner(),
  fullExplanation: m.exp_recovery_fullExplanation(),
  analogy: m.exp_recovery_analogy(),
  whyItMatters: m.exp_recovery_whyItMatters(),
  range: m.exp_recovery_range(),
  limitations: m.exp_recovery_limitations(),
  sports: ['all'],
  displayContext:
    'Session detail view for sessions with detected work/rest interval pairs. Show average recovery with a color-coded label.',
};

const pacingTrend: MetricExplanation = {
  id: 'pacingTrend',
  shortLabel: m.exp_pacingTrend_shortLabel(),
  friendlyName: m.exp_pacingTrend_friendlyName(),
  name: m.exp_pacingTrend_name(),
  oneLiner: m.exp_pacingTrend_oneLiner(),
  fullExplanation: m.exp_pacingTrend_fullExplanation(),
  formula:
    'Drift% = ((lastLapPace - firstLapPace) / firstLapPace) x 100. Fading: >3%, Stable: -3% to 3%, Building: <-3%',
  analogy: m.exp_pacingTrend_analogy(),
  whyItMatters: m.exp_pacingTrend_whyItMatters(),
  range: m.exp_pacingTrend_range(),
  limitations: m.exp_pacingTrend_limitations(),
  sports: ['running', 'cycling'],
  displayContext:
    'Session detail view for sessions with 3+ laps. Show drift percentage and a color-coded trend label.',
};

// ---------------------------------------------------------------------------
// Training zones (src/engine/zones.ts)
// ---------------------------------------------------------------------------

const trainingZones: MetricExplanation = {
  id: 'trainingZones',
  shortLabel: m.exp_trainingZones_shortLabel(),
  friendlyName: m.exp_trainingZones_friendlyName(),
  name: m.exp_trainingZones_name(),
  oneLiner: m.exp_trainingZones_oneLiner(),
  fullExplanation: m.exp_trainingZones_fullExplanation(),
  analogy: m.exp_trainingZones_analogy(),
  whyItMatters: m.exp_trainingZones_whyItMatters(),
  range: m.exp_trainingZones_range(),
  limitations: m.exp_trainingZones_limitations(),
  sports: ['running'],
  displayContext: 'Coaching page as a quick reference. Show zone name, color, and pace range.',
};

// ---------------------------------------------------------------------------
// Training Effect (src/engine/trainingEffect.ts)
// ---------------------------------------------------------------------------

const aerobicTE: MetricExplanation = {
  id: 'aerobicTE',
  shortLabel: m.exp_aerobicTE_shortLabel(),
  friendlyName: m.exp_aerobicTE_friendlyName(),
  name: m.exp_aerobicTE_name(),
  oneLiner: m.exp_aerobicTE_oneLiner(),
  fullExplanation: m.exp_aerobicTE_fullExplanation(),
  formula:
    'For each record: TRIMP += dt × HRR × a × exp(b × HRR). trimpRef = 60 × LT_HRR × a × exp(b × LT_HRR). TE = clamp(3.0 × (TRIMP / (trimpRef × fitnessScale))^0.25, 0, 5)',
  analogy: m.exp_aerobicTE_analogy(),
  whyItMatters: m.exp_aerobicTE_whyItMatters(),
  range: m.exp_aerobicTE_range(),
  limitations: m.exp_aerobicTE_limitations(),
  sports: ['all'],
  displayContext:
    'Session detail view as a gauge dial alongside Anaerobic TE. Only shown for sessions with HR data.',
};

const anaerobicTE: MetricExplanation = {
  id: 'anaerobicTE',
  shortLabel: m.exp_anaerobicTE_shortLabel(),
  friendlyName: m.exp_anaerobicTE_friendlyName(),
  name: m.exp_anaerobicTE_name(),
  oneLiner: m.exp_anaerobicTE_oneLiner(),
  fullExplanation: m.exp_anaerobicTE_fullExplanation(),
  formula:
    'For each record with HRR > 0.90: impulse += dt × (HRR − 0.90) / (1.0 − 0.90). TE = clamp(3.0 × impulse / (6.0 × fitnessScale), 0, 5)',
  analogy: m.exp_anaerobicTE_analogy(),
  whyItMatters: m.exp_anaerobicTE_whyItMatters(),
  range: m.exp_anaerobicTE_range(),
  limitations: m.exp_anaerobicTE_limitations(),
  sports: ['all'],
  displayContext:
    'Session detail view as a gauge dial alongside Aerobic TE. Only shown for sessions with HR data.',
};

// ---------------------------------------------------------------------------
// Session stats (src/features/sessions/session/SessionStatsGrid.tsx)
// ---------------------------------------------------------------------------

const avgHr: MetricExplanation = {
  id: 'avgHr',
  shortLabel: m.exp_avgHr_shortLabel(),
  friendlyName: m.exp_avgHr_friendlyName(),
  name: m.exp_avgHr_name(),
  oneLiner: m.exp_avgHr_oneLiner(),
  fullExplanation: m.exp_avgHr_fullExplanation(),
  analogy: m.exp_avgHr_analogy(),
  whyItMatters: m.exp_avgHr_whyItMatters(),
  range: m.exp_avgHr_range(),
  limitations: m.exp_avgHr_limitations(),
  unit: 'bpm',
  sports: ['all'],
  displayContext: 'Session detail stats grid. Always shown when HR data is available.',
};

const avgPace: MetricExplanation = {
  id: 'avgPace',
  shortLabel: m.exp_avgPace_shortLabel(),
  friendlyName: m.exp_avgPace_friendlyName(),
  name: m.exp_avgPace_name(),
  oneLiner: m.exp_avgPace_oneLiner(),
  fullExplanation: m.exp_avgPace_fullExplanation(),
  analogy: m.exp_avgPace_analogy(),
  whyItMatters: m.exp_avgPace_whyItMatters(),
  range: m.exp_avgPace_range(),
  limitations: m.exp_avgPace_limitations(),
  unit: 'min/km',
  sports: ['running', 'swimming'],
  displayContext: 'Session detail stats grid for running and swimming sessions.',
};

const avgSpeed: MetricExplanation = {
  id: 'avgSpeed',
  shortLabel: m.exp_avgSpeed_shortLabel(),
  friendlyName: m.exp_avgSpeed_friendlyName(),
  name: m.exp_avgSpeed_name(),
  oneLiner: m.exp_avgSpeed_oneLiner(),
  fullExplanation: m.exp_avgSpeed_fullExplanation(),
  analogy: m.exp_avgSpeed_analogy(),
  whyItMatters: m.exp_avgSpeed_whyItMatters(),
  range: m.exp_avgSpeed_range(),
  limitations: m.exp_avgSpeed_limitations(),
  unit: 'km/h',
  sports: ['cycling'],
  displayContext: 'Session detail stats grid for cycling sessions.',
};

const avgPower: MetricExplanation = {
  id: 'avgPower',
  shortLabel: m.exp_avgPower_shortLabel(),
  friendlyName: m.exp_avgPower_friendlyName(),
  name: m.exp_avgPower_name(),
  oneLiner: m.exp_avgPower_oneLiner(),
  fullExplanation: m.exp_avgPower_fullExplanation(),
  analogy: m.exp_avgPower_analogy(),
  whyItMatters: m.exp_avgPower_whyItMatters(),
  range: m.exp_avgPower_range(),
  limitations: m.exp_avgPower_limitations(),
  unit: 'W',
  sports: ['cycling'],
  displayContext:
    'Session detail stats grid for cycling sessions with power data. Shown as subDetail when Normalized Power is available.',
};

const elevation: MetricExplanation = {
  id: 'elevation',
  shortLabel: m.exp_elevation_shortLabel(),
  friendlyName: m.exp_elevation_friendlyName(),
  name: m.exp_elevation_name(),
  oneLiner: m.exp_elevation_oneLiner(),
  fullExplanation: m.exp_elevation_fullExplanation(),
  analogy: m.exp_elevation_analogy(),
  whyItMatters: m.exp_elevation_whyItMatters(),
  range: m.exp_elevation_range(),
  limitations: m.exp_elevation_limitations(),
  unit: 'm',
  sports: ['all'],
  displayContext:
    'Session detail stats grid. Shows gain/loss as primary value with altitude range as subDetail.',
};

const cadence: MetricExplanation = {
  id: 'cadence',
  shortLabel: m.exp_cadence_shortLabel(),
  friendlyName: m.exp_cadence_friendlyName(),
  name: m.exp_cadence_name(),
  oneLiner: m.exp_cadence_oneLiner(),
  fullExplanation: m.exp_cadence_fullExplanation(),
  analogy: m.exp_cadence_analogy(),
  whyItMatters: m.exp_cadence_whyItMatters(),
  range: m.exp_cadence_range(),
  limitations: m.exp_cadence_limitations(),
  unit: 'rpm',
  sports: ['all'],
  displayContext: 'Session detail stats grid when cadence data is available.',
};

// ---------------------------------------------------------------------------
// VDOT (src/engine/vdot.ts)
// ---------------------------------------------------------------------------

const vdot: MetricExplanation = {
  id: 'vdot',
  shortLabel: m.exp_vdot_shortLabel(),
  friendlyName: m.exp_vdot_friendlyName(),
  name: m.exp_vdot_name(),
  oneLiner: m.exp_vdot_oneLiner(),
  fullExplanation: m.exp_vdot_fullExplanation(),
  analogy: m.exp_vdot_analogy(),
  whyItMatters: m.exp_vdot_whyItMatters(),
  range: m.exp_vdot_range(),
  limitations: m.exp_vdot_limitations(),
  sports: ['running'],
  displayContext: 'Race predictor tool on the coaching page. Shown alongside predicted race times.',
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const METRIC_EXPLANATIONS: Record<MetricId, MetricExplanation> = {
  // Stress metrics
  tss,
  trimp,
  duration,
  // Load metrics
  ctl,
  atl,
  tsb,
  acwr,
  // Normalized metrics
  normalizedPower,
  gradeAdjustedPace,
  // Session analysis
  recovery,
  pacingTrend,
  // Training zones
  trainingZones,
  // Training Effect
  aerobicTE,
  anaerobicTE,
  // Session stats
  avgHr,
  avgPace,
  avgSpeed,
  avgPower,
  elevation,
  cadence,
  // VDOT
  vdot,
};

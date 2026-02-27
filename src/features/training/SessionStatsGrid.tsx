import { useMemo } from "react";
import { Card } from "../../components/ui/Card.tsx";
import { CardGrid } from "../../components/ui/CardGrid.tsx";
import { StatItem } from "../../components/ui/StatItem.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import {
  cn,
  formatDuration,
  formatDistance,
  formatPace,
  formatSpeed,
} from "../../lib/utils.ts";
import { METRIC_EXPLANATIONS } from "../../lib/explanations.ts";
import {
  detectIntervals,
  detectProgressiveOverload,
} from "../../engine/laps.ts";
import type { TrainingSession, SessionLap } from "../../types/index.ts";

interface SessionStatsGridProps {
  session: TrainingSession;
  laps: SessionLap[];
}

const TREND_META = {
  stable: {
    label: "Stable",
    className: "text-text-secondary",
  },
  fading: {
    label: "Fading",
    className: "text-status-warning",
  },
  building: {
    label: "Building",
    className: "text-status-success",
  },
} as const;

export const SessionStatsGrid = (props: SessionStatsGridProps) => {
  const intervals = useMemo(
    () => detectIntervals(props.laps),
    [props.laps],
  );
  const overload = useMemo(
    () => detectProgressiveOverload(props.laps),
    [props.laps],
  );

  const intervalPairsWithHr = intervals.filter(
    (p) => p.hrRecovery !== undefined,
  );
  const avgRecovery =
    intervalPairsWithHr.length > 0
      ? intervalPairsWithHr.reduce((sum, p) => sum + p.hrRecovery!, 0) /
        intervalPairsWithHr.length
      : 0;

  const recoveryMeta =
    avgRecovery > 25
      ? { label: "Strong recovery", className: "text-status-success" }
      : avgRecovery >= 15
        ? { label: "Adequate recovery", className: "text-text-secondary" }
        : { label: "Slow recovery", className: "text-status-warning" };

  const stats: Array<{
    key: string;
    label: string;
    value: React.ReactNode;
    unit?: string;
    metricId?: import("../../lib/explanations.ts").MetricId;
    subDetail?: React.ReactNode;
  }> = [];

  // Row 1: Duration & Distance (always present)
  stats.push({
    key: "duration",
    label: "Duration",
    value: formatDuration(props.session.duration),
  });

  stats.push({
    key: "distance",
    label: "Distance",
    value: formatDistance(props.session.distance),
  });

  // Row 2: Stress Score & Avg HR
  stats.push({
    key: "tss",
    label: METRIC_EXPLANATIONS[props.session.stressMethod].friendlyName,
    value: props.session.tss.toFixed(0),
    metricId: props.session.stressMethod,
  });

  stats.push({
    key: "avgHr",
    label: "Avg HR",
    value: props.session.avgHr ?? "--",
    unit: props.session.avgHr ? "bpm" : undefined,
  });

  // Row 3: Avg Pace (running) & Avg Speed
  if (props.session.avgPace) {
    stats.push({
      key: "avgPace",
      label: "Avg Pace",
      value: formatPace(props.session.avgPace),
    });
  }

  if (props.session.avgSpeed ?? (props.session.distance > 0 && props.session.duration > 0)) {
    stats.push({
      key: "avgSpeed",
      label: "Avg Speed",
      value: formatSpeed(props.session.avgSpeed ?? props.session.distance / props.session.duration),
    });
  }

  // Row 4: Avg Power & Normalized Power
  if (props.session.avgPower) {
    stats.push({
      key: "avgPower",
      label: "Avg Power",
      value: props.session.avgPower,
      unit: "W",
    });
  }

  if (props.session.normalizedPower) {
    stats.push({
      key: "np",
      label: "Norm. Power",
      value: props.session.normalizedPower,
      unit: "W",
      metricId: "normalizedPower",
    });
  }

  // Row 5: Elevation & Cadence
  if (
    props.session.elevationGain !== undefined &&
    props.session.elevationGain > 0
  ) {
    stats.push({
      key: "elevation",
      label: "Elevation",
      value: `+${props.session.elevationGain}`,
      unit: "m",
      subDetail:
        props.session.elevationLoss !== undefined &&
        props.session.elevationLoss > 0 ? (
          <Typography variant="caption" as="p">
            -{props.session.elevationLoss}m
          </Typography>
        ) : undefined,
    });
  }

  if (props.session.avgCadence) {
    stats.push({
      key: "cadence",
      label: "Cadence",
      value: props.session.avgCadence,
      unit: "rpm",
    });
  }

  // Row 6: Altitude & Pacing Trend
  if (props.session.minAltitude !== undefined) {
    stats.push({
      key: "altitude",
      label: "Altitude",
      value: `${Math.round(props.session.minAltitude)} — ${Math.round(props.session.maxAltitude!)}`,
      unit: "m",
      subDetail: (
        <Typography variant="caption" as="p">
          avg {Math.round(props.session.avgAltitude!)}m
        </Typography>
      ),
    });
  }

  if (overload.lapCount >= 3) {
    const trend = TREND_META[overload.trend];
    stats.push({
      key: "pacingTrend",
      label: "Pacing Trend",
      value:
        overload.paceDriftPercent !== undefined
          ? `${overload.paceDriftPercent > 0 ? "+" : ""}${overload.paceDriftPercent}% drift`
          : trend.label,
      metricId: "pacingTrend",
      subDetail: (
        <Typography
          variant="caption"
          as="p"
          className={trend.className}
        >
          {trend.label}
        </Typography>
      ),
    });
  }

  // Row 7: Recovery & Calories
  if (intervalPairsWithHr.length > 0) {
    stats.push({
      key: "recovery",
      label: "Recovery",
      value: `${Math.round(avgRecovery)} bpm`,
      metricId: "recovery",
      subDetail: (
        <Typography
          variant="caption"
          as="p"
          className={recoveryMeta.className}
        >
          {recoveryMeta.label}
        </Typography>
      ),
    });
  }

  if (props.session.calories) {
    stats.push({
      key: "calories",
      label: "Calories",
      value: props.session.calories,
      unit: "kcal",
    });
  }

  const hasWarnings = props.session.sensorWarnings.length > 0;

  return (
    <Card>
      <CardGrid collapsedRows={2} title="Stats">
        {stats.map((stat) => (
          <StatItem
            key={stat.key}
            label={stat.label}
            value={stat.value}
            unit={stat.unit}
            metricId={stat.metricId}
            subDetail={stat.subDetail}
          />
        ))}
      </CardGrid>

      {hasWarnings && (
        <div className={cn("border-t border-white/10", "mt-4 pt-4")}>
          <Typography
            variant="overline"
            as="h3"
            color="warning"
            className="mb-2"
          >
            Sensor Warnings
          </Typography>
          {props.session.sensorWarnings.map((w, i) => (
            <Typography
              key={i}
              variant="body"
              className="text-status-warning/80 mt-1"
            >
              {w}
            </Typography>
          ))}
        </div>
      )}
    </Card>
  );
};

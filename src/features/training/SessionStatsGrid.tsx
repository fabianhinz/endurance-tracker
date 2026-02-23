import { useMemo } from "react";
import { useSessionsStore } from "../../store/sessions.ts";
import { Card } from "../../components/ui/Card.tsx";
import { CardHeader } from "../../components/ui/CardHeader.tsx";
import { StatItem } from "../../components/ui/StatItem.tsx";
import { PbChip } from "../../components/ui/PbChip.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { cn } from "../../lib/utils.ts";
import { formatPace } from "../../lib/utils.ts";
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
  const personalBests = useSessionsStore((s) => s.personalBests);

  const sessionPBs = useMemo(
    () =>
      personalBests.filter((pb) => pb.sessionId === props.session.id),
    [personalBests, props.session.id],
  );

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
    metricId?: import("../../engine/explanations.ts").MetricId;
    subDetail?: React.ReactNode;
  }> = [];

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

  if (props.session.avgPace) {
    stats.push({
      key: "avgPace",
      label: "Avg Pace",
      value: formatPace(props.session.avgPace),
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

  if (props.session.calories) {
    stats.push({
      key: "calories",
      label: "Calories",
      value: props.session.calories,
      unit: "kcal",
    });
  }

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

  const hasStats = stats.length > 0;
  const hasPBs = sessionPBs.length > 0;
  const hasWarnings = props.session.sensorWarnings.length > 0;

  if (!hasStats && !hasPBs && !hasWarnings) return null;

  return (
    <Card>
      {hasStats && (
        <>
          <CardHeader title="Details" />
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div key={stat.key} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <StatItem
                  label={stat.label}
                  value={stat.value}
                  unit={stat.unit}
                  metricId={stat.metricId}
                  subDetail={stat.subDetail}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {hasPBs && (
        <>
          <div
            className={cn(
              "border-t border-white/10",
              hasStats ? "mt-4 pt-4" : "",
            )}
          >
            <Typography variant="overline" as="h3" className="mb-2">
              Personal Bests
            </Typography>
            <div className="flex flex-wrap gap-2">
              {sessionPBs.map((pb, idx) => (
                <PbChip key={idx} pb={pb} />
              ))}
            </div>
          </div>
        </>
      )}

      {hasWarnings && (
        <div
          className={cn(
            "border-t border-white/10",
            hasStats || hasPBs ? "mt-4 pt-4" : "",
          )}
        >
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

import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceArea,
} from "recharts";
import { useSessionsStore } from "../../store/sessions.ts";
import { getSessionRecords, getSessionLaps } from "../../lib/indexeddb.ts";
import { Button } from "../../components/ui/Button.tsx";
import { MetricCard } from "../../components/ui/MetricCard.tsx";
import { ChartCard } from "../../components/ui/ChartCard.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { PageGrid } from "../../components/ui/PageGrid.tsx";
import {
  formatDate,
  formatDuration,
  formatDistance,
  formatPace,
  formatSubSport,
} from "../../lib/utils.ts";
import { cn } from "../../lib/utils.ts";
import { useChartZoom } from "../../lib/use-chart-zoom.ts";
import { chartTheme } from "../../lib/chart-theme.ts";
import { tokens } from "../../lib/tokens.ts";
import { SportChip } from "../../components/ui/SportChip.tsx";
import {
  detectIntervals,
  detectProgressiveOverload,
} from "../../engine/laps.ts";
import { LapSplitsSection } from "./LapSplitsSection.tsx";
import { SessionPersonalBests } from "./SessionPersonalBests.tsx";
import type { SessionRecord, SessionLap } from "../../types/index.ts";
import { METRIC_EXPLANATIONS } from "../../engine/explanations.ts";

export const SessionDetailPage = () => {
  const params = useParams<{ id: string }>();
  const sessions = useSessionsStore((s) => s.sessions);
  const session = sessions.find((s) => s.id === params.id);
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [laps, setLaps] = useState<SessionLap[]>([]);
  const [showGrade, setShowGrade] = useState(false);

  useEffect(() => {
    if (params.id && session?.hasDetailedRecords) {
      getSessionRecords(params.id).then(setRecords);
      getSessionLaps(params.id).then(setLaps);
    }
  }, [params.id, session?.hasDetailedRecords]);

  // Downsample records for chart (every 10th point)
  const chartData = useMemo(
    () =>
      records
        .filter((_, i) => i % 10 === 0)
        .map((r) => ({
          time: Math.round((r.timestamp / 60) * 100) / 100,
          hr: r.hr,
          power: r.power,
          speed: r.speed ? Math.round(r.speed * 3.6 * 10) / 10 : undefined,
          grade:
            r.grade !== undefined ? Math.round(r.grade * 10) / 10 : undefined,
        })),
    [records],
  );

  const hasGradeData = chartData.some((d) => d.grade !== undefined);

  const intervals = useMemo(() => detectIntervals(laps), [laps]);
  const overload = useMemo(() => detectProgressiveOverload(laps), [laps]);

  const zoom = useChartZoom({ data: chartData, xKey: "time" });

  if (!session) {
    return (
      <Typography variant="body" color="tertiary">
        Session not found.
      </Typography>
    );
  }

  const subSportLabel =
    session.subSport && session.subSport !== "generic"
      ? formatSubSport(session.subSport)
      : null;

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

  const trendMeta = {
    stable: {
      label: "Stable",
      description: "Consistent pacing across laps",
      className: "text-text-secondary",
    },
    fading: {
      label: "Fading",
      description: "Pace slowing — normal fatigue",
      className: "text-status-warning",
    },
    building: {
      label: "Building",
      description: "Pace improving — progressive effort",
      className: "text-status-success",
    },
  } as const;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="flex justify-center flex-col">
          <Typography variant="h2" as="h1">
            {session.name ?? formatDate(session.date)}
          </Typography>
          {session.name && (
            <Typography variant="caption" color="tertiary">
              {formatDate(session.date)}
            </Typography>
          )}
        </div>
        <div className="flex flex-grow justify-end flex-wrap gap-3">
          <SportChip sport={session.sport} />
          {subSportLabel && (
            <Typography
              variant="caption"
              color="quaternary"
              className="rounded-md bg-white/10 px-2 py-0.5"
            >
              {subSportLabel}
            </Typography>
          )}
        </div>
      </div>

      <PageGrid>
        <MetricCard
          label="Duration"
          subtitle="Total elapsed time"
          size="lg"
          value={formatDuration(session.duration)}
          subDetail={
            session.movingTime !== undefined &&
            session.movingTime !== session.duration ? (
              <div className="space-y-0.5">
                <Typography variant="caption" as="p">
                  Moving: {formatDuration(session.movingTime)}
                </Typography>
                <Typography variant="caption" as="p">
                  Stopped:{" "}
                  {formatDuration(session.duration - session.movingTime)}
                </Typography>
              </div>
            ) : undefined
          }
        />
        <MetricCard
          label="Distance"
          subtitle="Total distance covered"
          size="lg"
          value={formatDistance(session.distance)}
        />
        <MetricCard
          label={METRIC_EXPLANATIONS[session.stressMethod].friendlyName}
          subtitle=""
          metricId={session.stressMethod}
          size="lg"
          value={session.tss.toFixed(0)}
        />
        {session.avgHr && (
          <MetricCard
            label="Avg HR"
            subtitle="Average heart rate"
            size="lg"
            value={session.avgHr}
            unit="bpm"
          />
        )}
        {session.avgPower && (
          <MetricCard
            label="Avg Power"
            subtitle="Mean power output"
            value={session.avgPower}
            unit="W"
          />
        )}
        {session.normalizedPower && (
          <MetricCard
            label={METRIC_EXPLANATIONS.normalizedPower.shortLabel}
            subtitle=""
            metricId="normalizedPower"
            value={session.normalizedPower}
            unit="W"
          />
        )}
        {session.avgPace && (
          <MetricCard
            label="Avg Pace"
            subtitle="Average speed as min/km"
            value={formatPace(session.avgPace)}
          />
        )}
        {session.elevationGain !== undefined && session.elevationGain > 0 && (
          <MetricCard
            label="Elevation"
            subtitle="Cumulative climb and descent"
            value={
              <span className="flex items-baseline gap-3">
                <span>+{session.elevationGain}m</span>
                {session.elevationLoss !== undefined &&
                  session.elevationLoss > 0 && (
                    <span className="text-text-tertiary">
                      -{session.elevationLoss}m
                    </span>
                  )}
              </span>
            }
          />
        )}
        {session.avgCadence && (
          <MetricCard
            label="Cadence"
            subtitle="Average steps or revolutions per minute"
            value={session.avgCadence}
            unit="rpm"
          />
        )}
        {session.calories && (
          <MetricCard
            label="Calories"
            subtitle="Estimated energy expenditure"
            value={session.calories}
            unit="kcal"
          />
        )}
        {session.minAltitude !== undefined && (
          <MetricCard
            label="Altitude"
            subtitle="Elevation range during the session"
            value={
              <span
                className="flex flex-wrap items-baseline gap-4 text-sm"
                aria-label={`Altitude statistics: minimum ${Math.round(session.minAltitude)} meters, average ${Math.round(session.avgAltitude!)} meters, maximum ${Math.round(session.maxAltitude!)} meters`}
              >
                <span>
                  <span className="font-bold">
                    {Math.round(session.minAltitude)}m
                  </span>
                  <Typography variant="caption" className="ml-1 font-normal">
                    min
                  </Typography>
                </span>
                <span>
                  <span className="font-bold">
                    {Math.round(session.avgAltitude!)}m
                  </span>
                  <Typography variant="caption" className="ml-1 font-normal">
                    avg
                  </Typography>
                </span>
                <span>
                  <span className="font-bold">
                    {Math.round(session.maxAltitude!)}m
                  </span>
                  <Typography variant="caption" className="ml-1 font-normal">
                    max
                  </Typography>
                </span>
              </span>
            }
          />
        )}
        {intervalPairsWithHr.length > 0 && (
          <MetricCard
            label="Recovery"
            subtitle=""
            metricId="recovery"
            value={`${Math.round(avgRecovery)} bpm`}
            subDetail={
              <Typography
                variant="caption"
                as="p"
                className={cn("font-medium", recoveryMeta.className)}
              >
                {recoveryMeta.label}
              </Typography>
            }
          />
        )}
        {overload.lapCount >= 3 && (
          <MetricCard
            label="Pacing Trend"
            subtitle=""
            metricId="pacingTrend"
            value={
              overload.paceDriftPercent !== undefined
                ? `${overload.paceDriftPercent > 0 ? "+" : ""}${overload.paceDriftPercent}% drift`
                : trendMeta[overload.trend].label
            }
            subDetail={
              <Typography
                variant="caption"
                as="p"
                className={cn(
                  "font-medium",
                  trendMeta[overload.trend].className,
                )}
              >
                {trendMeta[overload.trend].label}
              </Typography>
            }
          />
        )}
        <div className="md:col-span-2">
          <SessionPersonalBests sessionId={params.id!} />
        </div>

        {session.sensorWarnings.length > 0 && (
          <div className="md:col-span-2 rounded-lg bg-status-warning-muted border border-status-warning-strong/20 p-4">
            <Typography variant="emphasis" color="warning">
              Sensor Warnings
            </Typography>
            {session.sensorWarnings.map((w, i) => (
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

        {laps.length > 0 && (
          <div className="md:col-span-2">
            <LapSplitsSection laps={laps} sport={session.sport} />
          </div>
        )}

        {chartData.length > 0 && (
          <div className="md:col-span-2">
            <ChartCard
              title="Performance"
              subtitle="Heart rate, power, and speed over time"
              actions={
                hasGradeData ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowGrade((v) => !v)}
                    aria-pressed={showGrade}
                    aria-label="Toggle grade overlay on chart"
                    className={cn(
                      "px-2 py-1 text-xs",
                      showGrade
                        ? "bg-chart-grade/20 text-chart-grade"
                        : "bg-white/5 text-text-quaternary hover:text-text-tertiary",
                    )}
                  >
                    Grade %
                  </Button>
                ) : undefined
              }
              minHeight="h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={zoom.zoomedData}
                  onMouseDown={zoom.onMouseDown}
                  onMouseMove={zoom.onMouseMove}
                  onMouseUp={zoom.onMouseUp}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartTheme.grid.stroke}
                  />
                  <XAxis
                    dataKey="time"
                    tick={chartTheme.tick}
                    tickLine={false}
                    axisLine={chartTheme.axisLine}
                    tickFormatter={(v: number) => `${Math.round(v)} min`}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={chartTheme.tick}
                    tickLine={false}
                    axisLine={false}
                  />
                  <RechartsTooltip
                    contentStyle={chartTheme.tooltip.contentStyle}
                    labelStyle={chartTheme.tooltip.labelStyle}
                    isAnimationActive={chartTheme.tooltip.isAnimationActive}
                    labelFormatter={(v) => `${Math.round(Number(v))} min`}
                  />
                  {chartData.some((d) => d.hr) && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="hr"
                      stroke={tokens.chartHr}
                      strokeWidth={1.5}
                      dot={false}
                      name="HR (bpm)"
                    />
                  )}
                  {chartData.some((d) => d.power) && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="power"
                      stroke={tokens.chartPower}
                      strokeWidth={1.5}
                      dot={false}
                      name="Power (W)"
                    />
                  )}
                  {chartData.some((d) => d.speed) && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="speed"
                      stroke={tokens.chartSpeed}
                      strokeWidth={1.5}
                      dot={false}
                      name="Speed (km/h)"
                    />
                  )}
                  {showGrade && (
                    <>
                      <YAxis
                        yAxisId="grade"
                        orientation="right"
                        tick={chartTheme.tick}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `${v}%`}
                        domain={["auto", "auto"]}
                      />
                      <Line
                        yAxisId="grade"
                        type="monotone"
                        dataKey="grade"
                        stroke={tokens.chartGrade}
                        strokeWidth={1}
                        strokeDasharray="4 2"
                        dot={false}
                        name="Grade (%)"
                      />
                    </>
                  )}
                  {zoom.refAreaLeft && zoom.refAreaRight && (
                    <ReferenceArea
                      yAxisId="left"
                      x1={zoom.refAreaLeft}
                      x2={zoom.refAreaRight}
                      strokeOpacity={0.3}
                      fill={tokens.accent}
                      fillOpacity={0.15}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}
      </PageGrid>
    </div>
  );
};

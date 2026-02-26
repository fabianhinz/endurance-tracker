import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ReferenceArea,
} from "recharts";
import { useFilteredMetrics } from "../../hooks/useFilteredMetrics.ts";
import { ChartPreviewCard } from "../../components/ui/ChartPreviewCard.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { MetricLabel } from "../../components/ui/MetricLabel.tsx";
import { useChartZoom } from "../../lib/use-chart-zoom.ts";
import { chartTheme } from "../../lib/chart-theme.ts";
import { tokens } from "../../lib/tokens.ts";
import { METRIC_EXPLANATIONS } from "../../engine/explanations.ts";
import { rangeMap } from "../../lib/time-range.ts";
import type { TimeRange } from "../../lib/time-range.ts";
import { useDashboardChartZoom } from "./hooks/useDashboardChartZoom.ts";

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const WeeklyLoadChart = () => {
  const metrics = useFilteredMetrics();
  const dashboardZoom = useDashboardChartZoom();

  const chartData = useMemo(() => {
    if (dashboardZoom.range === "custom" && dashboardZoom.customRange) {
      return metrics.history
        .filter((d) => d.date >= dashboardZoom.customRange!.from && d.date <= dashboardZoom.customRange!.to)
        .map((d) => ({ date: d.date, tss: d.tss }));
    }
    const days = rangeMap[dashboardZoom.range as Exclude<TimeRange, "custom">];
    const sliced = days === Infinity ? metrics.history : metrics.history.slice(-days);
    return sliced.map((d) => ({
      date: d.date,
      tss: d.tss,
    }));
  }, [metrics.history, dashboardZoom.range, dashboardZoom.customRange]);

  const zoom = useChartZoom({ data: chartData, xKey: "date", onZoomComplete: dashboardZoom.onZoomComplete, onZoomReset: dashboardZoom.onZoomReset });

  const tickFormatter = (v: string) => {
    const d = new Date(v);
    if (dashboardZoom.range === "7d") {
      return dayLabels[(d.getDay() + 6) % 7];
    }
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <ChartPreviewCard
      title=""
      titleSlot={
        <div className="flex items-center gap-1 flex-1">
          <Typography variant="overline" as="h3">{METRIC_EXPLANATIONS.tss.friendlyName}</Typography>
          <MetricLabel metricId="tss" size="sm" />
        </div>
      }
      subtitle={METRIC_EXPLANATIONS.tss.oneLiner}
      compactHeight="h-64"
    >
      {(mode) => {
        const compact = mode === "compact";
        return chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              syncId={compact ? "dashboard" : undefined}
              data={zoom.zoomedData}
              onMouseDown={zoom.onMouseDown}
              onMouseMove={zoom.onMouseMove}
              onMouseUp={zoom.onMouseUp}
            >
              {!compact && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartTheme.grid.stroke}
                  vertical={false}
                />
              )}
              <XAxis
                dataKey="date"
                ticks={compact ? [zoom.zoomedData[0]?.date, zoom.zoomedData[zoom.zoomedData.length - 1]?.date].filter(Boolean) as string[] : undefined}
                tick={chartTheme.tick}
                tickLine={false}
                axisLine={chartTheme.axisLine}
                tickFormatter={tickFormatter}
              />
              <YAxis
                tick={chartTheme.tick}
                tickLine={false}
                axisLine={false}
                width={40}
                tickCount={compact ? 3 : undefined}
              />
              <RechartsTooltip
                contentStyle={chartTheme.tooltip.contentStyle}
                labelStyle={chartTheme.tooltip.labelStyle}
                isAnimationActive={chartTheme.tooltip.isAnimationActive}
                cursor={{ fill: `${tokens.accent}14` }}
              />
              <Bar
                dataKey="tss"
                fill={tokens.chartLoad}
                radius={[4, 4, 0, 0]}
                name="TSS"
              />
              {zoom.refAreaLeft && zoom.refAreaRight && (
                <ReferenceArea
                  x1={zoom.refAreaLeft}
                  x2={zoom.refAreaRight}
                  strokeOpacity={0.3}
                  fill={tokens.accent}
                  fillOpacity={0.15}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        ) : null;
      }}
    </ChartPreviewCard>
  );
};

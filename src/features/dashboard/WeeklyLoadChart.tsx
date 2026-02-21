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
import { ChartCard } from "../../components/ui/ChartCard.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { MetricLabel } from "../../components/ui/MetricLabel.tsx";
import { useChartZoom } from "../../lib/use-chart-zoom.ts";
import { chartTheme } from "../../lib/chart-theme.ts";
import { tokens } from "../../lib/tokens.ts";
import { METRIC_EXPLANATIONS } from "../../engine/explanations.ts";
import { type TimeRange, rangeMap } from "../../lib/time-range.ts";

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface WeeklyLoadChartProps {
  range: TimeRange;
  customRange?: { from: string; to: string } | null;
  onZoomComplete?: (from: string | number, to: string | number) => void;
  onZoomReset?: () => void;
}

export const WeeklyLoadChart = (props: WeeklyLoadChartProps) => {
  const metrics = useFilteredMetrics();

  const chartData = useMemo(() => {
    if (props.range === "custom" && props.customRange) {
      return metrics.history
        .filter((d) => d.date >= props.customRange!.from && d.date <= props.customRange!.to)
        .map((d) => ({ date: d.date, tss: d.tss }));
    }
    const days = rangeMap[props.range as Exclude<TimeRange, "custom">];
    const sliced = days === Infinity ? metrics.history : metrics.history.slice(-days);
    return sliced.map((d) => ({
      date: d.date,
      tss: d.tss,
    }));
  }, [metrics.history, props.range, props.customRange]);

  const zoom = useChartZoom({ data: chartData, xKey: "date", onZoomComplete: props.onZoomComplete, onZoomReset: props.onZoomReset });

  const tickFormatter = (v: string) => {
    const d = new Date(v);
    if (props.range === "7d") {
      return dayLabels[(d.getDay() + 6) % 7];
    }
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <ChartCard
      titleSlot={
        <div className="flex items-center gap-1">
          <Typography variant="overline" as="h3">{METRIC_EXPLANATIONS.tss.friendlyName}</Typography>
          <MetricLabel metricId="tss" size="sm" />
        </div>
      }
      title=""
      subtitle={METRIC_EXPLANATIONS.tss.oneLiner}
      minHeight="h-64"
      minWidth="min-w-[280px]"
    >
      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={zoom.zoomedData}
            onMouseDown={zoom.onMouseDown}
            onMouseMove={zoom.onMouseMove}
            onMouseUp={zoom.onMouseUp}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={chartTheme.grid.stroke}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={chartTheme.tick}
              tickLine={false}
              axisLine={chartTheme.axisLine}
              tickFormatter={tickFormatter}
            />
            <YAxis
              tick={chartTheme.tick}
              tickLine={false}
              axisLine={false}
              width={30}
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
      )}
    </ChartCard>
  );
};

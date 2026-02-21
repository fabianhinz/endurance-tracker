import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceArea,
} from "recharts";
import { useFilteredMetrics } from "../../hooks/useFilteredMetrics.ts";
import { ChartCard } from "../../components/ui/ChartCard.tsx";
import { MetricLabel } from "../../components/ui/MetricLabel.tsx";
import { useChartZoom } from "../../lib/use-chart-zoom.ts";
import { chartTheme } from "../../lib/chart-theme.ts";
import { tokens } from "../../lib/tokens.ts";
import { type TimeRange, rangeMap } from "../../lib/time-range.ts";

interface MetricsChartProps {
  range: TimeRange;
  customRange?: { from: string; to: string } | null;
  onZoomComplete?: (from: string | number, to: string | number) => void;
  onZoomReset?: () => void;
}

export const MetricsChart = (props: MetricsChartProps) => {
  const metrics = useFilteredMetrics();

  const filtered = useMemo(() => {
    if (props.range === "custom" && props.customRange) {
      return metrics.history.filter(
        (d) => d.date >= props.customRange!.from && d.date <= props.customRange!.to,
      );
    }
    const days = rangeMap[props.range as Exclude<TimeRange, "custom">];
    if (days === Infinity) return metrics.history;
    return metrics.history.slice(-days);
  }, [metrics.history, props.range, props.customRange]);

  const zoom = useChartZoom({ data: filtered, xKey: "date", onZoomComplete: props.onZoomComplete, onZoomReset: props.onZoomReset });

  return (
    <ChartCard
      title="Performance Metrics"
      subtitle="Long-term fitness, fatigue, and readiness trends"
      footer={
        <div className="mt-2 flex items-center justify-center gap-6 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-sm bg-chart-fitness" />
            <MetricLabel metricId="ctl" size="sm" />
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-sm bg-chart-fatigue" />
            <MetricLabel metricId="atl" size="sm" />
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-sm bg-chart-form" />
            <MetricLabel metricId="tsb" size="sm" />
          </span>
        </div>
      }
    >
      {filtered.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
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
              dataKey="date"
              tick={chartTheme.tick}
              tickLine={false}
              axisLine={chartTheme.axisLine}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
            />
            <YAxis
              tick={chartTheme.tick}
              tickLine={false}
              axisLine={chartTheme.axisLine}
            />
            <RechartsTooltip
              contentStyle={chartTheme.tooltip.contentStyle}
              labelStyle={chartTheme.tooltip.labelStyle}
              isAnimationActive={chartTheme.tooltip.isAnimationActive}
            />
            <Area
              type="monotone"
              dataKey="tsb"
              fill={tokens.chartForm}
              fillOpacity={0.1}
              stroke="none"
              tooltipType="none"
            />
            <Line
              type="monotone"
              dataKey="ctl"
              stroke={tokens.chartFitness}
              strokeWidth={2}
              dot={false}
              name="Fitness (CTL)"
            />
            <Line
              type="monotone"
              dataKey="atl"
              stroke={tokens.chartFatigue}
              strokeWidth={2}
              dot={false}
              name="Fatigue (ATL)"
            />
            <Line
              type="monotone"
              dataKey="tsb"
              stroke={tokens.chartForm}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              name="Form (TSB)"
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
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
};

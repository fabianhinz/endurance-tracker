import { useMemo } from 'react';
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
} from 'recharts';
import { useFilteredMetrics } from './hooks/useFilteredMetrics.ts';
import { ChartPreviewCard } from '@/components/ui/ChartPreviewCard.tsx';
import { MetricLabel } from '@/components/ui/MetricLabel.tsx';
import { useChartZoom } from '@/lib/hooks/useChartZoom.ts';
import { chartTheme, formatChartDate } from '@/lib/chartTheme.ts';
import { tokens } from '@/lib/tokens.ts';
import { rangeMap } from '@/lib/timeRange.ts';
import type { TimeRange } from '@/lib/timeRange.ts';
import { useDashboardChartZoom } from './hooks/useDashboardChartZoom.ts';
import { m } from '@/paraglide/messages.js';

export const PerformanceChart = () => {
  const metrics = useFilteredMetrics();
  const dashboardZoom = useDashboardChartZoom();

  const filtered = useMemo(() => {
    if (dashboardZoom.range === 'custom' && dashboardZoom.customRange) {
      const range = dashboardZoom.customRange;
      return metrics.history.filter((d) => d.date >= range.from && d.date <= range.to);
    }
    const days = rangeMap[dashboardZoom.range as Exclude<TimeRange, 'custom'>];
    if (days === Infinity) return metrics.history;
    return metrics.history.slice(-days);
  }, [metrics.history, dashboardZoom.range, dashboardZoom.customRange]);

  const zoom = useChartZoom({
    data: filtered,
    xKey: 'date',
    onZoomComplete: dashboardZoom.onZoomComplete,
    onZoomReset: dashboardZoom.onZoomReset,
  });

  return (
    <ChartPreviewCard
      title={m.ui_metrics_chart_title()}
      subtitle={m.ui_metrics_chart_subtitle()}
      compactHeight="h-64"
      footer={
        <div className="flex items-center justify-center gap-6">
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
      {(mode) => {
        const compact = mode === 'compact';
        return filtered.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={zoom.zoomedData}
              onMouseDown={zoom.onMouseDown}
              onMouseMove={zoom.onMouseMove}
              onMouseUp={zoom.onMouseUp}
            >
              {!compact && <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />}
              <XAxis
                dataKey="date"
                ticks={
                  compact
                    ? [
                        zoom.zoomedData[0]?.date,
                        zoom.zoomedData[zoom.zoomedData.length - 1]?.date,
                      ].filter((v): v is string => v != null)
                    : undefined
                }
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
                axisLine={compact ? false : chartTheme.axisLine}
                width={40}
                tickCount={compact ? 3 : undefined}
              />
              <RechartsTooltip
                contentStyle={chartTheme.tooltip.contentStyle}
                labelStyle={chartTheme.tooltip.labelStyle}
                isAnimationActive={chartTheme.tooltip.isAnimationActive}
                separator={chartTheme.tooltip.separator}
                labelFormatter={(v) => formatChartDate(String(v))}
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
                name={m.ui_chart_series_fitness()}
              />
              <Line
                type="monotone"
                dataKey="atl"
                stroke={tokens.chartFatigue}
                strokeWidth={2}
                dot={false}
                name={m.ui_chart_series_fatigue()}
              />
              <Line
                type="monotone"
                dataKey="tsb"
                stroke={tokens.chartForm}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                name={m.ui_chart_series_form()}
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
        ) : null;
      }}
    </ChartPreviewCard>
  );
};

import { useMemo } from 'react';
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ReferenceArea,
} from 'recharts';
import { useFilteredMetrics } from './hooks/useFilteredMetrics.ts';
import { ChartPreviewCard } from '@/components/ui/ChartPreviewCard.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { MetricLabel } from '@/components/ui/MetricLabel.tsx';
import { useChartZoom } from '@/lib/hooks/useChartZoom.ts';
import { chartTheme, formatChartDate } from '@/lib/chartTheme.ts';
import { tokens } from '@/lib/tokens.ts';
import { METRIC_EXPLANATIONS } from '@/lib/explanations.ts';
import { rangeMap } from '@/lib/timeRange.ts';
import type { TimeRange } from '@/lib/timeRange.ts';
import { useDashboardChartZoom } from './hooks/useDashboardChartZoom.ts';
import { m } from '@/paraglide/messages.js';

const dayLabels = [
  m.ui_day_mon,
  m.ui_day_tue,
  m.ui_day_wed,
  m.ui_day_thu,
  m.ui_day_fri,
  m.ui_day_sat,
  m.ui_day_sun,
];

export const WeeklyLoadChart = () => {
  const metrics = useFilteredMetrics();
  const dashboardZoom = useDashboardChartZoom();

  const chartData = useMemo(() => {
    if (dashboardZoom.range === 'custom' && dashboardZoom.customRange) {
      const range = dashboardZoom.customRange;
      return metrics.history
        .filter((d) => d.date >= range.from && d.date <= range.to)
        .map((d) => ({ date: d.date, tss: d.tss }));
    }
    const days = rangeMap[dashboardZoom.range as Exclude<TimeRange, 'custom'>];
    const sliced = days === Infinity ? metrics.history : metrics.history.slice(-days);
    return sliced.map((d) => ({
      date: d.date,
      tss: d.tss,
    }));
  }, [metrics.history, dashboardZoom.range, dashboardZoom.customRange]);

  const zoom = useChartZoom({
    data: chartData,
    xKey: 'date',
    onZoomComplete: dashboardZoom.onZoomComplete,
    onZoomReset: dashboardZoom.onZoomReset,
  });

  const tickFormatter = (v: string) => {
    const d = new Date(v);
    if (dashboardZoom.range === '7d') {
      const label = dayLabels[(d.getDay() + 6) % 7];
      if (label) return label();
    }
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <ChartPreviewCard
      title=""
      titleSlot={
        <div className="flex items-center gap-1 flex-1">
          <Typography variant="title" as="h3">
            {METRIC_EXPLANATIONS.tss.friendlyName}
          </Typography>
          <MetricLabel metricId="tss" size="sm" />
        </div>
      }
      subtitle={METRIC_EXPLANATIONS.tss.oneLiner}
      compactHeight="h-64"
    >
      {(mode) => {
        const compact = mode === 'compact';
        return chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              syncId={compact ? 'dashboard' : undefined}
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
                tickFormatter={tickFormatter}
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
                type="step"
                dataKey="tss"
                fill={tokens.chartLoad}
                fillOpacity={1}
                stroke="none"
                dot={false}
                name={m.ui_chart_series_tss()}
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

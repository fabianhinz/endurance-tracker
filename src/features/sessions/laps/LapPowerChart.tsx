import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { avgDomain, chartTheme, formatTick } from '@/lib/chartTheme.ts';
import { tokens } from '@/lib/tokens.ts';
import type { LapPowerPoint } from '@/lib/lapChartData.ts';
import { m } from '@/paraglide/messages.js';

interface LapPowerChartProps {
  data: LapPowerPoint[];
  mode: 'compact' | 'expanded';
  syncId?: string;
  onActiveLapChange?: (lapIndex: number | null) => void;
}

export const LapPowerChart = (props: LapPowerChartProps) => {
  const compact = props.mode === 'compact';
  const yDomain = avgDomain(props.data.map((d) => d.avgPower));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={props.data}
        syncId={compact ? props.syncId : undefined}
        onMouseMove={(state) => {
          props.onActiveLapChange?.(Number(state.activeTooltipIndex ?? 0));
        }}
        onMouseLeave={() => props.onActiveLapChange?.(null)}
      >
        {!compact && <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />}
        <XAxis
          dataKey="lap"
          ticks={
            compact
              ? [props.data[0]?.lap, props.data[props.data.length - 1]?.lap].filter(Boolean)
              : undefined
          }
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={chartTheme.axisLine}
        />
        <YAxis
          domain={yDomain}
          allowDataOverflow
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={false}
          tickCount={compact ? 3 : undefined}
          tickFormatter={(v: number) => formatTick(v, compact ? undefined : 'W')}
        />
        <RechartsTooltip
          contentStyle={chartTheme.tooltip.contentStyle}
          labelStyle={chartTheme.tooltip.labelStyle}
          isAnimationActive={chartTheme.tooltip.isAnimationActive}
          separator={chartTheme.tooltip.separator}
          cursor={{ fill: `${tokens.accent}14` }}
          formatter={(
            _value: number | undefined,
            _name: string | undefined,
            entry: { payload?: LapPowerPoint },
          ) => {
            const p = entry.payload;
            if (!p) return [`-- W`, m.ui_chart_series_avg_power()];
            return [`${p.avgPower} W (${p.minPower}–${p.maxPower})`, m.ui_chart_series_avg_power()];
          }}
        />
        <Area
          dataKey="powerRange"
          type="monotone"
          fill={tokens.chartPower}
          fillOpacity={0.15}
          stroke="none"
          tooltipType="none"
          dot={false}
        />
        <Line
          dataKey="avgPower"
          name={m.ui_chart_series_avg_power()}
          type="monotone"
          stroke={tokens.chartPower}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

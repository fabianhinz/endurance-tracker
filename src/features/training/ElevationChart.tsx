import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceArea,
} from "recharts";
import { useChartZoom } from "../../lib/use-chart-zoom.ts";
import { chartTheme, formatChartTime } from "../../lib/chart-theme.ts";
import { tokens } from "../../lib/tokens.ts";
import type { ElevationPoint } from "../../engine/chart-data.ts";

interface ElevationChartProps {
  data: ElevationPoint[];
  mode?: "compact" | "expanded";
}

export const ElevationChart = (props: ElevationChartProps) => {
  const compact = props.mode === "compact";
  const zoom = useChartZoom({ data: props.data, xKey: "time" });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={zoom.zoomedData}
        onMouseDown={compact ? undefined : zoom.onMouseDown}
        onMouseMove={compact ? undefined : zoom.onMouseMove}
        onMouseUp={compact ? undefined : zoom.onMouseUp}
      >
        {!compact && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartTheme.grid.stroke}
          />
        )}
        <XAxis
          dataKey="time"
          ticks={compact ? [zoom.zoomedData[0]?.time ?? 0, zoom.zoomedData[zoom.zoomedData.length - 1]?.time ?? 0] : undefined}
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={chartTheme.axisLine}
          tickFormatter={formatChartTime}
        />
        <YAxis
          yAxisId="left"
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={false}
          tickCount={compact ? 3 : undefined}
          tickFormatter={(v: number) => compact ? `${v}` : `${v} m`}
        />
        {!compact && (
          <RechartsTooltip
            contentStyle={chartTheme.tooltip.contentStyle}
            labelStyle={chartTheme.tooltip.labelStyle}
            isAnimationActive={chartTheme.tooltip.isAnimationActive}
            labelFormatter={(v) => `${formatChartTime(Number(v))} min`}
          />
        )}
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="elevation"
          stroke={tokens.chartElevation}
          fill={tokens.chartElevation}
          fillOpacity={0.2}
          strokeWidth={1.5}
          dot={false}
          activeDot={compact ? false : undefined}
          name="Elevation (m)"
        />
        {!compact && zoom.refAreaLeft && zoom.refAreaRight && (
          <ReferenceArea
            yAxisId="left"
            x1={zoom.refAreaLeft}
            x2={zoom.refAreaRight}
            strokeOpacity={0.3}
            fill={tokens.accent}
            fillOpacity={0.15}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
};

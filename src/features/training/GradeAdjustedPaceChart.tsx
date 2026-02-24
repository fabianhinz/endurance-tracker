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
import { useChartZoom } from "../../lib/use-chart-zoom.ts";
import { chartTheme, formatChartTime } from "../../lib/chart-theme.ts";
import { tokens } from "../../lib/tokens.ts";
import type { GAPPoint } from "../../engine/chart-data.ts";

interface GradeAdjustedPaceChartProps {
  data: GAPPoint[];
  mode?: "compact" | "expanded";
}

const formatPace = (minPerKm: number): string => {
  const mins = Math.floor(minPerKm);
  const secs = Math.round((minPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const GradeAdjustedPaceChart = (
  props: GradeAdjustedPaceChartProps,
) => {
  const compact = props.mode === "compact";
  const zoom = useChartZoom({ data: props.data, xKey: "time" });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
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
          reversed
          tickCount={compact ? 3 : undefined}
          tickFormatter={formatPace}
        />
        {!compact && (
          <RechartsTooltip
            contentStyle={chartTheme.tooltip.contentStyle}
            labelStyle={chartTheme.tooltip.labelStyle}
            isAnimationActive={chartTheme.tooltip.isAnimationActive}
            labelFormatter={(v) => `${formatChartTime(Number(v))} min`}
            formatter={(v: number | undefined, name: string | undefined) => [
              v !== undefined ? formatPace(v) : "",
              name ?? "",
            ]}
          />
        )}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="pace"
          stroke={tokens.chartPace}
          strokeWidth={1.5}
          dot={false}
          activeDot={compact ? false : undefined}
          name="Pace"
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="gap"
          stroke={tokens.chartGap}
          strokeWidth={1.5}
          dot={false}
          activeDot={compact ? false : undefined}
          name="GAP"
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
      </LineChart>
    </ResponsiveContainer>
  );
};

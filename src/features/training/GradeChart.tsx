import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import { useChartZoom } from "../../lib/use-chart-zoom.ts";
import { chartTheme, formatChartTime } from "../../lib/chart-theme.ts";
import { tokens } from "../../lib/tokens.ts";
import type { GradePoint } from "../../engine/chart-data.ts";

interface GradeChartProps {
  data: GradePoint[];
  mode?: "compact" | "expanded";
}

export const GradeChart = (props: GradeChartProps) => {
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
          tickCount={compact ? 3 : undefined}
          tickFormatter={(v: number) => `${v}%`}
        />
        {!compact && (
          <RechartsTooltip
            contentStyle={chartTheme.tooltip.contentStyle}
            labelStyle={chartTheme.tooltip.labelStyle}
            isAnimationActive={chartTheme.tooltip.isAnimationActive}
            labelFormatter={(v) => `${formatChartTime(Number(v))} min`}
          />
        )}
        {!compact && (
          <ReferenceLine
            yAxisId="left"
            y={0}
            stroke={tokens.textQuaternary}
            strokeDasharray="3 3"
          />
        )}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="grade"
          stroke={tokens.chartGrade}
          strokeWidth={1.5}
          dot={false}
          activeDot={compact ? false : undefined}
          name="Grade (%)"
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

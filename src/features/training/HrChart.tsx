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
import type { HrPoint } from "../../engine/chart-data.ts";

interface HrChartProps {
  data: HrPoint[];
  mode?: "compact" | "expanded";
  onActiveTimeChange?: (time: number | null) => void;
  onZoomComplete?: (from: string | number, to: string | number) => void;
  onZoomReset?: () => void;
}

export const HrChart = (props: HrChartProps) => {
  const compact = props.mode === "compact";
  const zoom = useChartZoom({ data: props.data, xKey: "time", onZoomComplete: props.onZoomComplete, onZoomReset: props.onZoomReset });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        syncId={compact ? "session-detail" : undefined}
        data={zoom.zoomedData}
        onMouseDown={zoom.onMouseDown}
        onMouseMove={(e) => { zoom.onMouseMove(e); if (compact && props.onActiveTimeChange && e.activeLabel != null) props.onActiveTimeChange(Number(e.activeLabel)); }}
        onMouseUp={zoom.onMouseUp}
        onMouseLeave={compact && props.onActiveTimeChange ? () => props.onActiveTimeChange!(null) : undefined}
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
          tickFormatter={(v: number) => compact ? `${v}` : `${v} bpm`}
        />
        <RechartsTooltip
          contentStyle={chartTheme.tooltip.contentStyle}
          labelStyle={chartTheme.tooltip.labelStyle}
          isAnimationActive={chartTheme.tooltip.isAnimationActive}
          labelFormatter={(v) => `${formatChartTime(Number(v))} min`}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="hr"
          stroke={tokens.chartHr}
          strokeWidth={1.5}
          dot={false}
          name="HR (bpm)"
        />
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
  );
};

import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import { chartTheme } from "../../lib/chartTheme.ts";
import { tokens } from "../../lib/tokens.ts";
import { formatPace, formatPaceInput } from "../../lib/utils.ts";
import type { LapSplitPoint } from "../../lib/lapChartData.ts";

interface LapSplitsChartProps {
  data: LapSplitPoint[];
  mode: "compact" | "expanded";
  isRunning: boolean;
  syncId?: string;
}

export const LapSplitsChart = (props: LapSplitsChartProps) => {
  const compact = props.mode === "compact";
  const dataKey = props.isRunning ? "pace" : "speed";
  const angleTicks = props.data.length > 20;
  const fill = props.isRunning ? tokens.chartPace : tokens.chartSpeed;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={props.data}
        syncId={compact ? props.syncId : undefined}
      >
        {!compact && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartTheme.grid.stroke}
          />
        )}
        <XAxis
          dataKey="lap"
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={chartTheme.axisLine}
          angle={angleTicks ? -45 : 0}
          textAnchor={angleTicks ? "end" : "middle"}
          height={angleTicks ? 50 : 30}
          interval={compact ? "preserveStartEnd" : 0}
        />
        <YAxis
          tick={chartTheme.tick}
          tickLine={false}
          axisLine={false}
          tickCount={compact ? 3 : undefined}
          reversed={props.isRunning}
          tickFormatter={(v: number) =>
            props.isRunning
              ? compact
                ? formatPaceInput(v)
                : formatPace(v)
              : compact
                ? `${v}`
                : `${v} km/h`
          }
        />
        <RechartsTooltip
          contentStyle={chartTheme.tooltip.contentStyle}
          labelStyle={chartTheme.tooltip.labelStyle}
          isAnimationActive={chartTheme.tooltip.isAnimationActive}
          cursor={{ fill: `${tokens.accent}14` }}
          formatter={(value: number | undefined) => [
            props.isRunning
              ? formatPace(value ?? 0)
              : `${value ?? 0} km/h`,
            props.isRunning ? "Pace" : "Speed",
          ]}
        />
        <Area
          dataKey={dataKey}
          name={props.isRunning ? "Pace" : "Speed"}
          type="step"
          stroke="none"
          fill={fill}
          fillOpacity={1}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

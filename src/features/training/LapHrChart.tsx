import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import { chartTheme } from "../../lib/chartTheme.ts";
import { tokens } from "../../lib/tokens.ts";
import type { LapHrPoint } from "../../lib/lapChartData.ts";

interface LapHrChartProps {
  data: LapHrPoint[];
  mode: "compact" | "expanded";
  syncId?: string;
}

export const LapHrChart = (props: LapHrChartProps) => {
  const compact = props.mode === "compact";
  const angleTicks = props.data.length > 20;

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
          tickFormatter={(v: number) =>
            compact ? `${v}` : `${v} bpm`
          }
        />
        <RechartsTooltip
          contentStyle={chartTheme.tooltip.contentStyle}
          labelStyle={chartTheme.tooltip.labelStyle}
          isAnimationActive={chartTheme.tooltip.isAnimationActive}
          cursor={{ fill: `${tokens.accent}14` }}
          formatter={(_value: number | undefined, _name: string | undefined, entry: { payload?: LapHrPoint }) => {
            const p = entry.payload;
            if (!p) return [`-- bpm`, "Avg HR"];
            return [
              `${p.avgHr} bpm (${p.minHr}–${p.maxHr})`,
              "Avg HR",
            ];
          }}
        />
        <Area
          dataKey="hrRange"
          type="monotone"
          fill={tokens.chartHr}
          fillOpacity={0.15}
          stroke="none"
          tooltipType="none"
          dot={false}
        />
        <Line
          dataKey="avgHr"
          name="Avg HR"
          type="monotone"
          stroke={tokens.chartHr}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

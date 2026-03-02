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
import type { LapPowerPoint } from "../../lib/lapChartData.ts";

interface LapPowerChartProps {
  data: LapPowerPoint[];
  mode: "compact" | "expanded";
  syncId?: string;
}

export const LapPowerChart = (props: LapPowerChartProps) => {
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
            compact ? `${v}` : `${v} W`
          }
        />
        <RechartsTooltip
          contentStyle={chartTheme.tooltip.contentStyle}
          labelStyle={chartTheme.tooltip.labelStyle}
          isAnimationActive={chartTheme.tooltip.isAnimationActive}
          cursor={{ fill: `${tokens.accent}14` }}
          formatter={(_value: number | undefined, _name: string | undefined, entry: { payload?: LapPowerPoint }) => {
            const p = entry.payload;
            if (!p) return [`-- W`, "Avg Power"];
            return [
              `${p.avgPower} W (${p.minPower}–${p.maxPower})`,
              "Avg Power",
            ];
          }}
        />
        <Area
          dataKey="avgPower"
          name="Avg Power"
          type="monotone"
          stroke="none"
          fill={tokens.chartPower}
          fillOpacity={0.15}
          dot={false}
        />
        <Line
          dataKey="avgPower"
          name="Avg Power"
          type="monotone"
          stroke={tokens.chartPower}
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="minPower"
          name="Min Power"
          type="monotone"
          stroke={`${tokens.chartPower}80`}
          strokeWidth={1}
          dot={false}
        />
        <Line
          dataKey="maxPower"
          name="Max Power"
          type="monotone"
          stroke={`${tokens.chartPower}80`}
          strokeWidth={1}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

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
import { avgDomain, chartTheme } from "../../lib/chartTheme.ts";
import { tokens } from "../../lib/tokens.ts";
import { formatPace, formatPaceInput } from "../../lib/utils.ts";
import type { LapSplitPoint } from "../../lib/lapChartData.ts";

interface LapSplitsChartProps {
  data: LapSplitPoint[];
  mode: "compact" | "expanded";
  isRunning: boolean;
  syncId?: string;
  onActiveLapChange?: (lapIndex: number | null) => void;
}

export const LapSplitsChart = (props: LapSplitsChartProps) => {
  const compact = props.mode === "compact";
  const dataKey = props.isRunning ? "pace" : "speed";
  const fill = props.isRunning ? tokens.chartPace : tokens.chartSpeed;
  const hasRangeData = props.data.some(
    (d) => (props.isRunning ? d.paceRange : d.speedRange) !== undefined,
  );
  const yDomain = avgDomain(
    props.data.map((d) => (props.isRunning ? d.pace : d.speed)),
  );

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
        {!compact && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartTheme.grid.stroke}
          />
        )}
        <XAxis
          dataKey="lap"
          ticks={compact ? [props.data[0]?.lap, props.data[props.data.length - 1]?.lap].filter(Boolean) : undefined}
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
          formatter={(
            _value: number | undefined,
            _name: string | undefined,
            entry: { payload?: LapSplitPoint },
          ) => {
            const p = entry.payload;
            if (!p)
              return [
                props.isRunning ? "-- /km" : "-- km/h",
                props.isRunning ? "Pace" : "Speed",
              ];
            if (props.isRunning) {
              const avg = formatPace(p.pace);
              if (p.minPace !== undefined) {
                return [
                  `${avg} (${formatPaceInput(p.minPace)}–${formatPaceInput(p.maxPace)})`,
                  "Pace",
                ];
              }
              return [avg, "Pace"];
            }
            const avg = `${p.speed} km/h`;
            if (p.minSpeed !== undefined) {
              return [`${avg} (${p.minSpeed}–${p.maxSpeed})`, "Speed"];
            }
            return [avg, "Speed"];
          }}
        />
        {hasRangeData && (
          <Area
            dataKey={props.isRunning ? "paceRange" : "speedRange"}
            type="monotone"
            fill={fill}
            fillOpacity={0.15}
            stroke="none"
            tooltipType="none"
            dot={false}
          />
        )}
        <Line
          dataKey={dataKey}
          name={props.isRunning ? "Pace" : "Speed"}
          type="monotone"
          stroke={fill}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

import { useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
} from "recharts";
import { Maximize2, Minimize2 } from "lucide-react";
import { ChartCard } from "../../components/ui/ChartCard.tsx";
import { Button } from "../../components/ui/Button.tsx";
import { useExpandCard } from "../../lib/use-expand-card.ts";
import { chartTheme } from "../../lib/chart-theme.ts";
import { tokens } from "../../lib/tokens.ts";
import type { LapSplitPoint } from "../../engine/lap-chart-data.ts";

interface LapSplitsChartProps {
  data: LapSplitPoint[];
  isRunning: boolean;
  mode?: "compact" | "expanded" | "full";
}

const formatPace = (minPerKm: number): string => {
  const mins = Math.floor(minPerKm);
  const secs = Math.round((minPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const LapSplitsChart = (props: LapSplitsChartProps) => {
  const mode = props.mode ?? "full";
  const cardRef = useRef<HTMLDivElement>(null);
  const expandCard = useExpandCard(cardRef);

  const dataKey = props.isRunning ? "pace" : "speed";

  if (mode === "compact") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={props.data}>
          <Bar dataKey={dataKey} isAnimationActive={false}>
            {props.data.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  entry.intensity === "rest"
                    ? tokens.textQuaternary
                    : tokens.chartSpeed
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  const unit = props.isRunning ? "min/km" : "km/h";

  if (mode === "expanded") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={props.data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartTheme.grid.stroke}
          />
          <XAxis
            dataKey="lap"
            tick={chartTheme.tick}
            tickLine={false}
            axisLine={chartTheme.axisLine}
          />
          <YAxis
            tick={chartTheme.tick}
            tickLine={false}
            axisLine={false}
            reversed={props.isRunning}
            tickFormatter={
              props.isRunning
                ? formatPace
                : (v: number) => `${v} ${unit}`
            }
          />
          <RechartsTooltip
            contentStyle={chartTheme.tooltip.contentStyle}
            labelStyle={chartTheme.tooltip.labelStyle}
            isAnimationActive={chartTheme.tooltip.isAnimationActive}
            formatter={(v: number | undefined) => [
              v !== undefined
                ? props.isRunning ? formatPace(v) : `${v} ${unit}`
                : "",
              props.isRunning ? "Pace" : "Speed",
            ]}
          />
          <Bar
            dataKey={dataKey}
            name={props.isRunning ? "Pace" : "Speed"}
            isAnimationActive={true}
          >
            {props.data.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  entry.intensity === "rest"
                    ? tokens.textQuaternary
                    : tokens.chartSpeed
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  const expandAction = (
    <div className="hidden md:flex">
      <Button
        variant="ghost"
        size="icon"
        onClick={expandCard.toggle}
        aria-label={expandCard.isExpanded ? "Collapse chart" : "Expand chart"}
      >
        {expandCard.isExpanded ? (
          <Minimize2 size={16} />
        ) : (
          <Maximize2 size={16} />
        )}
      </Button>
    </div>
  );

  return (
    <div ref={cardRef}>
      <ChartCard
        title="Lap Splits"
        subtitle={`${props.isRunning ? "Pace" : "Speed"} per lap`}
        minHeight={expandCard.isExpanded ? "h-full" : "h-64"}
        className={expandCard.isExpanded ? "h-full" : undefined}
        actions={expandAction}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={props.data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={chartTheme.grid.stroke}
            />
            <XAxis
              dataKey="lap"
              tick={chartTheme.tick}
              tickLine={false}
              axisLine={chartTheme.axisLine}
            />
            <YAxis
              tick={chartTheme.tick}
              tickLine={false}
              axisLine={false}
              reversed={props.isRunning}
              tickFormatter={
                props.isRunning
                  ? formatPace
                  : (v: number) => `${v} ${unit}`
              }
            />
            <RechartsTooltip
              contentStyle={chartTheme.tooltip.contentStyle}
              labelStyle={chartTheme.tooltip.labelStyle}
              isAnimationActive={chartTheme.tooltip.isAnimationActive}
              formatter={(v: number | undefined) => [
                v !== undefined
                  ? props.isRunning ? formatPace(v) : `${v} ${unit}`
                  : "",
                props.isRunning ? "Pace" : "Speed",
              ]}
            />
            <Bar
              dataKey={dataKey}
              name={props.isRunning ? "Pace" : "Speed"}
              isAnimationActive={!expandCard.isAnimating}
            >
              {props.data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    entry.intensity === "rest"
                      ? tokens.textQuaternary
                      : tokens.chartSpeed
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};

import { useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Maximize2, Minimize2 } from "lucide-react";
import { ChartCard } from "../../components/ui/ChartCard.tsx";
import { Button } from "../../components/ui/Button.tsx";
import { useExpandCard } from "../../lib/use-expand-card.ts";
import { chartTheme } from "../../lib/chart-theme.ts";
import { tokens } from "../../lib/tokens.ts";
import type { LapHrPoint } from "../../engine/lap-chart-data.ts";

interface LapHrChartProps {
  data: LapHrPoint[];
  mode?: "compact" | "expanded" | "full";
}

export const LapHrChart = (props: LapHrChartProps) => {
  const mode = props.mode ?? "full";
  const cardRef = useRef<HTMLDivElement>(null);
  const expandCard = useExpandCard(cardRef);

  if (mode === "compact") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={props.data}>
          <Bar
            dataKey="avgHr"
            fill={tokens.chartHr}
            fillOpacity={0.7}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

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
            tickFormatter={(v: number) => `${v} bpm`}
          />
          <RechartsTooltip
            contentStyle={chartTheme.tooltip.contentStyle}
            labelStyle={chartTheme.tooltip.labelStyle}
            isAnimationActive={chartTheme.tooltip.isAnimationActive}
          />
          <Bar
            dataKey="minHr"
            fill={tokens.chartHr}
            fillOpacity={0.3}
            name="Min HR"
            isAnimationActive={true}
          />
          <Bar
            dataKey="avgHr"
            fill={tokens.chartHr}
            fillOpacity={0.7}
            name="Avg HR"
            isAnimationActive={true}
          />
          <Bar
            dataKey="maxHr"
            fill={tokens.chartHr}
            name="Max HR"
            isAnimationActive={true}
          />
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
        title="Lap Heart Rate"
        subtitle="Avg, min, and max HR per lap"
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
              tickFormatter={(v: number) => `${v} bpm`}
            />
            <RechartsTooltip
              contentStyle={chartTheme.tooltip.contentStyle}
              labelStyle={chartTheme.tooltip.labelStyle}
              isAnimationActive={chartTheme.tooltip.isAnimationActive}
            />
            <Bar
              dataKey="minHr"
              fill={tokens.chartHr}
              fillOpacity={0.3}
              name="Min HR"
              isAnimationActive={!expandCard.isAnimating}
            />
            <Bar
              dataKey="avgHr"
              fill={tokens.chartHr}
              fillOpacity={0.7}
              name="Avg HR"
              isAnimationActive={!expandCard.isAnimating}
            />
            <Bar
              dataKey="maxHr"
              fill={tokens.chartHr}
              name="Max HR"
              isAnimationActive={!expandCard.isAnimating}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};

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
import type { HrRecoveryPoint } from "../../engine/lap-chart-data.ts";

interface HrRecoveryChartProps {
  data: HrRecoveryPoint[];
  mode?: "compact" | "expanded" | "full";
}

export const HrRecoveryChart = (props: HrRecoveryChartProps) => {
  const mode = props.mode ?? "full";
  const cardRef = useRef<HTMLDivElement>(null);
  const expandCard = useExpandCard(cardRef);

  if (mode === "compact") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={props.data}>
          <Bar dataKey="drop" isAnimationActive={false}>
            {props.data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
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
            dataKey="label"
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
            formatter={(v: number | undefined) => [`${v ?? 0} bpm`, "HR Drop"]}
          />
          <Bar
            dataKey="drop"
            name="HR Drop"
            isAnimationActive={true}
          >
            {props.data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
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
        title="HR Recovery"
        subtitle="Heart rate drop between intervals (bpm)"
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
              dataKey="label"
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
              formatter={(v: number | undefined) => [`${v ?? 0} bpm`, "HR Drop"]}
            />
            <Bar
              dataKey="drop"
              name="HR Drop"
              isAnimationActive={!expandCard.isAnimating}
            >
              {props.data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};

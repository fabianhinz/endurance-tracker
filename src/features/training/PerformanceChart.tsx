import { useRef } from "react";
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
import { Maximize2, Minimize2 } from "lucide-react";
import { ChartCard } from "../../components/ui/ChartCard.tsx";
import { Button } from "../../components/ui/Button.tsx";
import { useChartZoom } from "../../lib/use-chart-zoom.ts";
import { useExpandCard } from "../../lib/use-expand-card.ts";
import { chartTheme } from "../../lib/chart-theme.ts";
import { tokens } from "../../lib/tokens.ts";

interface PerformanceChartData {
  time: number;
  hr?: number;
  power?: number;
  speed?: number;
}

interface PerformanceChartProps {
  data: PerformanceChartData[];
}

export const PerformanceChart = (props: PerformanceChartProps) => {
  const zoom = useChartZoom({ data: props.data, xKey: "time" });
  const cardRef = useRef<HTMLDivElement>(null);
  const expandCard = useExpandCard(cardRef);

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
        title="Performance"
        subtitle="Heart rate, power, and speed over time"
        minHeight={expandCard.isExpanded ? "h-full" : "h-64"}
        className={expandCard.isExpanded ? "h-full" : undefined}
        actions={expandAction}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={zoom.zoomedData}
            onMouseDown={zoom.onMouseDown}
            onMouseMove={zoom.onMouseMove}
            onMouseUp={zoom.onMouseUp}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={chartTheme.grid.stroke}
            />
            <XAxis
              dataKey="time"
              tick={chartTheme.tick}
              tickLine={false}
              axisLine={chartTheme.axisLine}
              tickFormatter={(v: number) => `${Math.round(v)} min`}
            />
            <YAxis
              yAxisId="left"
              tick={chartTheme.tick}
              tickLine={false}
              axisLine={false}
            />
            <RechartsTooltip
              contentStyle={chartTheme.tooltip.contentStyle}
              labelStyle={chartTheme.tooltip.labelStyle}
              isAnimationActive={chartTheme.tooltip.isAnimationActive}
              labelFormatter={(v) => `${Math.round(Number(v))} min`}
            />
            {props.data.some((d) => d.hr) && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="hr"
                stroke={tokens.chartHr}
                strokeWidth={1.5}
                dot={false}
                name="HR (bpm)"
                isAnimationActive={!expandCard.isAnimating}
              />
            )}
            {props.data.some((d) => d.power) && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="power"
                stroke={tokens.chartPower}
                strokeWidth={1.5}
                dot={false}
                name="Power (W)"
                isAnimationActive={!expandCard.isAnimating}
              />
            )}
            {props.data.some((d) => d.speed) && (
              <>
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={chartTheme.tick}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v} km/h`}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="speed"
                  stroke={tokens.chartSpeed}
                  strokeWidth={1.5}
                  dot={false}
                  name="Speed (km/h)"
                  isAnimationActive={!expandCard.isAnimating}
                />
              </>
            )}
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
      </ChartCard>
    </div>
  );
};

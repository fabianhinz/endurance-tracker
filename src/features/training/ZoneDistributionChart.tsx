import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Heart, Timer, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { Tabs, TabsContent, TabsTrigger } from "../../components/ui/Tabs.tsx";
import { chartTheme } from "../../lib/chart-theme.ts";
import { tokens } from "../../lib/tokens.ts";
import type { ZoneBucket } from "../../engine/zone-distribution.ts";

interface TabConfig {
  key: string;
  label: string;
  icon: LucideIcon;
  data: ZoneBucket[];
}

interface ZoneDistributionChartProps {
  hrZones: ZoneBucket[];
  powerZones: ZoneBucket[];
  paceZones: ZoneBucket[];
  mode?: "compact" | "expanded";
}

const ZoneBarChart = (props: {
  data: ZoneBucket[];
  compact: boolean;
}) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      data={props.data}
      layout="vertical"
      barCategoryGap={props.compact ? "20%" : undefined}
    >
      {!props.compact && (
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={chartTheme.grid.stroke}
        />
      )}
      <XAxis type="number" tick={chartTheme.tick} tickLine={false} axisLine={chartTheme.axisLine} tickFormatter={(v: number) => `${v}%`} />
      <YAxis type="category" dataKey="label" tick={chartTheme.tick} tickLine={false} axisLine={false} width={140} />
      {!props.compact && (
        <RechartsTooltip
          contentStyle={chartTheme.tooltip.contentStyle}
          labelStyle={chartTheme.tooltip.labelStyle}
          itemStyle={{ color: tokens.textPrimary }}
          isAnimationActive={chartTheme.tooltip.isAnimationActive}
          cursor={{ fill: `${tokens.accent}14` }}
          formatter={(value: number | undefined, _name: string | undefined, entry: { payload?: ZoneBucket }) =>
            [`${value ?? 0}% · ${entry.payload?.rangeLabel ?? ""}`, "Time"]
          }
        />
      )}
      <Bar
        dataKey="percentage"
        name="Time"
      >
        {props.data.map((entry, index) => (
          <Cell key={index} fill={entry.color} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

export const ZoneDistributionChart = (props: ZoneDistributionChartProps) => {
  const tabs = useMemo(() => {
    const all: TabConfig[] = [
      { key: "hr", label: "HR", icon: Heart, data: props.hrZones },
      { key: "power", label: "Power", icon: Zap, data: props.powerZones },
      { key: "pace", label: "Pace", icon: Timer, data: props.paceZones },
    ];
    return all.filter((t) => t.data.length > 0);
  }, [props.hrZones, props.powerZones, props.paceZones]);

  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const resolvedTab = activeTab ?? tabs[0]?.key;

  if (tabs.length === 0) return null;

  const isCompact = props.mode === "compact";

  const tabsTriggers = (
    <TabsPrimitive.List className="inline-flex gap-1 mb-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <TabsTrigger
            key={tab.key}
            value={tab.key}
            className="flex-none gap-1 rounded-lg px-2 py-1 text-xs"
          >
            <Icon size={12} />
            {tab.label}
          </TabsTrigger>
        );
      })}
    </TabsPrimitive.List>
  );

  return (
    <Tabs value={resolvedTab} onValueChange={setActiveTab} className="h-full flex flex-col">
      {tabs.length > 1 && tabsTriggers}
      <div className="flex-1">
        {tabs.map((tab) => (
          <TabsContent key={tab.key} value={tab.key} className="mt-0 h-full">
            <ZoneBarChart
              data={tab.data}
              compact={isCompact}
            />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
};

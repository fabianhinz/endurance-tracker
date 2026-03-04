import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { Heart, Timer, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { Tabs, TabsContent, TabsTrigger } from '@/components/ui/Tabs.tsx';
import { chartTheme } from '@/lib/chartTheme.ts';
import { tokens } from '@/lib/tokens.ts';
import type { ZoneBucket } from '@/engine/zoneDistribution.ts';
import { m } from '@/paraglide/messages.js';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import type { ZoneColorMode } from '@/features/map/zoneColoredPath.ts';

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
  mode?: 'compact' | 'expanded';
}

const ZoneBarChart = (props: { data: ZoneBucket[]; compact: boolean }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      data={props.data}
      layout="vertical"
      barCategoryGap={props.compact ? '20%' : undefined}
    >
      {!props.compact && <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />}
      <XAxis
        type="number"
        tick={chartTheme.tick}
        tickLine={false}
        axisLine={chartTheme.axisLine}
        tickFormatter={(v: number) => `${v}%`}
      />
      <YAxis
        type="category"
        dataKey="label"
        tick={chartTheme.tick}
        tickLine={false}
        axisLine={false}
        width={140}
      />
      <RechartsTooltip
        contentStyle={chartTheme.tooltip.contentStyle}
        labelStyle={chartTheme.tooltip.labelStyle}
        itemStyle={{ color: tokens.textPrimary }}
        isAnimationActive={chartTheme.tooltip.isAnimationActive}
        separator={chartTheme.tooltip.separator}
        cursor={{ fill: `${tokens.accent}14` }}
        formatter={(
          value: number | undefined,
          _name: string | undefined,
          entry: { payload?: ZoneBucket },
        ) => [`${value ?? 0}% · ${entry.payload?.rangeLabel ?? ''}`, m.ui_laps_col_time()]}
      />
      <Bar dataKey="percentage" name={m.ui_laps_col_time()}>
        {props.data.map((entry, index) => (
          <Cell key={index} fill={entry.color} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

const ZONE_NAME_LABELS: Record<string, () => string> = {
  recovery: m.ui_zone_recovery,
  easy: m.ui_zone_easy,
  tempo: m.ui_zone_tempo,
  threshold: m.ui_zone_threshold,
  vo2max: m.ui_zone_vo2max,
  aerobic: m.ui_zone_aerobic,
  active_recovery: m.ui_zone_active_recovery,
  endurance: m.ui_zone_endurance,
  anaerobic: m.ui_zone_anaerobic,
  neuromuscular: m.ui_zone_neuromuscular,
};

const translateBuckets = (buckets: ZoneBucket[]): ZoneBucket[] =>
  buckets.map((b) => {
    const translatedName = ZONE_NAME_LABELS[b.name]?.() ?? b.name;
    const label = /^Z\d/.test(b.zone) ? `${b.zone} ${translatedName}` : translatedName;
    return { ...b, label };
  });

export const ZoneDistributionChart = (props: ZoneDistributionChartProps) => {
  const zoneColorMode = useMapFocusStore((s) => s.zoneColorMode);
  const setZoneColorMode = useMapFocusStore((s) => s.setZoneColorMode);

  const tabs = useMemo(() => {
    const all: TabConfig[] = [
      { key: 'hr', label: m.ui_zones_tab_hr(), icon: Heart, data: translateBuckets(props.hrZones) },
      {
        key: 'power',
        label: m.ui_zones_tab_power(),
        icon: Zap,
        data: translateBuckets(props.powerZones),
      },
      {
        key: 'pace',
        label: m.ui_zones_tab_pace(),
        icon: Timer,
        data: translateBuckets(props.paceZones),
      },
    ];
    return all.filter((t) => t.data.length > 0);
  }, [props.hrZones, props.powerZones, props.paceZones]);

  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const resolvedTab = zoneColorMode ?? activeTab ?? tabs[0]?.key;

  if (tabs.length === 0) return null;

  const isCompact = props.mode === 'compact';

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    if (zoneColorMode !== null) setZoneColorMode(newTab as ZoneColorMode);
  };

  return (
    <Tabs value={resolvedTab} onValueChange={handleTabChange} className="h-full flex flex-col">
      {tabs.length > 1 && (
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
      )}
      <div className="flex-1">
        {tabs.map((tab) => (
          <TabsContent key={tab.key} value={tab.key} className="mt-0 h-full">
            <ZoneBarChart data={tab.data} compact={isCompact} />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
};

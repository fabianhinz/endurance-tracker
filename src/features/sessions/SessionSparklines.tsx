import { LineChart, Line, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Typography } from '@/components/ui/Typography.tsx';
import { tokens } from '@/lib/tokens.ts';
import { formatPaceTick } from '@/lib/formatters.ts';
import { chartTheme, formatChartTime } from '@/lib/chartTheme.ts';
import type {
  SparklineData,
  SparklineDomains,
  SparklineSeries,
} from '../map/hooks/useSessionSparklines.ts';
import type { Sport } from '@/engine/types.ts';
import { m } from '@/paraglide/messages.js';
import { Card } from '@/components/ui/Card.tsx';

interface SessionSparklinesProps {
  data: SparklineData | undefined;
  domains: SparklineDomains;
  sport: Sport;
  syncId: string;
}

interface SparklineCardProps {
  label: string;
  series: SparklineSeries | null;
  dataKey: string;
  color: string;
  formatValue: (v: number) => string;
  syncId: string;
  domain: [number, number] | null;
}

const SparklineCard = (props: SparklineCardProps) => (
  <Card>
    <Typography variant="overline" as="p">
      {props.label}
    </Typography>
    <div className="h-20 mt-1">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart syncId={props.syncId} data={props.series?.points ?? []}>
          {props.domain && <YAxis hide domain={props.domain} />}
          <RechartsTooltip
            contentStyle={chartTheme.tooltip.contentStyle}
            labelStyle={chartTheme.tooltip.labelStyle}
            isAnimationActive={chartTheme.tooltip.isAnimationActive}
            separator={chartTheme.tooltip.separator}
            labelFormatter={(_label, payload) => {
              const originalTime = payload[0]?.payload?.originalTime;
              if (originalTime == null) return '';
              return formatChartTime(Number(originalTime));
            }}
          />
          <Line
            dataKey={props.dataKey}
            stroke={props.color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={true}
            name={props.label}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
    {props.series && (
      <Typography variant="caption" as="p" color="textTertiary" className="mt-1 truncate">
        {m.ui_label_min()} {props.formatValue(props.series.min)} · {m.ui_label_avg()}{' '}
        {props.formatValue(props.series.avg)} · {m.ui_label_max()}{' '}
        {props.formatValue(props.series.max)}
      </Typography>
    )}
  </Card>
);

const formatHr = (v: number): string => `${Math.round(v)}`;
const formatPower = (v: number): string => `${Math.round(v)}`;
const formatPace = (v: number): string => formatPaceTick(v);
const formatSpeed = (v: number): string => `${v.toFixed(1)}`;

export const SessionSparklines = (props: SessionSparklinesProps) => {
  const isRunning = props.sport === 'running';

  return (
    <div className="grid grid-cols-3 gap-2 mt-2">
      <SparklineCard
        label={m.ui_sparkline_hr()}
        series={props.data?.hr ?? null}
        dataKey="hr"
        color={tokens.chartHr}
        formatValue={formatHr}
        syncId={props.syncId}
        domain={props.domains.hr}
      />
      <SparklineCard
        label={isRunning ? m.ui_sparkline_pace() : m.ui_sparkline_speed()}
        series={isRunning ? (props.data?.pace ?? null) : (props.data?.speed ?? null)}
        dataKey={isRunning ? 'pace' : 'speed'}
        color={isRunning ? tokens.chartPace : tokens.chartSpeed}
        formatValue={isRunning ? formatPace : formatSpeed}
        syncId={props.syncId}
        domain={isRunning ? props.domains.pace : props.domains.speed}
      />
      {props.data?.power && (
        <SparklineCard
          label={m.ui_sparkline_power()}
          series={props.data.power}
          dataKey="power"
          color={tokens.chartPower}
          formatValue={formatPower}
          syncId={props.syncId}
          domain={props.domains.power}
        />
      )}
    </div>
  );
};

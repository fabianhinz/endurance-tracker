import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { usePopupPosition } from './hooks/usePopupPosition.ts';
import { useDismiss } from './hooks/useDismiss.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { filterRecordsByLap } from '@/engine/laps.ts';
import {
  prepareHrData,
  preparePowerData,
  prepareSpeedData,
  preparePaceData,
} from '@/lib/chartData.ts';
import {
  formatPace,
  formatSpeed,
  formatLapTime,
  formatDistance,
  formatPaceTick,
} from '@/lib/utils.ts';
import { chartTheme, formatChartTime } from '@/lib/chartTheme.ts';
import { tokens } from '@/lib/tokens.ts';
import type { SessionLap, SessionRecord, Sport } from '@/engine/types.ts';
import type { LapAnalysis, LapRecordEnrichment } from '@/engine/laps.ts';
import { m } from '@/paraglide/messages.js';

export interface LapPopupInfo {
  x: number;
  y: number;
}

interface LapPickPopupProps {
  info: LapPopupInfo;
  laps: SessionLap[];
  records: SessionRecord[];
  sport: Sport;
  onClose: () => void;
}

interface LapChartPoint {
  time: number;
  hr?: number;
  pace?: number;
  speed?: number;
  power?: number;
}

const buildLapChartData = (lapRecords: SessionRecord[], isRunning: boolean): LapChartPoint[] => {
  if (lapRecords.length === 0) return [];

  const byTime = new Map<number, LapChartPoint>();
  const ensure = (t: number) => {
    if (!byTime.has(t)) byTime.set(t, { time: t });
    return byTime.get(t)!;
  };

  for (const p of prepareHrData(lapRecords)) ensure(p.time).hr = p.hr;
  for (const p of preparePowerData(lapRecords)) ensure(p.time).power = p.power;
  if (isRunning) {
    for (const p of preparePaceData(lapRecords)) ensure(p.time).pace = p.pace;
  } else {
    for (const p of prepareSpeedData(lapRecords)) ensure(p.time).speed = p.speed;
  }

  return [...byTime.values()].sort((a, b) => a.time - b.time);
};

const formatPaceOrSpeed = (lap: LapAnalysis, isRunning: boolean): string => {
  if (lap.paceSecPerKm === undefined) return '--';
  if (isRunning) return formatPace(lap.paceSecPerKm);
  const speedMs = 1000 / lap.paceSecPerKm;
  return formatSpeed(speedMs);
};

/**
 * Gets lap records for the chart. For device laps uses time-based filtering,
 * for dynamic laps uses distance-based slicing.
 */
const getLapRecords = (
  clickedLapIndex: number,
  records: SessionRecord[],
  laps: SessionLap[],
  splitDistance: number | null,
): SessionRecord[] => {
  if (records.length === 0) return [];

  if (splitDistance != null) {
    const withDistance = records.filter((r) => r.distance !== undefined);
    if (withDistance.length < 2) return [];
    const firstDist = withDistance[0].distance ?? 0;
    const lapStart = firstDist + clickedLapIndex * splitDistance;
    const lapEnd = lapStart + splitDistance;
    return withDistance.filter((r) => r.distance! >= lapStart && r.distance! < lapEnd);
  }

  const lap = laps[clickedLapIndex];
  if (!lap) return [];
  const sessionStartMs = laps[0].startTime;
  return filterRecordsByLap(records, lap, sessionStartMs);
};

export const LapPickPopup = (props: LapPickPopupProps) => {
  const popupRef = useDismiss(props.onClose);
  const style = usePopupPosition(props.info.x, props.info.y);
  const clickedLapIndex = useMapFocusStore((s) => s.clickedLapIndex);
  const activeLapAnalysis = useMapFocusStore((s) => s.activeLapAnalysis);
  const activeLapEnrichments = useMapFocusStore((s) => s.activeLapEnrichments);
  const activeSplitDistance = useMapFocusStore((s) => s.activeSplitDistance);

  const isRunning = props.sport === 'running';

  const analysis: LapAnalysis | undefined =
    clickedLapIndex != null ? activeLapAnalysis[clickedLapIndex] : undefined;
  const enrichment: LapRecordEnrichment | undefined =
    clickedLapIndex != null ? activeLapEnrichments[clickedLapIndex] : undefined;

  const chartData = useMemo(() => {
    if (clickedLapIndex == null) return [];
    const lapRecords = getLapRecords(
      clickedLapIndex,
      props.records,
      props.laps,
      activeSplitDistance,
    );
    return buildLapChartData(lapRecords, isRunning);
  }, [clickedLapIndex, props.records, props.laps, activeSplitDistance, isRunning]);

  if (clickedLapIndex == null || !analysis) {
    return null;
  }

  const lapNumber = clickedLapIndex + 1;
  const totalLaps = activeLapAnalysis.length;
  const hasChartData = chartData.length > 0;
  const hasHrData = chartData.some((p) => p.hr !== undefined);
  const hasPaceOrSpeed = chartData.some((p) => p.pace !== undefined || p.speed !== undefined);
  const hasPowerData = chartData.some((p) => p.power !== undefined);
  const hasPower = enrichment?.avgPower !== undefined;
  const hasCadence = analysis.avgCadence !== undefined;
  const hasElevation = analysis.elevationGain > 0;

  return (
    <div ref={popupRef} style={style}>
      <Card variant="compact" className="w-[380px] max-h-[420px] flex flex-col overflow-hidden">
        <CardHeader
          title={m.ui_lap_popup_title({
            current: lapNumber,
            total: totalLaps,
          })}
          actions={
            <Button
              variant="ghost"
              size="icon"
              aria-label={m.ui_btn_close()}
              onClick={props.onClose}
            >
              <X size={16} />
            </Button>
          }
        />

        {hasChartData && (hasHrData || hasPaceOrSpeed || hasPowerData) && (
          <div className="h-[200px] px-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />
                <XAxis
                  dataKey="time"
                  tick={chartTheme.tick}
                  ticks={[chartData[0]?.time ?? 0, chartData[chartData.length - 1]?.time ?? 0]}
                  tickLine={false}
                  axisLine={chartTheme.axisLine}
                  tickFormatter={formatChartTime}
                />
                {(hasHrData || hasPowerData) && (
                  <YAxis
                    yAxisId="left"
                    tick={chartTheme.tick}
                    tickLine={false}
                    axisLine={false}
                    width={35}
                    tickCount={3}
                  />
                )}
                {hasPaceOrSpeed && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={chartTheme.tick}
                    tickLine={false}
                    axisLine={false}
                    width={35}
                    tickCount={3}
                    reversed={isRunning}
                    tickFormatter={isRunning ? formatPaceTick : (v: number) => `${v}`}
                  />
                )}
                <RechartsTooltip
                  contentStyle={chartTheme.tooltip.contentStyle}
                  labelStyle={chartTheme.tooltip.labelStyle}
                  isAnimationActive={chartTheme.tooltip.isAnimationActive}
                  separator={chartTheme.tooltip.separator}
                  labelFormatter={(v) => formatChartTime(Number(v))}
                />
                {hasHrData && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="hr"
                    stroke={tokens.chartHr}
                    dot={false}
                    strokeWidth={1.5}
                    name={m.ui_chart_series_hr()}
                  />
                )}
                {hasPowerData && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="power"
                    stroke={tokens.chartPower}
                    dot={false}
                    strokeWidth={1.5}
                    name={m.ui_chart_series_power()}
                  />
                )}
                {isRunning && hasPaceOrSpeed && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="pace"
                    stroke={tokens.chartPace}
                    dot={false}
                    strokeWidth={1.5}
                    name={m.ui_chart_series_pace()}
                  />
                )}
                {!isRunning && hasPaceOrSpeed && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="speed"
                    stroke={tokens.chartSpeed}
                    dot={false}
                    strokeWidth={1.5}
                    name={m.ui_chart_series_speed()}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs tabular-nums">
            <thead>
              <tr className="text-text-tertiary">
                <th className="px-2 py-1 text-right font-medium">{m.ui_laps_col_distance()}</th>
                <th className="px-2 py-1 text-right font-medium">{m.ui_laps_col_time()}</th>
                <th className="px-2 py-1 text-right font-medium">
                  {isRunning ? m.ui_laps_col_pace() : m.ui_laps_col_speed()}
                </th>
                {analysis.avgHr !== undefined && (
                  <th className="px-2 py-1 text-right font-medium">{m.ui_laps_col_avg_hr()}</th>
                )}
                {hasPower && (
                  <th className="px-2 py-1 text-right font-medium">{m.ui_laps_col_power()}</th>
                )}
                {hasCadence && (
                  <th className="px-2 py-1 text-right font-medium">{m.ui_laps_col_cadence()}</th>
                )}
                {hasElevation && (
                  <th className="px-2 py-1 text-right font-medium">{m.ui_laps_col_elev()}</th>
                )}
              </tr>
            </thead>
            <tbody>
              <tr className="text-text-primary">
                <td className="px-2 py-1 text-right">{formatDistance(analysis.distance)}</td>
                <td className="px-2 py-1 text-right">{formatLapTime(analysis.duration)}</td>
                <td className="px-2 py-1 text-right">{formatPaceOrSpeed(analysis, isRunning)}</td>
                {analysis.avgHr !== undefined && (
                  <td className="px-2 py-1 text-right">{analysis.avgHr}</td>
                )}
                {hasPower && <td className="px-2 py-1 text-right">{enrichment.avgPower} W</td>}
                {hasCadence && <td className="px-2 py-1 text-right">{analysis.avgCadence}</td>}
                {hasElevation && (
                  <td className="px-2 py-1 text-right">{Math.round(analysis.elevationGain)} m</td>
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

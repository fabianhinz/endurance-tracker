import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { glassClass } from '@/components/ui/Card.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { cn } from '@/lib/utils.ts';
import { formatDistance, formatLapTime, formatPace, formatSpeed } from '@/lib/utils.ts';
import type { LapAnalysis, LapRecordEnrichment } from '@/engine/laps.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { m } from '@/paraglide/messages.js';

interface LapDetailTableProps {
  laps: LapAnalysis[];
  isRunning: boolean;
  enrichments?: Map<number, LapRecordEnrichment>;
}

const COLLAPSED_COUNT = 6;

const formatPaceOrSpeed = (lap: LapAnalysis, isRunning: boolean): string => {
  if (lap.paceSecPerKm === undefined) return '--';
  if (isRunning) return formatPace(lap.paceSecPerKm);
  const speedMs = 1000 / lap.paceSecPerKm;
  return formatSpeed(speedMs);
};

export const LapDetailTable = (props: LapDetailTableProps) => {
  const [expanded, setExpanded] = useState(false);
  const hoveredLapIndex = useMapFocusStore((s) => s.hoveredLapIndex);
  const setHoveredLapIndex = useMapFocusStore((s) => s.setHoveredLapIndex);
  const clearHoveredLapIndex = useMapFocusStore((s) => s.clearHoveredLapIndex);
  const needsToggle = props.laps.length > COLLAPSED_COUNT;
  const visibleLaps = needsToggle && !expanded ? props.laps.slice(0, COLLAPSED_COUNT) : props.laps;

  const hasCadence = props.laps.some((l) => l.avgCadence !== undefined);
  const hasElevation = props.laps.some((l) => l.elevationGain > 0);
  const hasPower = props.enrichments
    ? [...props.enrichments.values()].some((e) => e.avgPower !== undefined)
    : false;

  return (
    <div className={cn(glassClass, 'rounded-2xl shadow-lg overflow-hidden')}>
      <div className="flex items-center px-4 py-2">
        <Typography variant="title" className="flex-1 text-left">
          {m.ui_laps_table_title()}
        </Typography>
        {needsToggle && (
          <Button variant="ghost" size="icon" onClick={() => setExpanded((prev) => !prev)}>
            <Typography variant="caption" color="textSecondary">
              ({props.laps.length})
            </Typography>
            <ChevronRight className={cn('size-4 transition-transform', expanded && 'rotate-90')} />
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead>
            <tr className="text-text-tertiary text-xs">
              <th className="px-3 py-2 text-left font-medium">#</th>
              <th className="px-3 py-2 text-right font-medium">{m.ui_laps_col_distance()}</th>
              <th className="px-3 py-2 text-right font-medium">{m.ui_laps_col_time()}</th>
              <th className="px-3 py-2 text-right font-medium">
                {props.isRunning ? m.ui_laps_col_pace() : m.ui_laps_col_speed()}
              </th>
              <th className="px-3 py-2 text-right font-medium">{m.ui_laps_col_avg_hr()}</th>
              {hasPower && <th className="px-3 py-2 text-right font-medium">{m.ui_laps_col_power()}</th>}
              {hasCadence && <th className="px-3 py-2 text-right font-medium">{m.ui_laps_col_cadence()}</th>}
              {hasElevation && <th className="px-3 py-2 text-right font-medium">{m.ui_laps_col_elev()}</th>}
            </tr>
          </thead>
          <tbody onPointerLeave={clearHoveredLapIndex}>
            {visibleLaps.map((lap) => (
              <tr
                key={lap.lapIndex}
                onPointerEnter={() => setHoveredLapIndex(lap.lapIndex)}
                className={cn(
                  'transition-colors',
                  lap.intensity !== 'active' && 'text-text-quaternary',
                  hoveredLapIndex === lap.lapIndex && 'bg-white/10',
                )}
              >
                <td className="px-3 py-1.5 text-left">{lap.lapIndex + 1}</td>
                <td className="px-3 py-1.5 text-right">{formatDistance(lap.distance)}</td>
                <td className="px-3 py-1.5 text-right">{formatLapTime(lap.duration)}</td>
                <td className="px-3 py-1.5 text-right">
                  {formatPaceOrSpeed(lap, props.isRunning)}
                </td>
                <td className="px-3 py-1.5 text-right">
                  {lap.avgHr !== undefined ? `${lap.avgHr}` : '--'}
                </td>
                {hasPower && (
                  <td className="px-3 py-1.5 text-right">
                    {props.enrichments?.get(lap.lapIndex)?.avgPower !== undefined
                      ? `${props.enrichments.get(lap.lapIndex)!.avgPower} W`
                      : '--'}
                  </td>
                )}
                {hasCadence && (
                  <td className="px-3 py-1.5 text-right">
                    {lap.avgCadence !== undefined ? `${lap.avgCadence}` : '--'}
                  </td>
                )}
                {hasElevation && (
                  <td className="px-3 py-1.5 text-right">
                    {lap.elevationGain > 0 ? `${Math.round(lap.elevationGain)} m` : '--'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

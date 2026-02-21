import { useMemo, useState } from "react";
import type { SessionLap, Sport } from "../../types/index.ts";
import { analyzeLaps } from "../../engine/laps.ts";
import type { LapAnalysis } from "../../engine/laps.ts";
import { Card, glassClass } from "../../components/ui/Card.tsx";
import { Button } from "../../components/ui/Button.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { cn } from "../../lib/utils.ts";
import {
  formatPace,
  formatSpeed,
  formatLapTime,
  formatDistance,
} from "../../lib/utils.ts";

interface LapSplitsSectionProps {
  laps: SessionLap[];
  sport: Sport;
}

export const LapSplitsSection = (props: LapSplitsSectionProps) => {
  const analysis = useMemo(() => analyzeLaps(props.laps), [props.laps]);
  const [expanded, setExpanded] = useState(false);

  if (analysis.length === 0) return null;

  const isRunning = props.sport === "running";
  const hasCadence = analysis.some((l) => l.avgCadence !== undefined);

  // Best/worst: compare only active laps (or all if no intervals)
  const comparableLaps = analysis.filter(
    (l) => l.isInterval || analysis.every((a) => !a.isInterval),
  );
  const lapsWithMetric = comparableLaps.filter((l) =>
    isRunning ? l.paceSecPerKm !== undefined : l.paceSecPerKm !== undefined,
  );

  let bestIdx = -1;
  let worstIdx = -1;
  if (lapsWithMetric.length >= 2) {
    let bestPace = Infinity;
    let worstPace = -Infinity;
    for (const lap of lapsWithMetric) {
      if (lap.paceSecPerKm! < bestPace) {
        bestPace = lap.paceSecPerKm!;
        bestIdx = lap.lapIndex;
      }
      if (lap.paceSecPerKm! > worstPace) {
        worstPace = lap.paceSecPerKm!;
        worstIdx = lap.lapIndex;
      }
    }
  }

  const highlightedLaps = analysis.filter(
    (l) => l.lapIndex === bestIdx || l.lapIndex === worstIdx,
  );
  const visibleLaps = expanded ? analysis : highlightedLaps;
  const hiddenCount = analysis.length - highlightedLaps.length;

  return (
    <Card>
      <Typography variant="overline" as="h3">Lap Splits</Typography>
      <Typography variant="caption" color="quaternary" as="p" className="mt-0.5">
        {expanded
          ? "Per-lap breakdown with pace, HR, and intensity"
          : `Fastest and slowest of ${analysis.length} laps`}
      </Typography>

      {/* Desktop table */}
      <div className="mt-4 hidden lg:block overflow-x-auto">
        <LapSplitsTable
          analysis={visibleLaps}
          isRunning={isRunning}
          hasCadence={hasCadence}
          bestIdx={bestIdx}
          worstIdx={worstIdx}
        />
      </div>

      {/* Mobile card stack */}
      <div className="mt-4 space-y-2 lg:hidden">
        {visibleLaps.map((lap) => (
          <LapSplitCard
            key={lap.lapIndex}
            lap={lap}
            isRunning={isRunning}
            isBest={lap.lapIndex === bestIdx}
            isWorst={lap.lapIndex === worstIdx}
          />
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="mt-2 w-full text-xs text-text-quaternary hover:text-text-tertiary"
      >
        {expanded ? "Show best & worst only" : `+ ${hiddenCount} more laps`}
      </Button>
    </Card>
  );
};

const intensityColor = (intensity: string): string => {
  switch (intensity) {
    case "active":
      return "bg-accent/20 text-accent-hover";
    case "rest":
    case "recovery":
    case "warmup":
    case "cooldown":
      return "bg-white/5 text-text-quaternary";
    default:
      return "bg-white/5 text-text-tertiary";
  }
};

const formatMetric = (
  lap: LapAnalysis,
  isRunning: boolean,
): string | undefined => {
  if (lap.paceSecPerKm === undefined) return undefined;
  if (isRunning) return formatPace(lap.paceSecPerKm);
  // For cycling, convert pace back to speed: 1000 / paceSecPerKm = m/s
  const speedMs = 1000 / lap.paceSecPerKm;
  return formatSpeed(speedMs);
};

const rowClass = (lapIndex: number, bestIdx: number, worstIdx: number): string => {
  if (lapIndex === bestIdx) return "border-l-2 border-status-success";
  if (lapIndex === worstIdx) return "border-l-2 border-status-danger";
  return "border-l-2 border-transparent";
};

const LapSplitsTable = (props: {
  analysis: LapAnalysis[];
  isRunning: boolean;
  hasCadence: boolean;
  bestIdx: number;
  worstIdx: number;
}) => {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-text-tertiary text-xs">
          <th scope="col" className="pb-2 pr-3 text-left font-medium">
            #
          </th>
          <th scope="col" className="pb-2 pr-3 text-right font-medium">
            Dist
          </th>
          <th scope="col" className="pb-2 pr-3 text-right font-medium">
            Time
          </th>
          <th scope="col" className="pb-2 pr-3 text-right font-medium">
            {props.isRunning ? "Pace" : "Speed"}
          </th>
          <th scope="col" className="pb-2 pr-3 text-right font-medium">
            HR
          </th>
          {props.hasCadence && (
            <th scope="col" className="pb-2 pr-3 text-right font-medium">
              Cad
            </th>
          )}
          <th scope="col" className="pb-2 pr-3 text-right font-medium">
            Elev
          </th>
          <th scope="col" className="pb-2 text-right font-medium">
            Int
          </th>
        </tr>
      </thead>
      <tbody>
        {props.analysis.map((lap) => (
          <tr
            key={lap.lapIndex}
            className={cn(
              "text-text-primary",
              rowClass(lap.lapIndex, props.bestIdx, props.worstIdx),
            )}
            aria-label={
              lap.lapIndex === props.bestIdx
                ? `Lap ${lap.lapIndex + 1} — fastest lap`
                : lap.lapIndex === props.worstIdx
                  ? `Lap ${lap.lapIndex + 1} — slowest lap`
                  : undefined
            }
          >
            <td className="py-1.5 pr-3">
              {lap.lapIndex + 1}
              {lap.lapIndex === props.bestIdx && (
                <span className="ml-1 text-xs text-status-success">Best</span>
              )}
              {lap.lapIndex === props.worstIdx && (
                <span className="ml-1 text-xs text-status-danger">Slow</span>
              )}
            </td>
            <td className="py-1.5 pr-3 text-right tabular-nums">
              {formatDistance(lap.distance)}
            </td>
            <td className="py-1.5 pr-3 text-right tabular-nums">
              {formatLapTime(lap.duration)}
            </td>
            <td className="py-1.5 pr-3 text-right tabular-nums">
              {formatMetric(lap, props.isRunning) ?? "—"}
            </td>
            <td className="py-1.5 pr-3 text-right tabular-nums">
              {lap.avgHr ?? "—"}
            </td>
            {props.hasCadence && (
              <td className="py-1.5 pr-3 text-right tabular-nums">
                {lap.avgCadence ?? "—"}
              </td>
            )}
            <td className="py-1.5 pr-3 text-right tabular-nums">
              {lap.elevationGain > 0 ? `+${lap.elevationGain}m` : "—"}
            </td>
            <td className="py-1.5 text-right">
              <span
                className={cn(
                  "inline-block rounded-full px-2 py-0.5 text-xs",
                  intensityColor(lap.intensity),
                )}
                aria-label={`Intensity: ${lap.intensity}`}
              >
                {lap.intensity}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const LapSplitCard = (props: {
  lap: LapAnalysis;
  isRunning: boolean;
  isBest: boolean;
  isWorst: boolean;
}) => {
  return (
    <div
      className={cn(
        `rounded-lg ${glassClass} p-3`,
        props.isBest && "border-l-2 border-l-status-success",
        props.isWorst && "border-l-2 border-l-status-danger",
      )}
      aria-label={
        props.isBest
          ? `Lap ${props.lap.lapIndex + 1} — fastest lap`
          : props.isWorst
            ? `Lap ${props.lap.lapIndex + 1} — slowest lap`
            : undefined
      }
    >
      <div className="flex items-center justify-between">
        <Typography variant="emphasis" as="span">
          Lap {props.lap.lapIndex + 1}
          {props.isBest && (
            <span className="ml-1.5 text-xs text-status-success">Best</span>
          )}
          {props.isWorst && (
            <span className="ml-1.5 text-xs text-status-danger">Slow</span>
          )}
        </Typography>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs",
            intensityColor(props.lap.intensity),
          )}
          aria-label={`Intensity: ${props.lap.intensity}`}
        >
          {props.lap.intensity}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
        <Typography variant="caption" color="tertiary">
          {formatDistance(props.lap.distance)}
        </Typography>
        <Typography variant="caption" color="tertiary">{formatLapTime(props.lap.duration)}</Typography>
        <Typography variant="caption" color="primary">
          {formatMetric(props.lap, props.isRunning) ?? "—"}
        </Typography>
        <Typography variant="caption" color="tertiary">
          {props.lap.avgHr ? `${props.lap.avgHr} bpm` : "—"}
        </Typography>
        {props.lap.avgCadence !== undefined && (
          <Typography variant="caption" color="tertiary">Cad {props.lap.avgCadence}</Typography>
        )}
        {props.lap.elevationGain > 0 && (
          <Typography variant="caption" color="tertiary">+{props.lap.elevationGain}m</Typography>
        )}
      </div>
    </div>
  );
};

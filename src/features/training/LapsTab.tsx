import { useMemo } from "react";
import { Timer, Heart, Zap } from "lucide-react";
import { ChartPreviewCard } from "../../components/ui/ChartPreviewCard.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/ToggleGroup.tsx";
import { analyzeLaps, enrichAllLaps } from "../../engine/laps.ts";
import type { LapAnalysis, LapRecordEnrichment } from "../../engine/laps.ts";
import { computeDynamicLaps, SPLIT_PRESETS } from "../../engine/dynamicLaps.ts";
import { useLapOptionsStore } from "../../store/lapOptions.ts";
import {
  prepareLapSplitsData,
  prepareLapHrData,
  prepareLapPowerData,
} from "../../lib/lapChartData.ts";
import { tokens } from "../../lib/tokens.ts";
import { LapSplitsChart } from "./LapSplitsChart.tsx";
import { LapHrChart } from "./LapHrChart.tsx";
import { LapPowerChart } from "./LapPowerChart.tsx";
import { LapDetailTable } from "./LapDetailTable.tsx";
import type {
  SessionLap,
  SessionRecord,
  TrainingSession,
} from "../../engine/types.ts";

interface LapsTabProps {
  laps: SessionLap[];
  session: TrainingSession;
  records: SessionRecord[];
}

const SYNC_ID = "laps-detail";

const formatSplitLabel = (metres: number): string => {
  return metres >= 1000 ? `${metres / 1000} km` : `${metres} m`;
};

export const LapsTab = (props: LapsTabProps) => {
  const isRunning = props.session.sport === "running";
  const sport = props.session.sport;

  const presets = SPLIT_PRESETS[sport];
  const splitDistance = useLapOptionsStore((s) => s.splitDistance[sport]);
  const setLapSplitDistance = useLapOptionsStore((s) => s.setLapSplitDistance);

  const isDynamic = splitDistance !== undefined;

  const deviceAnalysis = useMemo(() => analyzeLaps(props.laps), [props.laps]);
  const deviceEnrichments = useMemo(
    () => enrichAllLaps(props.laps, props.records),
    [props.laps, props.records],
  );

  const dynamicResult = useMemo(
    () =>
      isDynamic
        ? computeDynamicLaps(props.records, splitDistance)
        : undefined,
    [props.records, splitDistance, isDynamic],
  );

  const analysis: LapAnalysis[] = isDynamic
    ? dynamicResult!.analysis
    : deviceAnalysis;
  const enrichments: LapRecordEnrichment[] = isDynamic
    ? dynamicResult!.enrichments
    : deviceEnrichments;

  const enrichmentMap = useMemo(
    () =>
      new Map<number, LapRecordEnrichment>(
        enrichments.map((e) => [e.lapIndex, e]),
      ),
    [enrichments],
  );
  const splitsData = useMemo(
    () => prepareLapSplitsData(analysis, enrichments),
    [analysis, enrichments],
  );
  const hrData = useMemo(
    () => prepareLapHrData(analysis, enrichments),
    [analysis, enrichments],
  );
  const powerData = useMemo(
    () => prepareLapPowerData(enrichments),
    [enrichments],
  );

  const toggleValue = splitDistance !== undefined ? String(splitDistance) : "device";

  const handleToggle = (value: string) => {
    if (!value) return;
    setLapSplitDistance(sport, value === "device" ? undefined : Number(value));
  };

  const isEmpty = isDynamic ? analysis.length === 0 : props.laps.length === 0;

  if (isEmpty && presets.length === 0) {
    return (
      <Typography variant="body" color="tertiary">
        No lap data available for this session.
      </Typography>
    );
  }

  return (
    <div className="space-y-3">
      {presets.length > 0 && (
        <ToggleGroup type="single" value={toggleValue} onValueChange={handleToggle}>
          <ToggleGroupItem value="device">Device</ToggleGroupItem>
          {presets.map((m) => (
            <ToggleGroupItem key={m} value={String(m)}>
              {formatSplitLabel(m)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}

      {isEmpty ? (
        <Typography variant="body" color="tertiary">
          {isDynamic
            ? "No distance data available in records for split computation."
            : "No lap data available for this session."}
        </Typography>
      ) : (
        <>
          {hrData.length > 0 && (
            <ChartPreviewCard
              title="Heart Rate per Lap"
              icon={Heart}
              color={tokens.chartHr}
            >
              {(mode) => <LapHrChart data={hrData} mode={mode} syncId={SYNC_ID} />}
            </ChartPreviewCard>
          )}

          {powerData.length > 0 && (
            <ChartPreviewCard
              title="Power per Lap"
              icon={Zap}
              color={tokens.chartPower}
            >
              {(mode) => (
                <LapPowerChart data={powerData} mode={mode} syncId={SYNC_ID} />
              )}
            </ChartPreviewCard>
          )}

          {splitsData.length > 0 && (
            <ChartPreviewCard
              title={isRunning ? "Pace per Lap" : "Speed per Lap"}
              icon={Timer}
              color={isRunning ? tokens.chartPace : tokens.chartSpeed}
            >
              {(mode) => (
                <LapSplitsChart
                  data={splitsData}
                  mode={mode}
                  isRunning={isRunning}
                  syncId={SYNC_ID}
                />
              )}
            </ChartPreviewCard>
          )}

          <LapDetailTable
            laps={analysis}
            isRunning={isRunning}
            enrichments={enrichmentMap}
          />
        </>
      )}
    </div>
  );
};

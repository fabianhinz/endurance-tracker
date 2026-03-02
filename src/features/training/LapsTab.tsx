import { useCallback, useEffect, useMemo } from "react";
import { Timer, Heart, Zap } from "lucide-react";
import { ChartPreviewCard } from "../../components/ui/ChartPreviewCard.tsx";
import { analyzeLaps, enrichAllLaps } from "../../engine/laps.ts";
import type { LapAnalysis, LapRecordEnrichment } from "../../engine/laps.ts";
import { computeDynamicLaps } from "../../engine/dynamicLaps.ts";
import { computeLapMarkers } from "../../engine/lapMarkers.ts";
import type { LapMarkerMode } from "../../engine/lapMarkers.ts";
import {
  DEFAULT_CUSTOM_DISTANCE,
  useLapOptionsStore,
} from "../../store/lapOptions.ts";
import { useMapFocusStore } from "../../store/mapFocus.ts";
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
import { SplitDistanceCard } from "./SplitDistanceCard.tsx";
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

export const LapsTab = (props: LapsTabProps) => {
  const isRunning = props.session.sport === "running";
  const sport = props.session.sport;

  const splitDistance = useLapOptionsStore((s) => s.splitDistance[sport]);
  const useDeviceDefaults = useLapOptionsStore(
    (s) => s.useDeviceLaps[sport] ?? true,
  );

  const deviceAnalysis = useMemo(() => analyzeLaps(props.laps), [props.laps]);
  const deviceEnrichments = useMemo(
    () => enrichAllLaps(props.laps, props.records),
    [props.laps, props.records],
  );

  const dynamicResult = useMemo(
    () =>
      useDeviceDefaults
        ? undefined
        : computeDynamicLaps(
            props.records,
            splitDistance ?? DEFAULT_CUSTOM_DISTANCE[sport],
          ),
    [props.records, splitDistance, useDeviceDefaults, sport],
  );

  const analysis: LapAnalysis[] = useDeviceDefaults
    ? deviceAnalysis
    : dynamicResult!.analysis;
  const enrichments: LapRecordEnrichment[] = useDeviceDefaults
    ? deviceEnrichments
    : dynamicResult!.enrichments;

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

  const setLapMarkers = useMapFocusStore((s) => s.setLapMarkers);
  const clearLapMarkers = useMapFocusStore((s) => s.clearLapMarkers);
  const setHoveredLapIndex = useMapFocusStore((s) => s.setHoveredLapIndex);
  const clearHoveredLapIndex = useMapFocusStore((s) => s.clearHoveredLapIndex);

  const handleActiveLapChange = useCallback(
    (lapIndex: number | null) => {
      if (lapIndex != null) {
        setHoveredLapIndex(lapIndex);
      } else {
        clearHoveredLapIndex();
      }
    },
    [setHoveredLapIndex, clearHoveredLapIndex],
  );

  const markerMode = useMemo((): LapMarkerMode | undefined => {
    if (useDeviceDefaults) {
      return {
        kind: "device",
        laps: props.laps,
        sessionStartMs: props.laps[0].startTime,
      };
    }
    return {
      kind: "dynamic",
      splitDistanceMetres: splitDistance ?? DEFAULT_CUSTOM_DISTANCE[sport],
    };
  }, [props.laps, splitDistance, sport, useDeviceDefaults]);

  useEffect(() => {
    if (markerMode) {
      const markers = computeLapMarkers(props.records, markerMode);
      setLapMarkers(markers);
    } else {
      clearLapMarkers();
    }
    return () => {
      clearLapMarkers();
      clearHoveredLapIndex();
    };
  }, [props.records, markerMode, setLapMarkers, clearLapMarkers, clearHoveredLapIndex]);

  return (
    <div className="space-y-3">
      <SplitDistanceCard
        sport={sport}
        maxKm={Math.max(1, Math.ceil((props.session.distance ?? 0) / 1000))}
      />

      {hrData.length > 0 && (
        <ChartPreviewCard
          title="Heart Rate per Lap"
          icon={Heart}
          color={tokens.chartHr}
        >
          {(mode) => <LapHrChart data={hrData} mode={mode} syncId={SYNC_ID} onActiveLapChange={handleActiveLapChange} />}
        </ChartPreviewCard>
      )}

      {powerData.length > 0 && (
        <ChartPreviewCard
          title="Power per Lap"
          icon={Zap}
          color={tokens.chartPower}
        >
          {(mode) => (
            <LapPowerChart data={powerData} mode={mode} syncId={SYNC_ID} onActiveLapChange={handleActiveLapChange} />
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
              onActiveLapChange={handleActiveLapChange}
            />
          )}
        </ChartPreviewCard>
      )}

      <LapDetailTable
        laps={analysis}
        isRunning={isRunning}
        enrichments={enrichmentMap}
      />
    </div>
  );
};

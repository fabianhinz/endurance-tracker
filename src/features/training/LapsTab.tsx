import { useCallback, useEffect, useMemo } from "react";
import { Timer, Heart, Zap } from "lucide-react";
import { Card } from "../../components/ui/Card.tsx";
import { CardHeader } from "../../components/ui/CardHeader.tsx";
import { ChartPreviewCard } from "../../components/ui/ChartPreviewCard.tsx";
import { Slider } from "../../components/ui/Slider.tsx";
import { Switch } from "../../components/ui/Switch.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { analyzeLaps, enrichAllLaps } from "../../engine/laps.ts";
import type { LapAnalysis, LapRecordEnrichment } from "../../engine/laps.ts";
import { computeDynamicLaps } from "../../engine/dynamicLaps.ts";
import { computeLapMarkers } from "../../engine/lapMarkers.ts";
import type { LapMarkerMode } from "../../engine/lapMarkers.ts";
import type { Sport } from "../../engine/types.ts";
import { useLapOptionsStore } from "../../store/lapOptions.ts";
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

const DEFAULT_CUSTOM_DISTANCE: Record<Sport, number> = {
  running: 1000,
  cycling: 5000,
  swimming: 500,
};

const formatDistanceKm = (metres: number): string => {
  const km = metres / 1000;
  return km % 1 === 0 ? `${km} km` : `${km.toFixed(1)} km`;
};

export const LapsTab = (props: LapsTabProps) => {
  const isRunning = props.session.sport === "running";
  const sport = props.session.sport;

  const splitDistance = useLapOptionsStore((s) => s.splitDistance[sport]);
  const lastCustomDistance = useLapOptionsStore(
    (s) => s.lastCustomDistance[sport],
  );
  const setLapSplitDistance = useLapOptionsStore((s) => s.setLapSplitDistance);

  const isDynamic = splitDistance !== undefined;
  const isDevice = !isDynamic;
  const maxKm = Math.max(1, Math.ceil((props.session.distance ?? 0) / 1000));
  const sliderValueKm = isDynamic
    ? splitDistance / 1000
    : (lastCustomDistance ?? DEFAULT_CUSTOM_DISTANCE[sport]) / 1000;

  const handleDeviceToggle = useCallback(
    (checked: boolean) => {
      if (checked) {
        setLapSplitDistance(sport, undefined);
      } else {
        const restored = lastCustomDistance ?? DEFAULT_CUSTOM_DISTANCE[sport];
        setLapSplitDistance(sport, restored);
      }
    },
    [sport, lastCustomDistance, setLapSplitDistance],
  );

  const handleSliderChange = useCallback(
    (value: number[]) => {
      setLapSplitDistance(sport, Math.round(value[0] * 1000));
    },
    [sport, setLapSplitDistance],
  );

  const deviceAnalysis = useMemo(() => analyzeLaps(props.laps), [props.laps]);
  const deviceEnrichments = useMemo(
    () => enrichAllLaps(props.laps, props.records),
    [props.laps, props.records],
  );

  const dynamicResult = useMemo(
    () =>
      isDynamic ? computeDynamicLaps(props.records, splitDistance) : undefined,
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

  const setLapMarkers = useMapFocusStore((s) => s.setLapMarkers);
  const clearLapMarkers = useMapFocusStore((s) => s.clearLapMarkers);

  const markerMode = useMemo((): LapMarkerMode | undefined => {
    if (isDynamic) {
      return { kind: "dynamic", splitDistanceMetres: splitDistance };
    }
    if (props.laps.length > 0) {
      return {
        kind: "device",
        laps: props.laps,
        sessionStartMs: props.laps[0].startTime,
      };
    }
    return undefined;
  }, [isDynamic, splitDistance, props.laps]);

  useEffect(() => {
    if (markerMode) {
      const markers = computeLapMarkers(props.records, markerMode);
      setLapMarkers(markers);
    } else {
      clearLapMarkers();
    }
    return () => clearLapMarkers();
  }, [props.records, markerMode, setLapMarkers, clearLapMarkers]);

  const isEmpty = isDynamic ? analysis.length === 0 : props.laps.length === 0;

  return (
    <div className="space-y-3">
      <Card
        footer={
          <Typography variant="caption" color="tertiary" as="p">
            Custom splits divide the route into equal-distance segments. Device
            uses the laps recorded by your watch or bike computer.
          </Typography>
        }
      >
        <CardHeader
          title="Split Distance"
          subtitle={
            isDevice
              ? "Using device-recorded laps"
              : `${formatDistanceKm(splitDistance)} splits`
          }
          actions={
            <div className="flex items-center gap-2">
              <Typography variant="caption" color="tertiary">
                Device
              </Typography>
              <Switch checked={isDevice} onCheckedChange={handleDeviceToggle} />
            </div>
          }
        />
        <div className="space-y-2">
          <Slider
            value={[sliderValueKm]}
            onValueChange={handleSliderChange}
            min={0.1}
            max={maxKm}
            step={0.1}
            disabled={isDevice}
          />
          <div className="flex justify-between">
            <Typography variant="caption" color="quaternary">
              0.1 km
            </Typography>
            <Typography variant="caption" color="quaternary">
              {maxKm} km
            </Typography>
          </div>
        </div>
      </Card>

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
              {(mode) => (
                <LapHrChart data={hrData} mode={mode} syncId={SYNC_ID} />
              )}
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

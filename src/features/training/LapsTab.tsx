import { useMemo } from "react";
import { Timer, Heart, Zap } from "lucide-react";
import { ChartPreviewCard } from "../../components/ui/ChartPreviewCard.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { analyzeLaps, enrichAllLaps } from "../../engine/laps.ts";
import type { LapRecordEnrichment } from "../../engine/laps.ts";
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

export const LapsTab = (props: LapsTabProps) => {
  const isRunning = props.session.sport === "running";

  const analysis = useMemo(
    () => analyzeLaps(props.laps),
    [props.laps],
  );
  const enrichments = useMemo(
    () => enrichAllLaps(props.laps, props.records),
    [props.laps, props.records],
  );
  const enrichmentMap = useMemo(
    () => new Map<number, LapRecordEnrichment>(enrichments.map((e) => [e.lapIndex, e])),
    [enrichments],
  );
  const splitsData = useMemo(
    () => prepareLapSplitsData(analysis, enrichments),
    [analysis, enrichments],
  );
  const hrData = useMemo(
    () => prepareLapHrData(analysis),
    [analysis],
  );
  const powerData = useMemo(
    () => prepareLapPowerData(enrichments),
    [enrichments],
  );

  if (props.laps.length === 0) {
    return (
      <Typography variant="body" color="tertiary">
        No lap data available for this session.
      </Typography>
    );
  }

  return (
    <div className="space-y-3">
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

      {hrData.length > 0 && (
        <ChartPreviewCard
          title="Heart Rate per Lap"
          icon={Heart}
          color={tokens.chartHr}
        >
          {(mode) => (
            <LapHrChart
              data={hrData}
              mode={mode}
              syncId={SYNC_ID}
            />
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
            <LapPowerChart
              data={powerData}
              mode={mode}
              syncId={SYNC_ID}
            />
          )}
        </ChartPreviewCard>
      )}

      <LapDetailTable laps={analysis} isRunning={isRunning} enrichments={enrichmentMap} />
    </div>
  );
};

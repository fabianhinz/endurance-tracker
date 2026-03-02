import { useMemo } from "react";
import { Timer, Heart } from "lucide-react";
import { ChartPreviewCard } from "../../components/ui/ChartPreviewCard.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { analyzeLaps } from "../../engine/laps.ts";
import {
  prepareLapSplitsData,
  prepareLapHrData,
} from "../../lib/lapChartData.ts";
import { tokens } from "../../lib/tokens.ts";
import { LapSplitsChart } from "./LapSplitsChart.tsx";
import { LapHrChart } from "./LapHrChart.tsx";
import { LapDetailTable } from "./LapDetailTable.tsx";
import type {
  SessionLap,
  TrainingSession,
} from "../../engine/types.ts";

interface LapsTabProps {
  laps: SessionLap[];
  session: TrainingSession;
}

const SYNC_ID = "laps-detail";

export const LapsTab = (props: LapsTabProps) => {
  const isRunning = props.session.sport === "running";

  const analysis = useMemo(
    () => analyzeLaps(props.laps),
    [props.laps],
  );
  const splitsData = useMemo(
    () => prepareLapSplitsData(analysis),
    [analysis],
  );
  const hrData = useMemo(
    () => prepareLapHrData(analysis),
    [analysis],
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

      <LapDetailTable laps={analysis} isRunning={isRunning} />
    </div>
  );
};

import { useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "../../components/ui/Button.tsx";
import { Card } from "../../components/ui/Card.tsx";
import { CardHeader } from "../../components/ui/CardHeader.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { usePopupPosition } from "./hooks/usePopupPosition.ts";
import { useDismiss } from "./hooks/useDismiss.ts";
import { analyzeLaps } from "../../engine/laps.ts";
import { computeRunningZones } from "../../engine/zones.ts";
import { useUserStore } from "../../store/user.ts";
import {
  formatPace,
  formatSpeed,
  formatLapTime,
  formatDistance,
} from "../../lib/utils.ts";
import type { SessionLap, Sport, RunningZone } from "../../engine/types.ts";
import type { LapAnalysis } from "../../engine/laps.ts";

export interface LapPopupInfo {
  x: number;
  y: number;
}

interface LapPickPopupProps {
  info: LapPopupInfo;
  laps: SessionLap[];
  sport: Sport;
  onClose: () => void;
}

const formatPaceOrSpeed = (
  lap: LapAnalysis,
  isRunning: boolean,
): string | undefined => {
  if (lap.paceSecPerKm === undefined) return undefined;
  if (isRunning) return formatPace(lap.paceSecPerKm);
  const speedMs = 1000 / lap.paceSecPerKm;
  return formatSpeed(speedMs);
};

interface LapPickItemProps {
  lap: LapAnalysis;
  isRunning: boolean;
  zones: RunningZone[] | null;
}

const LapPickItem = (props: LapPickItemProps) => {
  const paceOrSpeed = formatPaceOrSpeed(props.lap, props.isRunning);

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2">
      <Typography
        variant="emphasis"
        className="w-5 shrink-0 text-center"
        tabularNums
      >
        {props.lap.lapIndex + 1}
      </Typography>
      <div className="flex-1 min-w-0">
        <Typography variant="emphasis" tabularNums>
          {formatDistance(props.lap.distance)}
        </Typography>
        <Typography variant="caption" as="p" tabularNums>
          {formatLapTime(props.lap.duration)}
          {paceOrSpeed && <> &middot; {paceOrSpeed}</>}
          {props.lap.avgHr !== undefined && (
            <> &middot; {props.lap.avgHr} bpm</>
          )}
        </Typography>
      </div>
    </div>
  );
};

export const LapPickPopup = (props: LapPickPopupProps) => {
  const popupRef = useDismiss(props.onClose);

  const style = usePopupPosition(props.info.x, props.info.y);
  const analysis = useMemo(() => analyzeLaps(props.laps), [props.laps]);
  const isRunning = props.sport === "running";
  const thresholdPace = useUserStore(
    (s) => s.profile?.thresholds.thresholdPace,
  );
  const zones = useMemo(
    () =>
      isRunning && thresholdPace ? computeRunningZones(thresholdPace) : null,
    [isRunning, thresholdPace],
  );

  return (
    <div ref={popupRef} style={style}>
      <Card
        variant="compact"
        className="w-[380px] max-h-[300px] flex flex-col overflow-hidden"
      >
        <CardHeader
          title={`${analysis.length} Laps`}
          actions={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close"
              onClick={props.onClose}
            >
              <X size={16} />
            </Button>
          }
        />

        <div className="space-y-0.5 overflow-y-auto min-h-0">
          {analysis.map((lap) => (
            <LapPickItem
              key={lap.lapIndex}
              lap={lap}
              isRunning={isRunning}
              zones={zones}
            />
          ))}
        </div>
      </Card>
    </div>
  );
};

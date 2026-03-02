import { useCallback, useState, useTransition } from "react";
import { Card } from "../../components/ui/Card.tsx";
import { CardHeader } from "../../components/ui/CardHeader.tsx";
import { Slider } from "../../components/ui/Slider.tsx";
import { Switch } from "../../components/ui/Switch.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import type { Sport } from "../../engine/types.ts";
import {
  DEFAULT_CUSTOM_DISTANCE,
  useLapOptionsStore,
} from "../../store/lapOptions.ts";

const formatDistanceKm = (metres: number): string => {
  const km = metres / 1000;
  return km % 1 === 0 ? `${km} km` : `${km.toFixed(1)} km`;
};

interface SplitDistanceCardProps {
  sport: Sport;
  maxKm: number;
}

export const SplitDistanceCard = (props: SplitDistanceCardProps) => {
  const isDevice = useLapOptionsStore(
    (s) => s.useDeviceLaps[props.sport] ?? true,
  );
  const setLapSplitDistance = useLapOptionsStore((s) => s.setLapSplitDistance);
  const setUseDeviceLaps = useLapOptionsStore((s) => s.setUseDeviceLaps);

  const [, startTransition] = useTransition();
  const [localSliderKm, setLocalSliderKm] = useState(
    () =>
      (useLapOptionsStore.getState().splitDistance[props.sport] ??
        DEFAULT_CUSTOM_DISTANCE[props.sport]) / 1000,
  );

  const handleDeviceToggle = useCallback(
    (checked: boolean) => {
      setUseDeviceLaps(props.sport, checked);
    },
    [props.sport, setUseDeviceLaps],
  );

  const handleSliderChange = useCallback(
    (value: number[]) => {
      const km = value[0];
      setLocalSliderKm(km);
      startTransition(() => {
        setLapSplitDistance(props.sport, Math.round(km * 1000));
      });
    },
    [props.sport, setLapSplitDistance, startTransition],
  );

  return (
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
            : `${formatDistanceKm(Math.round(localSliderKm * 1000))} splits`
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
          value={[localSliderKm]}
          onValueChange={handleSliderChange}
          min={1}
          max={props.maxKm}
          step={0.5}
          disabled={isDevice}
        />
        <div className="flex justify-between">
          <Typography variant="caption" color="quaternary">
            1 km
          </Typography>
          <Typography variant="caption" color="quaternary">
            {props.maxKm} km
          </Typography>
        </div>
      </div>
    </Card>
  );
};

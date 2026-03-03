import { useState, useTransition } from 'react';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { Slider } from '@/components/ui/Slider.tsx';
import { Switch } from '@/components/ui/Switch.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import type { Sport } from '@/engine/types.ts';

const formatDistanceKm = (metres: number): string => {
  const km = metres / 1000;
  return km % 1 === 0 ? `${km} km` : `${km.toFixed(1)} km`;
};

interface SplitDistanceCardProps {
  sport: Sport;
  maxKm: number;
  isDevice: boolean;
  splitDistance: number;
  onDeviceToggle: (checked: boolean) => void;
  onSplitDistanceChange: (distance: number) => void;
}

export const SplitDistanceCard = (props: SplitDistanceCardProps) => {
  const [, startTransition] = useTransition();
  const [localSliderKm, setLocalSliderKm] = useState(() => props.splitDistance / 1000);

  const handleSliderChange = (value: number[]) => {
    const km = value[0];
    setLocalSliderKm(km);
    startTransition(() => {
      props.onSplitDistanceChange(Math.round(km * 1000));
    });
  };

  return (
    <Card
      footer={
        <Typography variant="caption" color="textTertiary" as="p">
          Custom splits divide the route into equal-distance segments. Device uses the laps recorded
          by your watch or bike computer.
        </Typography>
      }
    >
      <CardHeader
        title="Split Distance"
        subtitle={
          props.isDevice
            ? 'Using device-recorded laps'
            : `${formatDistanceKm(Math.round(localSliderKm * 1000))} splits`
        }
        actions={
          <div className="flex items-center gap-2">
            <Typography variant="caption" color="textTertiary">
              Device
            </Typography>
            <Switch checked={props.isDevice} onCheckedChange={props.onDeviceToggle} />
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
          disabled={props.isDevice}
        />
        <div className="flex justify-between">
          <Typography variant="caption" color="textQuaternary">
            1 km
          </Typography>
          <Typography variant="caption" color="textQuaternary">
            {props.maxKm} km
          </Typography>
        </div>
      </div>
    </Card>
  );
};

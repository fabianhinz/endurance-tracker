import { useState, useMemo } from 'react';
import { m } from '@/paraglide/messages.js';
import type { RaceDistance } from '@/engine/types.ts';
import { RACE_DISTANCE_METERS, thresholdPaceFromRace } from '@/engine/vdot.ts';
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Label } from '@/components/ui/Label.tsx';
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select.tsx';

interface PaceEstimatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (paceSecPerKm: number) => void;
}

const DISTANCE_OPTIONS: Array<{ value: RaceDistance; label: string }> = [
  { value: '5k', label: m.ui_pace_est_5k() },
  { value: '10k', label: m.ui_pace_est_10k() },
  { value: 'half-marathon', label: m.ui_pace_est_half_marathon() },
  { value: 'marathon', label: m.ui_pace_est_marathon() },
];

const usesLongFormat = (distance: RaceDistance): boolean =>
  distance === 'half-marathon' || distance === 'marathon';

const parseRaceTime = (input: string, distance: RaceDistance): number | undefined => {
  if (usesLongFormat(distance)) {
    const match = input.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
    if (!match) return undefined;
    const h = Number(match[1]);
    const m = Number(match[2]);
    const s = Number(match[3]);
    if (m >= 60 || s >= 60) return undefined;
    const total = h * 60 + m + s / 60;
    return total > 0 ? total : undefined;
  }
  const match = input.match(/^(\d{1,3}):(\d{2})$/);
  if (!match) return undefined;
  const m = Number(match[1]);
  const s = Number(match[2]);
  if (s >= 60) return undefined;
  const total = m + s / 60;
  return total > 0 ? total : undefined;
};

export const PaceEstimatorDialog = (props: PaceEstimatorDialogProps) => {
  const [distance, setDistance] = useState<RaceDistance>('5k');
  const [timeInput, setTimeInput] = useState('');

  const result = useMemo(() => {
    const minutes = parseRaceTime(timeInput, distance);
    if (minutes === undefined) return undefined;
    const pace = thresholdPaceFromRace(RACE_DISTANCE_METERS[distance], minutes);
    if (pace < 150 || pace > 540) return undefined;
    return pace;
  }, [timeInput, distance]);

  const handleDistanceChange = (v: string) => {
    setDistance(v as RaceDistance);
    setTimeInput('');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setDistance('5k');
      setTimeInput('');
    }
    props.onOpenChange(open);
  };

  const handleSave = () => {
    if (result === undefined) return;
    props.onSave(result);
    handleOpenChange(false);
  };

  return (
    <DialogRoot open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogTitle>{m.ui_pace_est_title()}</DialogTitle>
        <DialogDescription>{m.ui_pace_est_desc()}</DialogDescription>

        <div className="mt-4 flex flex-col gap-3">
          <div>
            <Label>{m.ui_pace_est_distance()}</Label>
            <SelectRoot value={distance} onValueChange={handleDistanceChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISTANCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </div>

          <div>
            <Label>
              {m.ui_pace_est_race_time({ format: usesLongFormat(distance) ? 'h:mm:ss' : 'mm:ss' })}
            </Label>
            <Input
              type="text"
              placeholder={usesLongFormat(distance) ? '1:45:00' : '20:00'}
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
            />
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => handleOpenChange(false)}>
              {m.ui_btn_cancel()}
            </Button>
            <Button disabled={result === undefined} onClick={handleSave}>
              {m.ui_btn_save()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </DialogRoot>
  );
};

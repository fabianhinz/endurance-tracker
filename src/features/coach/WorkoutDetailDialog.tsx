import { useState } from 'react';
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../../components/ui/Dialog.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Typography } from '../../components/ui/Typography.tsx';
import { formatDuration } from '../../lib/utils.ts';
import { estimateWorkoutDistance } from '../../engine/prescription.ts';
import type { PrescribedWorkout, RunningZone } from '../../types/index.ts';
import { cn, formatPace, formatDistance } from '../../lib/utils.ts';
import { X } from 'lucide-react';

interface WorkoutDetailDialogProps {
  workout: PrescribedWorkout;
  zones: RunningZone[];
  children: React.ReactNode;
}

const STEP_LABELS: Record<string, string> = {
  warmup: 'Warm-up',
  work: 'Work',
  recovery: 'Recovery',
  cooldown: 'Cool-down',
};

export const WorkoutDetailDialog = (props: WorkoutDetailDialogProps) => {
  const [open, setOpen] = useState(false);
  const distance = estimateWorkoutDistance(props.workout, props.zones);

  return (
    <DialogRoot open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {props.children}
      </div>
      <DialogContent>
        <div className="flex items-start justify-between gap-2">
          <div>
            <DialogTitle>{props.workout.title}</DialogTitle>
            <DialogDescription>{props.workout.dayLabel} — {props.workout.date}</DialogDescription>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close">
              <X size={16} />
            </Button>
          </DialogClose>
        </div>

        {props.workout.steps.length > 0 && (
          <div className="mt-4 space-y-1">
            {props.workout.steps.map((s, i) => {
              const zone = props.zones.find((z) => z.name === s.zone);
              return (
                <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-white/5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: zone?.color ?? '#888' }}
                  />
                  <Typography variant="caption" color="secondary" className="w-16 shrink-0">
                    {STEP_LABELS[s.type] ?? s.type}
                  </Typography>
                  {s.repeat && s.repeat > 1 && (
                    <Typography variant="caption" color="primary" className="font-medium shrink-0">
                      {s.repeat}x
                    </Typography>
                  )}
                  <Typography variant="caption" color="tertiary" className="shrink-0">
                    {formatDuration(s.durationSec)}
                  </Typography>
                  <Typography variant="caption" color="quaternary" className={cn("ml-auto text-right shrink-0")}>
                    {formatPace(s.targetPaceMax)} – {formatPace(s.targetPaceMin)}
                  </Typography>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex gap-4 text-sm text-text-tertiary border-t border-white/10 pt-3">
          <span>{formatDuration(props.workout.estimatedDurationSec)}</span>
          <span>{props.workout.estimatedTss} TSS</span>
          <span>{formatDistance(distance)}</span>
        </div>

        <Typography variant="caption" color="quaternary" as="p" className="mt-2">
          {props.workout.rationale}
        </Typography>
      </DialogContent>
    </DialogRoot>
  );
};

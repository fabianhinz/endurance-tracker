import { useState } from 'react';
import { Typography } from '../../components/ui/Typography.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { formatDuration, cn, formatPace, formatDistance } from '../../lib/utils.ts';
import { estimateWorkoutDistance } from '../../engine/prescription.ts';
import type { WeeklyPlan, RunningZone, WorkoutType, PrescribedWorkout } from '../../types/index.ts';
import {
  Moon,
  Footprints,
  Route,
  Gauge,
  Timer,
  Flame,
  BedDouble,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const WORKOUT_ICONS: Record<WorkoutType, LucideIcon> = {
  rest: BedDouble,
  recovery: Moon,
  easy: Footprints,
  'long-run': Route,
  tempo: Gauge,
  'threshold-intervals': Timer,
  'vo2max-intervals': Flame,
};

const STEP_LABELS: Record<string, string> = {
  warmup: 'Warm-up',
  work: 'Work',
  recovery: 'Recovery',
  cooldown: 'Cool-down',
};

interface WeeklyPlanTimelineProps {
  plan: WeeklyPlan;
  zones: RunningZone[];
  today: string;
}

export const WeeklyPlanTimeline = (props: WeeklyPlanTimelineProps) => {
  const today = props.today;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const expandedWorkout = expandedId
    ? props.plan.workouts.find((w) => w.id === expandedId)
    : undefined;

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
        {props.plan.workouts.map((workout) => {
          const isToday = workout.date === today;
          const isExpanded = workout.id === expandedId;
          const Icon = WORKOUT_ICONS[workout.type];
          const primaryZone = workout.steps.length > 0
            ? props.zones.find((z) => z.name === workout.steps.find((s) => s.type === 'work')?.zone)
            : undefined;

          const isRest = workout.type === 'rest';

          return (
            <div
              key={workout.id}
              className={cn(
                'relative flex flex-col items-center gap-1.5 p-3 rounded-xl min-w-[5.5rem] snap-start transition-colors border',
                isRest
                  ? 'opacity-50 bg-white/5'
                  : 'bg-white/5 hover:bg-white/10 cursor-pointer',
                isExpanded
                  ? 'ring-1 ring-accent/50 border-accent'
                  : isToday
                    ? 'border-accent ring-1 ring-accent/30'
                    : 'border-white/10',
              )}
              onClick={isRest ? undefined : () => setExpandedId(isExpanded ? null : workout.id)}
            >
              {primaryZone && (
                <span
                  className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full"
                  style={{ backgroundColor: primaryZone.color }}
                />
              )}

              <Typography variant="caption" color={isToday ? 'primary' : 'tertiary'} className="font-medium">
                {workout.dayLabel.slice(0, 3)}
              </Typography>

              <Icon size={20} className="text-text-secondary" />

              <Typography variant="caption" color="secondary" className="text-center text-[11px] leading-tight min-h-[2em]">
                {workout.title}
              </Typography>

              {!isRest && (
                <div className="flex gap-2 text-[10px] text-text-quaternary">
                  <span>{formatDuration(workout.estimatedDurationSec)}</span>
                  <span>{workout.estimatedTss}T</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {expandedWorkout && (
        <ExpansionPanel workout={expandedWorkout} zones={props.zones} onClose={() => setExpandedId(null)} />
      )}
    </div>
  );
};

const ExpansionPanel = (props: { workout: PrescribedWorkout; zones: RunningZone[]; onClose: () => void }) => {
  const distance = estimateWorkoutDistance(props.workout, props.zones);

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Typography variant="body" color="primary" className="font-medium">
            {props.workout.title}
          </Typography>
          <Typography variant="caption" color="tertiary">
            {props.workout.dayLabel} — {props.workout.date}
          </Typography>
        </div>
        <Button variant="ghost" size="icon" aria-label="Close" onClick={props.onClose}>
          <X size={16} />
        </Button>
      </div>

      {props.workout.steps.length > 0 && (
        <div className="space-y-1">
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
                <Typography variant="caption" color="quaternary" className="ml-auto text-right shrink-0">
                  {formatPace(s.targetPaceMax)} – {formatPace(s.targetPaceMin)}
                </Typography>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-4 text-sm text-text-tertiary border-t border-white/10 pt-3">
        <span>{formatDuration(props.workout.estimatedDurationSec)}</span>
        <span>{props.workout.estimatedTss} TSS</span>
        <span>{formatDistance(distance)}</span>
      </div>

      <Typography variant="caption" color="quaternary" as="p">
        {props.workout.rationale}
      </Typography>
    </div>
  );
};

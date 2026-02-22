import { Typography } from '../../components/ui/Typography.tsx';
import { WorkoutDetailDialog } from './WorkoutDetailDialog.tsx';
import { formatDuration } from '../../lib/utils.ts';
import { cn } from '../../lib/utils.ts';
import type { WeeklyPlan, RunningZone, WorkoutType } from '../../types/index.ts';
import {
  Moon,
  Footprints,
  Route,
  Gauge,
  Timer,
  Flame,
  BedDouble,
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

interface WeeklyPlanTimelineProps {
  plan: WeeklyPlan;
  zones: RunningZone[];
  today: string;
}

export const WeeklyPlanTimeline = (props: WeeklyPlanTimelineProps) => {
  const today = props.today;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
      {props.plan.workouts.map((workout) => {
        const isToday = workout.date === today;
        const Icon = WORKOUT_ICONS[workout.type];
        const primaryZone = workout.steps.length > 0
          ? props.zones.find((z) => z.name === workout.steps.find((s) => s.type === 'work')?.zone)
          : undefined;

        return (
          <WorkoutDetailDialog key={workout.id} workout={workout} zones={props.zones}>
            <div
              className={cn(
                'flex flex-col items-center gap-1.5 p-3 rounded-xl min-w-[5.5rem] snap-start transition-colors',
                'bg-white/5 hover:bg-white/10 border',
                isToday ? 'border-accent ring-1 ring-accent/30' : 'border-white/10',
              )}
            >
              <Typography variant="caption" color={isToday ? 'primary' : 'tertiary'} className="font-medium">
                {workout.dayLabel.slice(0, 3)}
              </Typography>

              <div className="relative">
                <Icon size={20} className="text-text-secondary" />
                {primaryZone && (
                  <span
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full"
                    style={{ backgroundColor: primaryZone.color }}
                  />
                )}
              </div>

              <Typography variant="caption" color="secondary" className="text-center text-[11px] leading-tight min-h-[2em]">
                {workout.title}
              </Typography>

              {workout.type !== 'rest' && (
                <div className="flex gap-2 text-[10px] text-text-quaternary">
                  <span>{formatDuration(workout.estimatedDurationSec)}</span>
                  <span>{workout.estimatedTss}T</span>
                </div>
              )}
            </div>
          </WorkoutDetailDialog>
        );
      })}
    </div>
  );
};

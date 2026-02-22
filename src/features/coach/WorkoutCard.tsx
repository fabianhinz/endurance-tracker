import { Typography } from "../../components/ui/Typography.tsx";
import { formatDuration, cn } from "../../lib/utils.ts";
import { WORKOUT_ICONS } from "./workout-display.ts";
import type { PrescribedWorkout } from "../../types/index.ts";

interface WorkoutCardProps {
  workout: PrescribedWorkout;
  isToday: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

export const WorkoutCard = (props: WorkoutCardProps) => {
  const isRest = props.workout.type === "rest";
  const Icon = WORKOUT_ICONS[props.workout.type];

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-1.5 p-3 rounded-xl flex-1 min-w-[5rem] transition-colors border",
        isRest
          ? "opacity-50 bg-white/5"
          : "bg-white/5 hover:bg-white/10 cursor-pointer",
        props.isExpanded
          ? "border-accent"
          : props.isToday
            ? "border-accent/50"
            : "border-white/10",
      )}
      onClick={isRest ? undefined : props.onToggle}
    >
      <Typography
        variant="caption"
        color={props.isToday ? "primary" : "tertiary"}
        className="font-medium"
      >
        {props.workout.dayLabel.slice(0, 3)}
      </Typography>

      <Icon size={20} className="text-text-secondary" />

      <Typography
        variant="caption"
        color="secondary"
        className="text-center text-[11px] leading-tight min-h-[2em]"
      >
        {props.workout.title}
      </Typography>

      {!isRest && (
        <div className="flex gap-2 text-[10px] text-text-quaternary mt-auto">
          <span>{formatDuration(props.workout.estimatedDurationSec)}</span>
          <span>{props.workout.estimatedTss}T</span>
        </div>
      )}
    </div>
  );
};

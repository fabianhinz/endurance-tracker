import { useState } from "react";
import { Typography } from "../../components/ui/Typography.tsx";
import { formatDuration, cn } from "../../lib/utils.ts";
import { WORKOUT_ICONS } from "./workout-display.ts";
import { WorkoutExpansionPanel } from "./WorkoutExpansionPanel.tsx";
import type { WeeklyPlan, RunningZone } from "../../types/index.ts";

interface WeeklyPlanTimelineProps {
  plan: WeeklyPlan;
  zones: RunningZone[];
  today: string;
}

export const WeeklyPlanTimeline = (props: WeeklyPlanTimelineProps) => {
  const today = props.today;
  const firstTrainingId =
    props.plan.workouts.find((w) => w.type !== "rest")?.id ?? null;
  const [expandedId, setExpandedId] = useState<string | null>(firstTrainingId);

  const expandedWorkout = expandedId
    ? props.plan.workouts.find((w) => w.id === expandedId)
    : undefined;

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {props.plan.workouts.map((workout) => {
          const isToday = workout.date === today;
          const isExpanded = workout.id === expandedId;
          const Icon = WORKOUT_ICONS[workout.type];
          const isRest = workout.type === "rest";

          return (
            <div
              key={workout.id}
              className={cn(
                "relative flex flex-col items-center gap-1.5 p-3 rounded-xl flex-1 transition-colors border",
                isRest
                  ? "opacity-50 bg-white/5"
                  : "bg-white/5 hover:bg-white/10 cursor-pointer",
                isExpanded
                  ? "border-accent"
                  : isToday
                    ? "border-accent/50"
                    : "border-white/10",
              )}
              onClick={
                isRest
                  ? undefined
                  : () => setExpandedId(isExpanded ? null : workout.id)
              }
            >
              <Typography
                variant="caption"
                color={isToday ? "primary" : "tertiary"}
                className="font-medium"
              >
                {workout.dayLabel.slice(0, 3)}
              </Typography>

              <Icon size={20} className="text-text-secondary" />

              <Typography
                variant="caption"
                color="secondary"
                className="text-center text-[11px] leading-tight min-h-[2em]"
              >
                {workout.title}
              </Typography>

              {!isRest && (
                <div className="flex gap-2 text-[10px] text-text-quaternary mt-auto">
                  <span>{formatDuration(workout.estimatedDurationSec)}</span>
                  <span>{workout.estimatedTss}T</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {expandedWorkout && (
        <WorkoutExpansionPanel
          workout={expandedWorkout}
          zones={props.zones}
          onClose={() => setExpandedId(null)}
        />
      )}
    </div>
  );
};

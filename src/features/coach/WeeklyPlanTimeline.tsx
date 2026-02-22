import { useState } from "react";
import { WorkoutCard } from "./WorkoutCard.tsx";
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
        {props.plan.workouts.map((workout) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            isToday={workout.date === today}
            isExpanded={workout.id === expandedId}
            onToggle={() =>
              setExpandedId(workout.id === expandedId ? null : workout.id)
            }
          />
        ))}
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

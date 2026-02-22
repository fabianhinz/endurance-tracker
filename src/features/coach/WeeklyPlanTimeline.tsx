import { useState } from "react";
import { Typography } from "../../components/ui/Typography.tsx";
import { Button } from "../../components/ui/Button.tsx";
import { formatDuration, cn } from "../../lib/utils.ts";
import type {
  WeeklyPlan,
  RunningZone,
  WorkoutType,
  WorkoutStep,
  PrescribedWorkout,
} from "../../types/index.ts";
import {
  Moon,
  Footprints,
  Route,
  Gauge,
  Timer,
  Flame,
  BedDouble,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const WORKOUT_ICONS: Record<WorkoutType, LucideIcon> = {
  rest: BedDouble,
  recovery: Moon,
  easy: Footprints,
  "long-run": Route,
  tempo: Gauge,
  "threshold-intervals": Timer,
  "vo2max-intervals": Flame,
};

const STEP_LABELS: Record<string, string> = {
  warmup: "Warm-up",
  work: "Run",
  recovery: "Recovery",
  cooldown: "Cool-down",
};

type GroupedStep =
  | { kind: "single"; step: WorkoutStep }
  | { kind: "interval"; repeat: number; steps: WorkoutStep[] };

const groupSteps = (steps: WorkoutStep[]): GroupedStep[] => {
  const result: GroupedStep[] = [];
  let i = 0;
  while (i < steps.length) {
    const current = steps[i];
    const next = steps[i + 1];
    if (
      next &&
      current.repeat &&
      current.repeat > 1 &&
      current.repeat === next.repeat
    ) {
      const group: WorkoutStep[] = [current];
      let j = i + 1;
      while (j < steps.length && steps[j].repeat === current.repeat) {
        group.push(steps[j]);
        j++;
      }
      result.push({ kind: "interval", repeat: current.repeat, steps: group });
      i = j;
    } else {
      result.push({ kind: "single", step: current });
      i++;
    }
  }
  return result;
};

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
        <ExpansionPanel
          workout={expandedWorkout}
          zones={props.zones}
          onClose={() => setExpandedId(null)}
        />
      )}
    </div>
  );
};

const ExpansionPanel = (props: {
  workout: PrescribedWorkout;
  zones: RunningZone[];
  onClose: () => void;
}) => {
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
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close"
          onClick={props.onClose}
        >
          <X size={16} />
        </Button>
      </div>

      {props.workout.steps.length > 0 && (
        <div className="space-y-2">
          {groupSteps(props.workout.steps).map((group, gi) =>
            group.kind === "single" ? (
              <StepRow
                key={gi}
                step={group.step}
                zones={props.zones}
                showRepeat
              />
            ) : (
              <fieldset
                key={gi}
                className="rounded-xl border border-white/10 px-3 pb-3 pt-1 space-y-1"
              >
                <legend className="px-2 text-xs text-text-secondary font-medium">
                  {group.repeat}×
                </legend>
                {group.steps.map((s, si) => (
                  <StepRow
                    key={si}
                    step={s}
                    zones={props.zones}
                    showRepeat={false}
                  />
                ))}
              </fieldset>
            ),
          )}
        </div>
      )}
    </div>
  );
};

const StepRow = (props: {
  step: WorkoutStep;
  zones: RunningZone[];
  showRepeat: boolean;
}) => {
  const zone = props.zones.find((z) => z.name === props.step.zone);
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-white/5">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: zone?.color ?? "#888" }}
      />
      <Typography variant="caption" color="secondary" className="w-16 shrink-0">
        {STEP_LABELS[props.step.type] ?? props.step.type}
      </Typography>
      <Typography
        variant="caption"
        color="tertiary"
        className="grow-1 text-right"
      >
        {formatDuration(props.step.durationSec)}
      </Typography>
    </div>
  );
};

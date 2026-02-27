import {
  Moon,
  Footprints,
  Route,
  Gauge,
  Timer,
  Flame,
  BedDouble,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { WorkoutType } from "../../types/index.ts";

export const WORKOUT_ICONS: Record<WorkoutType, LucideIcon> = {
  rest: BedDouble,
  recovery: Moon,
  easy: Footprints,
  "long-run": Route,
  tempo: Gauge,
  "threshold-intervals": Timer,
  "vo2max-intervals": Flame,
};

export const STEP_LABELS: Record<string, string> = {
  warmup: "Warm-up",
  work: "Run",
  recovery: "Recovery",
  cooldown: "Cool-down",
};

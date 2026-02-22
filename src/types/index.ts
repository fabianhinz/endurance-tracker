export type Sport = "running" | "cycling" | "swimming";
export type Gender = "male" | "female" | "other";

export interface UserProfile {
  id: string;
  gender: Gender;
  thresholds: {
    ftp?: number;
    maxHr: number;
    restHr: number;
    thresholdPace?: number; // sec/km
  };
  showMetricHelp: boolean;
  createdAt: number;
}

export interface TrainingSession {
  id: string;
  name?: string;
  sport: Sport;
  date: number;
  duration: number;
  distance: number;
  avgHr?: number;
  maxHr?: number;
  avgPower?: number;
  maxPower?: number;
  normalizedPower?: number;
  avgCadence?: number;
  avgPace?: number;
  calories?: number;
  elevationGain?: number;
  elevationLoss?: number;
  movingTime?: number;
  subSport?: string;
  deviceTss?: number;
  deviceIf?: number;
  deviceFtp?: number;
  maxSpeed?: number;
  minAltitude?: number;
  maxAltitude?: number;
  avgAltitude?: number;
  tss: number;
  stressMethod: "tss" | "trimp";
  sensorWarnings: string[];
  isPlanned: boolean;
  hasDetailedRecords: boolean;
  createdAt: number;
}

export interface SessionRecord {
  sessionId: string;
  timestamp: number;
  hr?: number;
  power?: number;
  cadence?: number;
  speed?: number;
  lat?: number;
  lng?: number;
  elevation?: number;
  distance?: number;
  grade?: number;
  timerTime?: number;
}

export interface SessionLap {
  sessionId: string;
  lapIndex: number;
  startTime: number;
  endTime: number;
  totalElapsedTime: number;
  totalTimerTime: number;
  totalMovingTime?: number;
  distance: number;
  avgSpeed: number;
  maxSpeed?: number;
  totalAscent?: number;
  minAltitude?: number;
  maxAltitude?: number;
  avgGrade?: number;
  avgHr?: number;
  minHr?: number;
  maxHr?: number;
  avgCadence?: number;
  maxCadence?: number;
  intensity?: string;
  repetitionNum?: number;
}

export interface DailyMetrics {
  date: string;
  tss: number;
  ctl: number;
  atl: number;
  tsb: number;
  acwr: number;
}

export type FormStatus =
  | "detraining"
  | "fresh"
  | "neutral"
  | "optimal"
  | "overload";

export type InjuryRisk = "low" | "moderate" | "high";

export interface CoachingRecommendation {
  status: FormStatus;
  message: string;
  tsb: number;
  acwr: number;
  injuryRisk: InjuryRisk;
}

// --- Running Zones & Coaching Plan ---

export type RunningZoneName = "recovery" | "easy" | "tempo" | "threshold" | "vo2max";

export interface RunningZone {
  name: RunningZoneName;
  label: string;
  minPace: number; // sec/km (slower = higher number)
  maxPace: number; // sec/km (faster = lower number)
  color: string;
}

export type WorkoutType =
  | "rest"
  | "recovery"
  | "easy"
  | "long-run"
  | "tempo"
  | "threshold-intervals"
  | "vo2max-intervals";

export type StepType = "warmup" | "work" | "recovery" | "cooldown";

export interface WorkoutStep {
  type: StepType;
  durationSec: number;
  zone: RunningZoneName;
  targetPaceMin: number; // sec/km
  targetPaceMax: number; // sec/km
  repeat?: number;
}

export interface PrescribedWorkout {
  id: string;
  date: string; // YYYY-MM-DD
  dayLabel: string;
  type: WorkoutType;
  title: string;
  steps: WorkoutStep[];
  estimatedDurationSec: number;
  estimatedTss: number;
  rationale: string;
  isTaper: boolean;
}

export type PlanContext =
  | { mode: "normal"; formStatus: FormStatus; tsb: number; acwr: number }
  | { mode: "taper"; raceDate: string; raceDistance: RaceDistance; daysToRace: number }
  | { mode: "no-data" };

export type RaceDistance = "5k" | "10k" | "half-marathon" | "marathon";

export interface WeeklyPlan {
  weekOf: string;
  workouts: PrescribedWorkout[];
  totalEstimatedTss: number;
  context: PlanContext;
}

// --- Personal Bests ---

export type PBCategory = "peak-power" | "fastest-distance" | "longest" | "most-elevation";

export interface PersonalBest {
  sport: Sport;
  category: PBCategory;
  window: number;
  value: number;
  sessionId: string;
  date: number;
}

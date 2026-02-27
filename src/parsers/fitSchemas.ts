import { z } from "zod";

const optNum = z.number().optional();
const optStr = z.string().optional();
const optDateTime = z.union([z.string(), z.date()]).optional();

// ---------------------------------------------------------------------------
// File ID
// ---------------------------------------------------------------------------

export const fitFileIdSchema = z.object({
  serial_number: optNum,
  time_created: z.union([z.string(), z.date()]),
});

// ---------------------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------------------

export const fitUserProfileSchema = z.object({
  weight: optNum,
  gender: optStr,
  resting_heart_rate: optNum,
});

// ---------------------------------------------------------------------------
// Record (single data point)
// ---------------------------------------------------------------------------

export const fitRecordSchema = z.object({
  elapsed_time: optNum,
  heart_rate: optNum,
  power: optNum,
  cadence: optNum,
  speed: optNum,
  position_lat: optNum,
  position_long: optNum,
  altitude: optNum,
  distance: optNum,
  grade: optNum,
  timer_time: optNum,
});

export const fitRecordsSchema = z.array(fitRecordSchema);

// ---------------------------------------------------------------------------
// Lap
// ---------------------------------------------------------------------------

export const fitLapSchema = z.object({
  start_time: optDateTime,
  timestamp: optDateTime,
  message_index: z.object({ value: z.number() }).optional(),
  total_elapsed_time: optNum,
  total_timer_time: optNum,
  total_moving_time: optNum,
  total_distance: optNum,
  avg_speed: optNum,
  max_speed: optNum,
  total_ascent: optNum,
  min_altitude: optNum,
  max_altitude: optNum,
  avg_grade: optNum,
  avg_heart_rate: optNum,
  min_heart_rate: optNum,
  max_heart_rate: optNum,
  avg_cadence: optNum,
  max_cadence: optNum,
  intensity: optStr,
  repetition_num: optNum,
});

export const fitLapsSchema = z.array(fitLapSchema);

export type FitLapInput = z.infer<typeof fitLapSchema>;

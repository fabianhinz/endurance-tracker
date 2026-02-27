import FitParser from 'fit-file-parser';
import type { TrainingSession, SessionRecord, SessionLap, Sport, Gender } from '../types/index.ts';
import { validateRecords } from '../engine/validation.ts';
import { calculateSessionStress } from '../engine/stress.ts';
import { extractSessionName } from '../lib/filename.ts';

export interface FitUserProfile {
  weight?: number;
  gender?: 'male' | 'female';
  restingHeartRate?: number;
}

export interface ParsedFitResult {
  session: Omit<TrainingSession, 'id' | 'createdAt'>;
  records: SessionRecord[];
  laps: SessionLap[];
  fitUserProfile?: FitUserProfile;
}

const mapFitSportToAppSport = (fitSport?: string): Sport => {
  switch (fitSport) {
    case 'running':
      return 'running';
    case 'cycling':
      return 'cycling';
    case 'swimming':
    case 'lap_swimming':
    case 'open_water':
      return 'swimming';
    default:
      return 'cycling'; // default fallback
  }
};

// Metric derivation priority:
// 1. Calculate from records (most accurate)
// 2. Fall back to session-level FIT value
// 3. Leave undefined (never fabricate)

export const deriveDistanceFromRecords = (records: SessionRecord[]): number => {
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i].distance !== undefined && records[i].distance! > 0) {
      return records[i].distance!;
    }
  }
  return 0;
};

export const deriveAvgFromRecords = (
  records: SessionRecord[],
  field: 'power' | 'cadence',
): number | undefined => {
  const values = records
    .map((r) => r[field])
    .filter((v): v is number => v !== undefined && v > 0);
  if (values.length === 0) return undefined;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
};

export const deriveMaxFromRecords = (
  records: SessionRecord[],
  field: 'power' | 'speed',
): number | undefined => {
  const values = records
    .map((r) => r[field])
    .filter((v): v is number => v !== undefined && v > 0);
  if (values.length === 0) return undefined;
  return Math.max(...values);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- fit-file-parser laps lack TS types
export const mapFitLaps = (fitLaps: any[], sessionId: string): SessionLap[] => {
  return fitLaps.map((lap, index) => ({
    sessionId,
    lapIndex: lap.message_index?.value ?? index,
    startTime: lap.start_time ? new Date(lap.start_time).getTime() : 0,
    endTime: lap.timestamp ? new Date(lap.timestamp).getTime() : 0,
    totalElapsedTime: lap.total_elapsed_time ?? 0,
    totalTimerTime: lap.total_timer_time ?? 0,
    totalMovingTime: lap.total_moving_time,
    distance: lap.total_distance ?? 0,
    avgSpeed: lap.avg_speed ?? 0,
    maxSpeed: lap.max_speed,
    totalAscent: lap.total_ascent,
    minAltitude: lap.min_altitude,
    maxAltitude: lap.max_altitude,
    avgGrade: lap.avg_grade,
    avgHr: lap.avg_heart_rate,
    minHr: lap.min_heart_rate,
    maxHr: lap.max_heart_rate,
    avgCadence: lap.avg_cadence,
    maxCadence: lap.max_cadence,
    intensity: lap.intensity,
    repetitionNum: lap.repetition_num,
  }));
};

export const parseFitFile = async (
  file: File,
  userProfile: {
    restHr: number;
    maxHr: number;
    gender: Gender;
    ftp?: number;
  },
): Promise<ParsedFitResult> => {
  const arrayBuffer = await file.arrayBuffer();

  const parser = new FitParser({
    force: true,
    speedUnit: 'm/s',
    lengthUnit: 'm',
    temperatureUnit: 'celsius',
    elapsedRecordField: true,
    mode: 'list',
  });

  let data;
  try {
    data = await parser.parseAsync(arrayBuffer);
  } catch (err) {
    throw new Error(
      `Failed to parse FIT file "${file.name}": ${err instanceof Error ? err.message : 'unknown error'}`
    );
  }

  const fitSession = data.sessions?.[0];
  const fitRecords = data.records ?? [];

  const sessionId = crypto.randomUUID();
  const sport = mapFitSportToAppSport(fitSession?.sport);

  // Extract user profile from FIT file (if available)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- fit-file-parser user_profile not in TS types
  const fitProfile = (data as any).user_profile;
  const fitUserProfile: FitUserProfile | undefined = fitProfile
    ? {
        weight: fitProfile.weight,
        gender:
          fitProfile.gender === 'female'
            ? 'female'
            : fitProfile.gender === 'male'
              ? 'male'
              : undefined,
        restingHeartRate: fitProfile.resting_heart_rate,
      }
    : undefined;

  // Transform FIT records to app records
  // Fields elapsed_time, grade, timer_time exist at runtime but not in TS types (see CLAUDE.md gotcha)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- fit-file-parser record fields not in TS types
  const records: SessionRecord[] = fitRecords.map((r: any) => ({
    sessionId,
    timestamp: r.elapsed_time ?? 0,
    hr: r.heart_rate,
    power: r.power,
    cadence: r.cadence,
    speed: r.speed,
    lat: r.position_lat,
    lng: r.position_long,
    elevation: r.altitude,
    distance: r.distance,
    grade: r.grade,
    timerTime: r.timer_time,
  }));

  // Extract laps
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- fit-file-parser laps not in TS types
  const fitLaps = (data as any).laps ?? [];
  const laps = mapFitLaps(fitLaps, sessionId);

  // Derive moving time from laps; fall back to timer time per lap when moving time is unavailable
  const movingTime = laps.length > 0
    ? laps.reduce((sum, lap) => sum + (lap.totalMovingTime ?? lap.totalTimerTime), 0)
    : undefined;

  // Validate sensor data
  const sensorWarnings = validateRecords(records, sport).map((w) => w.message);

  // Calculate stress — use FTP for all sports with power data, not just cycling
  const hasPowerRecords = records.some((r) => r.power !== undefined && r.power > 0);
  const stressResult = calculateSessionStress(
    records,
    fitSession?.total_timer_time ?? fitSession?.total_elapsed_time ?? 0,
    fitSession?.avg_heart_rate,
    userProfile.restHr,
    userProfile.maxHr,
    userProfile.gender,
    hasPowerRecords ? userProfile.ftp : undefined,
  );

  const sessionDate = fitSession?.start_time
    ? new Date(fitSession.start_time).getTime()
    : Date.now();

  const avgSpeed = fitSession?.avg_speed;
  const name = extractSessionName(file.name);

  const session: Omit<TrainingSession, 'id' | 'createdAt'> = {
    ...(name !== undefined && { name }),
    sport,
    date: sessionDate,
    duration: fitSession?.total_timer_time ?? fitSession?.total_elapsed_time ?? 0,
    distance: deriveDistanceFromRecords(records),
    avgHr: fitSession?.avg_heart_rate,
    maxHr: fitSession?.max_heart_rate,
    avgPower: deriveAvgFromRecords(records, 'power') ?? fitSession?.avg_power,
    maxPower: deriveMaxFromRecords(records, 'power') ?? fitSession?.max_power,
    normalizedPower: stressResult.normalizedPower ?? fitSession?.normalized_power,
    avgCadence: deriveAvgFromRecords(records, 'cadence') ?? fitSession?.avg_cadence,
    avgSpeed,
    avgPace:
      sport === 'running' && avgSpeed && avgSpeed > 0
        ? 1000 / avgSpeed
        : undefined,
    calories: fitSession?.total_calories,
    elevationGain: fitSession?.total_ascent,
    elevationLoss: fitSession?.total_descent,
    movingTime,
    subSport: fitSession?.sub_sport,
    deviceTss: fitSession?.training_stress_score,
    deviceIf: fitSession?.intensity_factor,
    deviceFtp: fitSession?.threshold_power,
    maxSpeed: fitSession?.max_speed ?? deriveMaxFromRecords(records, 'speed'),
    minAltitude: fitSession?.min_altitude,
    maxAltitude: fitSession?.max_altitude,
    avgAltitude: fitSession?.avg_altitude,
    tss: stressResult.tss,
    stressMethod: stressResult.stressMethod,
    sensorWarnings,
    isPlanned: false,
    hasDetailedRecords: records.length > 0,
  };

  return { session, records, laps, fitUserProfile };
};

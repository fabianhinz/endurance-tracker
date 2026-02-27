import { describe, it, expect } from 'vitest';
import {
  fitUserProfileSchema,
  fitRecordSchema,
  fitRecordsSchema,
  fitLapSchema,
  fitLapsSchema,
} from '../../src/parsers/fitSchemas.ts';

describe('fitUserProfileSchema', () => {
  it('accepts a full profile', () => {
    const result = fitUserProfileSchema.safeParse({
      weight: 75,
      gender: 'male',
      resting_heart_rate: 52,
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      weight: 75,
      gender: 'male',
      resting_heart_rate: 52,
    });
  });

  it('accepts empty object (all fields optional)', () => {
    const result = fitUserProfileSchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data?.weight).toBeUndefined();
    expect(result.data?.gender).toBeUndefined();
    expect(result.data?.resting_heart_rate).toBeUndefined();
  });

  it('rejects non-object input', () => {
    expect(fitUserProfileSchema.safeParse(null).success).toBe(false);
    expect(fitUserProfileSchema.safeParse('hello').success).toBe(false);
  });

  it('rejects wrong field types', () => {
    const result = fitUserProfileSchema.safeParse({
      weight: 'heavy',
      resting_heart_rate: true,
    });
    expect(result.success).toBe(false);
  });
});

describe('fitRecordSchema', () => {
  it('accepts a full record', () => {
    const result = fitRecordSchema.safeParse({
      elapsed_time: 10,
      heart_rate: 145,
      power: 250,
      cadence: 90,
      speed: 8.5,
      position_lat: 48.123,
      position_long: 11.456,
      altitude: 520,
      distance: 1200,
      grade: 3.2,
      timer_time: 10,
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (all fields optional)', () => {
    const result = fitRecordSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects wrong types', () => {
    expect(fitRecordSchema.safeParse({ heart_rate: 'fast' }).success).toBe(false);
  });
});

describe('fitRecordsSchema', () => {
  it('accepts an array of records', () => {
    const result = fitRecordsSchema.safeParse([
      { elapsed_time: 1, heart_rate: 120 },
      { elapsed_time: 2, speed: 4.5 },
    ]);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  it('accepts empty array', () => {
    const result = fitRecordsSchema.safeParse([]);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
  });

  it('rejects non-array input', () => {
    expect(fitRecordsSchema.safeParse('not-array').success).toBe(false);
    expect(fitRecordsSchema.safeParse(42).success).toBe(false);
  });

  it('rejects array with invalid element', () => {
    const result = fitRecordsSchema.safeParse([
      { elapsed_time: 1 },
      { heart_rate: 'invalid' },
    ]);
    expect(result.success).toBe(false);
  });
});

describe('fitLapSchema', () => {
  it('accepts a full lap', () => {
    const result = fitLapSchema.safeParse({
      start_time: '2025-08-16T16:14:27.000Z',
      timestamp: '2025-08-16T16:26:44.000Z',
      message_index: { value: 0 },
      total_elapsed_time: 737,
      total_timer_time: 737,
      total_moving_time: 739,
      total_distance: 4631.3,
      avg_speed: 6.267,
      max_speed: 8.35,
      total_ascent: 27,
      min_altitude: 116,
      max_altitude: 126.8,
      avg_grade: 0,
      avg_heart_rate: 113,
      min_heart_rate: 79,
      max_heart_rate: 130,
      avg_cadence: 83,
      max_cadence: 88,
      intensity: 'active',
      repetition_num: 1,
    });
    expect(result.success).toBe(true);
  });

  it('accepts Date objects for time fields', () => {
    const result = fitLapSchema.safeParse({
      start_time: new Date('2025-08-16T16:14:27.000Z'),
      timestamp: new Date('2025-08-16T16:26:44.000Z'),
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (all fields optional)', () => {
    const result = fitLapSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects wrong types', () => {
    expect(fitLapSchema.safeParse({ total_elapsed_time: 'slow' }).success).toBe(false);
  });
});

describe('fitLapsSchema', () => {
  it('accepts an array of laps', () => {
    const result = fitLapsSchema.safeParse([
      { total_elapsed_time: 300, avg_speed: 5.0 },
      { total_elapsed_time: 400, avg_speed: 6.0 },
    ]);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  it('accepts empty array', () => {
    const result = fitLapsSchema.safeParse([]);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
  });

  it('rejects non-array input', () => {
    expect(fitLapsSchema.safeParse('not-array').success).toBe(false);
  });

  it('rejects array with invalid element', () => {
    const result = fitLapsSchema.safeParse([
      { total_elapsed_time: 300 },
      { avg_speed: 'fast' },
    ]);
    expect(result.success).toBe(false);
  });
});

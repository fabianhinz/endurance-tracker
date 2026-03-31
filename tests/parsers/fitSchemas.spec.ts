import { describe, it, expect } from 'vitest';
import {
  enumStr,
  fitRecordSchema,
  fitRecordsSchema,
  fitLapSchema,
  fitLapsSchema,
} from '@/parsers/fitSchemas.ts';

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

  it('accepts enhanced_speed and enhanced_altitude (native Garmin)', () => {
    const result = fitRecordSchema.safeParse({
      elapsed_time: 10,
      heart_rate: 145,
      enhanced_speed: 3.21,
      enhanced_altitude: 402.4,
      distance: 1200,
    });
    expect(result.success).toBe(true);
    expect(result.data?.enhanced_speed).toBe(3.21);
    expect(result.data?.enhanced_altitude).toBe(402.4);
    expect(result.data?.speed).toBeUndefined();
    expect(result.data?.altitude).toBeUndefined();
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
    const result = fitRecordsSchema.safeParse([{ elapsed_time: 1 }, { heart_rate: 'invalid' }]);
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

  it('accepts enhanced fields (native Garmin)', () => {
    const result = fitLapSchema.safeParse({
      enhanced_avg_speed: 3.26,
      enhanced_max_speed: 4.1,
      enhanced_min_altitude: 98.2,
      enhanced_max_altitude: 134.6,
      enhanced_avg_altitude: 116.4,
    });
    expect(result.success).toBe(true);
    expect(result.data?.enhanced_avg_speed).toBe(3.26);
    expect(result.data?.enhanced_max_speed).toBe(4.1);
    expect(result.data?.enhanced_min_altitude).toBe(98.2);
    expect(result.data?.enhanced_max_altitude).toBe(134.6);
    expect(result.data?.enhanced_avg_altitude).toBe(116.4);
    expect(result.data?.avg_speed).toBeUndefined();
    expect(result.data?.max_speed).toBeUndefined();
    expect(result.data?.min_altitude).toBeUndefined();
    expect(result.data?.max_altitude).toBeUndefined();
    expect(result.data?.avg_altitude).toBeUndefined();
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
    const result = fitLapsSchema.safeParse([{ total_elapsed_time: 300 }, { avg_speed: 'fast' }]);
    expect(result.success).toBe(false);
  });
});

describe('enumStr', () => {
  it('keeps string values', () => {
    const result = enumStr.safeParse('active');
    expect(result.success).toBe(true);
    expect(result.data).toBe('active');
  });

  it('coerces number to undefined', () => {
    const result = enumStr.safeParse(255);
    expect(result.success).toBe(true);
    expect(result.data).toBeUndefined();
  });

  it('passes through undefined', () => {
    const result = enumStr.safeParse(undefined);
    expect(result.success).toBe(true);
    expect(result.data).toBeUndefined();
  });

  it('rejects non-string non-number types', () => {
    expect(enumStr.safeParse(true).success).toBe(false);
    expect(enumStr.safeParse({ foo: 1 }).success).toBe(false);
  });
});

describe('fitLapSchema enumStr fields', () => {
  it('coerces numeric intensity to undefined', () => {
    const result = fitLapSchema.safeParse({ intensity: 255 });
    expect(result.success).toBe(true);
    expect(result.data?.intensity).toBeUndefined();
  });

  it('keeps string intensity', () => {
    const result = fitLapSchema.safeParse({ intensity: 'rest' });
    expect(result.success).toBe(true);
    expect(result.data?.intensity).toBe('rest');
  });
});

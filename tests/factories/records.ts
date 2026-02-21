import type { SessionRecord, SessionLap } from '../../src/types/index.ts';

/**
 * Generate realistic cycling records with power, HR, speed, cadence, cumulative distance.
 * Power oscillates around basePower + 40*sin for variability.
 * HR starts at baseHr and trends upward (cardiac drift).
 */
export const makeCyclingRecords = (
  sessionId: string,
  count: number,
  options?: { basePower?: number; baseHr?: number },
): SessionRecord[] => {
  const basePower = options?.basePower ?? 200;
  const baseHr = options?.baseHr ?? 140;
  const records: SessionRecord[] = [];
  let cumulativeDistance = 0;

  for (let i = 0; i < count; i++) {
    const speed = 8 + Math.sin(i * 0.02); // ~28-32 km/h in m/s
    cumulativeDistance += speed;
    records.push({
      sessionId,
      timestamp: i,
      power: basePower + 40 * Math.sin(i * 0.05),
      hr: baseHr + (i / count) * 20,
      speed,
      cadence: 85 + 5 * Math.sin(i * 0.03),
      distance: cumulativeDistance,
      elevation: 200 + 5 * Math.sin(i * 0.005),
    });
  }

  return records;
};

/**
 * Generate realistic running records with speed, HR, elevation, cumulative distance.
 * Speed oscillates between baseSpeed-0.5 and baseSpeed+0.5 m/s, HR trends upward.
 */
export const makeRunningRecords = (
  sessionId: string,
  count: number,
  options?: { baseSpeed?: number; baseHr?: number },
): SessionRecord[] => {
  const baseSpeed = options?.baseSpeed ?? 3.5;
  const baseHr = options?.baseHr ?? 145;
  const records: SessionRecord[] = [];
  let cumulativeDistance = 0;

  for (let i = 0; i < count; i++) {
    const speed = baseSpeed + 0.5 * Math.sin(i * 0.04);
    cumulativeDistance += speed; // 1 record = 1 second
    records.push({
      sessionId,
      timestamp: i,
      speed,
      hr: baseHr + (i / count) * 15,
      elevation: 100 + 2 * Math.sin(i * 0.01),
      distance: cumulativeDistance,
    });
  }

  return records;
};

/**
 * Generate realistic swimming records with speed, HR, cumulative distance.
 * Speed ~1.5 m/s (typical pool swimming pace).
 */
export const makeSwimmingRecords = (
  sessionId: string,
  count: number,
  options?: { baseSpeed?: number; baseHr?: number },
): SessionRecord[] => {
  const baseSpeed = options?.baseSpeed ?? 1.5;
  const baseHr = options?.baseHr ?? 135;
  const records: SessionRecord[] = [];
  let cumulativeDistance = 0;

  for (let i = 0; i < count; i++) {
    const speed = baseSpeed + 0.2 * Math.sin(i * 0.06);
    cumulativeDistance += speed;
    records.push({
      sessionId,
      timestamp: i,
      speed,
      hr: baseHr + (i / count) * 10,
      distance: cumulativeDistance,
    });
  }

  return records;
};

/**
 * Generate lap data for a session.
 */
export const makeLaps = (
  sessionId: string,
  count: number,
): SessionLap[] => {
  const laps: SessionLap[] = [];
  const lapDuration = 300;

  for (let i = 0; i < count; i++) {
    const startMs = i * lapDuration * 1000;
    laps.push({
      sessionId,
      lapIndex: i,
      startTime: startMs,
      endTime: startMs + lapDuration * 1000,
      totalElapsedTime: lapDuration,
      totalTimerTime: lapDuration,
      totalMovingTime: lapDuration - 10,
      distance: 1000 + i * 50,
      avgSpeed: 3.2 + i * 0.1,
      maxSpeed: 4.0 + i * 0.1,
      totalAscent: 5 + i,
      avgHr: 140 + i * 3,
      minHr: 130 + i * 2,
      maxHr: 155 + i * 3,
      avgCadence: 82 + i,
      intensity: i % 3 === 0 ? 'rest' : 'active',
      repetitionNum: i + 1,
    });
  }

  return laps;
};

export const makeInvalidRecords = (
  sessionId: string,
  type: 'highHr' | 'highPower' | 'zeroHr',
): SessionRecord[] => {
  const count = 20;
  const records: SessionRecord[] = [];

  for (let i = 0; i < count; i++) {
    const base: SessionRecord = { sessionId, timestamp: i };

    switch (type) {
      case 'highHr':
        base.hr = 240;
        base.power = 200;
        break;
      case 'highPower':
        base.power = 3000;
        base.hr = 150;
        break;
      case 'zeroHr':
        base.hr = 0;
        base.power = 200;
        break;
    }

    records.push(base);
  }

  return records;
};

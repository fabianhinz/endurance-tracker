import type { SessionRecord, PersonalBest, PBCategory, Sport } from '../types/index.ts';

export const POWER_WINDOWS = [
  { seconds: 5 },
  { seconds: 60 },
  { seconds: 300 },
  { seconds: 1200 },
  { seconds: 3600 },
] as const;

export const RUNNING_DISTANCES = [
  { meters: 1000 },
  { meters: 5000 },
  { meters: 10000 },
  { meters: 21097 },
  { meters: 42195 },
] as const;

export const SWIMMING_DISTANCES = [
  { meters: 100 },
  { meters: 400 },
  { meters: 1000 },
  { meters: 1500 },
] as const;

export const PB_SLOTS: Record<Sport, Array<{ category: PBCategory; window: number }>> = {
  running: [
    { category: "fastest-distance", window: 1000 },
    { category: "fastest-distance", window: 5000 },
    { category: "fastest-distance", window: 10000 },
    { category: "fastest-distance", window: 21097 },
    { category: "fastest-distance", window: 42195 },
    { category: "longest", window: 0 },
  ],
  cycling: [
    { category: "peak-power", window: 5 },
    { category: "peak-power", window: 60 },
    { category: "peak-power", window: 300 },
    { category: "peak-power", window: 1200 },
    { category: "peak-power", window: 3600 },
    { category: "longest", window: 0 },
    { category: "most-elevation", window: 0 },
  ],
  swimming: [
    { category: "fastest-distance", window: 100 },
    { category: "fastest-distance", window: 400 },
    { category: "fastest-distance", window: 1000 },
    { category: "fastest-distance", window: 1500 },
    { category: "longest", window: 0 },
  ],
};

/**
 * Find peak average value over a rolling window.
 * Returns the maximum average value found for the given window size.
 */
const findPeakAverage = (values: number[], windowSize: number): number => {
  if (values.length < windowSize) return 0;

  let maxAvg = 0;
  let windowSum = 0;

  for (let i = 0; i < windowSize; i++) {
    windowSum += values[i];
  }
  maxAvg = windowSum / windowSize;

  for (let i = windowSize; i < values.length; i++) {
    windowSum += values[i] - values[i - windowSize];
    const avg = windowSum / windowSize;
    if (avg > maxAvg) maxAvg = avg;
  }

  return Math.round(maxAvg * 10) / 10;
};

/**
 * Extract peak power values for standard duration windows from a session.
 * Returns Map keyed by seconds.
 */
export const extractPeakPower = (
  records: SessionRecord[],
): Map<number, number> => {
  const powerData = records
    .filter((r) => r.power !== undefined && r.power > 0)
    .map((r) => r.power!);

  const peaks = new Map<number, number>();
  for (const w of POWER_WINDOWS) {
    const peak = findPeakAverage(powerData, w.seconds);
    if (peak > 0) {
      peaks.set(w.seconds, peak);
    }
  }

  return peaks;
};

/**
 * Extract fastest times for target distances using two-pointer on cumulative distance.
 * Returns Map<meters, timeInSeconds>.
 */
export const extractFastestDistances = (
  records: SessionRecord[],
  targets: ReadonlyArray<{ meters: number }>,
): Map<number, number> => {
  const results = new Map<number, number>();

  // Need cumulative distance data
  const withDistance = records.filter((r) => r.distance !== undefined && r.distance > 0);
  if (withDistance.length < 2) return results;

  for (const target of targets) {
    let bestTime = Infinity;
    let left = 0;

    for (let right = 1; right < withDistance.length; right++) {
      while (left < right && withDistance[right].distance! - withDistance[left].distance! >= target.meters) {
        const time = withDistance[right].timestamp - withDistance[left].timestamp;
        if (time > 0 && time < bestTime) {
          bestTime = time;
        }
        left++;
      }
    }

    if (bestTime < Infinity) {
      results.set(target.meters, bestTime);
    }
  }

  return results;
};

/**
 * Compare new session peaks against existing personal bests.
 * Returns array of new PBs found. All-time comparison (no rolling window).
 */
export const detectNewPBs = (
  sessionId: string,
  sessionDate: number,
  sport: Sport,
  records: SessionRecord[],
  existingBests: PersonalBest[],
  sessionMeta?: { distance: number; elevationGain?: number },
): PersonalBest[] => {
  const newPBs: PersonalBest[] = [];

  const findExisting = (category: PBCategory, window: number) =>
    existingBests.find(
      (pb) => pb.sport === sport && pb.category === category && pb.window === window,
    );

  const pushIfBetter = (
    category: PBCategory,
    window: number,
    value: number,
    higherIsBetter: boolean,
  ) => {
    const existing = findExisting(category, window);
    const isBetter = higherIsBetter
      ? !existing || value > existing.value
      : !existing || value < existing.value;
    if (isBetter) {
      newPBs.push({ sport, category, window, value, sessionId, date: sessionDate });
    }
  };

  if (sport === 'cycling') {
    const peaks = extractPeakPower(records);
    for (const [seconds, value] of peaks) {
      pushIfBetter('peak-power', seconds, value, true);
    }
  }

  if (sport === 'running') {
    const distances = extractFastestDistances(records, RUNNING_DISTANCES);
    for (const [meters, time] of distances) {
      pushIfBetter('fastest-distance', meters, time, false);
    }
  }

  if (sport === 'swimming') {
    const distances = extractFastestDistances(records, SWIMMING_DISTANCES);
    for (const [meters, time] of distances) {
      pushIfBetter('fastest-distance', meters, time, false);
    }
  }

  // Session-level records
  if (sessionMeta) {
    if (sessionMeta.distance > 0) {
      pushIfBetter('longest', 0, sessionMeta.distance, true);
    }
    if (sport === 'cycling' && sessionMeta.elevationGain && sessionMeta.elevationGain > 0) {
      pushIfBetter('most-elevation', 0, sessionMeta.elevationGain, true);
    }
  }

  return newPBs;
};

/**
 * Merge incoming PBs into an existing array.
 * Replaces entries with matching sport+category+window, appends new ones.
 */
export const mergePBs = (
  existing: PersonalBest[],
  incoming: PersonalBest[],
): PersonalBest[] => {
  const merged = [...existing];
  for (const nb of incoming) {
    const idx = merged.findIndex(
      (pb) =>
        pb.sport === nb.sport &&
        pb.category === nb.category &&
        pb.window === nb.window,
    );
    if (idx >= 0) {
      merged[idx] = nb;
    } else {
      merged.push(nb);
    }
  }
  return merged;
};

/**
 * Group personal bests by sport for per-sport dashboard cards.
 */
export const groupPBsBySport = (
  pbs: PersonalBest[],
): Partial<Record<Sport, PersonalBest[]>> => {
  const grouped: Partial<Record<Sport, PersonalBest[]>> = {};
  for (const pb of pbs) {
    if (!grouped[pb.sport]) {
      grouped[pb.sport] = [];
    }
    grouped[pb.sport]!.push(pb);
  }
  return grouped;
};

/**
 * Compute personal bests across multiple sessions.
 * Handles all three sports and all PB categories.
 */
export const computePBsForSessions = (
  sessions: Array<{
    sessionId: string;
    date: number;
    sport: Sport;
    records: SessionRecord[];
    distance?: number;
    elevationGain?: number;
  }>,
): PersonalBest[] => {
  const bestByKey = new Map<string, PersonalBest>();

  const trySet = (
    key: string,
    pb: PersonalBest,
    higherIsBetter: boolean,
  ) => {
    const existing = bestByKey.get(key);
    const isBetter = higherIsBetter
      ? !existing || pb.value > existing.value
      : !existing || pb.value < existing.value;
    if (isBetter) {
      bestByKey.set(key, pb);
    }
  };

  for (const session of sessions) {
    const makePB = (category: PBCategory, window: number, value: number): PersonalBest => ({
      sport: session.sport,
      category,
      window,
      value,
      sessionId: session.sessionId,
      date: session.date,
    });

    if (session.sport === 'cycling') {
      const peaks = extractPeakPower(session.records);
      for (const [seconds, value] of peaks) {
        trySet(`cycling:peak-power:${seconds}`, makePB('peak-power', seconds, value), true);
      }
    }

    if (session.sport === 'running') {
      const distances = extractFastestDistances(session.records, RUNNING_DISTANCES);
      for (const [meters, time] of distances) {
        trySet(`running:fastest-distance:${meters}`, makePB('fastest-distance', meters, time), false);
      }
    }

    if (session.sport === 'swimming') {
      const distances = extractFastestDistances(session.records, SWIMMING_DISTANCES);
      for (const [meters, time] of distances) {
        trySet(`swimming:fastest-distance:${meters}`, makePB('fastest-distance', meters, time), false);
      }
    }

    // Session-level records
    if (session.distance && session.distance > 0) {
      trySet(
        `${session.sport}:longest:0`,
        makePB('longest', 0, session.distance),
        true,
      );
    }

    if (session.sport === 'cycling' && session.elevationGain && session.elevationGain > 0) {
      trySet(
        'cycling:most-elevation:0',
        makePB('most-elevation', 0, session.elevationGain),
        true,
      );
    }
  }

  return [...bestByKey.values()];
};

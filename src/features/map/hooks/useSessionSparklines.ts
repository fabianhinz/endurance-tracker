import { useState, useEffect, useMemo } from 'react';
import { getSessionRecords } from '@/lib/indexeddb.ts';
import { downsample } from '@/lib/downsample.ts';
import {
  prepareHrData,
  preparePowerData,
  preparePaceData,
  prepareSpeedData,
} from '@/lib/chartData.ts';
import { avgDomain } from '@/lib/chartTheme.ts';
import type { TimeSeriesPoint } from '@/lib/chartData.ts';
import type { TrainingSession } from '@/engine/types.ts';

export interface SparklineSeries {
  points: TimeSeriesPoint[];
  min: number;
  avg: number;
  max: number;
}

export interface SparklineData {
  hr: SparklineSeries | null;
  power: SparklineSeries | null;
  pace: SparklineSeries | null;
  speed: SparklineSeries | null;
}

export type SparklineDomains = {
  hr: [number, number] | null;
  power: [number, number] | null;
  pace: [number, number] | null;
  speed: [number, number] | null;
};

export interface SparklineResult {
  data: Map<string, SparklineData>;
  domains: SparklineDomains;
}

const SPARKLINE_SAMPLE_SIZE = 60;

const sparklineCache = new Map<string, SparklineData>();
const loadingSet = new Set<string>();

const toSeries = <T extends TimeSeriesPoint>(
  points: T[],
  valueKey: keyof T & string,
): SparklineSeries | null => {
  if (points.length === 0) return null;
  const values = points.map((p) => p[valueKey] as number);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return { points, min, avg, max };
};

const normalizeTime = <T extends TimeSeriesPoint>(points: T[]): (T & { originalTime: number })[] =>
  points.map((p, i) => ({ ...p, time: i, originalTime: p.time }));

const loadSession = async (id: string): Promise<void> => {
  const records = await getSessionRecords(id);
  const sampled = downsample(records, SPARKLINE_SAMPLE_SIZE);
  const data: SparklineData = {
    hr: toSeries(normalizeTime(prepareHrData(sampled)), 'hr'),
    power: toSeries(normalizeTime(preparePowerData(sampled)), 'power'),
    pace: toSeries(normalizeTime(preparePaceData(sampled)), 'pace'),
    speed: toSeries(normalizeTime(prepareSpeedData(sampled)), 'speed'),
  };
  sparklineCache.set(id, data);
};

const computeDomains = (data: Map<string, SparklineData>): SparklineDomains => {
  const collect = (key: keyof SparklineData): [number, number] | null => {
    const mins: number[] = [];
    const maxes: number[] = [];
    for (const d of data.values()) {
      const s = d[key];
      if (s) {
        mins.push(s.min);
        maxes.push(s.max);
      }
    }
    if (mins.length === 0) return null;
    return avgDomain([Math.min(...mins), Math.max(...maxes)]);
  };
  return {
    hr: collect('hr'),
    power: collect('power'),
    pace: collect('pace'),
    speed: collect('speed'),
  };
};

export const useSessionSparklines = (
  enabled: boolean,
  sessions: TrainingSession[],
): SparklineResult => {
  const [snapshot, setSnapshot] = useState(() => new Map(sparklineCache));

  useEffect(() => {
    if (!enabled) return;

    const uncached = sessions.filter(
      (s) => s.hasDetailedRecords && !sparklineCache.has(s.id) && !loadingSet.has(s.id),
    );
    if (uncached.length === 0) return;

    for (const s of uncached) {
      loadingSet.add(s.id);
    }

    Promise.all(uncached.map((s) => loadSession(s.id))).then(() => {
      for (const s of uncached) {
        loadingSet.delete(s.id);
      }
      setSnapshot(new Map(sparklineCache));
    });
  }, [enabled, sessions]);

  const domains = useMemo(() => computeDomains(snapshot), [snapshot]);

  return { data: snapshot, domains };
};

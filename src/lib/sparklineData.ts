import { downsample } from '@/lib/downsample.ts';
import {
  prepareHrData,
  preparePowerData,
  preparePaceData,
  prepareSpeedData,
} from '@/lib/chartData.ts';
import type { TimeSeriesPoint } from '@/lib/chartData.ts';
import type { SessionRecord } from '@/engine/types.ts';

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

const SPARKLINE_SAMPLE_SIZE = 60;

export const toSeries = <T extends TimeSeriesPoint>(
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

export const normalizeTime = <T extends TimeSeriesPoint>(
  points: T[],
): (T & { originalTime: number })[] =>
  points.map((p, i) => ({ ...p, time: i, originalTime: p.time }));

export const buildSparklineData = (records: SessionRecord[]): SparklineData => {
  const sampled = downsample(records, SPARKLINE_SAMPLE_SIZE);
  return {
    hr: toSeries(normalizeTime(prepareHrData(sampled)), 'hr'),
    power: toSeries(normalizeTime(preparePowerData(sampled)), 'power'),
    pace: toSeries(normalizeTime(preparePaceData(sampled)), 'pace'),
    speed: toSeries(normalizeTime(prepareSpeedData(sampled)), 'speed'),
  };
};

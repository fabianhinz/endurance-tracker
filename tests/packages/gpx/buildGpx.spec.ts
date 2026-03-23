import { describe, it, expect } from 'vitest';
import { buildGpxString, buildGpxFilename } from '@/packages/gpx/buildGpx.ts';
import type { GpxMetadata, GpxPoint } from '@/packages/gpx/buildGpx.ts';

const makePoints = (count: number): GpxPoint[] =>
  Array.from({ length: count }, (_, i) => ({
    lat: 48.137 + i * 0.001,
    lon: 11.575 + i * 0.001,
    ele: 520 + i,
    time: new Date(`2024-01-15T08:00:0${i}Z`),
  }));

const metadata: GpxMetadata = {
  time: new Date('2026-01-01'),
  name: undefined,
};

describe('buildGpxString', () => {
  it('generates a structurally complete GPX string', () => {
    const gpx = buildGpxString(makePoints(2), {
      name: 'Test Run',
      time: new Date('2024-01-15T06:00:00Z'),
    });

    expect(gpx).toMatchSnapshot();
  });

  it('returns null for fewer than 2 points', () => {
    expect(buildGpxString([], metadata)).toBeNull();
    expect(buildGpxString(makePoints(1), metadata)).toBeNull();
  });

  it('escapes XML special characters in metadata name', () => {
    const gpx = buildGpxString(makePoints(2), { time: metadata.time, name: 'Run & Ride <fast>' });
    expect(gpx).toContain('<name>Run &amp; Ride &lt;fast&gt;</name>');
  });

  it('rounds coordinates to 6 decimal places', () => {
    const points: GpxPoint[] = [
      { lat: 48.13712345678, lon: 11.57512345678 },
      { lat: 48.13812345678, lon: 11.57612345678 },
    ];
    const gpx = buildGpxString(points, metadata);

    expect(gpx).toContain('lat="48.137123"');
    expect(gpx).toContain('lon="11.575123"');
  });

  it('rounds elevation to 1 decimal place', () => {
    const points: GpxPoint[] = [
      { lat: 48.137, lon: 11.575, ele: 222.60000000000002 },
      { lat: 48.138, lon: 11.576, ele: 520.456 },
    ];
    const gpx = buildGpxString(points, metadata);

    expect(gpx).toContain('<ele>222.6</ele>');
    expect(gpx).toContain('<ele>520.5</ele>');
  });
});

it('formats filename with capitalized sport and ISO date', () => {
  expect(buildGpxFilename('running', 1700000000000)).toBe('PaceVault_Running_2023-11-14.gpx');
});

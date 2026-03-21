import { describe, it, expect } from 'vitest';
import { buildGpxString, buildGpxFilename } from '@/packages/gpx/buildGpx.ts';
import type { GpxPoint } from '@/packages/gpx/buildGpx.ts';

const makePoints = (count: number): GpxPoint[] =>
  Array.from({ length: count }, (_, i) => ({
    lat: 48.137 + i * 0.001,
    lon: 11.575 + i * 0.001,
    ele: 520 + i,
    time: new Date(`2024-01-15T08:00:0${i}Z`),
  }));

describe('buildGpxString', () => {
  it('produces valid GPX XML from points with ele and time', () => {
    const gpx = buildGpxString(makePoints(3), { name: 'Test Run', time: new Date('2024-01-15') });

    expect(gpx).not.toBeNull();
    expect(gpx).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(gpx).toContain('<gpx version="1.1"');
    expect(gpx).toContain('<name>Test Run</name>');
    expect(gpx).toContain('<trkpt lat="48.137" lon="11.575">');
    expect(gpx).toContain('<ele>520</ele>');
    expect(gpx).toContain('<time>2024-01-15T08:00:00.000Z</time>');
    expect(gpx).toContain('</trkseg></trk>');
    expect(gpx).toContain('</gpx>');
  });

  it('returns null for fewer than 2 points', () => {
    expect(buildGpxString([])).toBeNull();
    expect(buildGpxString(makePoints(1))).toBeNull();
  });

  it('escapes XML special characters in metadata name', () => {
    const gpx = buildGpxString(makePoints(2), { name: 'Run & Ride <fast>' });

    expect(gpx).toContain('<name>Run &amp; Ride &lt;fast&gt;</name>');
  });

  it('omits ele and time elements when not provided', () => {
    const points: GpxPoint[] = [
      { lat: 48.137, lon: 11.575 },
      { lat: 48.138, lon: 11.576 },
    ];
    const gpx = buildGpxString(points);

    expect(gpx).not.toBeNull();
    expect(gpx).not.toContain('<ele>');
    expect(gpx).not.toContain('<time>');
    expect(gpx).not.toContain('<metadata>');
  });

  it('includes metadata when provided', () => {
    const gpx = buildGpxString(makePoints(2), {
      name: 'Morning Run',
      time: new Date('2024-01-15T06:00:00Z'),
    });

    expect(gpx).toContain('<metadata>');
    expect(gpx).toContain('<name>Morning Run</name>');
    expect(gpx).toContain('<time>2024-01-15T06:00:00.000Z</time>');
    expect(gpx).toContain('</metadata>');
  });
});

describe('buildGpxFilename', () => {
  it('formats filename with capitalized sport and ISO date', () => {
    expect(buildGpxFilename('running', 1700000000000)).toBe('PaceVault_Running_2023-11-14.gpx');
  });

  it('capitalizes first letter of sport', () => {
    expect(buildGpxFilename('cycling', 1700000000000)).toBe('PaceVault_Cycling_2023-11-14.gpx');
  });
});

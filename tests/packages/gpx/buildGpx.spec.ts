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
    expect(gpx).toContain('<trkpt lat="48.137000" lon="11.575000">');
    expect(gpx).toContain('<ele>520.0</ele>');
    expect(gpx).toContain('<time>2024-01-15T08:00:00.000Z</time>');
    expect(gpx).toContain('</trkseg>');
    expect(gpx).toContain('</trk>');
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

  it('includes schema attributes on gpx element', () => {
    const gpx = buildGpxString(makePoints(2))!;

    expect(gpx).toContain('xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"');
    expect(gpx).toContain(
      'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"',
    );
  });

  it('adds track name inside trk when metadata name is provided', () => {
    const gpx = buildGpxString(makePoints(2), { name: 'Trail Run' })!;
    const trkIdx = gpx.indexOf('<trk>');
    const trksegIdx = gpx.indexOf('<trkseg>');

    expect(gpx.slice(trkIdx, trksegIdx)).toContain('<name>Trail Run</name>');
  });

  it('rounds coordinates to 6 decimal places', () => {
    const points: GpxPoint[] = [
      { lat: 48.13712345678, lon: 11.57512345678 },
      { lat: 48.13812345678, lon: 11.57612345678 },
    ];
    const gpx = buildGpxString(points)!;

    expect(gpx).toContain('lat="48.137123"');
    expect(gpx).toContain('lon="11.575123"');
  });

  it('rounds elevation to 1 decimal place', () => {
    const points: GpxPoint[] = [
      { lat: 48.137, lon: 11.575, ele: 222.60000000000002 },
      { lat: 48.138, lon: 11.576, ele: 520.456 },
    ];
    const gpx = buildGpxString(points)!;

    expect(gpx).toContain('<ele>222.6</ele>');
    expect(gpx).toContain('<ele>520.5</ele>');
  });

  it('separates XML elements with newlines', () => {
    const gpx = buildGpxString(makePoints(2))!;

    expect(gpx).toContain('\n');
    expect(gpx.split('\n').length).toBeGreaterThan(1);
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

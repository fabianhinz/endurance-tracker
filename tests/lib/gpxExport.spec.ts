import { describe, it, expect } from 'vitest';
import { buildSessionGpx, buildGpxFilename } from '@/lib/gpxExport.ts';
import { makeGPSRunningRecords, makeIndoorRecords } from '../factories/gps.ts';
import { makeSession } from '../factories/sessions.ts';

describe('buildSessionGpx', () => {
  it('produces valid GPX from GPS records', () => {
    const session = makeSession({ id: 'test-1', name: 'Morning Run', date: 1700000000000 });
    const records = makeGPSRunningRecords('test-1', 10);
    const gpx = buildSessionGpx(session, records);

    expect(gpx).not.toBeNull();
    expect(gpx).toContain('<?xml');
    expect(gpx).toContain('<gpx');
    expect(gpx).toContain('<trkpt');
    expect(gpx).toContain('<ele>');
    expect(gpx).toContain('<time>');
    expect(gpx).toContain('Morning Run');
  });

  it('returns null for indoor records with no GPS', () => {
    const session = makeSession({ id: 'test-2' });
    const records = makeIndoorRecords('test-2', 50);
    const gpx = buildSessionGpx(session, records);

    expect(gpx).toBeNull();
  });

  it('returns null when fewer than 2 valid GPS points', () => {
    const session = makeSession({ id: 'test-3' });
    const records = makeGPSRunningRecords('test-3', 1);
    const gpx = buildSessionGpx(session, records);

    expect(gpx).toBeNull();
  });

  it('filters out records with invalid coordinates', () => {
    const session = makeSession({ id: 'test-4', date: 1700000000000 });
    const validRecords = makeGPSRunningRecords('test-4', 5);
    const invalidRecords = [
      { sessionId: 'test-4', timestamp: 100, lat: undefined, lng: undefined },
      { sessionId: 'test-4', timestamp: 101, lat: 999, lng: 999 },
    ];
    const mixed = [...validRecords, ...invalidRecords];
    const gpx = buildSessionGpx(session, mixed);

    expect(gpx).not.toBeNull();
    // Should have exactly 5 trkpt elements from the valid records
    const trkptCount = (gpx!.match(/<trkpt/g) ?? []).length;
    expect(trkptCount).toBe(5);
  });

  it('returns null for empty records', () => {
    const session = makeSession({ id: 'test-5' });
    const gpx = buildSessionGpx(session, []);

    expect(gpx).toBeNull();
  });
});

describe('buildGpxFilename', () => {
  it('formats filename with capitalized sport and ISO date', () => {
    const filename = buildGpxFilename('running', 1700000000000);
    expect(filename).toBe('PaceVault_Running_2023-11-14.gpx');
  });

  it('capitalizes first letter of sport', () => {
    const filename = buildGpxFilename('cycling', 1700000000000);
    expect(filename).toBe('PaceVault_Cycling_2023-11-14.gpx');
  });
});

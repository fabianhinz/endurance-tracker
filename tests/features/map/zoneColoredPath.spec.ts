import { describe, expect, it } from 'vitest';

import type { SessionRecord } from '@/engine/types.ts';
import {
  buildZoneColoredPath,
  buildSportColoredPath,
  type UserThresholds,
} from '@/features/map/zoneColoredPath.ts';

const FALLBACK_COLOR: [number, number, number, number] = [160, 160, 160, 80];

const rec = (lat: number, lng: number, extras?: Partial<SessionRecord>): SessionRecord => ({
  sessionId: 's1',
  timestamp: 0,
  lat,
  lng,
  ...extras,
});

const hrThresholds: UserThresholds = { maxHr: 200, restHr: 60 };

describe('buildZoneColoredPath — structural', () => {
  it('returns [] for empty records', () => {
    expect(buildZoneColoredPath([], 'hr', hrThresholds)).toEqual([]);
  });

  it('returns [] for a single GPS record', () => {
    expect(buildZoneColoredPath([rec(1, 2)], 'hr', hrThresholds)).toEqual([]);
  });

  it('returns [] when only one record has GPS', () => {
    const records = [rec(1, 2), { sessionId: 's1', timestamp: 0 } as SessionRecord];
    expect(buildZoneColoredPath(records, 'hr', hrThresholds)).toEqual([]);
  });

  it('produces 1 segment with 2-point path for two same-color records', () => {
    const records = [rec(1, 2, { hr: 150 }), rec(3, 4, { hr: 150 })];
    const segments = buildZoneColoredPath(records, 'hr', hrThresholds);
    expect(segments).toHaveLength(1);
    expect(segments[0].path).toHaveLength(2);
  });

  it('produces 2 segments with shared bridging point on color transition', () => {
    // hr=80 → below Z1 → Z1 color; hr=165 → Z3 color
    const records = [rec(1, 2, { hr: 80 }), rec(3, 4, { hr: 80 }), rec(5, 6, { hr: 165 })];
    const segments = buildZoneColoredPath(records, 'hr', hrThresholds);
    expect(segments).toHaveLength(2);
    // bridging point is the last point of seg 0 and first point of seg 1
    expect(segments[0].path[segments[0].path.length - 1]).toEqual(segments[1].path[0]);
  });

  it('uses [lng, lat] coordinate order', () => {
    const records = [rec(10, 20, { hr: 150 }), rec(30, 40, { hr: 150 })];
    const segments = buildZoneColoredPath(records, 'hr', hrThresholds);
    expect(segments[0].path[0]).toEqual([20, 10]); // [lng, lat]
    expect(segments[0].path[1]).toEqual([40, 30]);
  });

  it('returns all FALLBACK_COLOR when pace mode has thresholdPace=0', () => {
    const thresholds: UserThresholds = { maxHr: 200, restHr: 60, thresholdPace: 0 };
    const records = [rec(1, 2, { speed: 3 }), rec(3, 4, { speed: 3 })];
    const segments = buildZoneColoredPath(records, 'pace', thresholds);
    expect(segments).toHaveLength(1);
    expect(segments[0].color).toEqual(FALLBACK_COLOR);
  });
});

describe('getHrColor (via HR mode)', () => {
  it('returns FALLBACK_COLOR when hrReserve <= 0', () => {
    const thresholds: UserThresholds = { maxHr: 60, restHr: 60 };
    const records = [rec(1, 2, { hr: 60 }), rec(3, 4, { hr: 60 })];
    const segments = buildZoneColoredPath(records, 'hr', thresholds);
    expect(segments[0].color).toEqual(FALLBACK_COLOR);
  });

  it('clamps below Z1 to Z1 color', () => {
    // pct < 0.5 → Z1 color #60a5fa
    const records = [rec(1, 2, { hr: 80 }), rec(3, 4, { hr: 80 })];
    const segments = buildZoneColoredPath(records, 'hr', hrThresholds);
    expect(segments[0].color).toEqual([96, 165, 250, 220]);
  });

  it('maps mid-range HR to Z3 color', () => {
    // maxHr=200, restHr=60, hrReserve=140
    // Z3: pct 0.7-0.8 → hr 158-172; hr=165 → pct≈0.75
    const records = [rec(1, 2, { hr: 165 }), rec(3, 4, { hr: 165 })];
    const segments = buildZoneColoredPath(records, 'hr', hrThresholds);
    expect(segments[0].color).toEqual([251, 191, 36, 220]);
  });

  it('clamps above maxHr to Z5 color', () => {
    // hr=210 → pct > 1.0 → Z5 color #ef4444
    const records = [rec(1, 2, { hr: 210 }), rec(3, 4, { hr: 210 })];
    const segments = buildZoneColoredPath(records, 'hr', hrThresholds);
    expect(segments[0].color).toEqual([239, 68, 68, 220]);
  });

  it('returns FALLBACK_COLOR when hr is 0', () => {
    const records = [rec(1, 2, { hr: 0 }), rec(3, 4, { hr: 0 })];
    const segments = buildZoneColoredPath(records, 'hr', hrThresholds);
    expect(segments[0].color).toEqual(FALLBACK_COLOR);
  });

  it('returns FALLBACK_COLOR when hr is undefined', () => {
    const records = [rec(1, 2), rec(3, 4)];
    const segments = buildZoneColoredPath(records, 'hr', hrThresholds);
    expect(segments[0].color).toEqual(FALLBACK_COLOR);
  });
});

describe('getPowerColor (via power mode)', () => {
  const powerThresholds: UserThresholds = { maxHr: 200, restHr: 60, ftp: 200 };

  it('returns FALLBACK_COLOR when ftp is missing', () => {
    const records = [rec(1, 2, { power: 150 }), rec(3, 4, { power: 150 })];
    const segments = buildZoneColoredPath(records, 'power', hrThresholds);
    expect(segments[0].color).toEqual(FALLBACK_COLOR);
  });

  it('maps low power to Z1 color', () => {
    // power=100, ftp=200 → pct=0.5 → Z1 (0-0.55) #94a3b8
    const records = [rec(1, 2, { power: 100 }), rec(3, 4, { power: 100 })];
    const segments = buildZoneColoredPath(records, 'power', powerThresholds);
    expect(segments[0].color).toEqual([148, 163, 184, 220]);
  });

  it('maps very high power to Z7 color', () => {
    // power=350, ftp=200 → pct=1.75 → Z7 (1.5-Inf) #dc2626
    const records = [rec(1, 2, { power: 350 }), rec(3, 4, { power: 350 })];
    const segments = buildZoneColoredPath(records, 'power', powerThresholds);
    expect(segments[0].color).toEqual([220, 38, 38, 220]);
  });
});

describe('getPaceColor (via pace mode)', () => {
  // thresholdPace=300 (5:00/km)
  // recovery: minPace=420, maxPace=387, #60a5fa
  // tempo:    minPace=348, maxPace=315, #fbbf24
  // vo2max:   minPace=291, maxPace=258, #ef4444
  const paceThresholds: UserThresholds = { maxHr: 200, restHr: 60, thresholdPace: 300 };

  it('returns FALLBACK_COLOR when speed <= 0.5', () => {
    const records = [rec(1, 2, { speed: 0.5 }), rec(3, 4, { speed: 0.5 })];
    const segments = buildZoneColoredPath(records, 'pace', paceThresholds);
    expect(segments[0].color).toEqual(FALLBACK_COLOR);
  });

  it('maps tempo-zone pace to tempo color', () => {
    // pace=330 sec/km → speed=1000/330≈3.03 → tempo zone #fbbf24
    const records = [rec(1, 2, { speed: 1000 / 330 }), rec(3, 4, { speed: 1000 / 330 })];
    const segments = buildZoneColoredPath(records, 'pace', paceThresholds);
    expect(segments[0].color).toEqual([251, 191, 36, 220]);
  });

  it('clamps very slow pace to recovery color', () => {
    // pace=450 sec/km → speed=1000/450≈2.22 → slower than recovery → clamps to recovery #60a5fa
    const records = [rec(1, 2, { speed: 1000 / 450 }), rec(3, 4, { speed: 1000 / 450 })];
    const segments = buildZoneColoredPath(records, 'pace', paceThresholds);
    expect(segments[0].color).toEqual([96, 165, 250, 220]);
  });

  it('clamps very fast pace to vo2max color', () => {
    // pace=240 sec/km → speed=1000/240≈4.17 → faster than vo2max → clamps to vo2max #ef4444
    const records = [rec(1, 2, { speed: 1000 / 240 }), rec(3, 4, { speed: 1000 / 240 })];
    const segments = buildZoneColoredPath(records, 'pace', paceThresholds);
    expect(segments[0].color).toEqual([239, 68, 68, 220]);
  });
});

describe('buildSportColoredPath', () => {
  const color: [number, number, number, number] = [74, 222, 128, 255];

  it('returns [] for empty records', () => {
    expect(buildSportColoredPath([], color)).toEqual([]);
  });

  it('returns [] for a single GPS record', () => {
    expect(buildSportColoredPath([rec(1, 2)], color)).toEqual([]);
  });

  it('returns single segment with provided color for 2+ valid records', () => {
    const records = [rec(10, 20), rec(30, 40), rec(50, 60)];
    const segments = buildSportColoredPath(records, color);
    expect(segments).toHaveLength(1);
    expect(segments[0].color).toEqual(color);
    expect(segments[0].path).toHaveLength(3);
  });

  it('uses [lng, lat] coordinate order', () => {
    const records = [rec(10, 20), rec(30, 40)];
    const segments = buildSportColoredPath(records, color);
    expect(segments[0].path[0]).toEqual([20, 10]);
    expect(segments[0].path[1]).toEqual([40, 30]);
  });

  it('filters out records with invalid coordinates', () => {
    const records = [
      rec(10, 20),
      { sessionId: 's1', timestamp: 0 } as SessionRecord,
      rec(30, 40),
    ];
    const segments = buildSportColoredPath(records, color);
    expect(segments).toHaveLength(1);
    expect(segments[0].path).toHaveLength(2);
  });
});

import { describe, it, expect } from 'vitest';
import {
  computeHrZoneDistribution,
  computePowerZoneDistribution,
  computePaceZoneDistribution,
} from '../../src/engine/zone-distribution.ts';
import type { SessionRecord } from '../../src/engine/types.ts';

describe('computeHrZoneDistribution', () => {
  const maxHr = 190;
  const restHr = 50;
  // HR reserve = 140

  it('distributes records into 5 HR zones', () => {
    // Create records spanning all zones
    const records: SessionRecord[] = [];
    for (let hr = 120; hr <= 190; hr += 2) {
      records.push({ sessionId: 's1', timestamp: records.length, hr });
    }
    const result = computeHrZoneDistribution(records, maxHr, restHr);
    expect(result).toHaveLength(5);
    expect(result.every((b) => b.zone.startsWith('Z'))).toBe(true);
  });

  it('percentages sum to 100', () => {
    const records: SessionRecord[] = [];
    for (let hr = 120; hr <= 190; hr++) {
      records.push({ sessionId: 's1', timestamp: records.length, hr });
    }
    const result = computeHrZoneDistribution(records, maxHr, restHr);
    const totalPct = result.reduce((s, b) => s + b.percentage, 0);
    expect(totalPct).toBeCloseTo(100, 0);
  });

  it('returns empty for no HR data', () => {
    const records: SessionRecord[] = [
      { sessionId: 's1', timestamp: 0 },
    ];
    expect(computeHrZoneDistribution(records, maxHr, restHr)).toHaveLength(0);
  });

  it('returns empty for invalid HR reserve', () => {
    const records: SessionRecord[] = [
      { sessionId: 's1', timestamp: 0, hr: 150 },
    ];
    expect(computeHrZoneDistribution(records, 50, 50)).toHaveLength(0);
  });

  it('caps HR above max into Z5', () => {
    const records: SessionRecord[] = [
      { sessionId: 's1', timestamp: 0, hr: 200 }, // above maxHr
    ];
    const result = computeHrZoneDistribution(records, maxHr, restHr);
    const z5 = result.find((b) => b.zone === 'Z5');
    expect(z5?.percentage).toBe(100);
  });

  it('includes rangeLabel with bpm range', () => {
    const records: SessionRecord[] = [
      { sessionId: 's1', timestamp: 0, hr: 150 },
    ];
    const result = computeHrZoneDistribution(records, maxHr, restHr);
    // HR reserve = 140, Z1 minPct=0.50 maxPct=0.60 → 50+70=120 to 50+84=134
    const z1 = result.find((b) => b.zone === 'Z1');
    expect(z1?.rangeLabel).toBe('120–134 bpm');
  });
});

describe('computePowerZoneDistribution', () => {
  const ftp = 250;

  it('distributes records into 7 Coggan power zones', () => {
    const records: SessionRecord[] = [];
    for (let power = 50; power <= 400; power += 10) {
      records.push({ sessionId: 's1', timestamp: records.length, power });
    }
    const result = computePowerZoneDistribution(records, ftp);
    expect(result).toHaveLength(7);
  });

  it('percentages sum to 100', () => {
    const records: SessionRecord[] = [];
    for (let power = 50; power <= 400; power += 5) {
      records.push({ sessionId: 's1', timestamp: records.length, power });
    }
    const result = computePowerZoneDistribution(records, ftp);
    const totalPct = result.reduce((s, b) => s + b.percentage, 0);
    expect(totalPct).toBeCloseTo(100, 0);
  });

  it('returns empty for no power data', () => {
    const records: SessionRecord[] = [
      { sessionId: 's1', timestamp: 0 },
    ];
    expect(computePowerZoneDistribution(records, ftp)).toHaveLength(0);
  });

  it('returns empty for ftp <= 0', () => {
    const records: SessionRecord[] = [
      { sessionId: 's1', timestamp: 0, power: 200 },
    ];
    expect(computePowerZoneDistribution(records, 0)).toHaveLength(0);
  });

  it('includes rangeLabel with watt range', () => {
    const records: SessionRecord[] = [
      { sessionId: 's1', timestamp: 0, power: 200 },
    ];
    const result = computePowerZoneDistribution(records, ftp);
    // Z2: 0.55–0.75 of 250 = 138–188, Z3: 0.75–0.90 = 188–225
    const z3 = result.find((b) => b.zone === 'Z3');
    expect(z3?.rangeLabel).toBe('188–225 W');
    // Z7 has Infinity upper bound
    const z7 = result.find((b) => b.zone === 'Z7');
    expect(z7?.rangeLabel).toBe('>375 W');
  });
});

describe('computePaceZoneDistribution', () => {
  // 270 sec/km = 4:30/km threshold
  const thresholdPace = 270;

  it('distributes into 5 running zones', () => {
    const records: SessionRecord[] = [];
    // Spread across paces from 6:00/km (360s) to 3:30/km (210s)
    for (let pace = 210; pace <= 360; pace += 5) {
      const speed = 1000 / pace; // m/s
      records.push({ sessionId: 's1', timestamp: records.length, speed });
    }
    const result = computePaceZoneDistribution(records, thresholdPace);
    expect(result).toHaveLength(5);
  });

  it('percentages sum to ~100', () => {
    const records: SessionRecord[] = [];
    for (let pace = 220; pace <= 370; pace += 3) {
      const speed = 1000 / pace;
      records.push({ sessionId: 's1', timestamp: records.length, speed });
    }
    const result = computePaceZoneDistribution(records, thresholdPace);
    const totalPct = result.reduce((s, b) => s + b.percentage, 0);
    // May not be exactly 100 if some records fall outside all zones
    expect(totalPct).toBeLessThanOrEqual(100.1);
    expect(totalPct).toBeGreaterThan(0);
  });

  it('returns empty for no speed data', () => {
    const records: SessionRecord[] = [
      { sessionId: 's1', timestamp: 0 },
    ];
    expect(computePaceZoneDistribution(records, thresholdPace)).toHaveLength(0);
  });

  it('returns empty for thresholdPace <= 0', () => {
    const records: SessionRecord[] = [
      { sessionId: 's1', timestamp: 0, speed: 3.5 },
    ];
    expect(computePaceZoneDistribution(records, 0)).toHaveLength(0);
  });

  it('filters out slow records (speed <= 0.5 m/s)', () => {
    const records: SessionRecord[] = [
      { sessionId: 's1', timestamp: 0, speed: 0.3 },
    ];
    expect(computePaceZoneDistribution(records, thresholdPace)).toHaveLength(0);
  });

  it('includes rangeLabel with pace range', () => {
    const records: SessionRecord[] = [];
    for (let pace = 210; pace <= 360; pace += 5) {
      records.push({ sessionId: 's1', timestamp: records.length, speed: 1000 / pace });
    }
    const result = computePaceZoneDistribution(records, thresholdPace);
    // Each zone should have a rangeLabel containing "/km"
    for (const bucket of result) {
      expect(bucket.rangeLabel).toContain('/km');
      expect(bucket.rangeLabel).toContain('–');
    }
  });
});

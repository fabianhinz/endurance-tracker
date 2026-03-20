import { describe, it, expect } from 'vitest';
import { formatSessionName, formatSessionZoneLabel } from '@/lib/sessionTitleFormatter.ts';

const atHour = (hour: number): number => new Date(2025, 0, 15, hour, 0, 0).getTime();

const auto = { useAutoNames: true } as const;

describe('formatSessionName', () => {
  describe('auto mode — time-of-day boundaries', () => {
    it('returns Morning at 5:00', () => {
      expect(formatSessionName({ sport: 'running', date: atHour(5) }, auto)).toBe('Morning Run');
    });

    it('returns Afternoon at 12:00', () => {
      expect(formatSessionName({ sport: 'running', date: atHour(12) }, auto)).toBe('Afternoon Run');
    });

    it('returns Evening at 17:00', () => {
      expect(formatSessionName({ sport: 'running', date: atHour(17) }, auto)).toBe('Evening Run');
    });

    it('returns Night at 21:00', () => {
      expect(formatSessionName({ sport: 'running', date: atHour(21) }, auto)).toBe('Night Run');
    });
  });

  it('applies sub-sport prefix when mapped', () => {
    expect(formatSessionName({ sport: 'running', subSport: 'trail', date: atHour(8) }, auto)).toBe(
      'Morning Trail Run',
    );
  });

  it('skips unmapped sub-sports', () => {
    expect(formatSessionName({ sport: 'running', subSport: 'road', date: atHour(8) }, auto)).toBe(
      'Morning Run',
    );
  });

  describe('fallback mode (default)', () => {
    it('returns name when available', () => {
      expect(formatSessionName({ sport: 'running', date: atHour(8), name: 'My Custom Name' })).toBe(
        'My Custom Name',
      );
    });

    it('falls back to formatted date when name is missing', () => {
      const result = formatSessionName({ sport: 'running', date: atHour(8) });
      expect(result).toBeTruthy();
      expect(result).not.toBe('Morning Run');
    });
  });
});

describe('formatSessionZoneLabel', () => {
  // Profile: maxHr=200, restHr=50 → hrReserve=150

  it('returns correct zone for valid input', () => {
    expect(formatSessionZoneLabel(160, 200, 50)).toBe('Tempo');
  });

  it('returns undefined when input is missing', () => {
    expect(formatSessionZoneLabel(undefined, 200, 50)).toBeUndefined();
  });

  it('returns undefined when maxHr <= restHr', () => {
    expect(formatSessionZoneLabel(150, 50, 60)).toBeUndefined();
  });
});

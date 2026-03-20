import { describe, it, expect } from 'vitest';
import { formatSessionName, formatSessionZoneLabel } from '@/lib/sessionTitleFormatter.ts';

const atHour = (hour: number): number => new Date(2025, 0, 15, hour, 0, 0).getTime();

const auto = { useAutoNames: true } as const;

describe('formatSessionName', () => {
  describe('time-of-day bucketing', () => {
    it('returns Morning for 5:00', () => {
      expect(formatSessionName({ sport: 'running', date: atHour(5) }, auto)).toBe('Morning Run');
    });

    it('returns Morning for 11:00', () => {
      expect(formatSessionName({ sport: 'running', date: atHour(11) }, auto)).toBe('Morning Run');
    });

    it('returns Afternoon for 12:00', () => {
      expect(formatSessionName({ sport: 'running', date: atHour(12) }, auto)).toBe('Afternoon Run');
    });

    it('returns Afternoon for 16:00', () => {
      expect(formatSessionName({ sport: 'running', date: atHour(16) }, auto)).toBe('Afternoon Run');
    });

    it('returns Evening for 17:00', () => {
      expect(formatSessionName({ sport: 'running', date: atHour(17) }, auto)).toBe('Evening Run');
    });

    it('returns Evening for 20:00', () => {
      expect(formatSessionName({ sport: 'running', date: atHour(20) }, auto)).toBe('Evening Run');
    });

    it('returns Night for 21:00', () => {
      expect(formatSessionName({ sport: 'running', date: atHour(21) }, auto)).toBe('Night Run');
    });

    it('returns Night for midnight', () => {
      expect(formatSessionName({ sport: 'running', date: atHour(0) }, auto)).toBe('Night Run');
    });

    it('returns Night for 4:00', () => {
      expect(formatSessionName({ sport: 'running', date: atHour(4) }, auto)).toBe('Night Run');
    });
  });

  describe('sport nouns', () => {
    it('maps running to Run', () => {
      expect(formatSessionName({ sport: 'running', date: atHour(8) }, auto)).toBe('Morning Run');
    });

    it('maps cycling to Ride', () => {
      expect(formatSessionName({ sport: 'cycling', date: atHour(8) }, auto)).toBe('Morning Ride');
    });

    it('maps swimming to Swim', () => {
      expect(formatSessionName({ sport: 'swimming', date: atHour(8) }, auto)).toBe('Morning Swim');
    });
  });

  describe('sub-sport prefixes', () => {
    it('includes Trail prefix for trail running', () => {
      expect(
        formatSessionName({ sport: 'running', subSport: 'trail', date: atHour(8) }, auto),
      ).toBe('Morning Trail Run');
    });

    it('includes Virtual prefix for virtual cycling', () => {
      expect(
        formatSessionName(
          { sport: 'cycling', subSport: 'virtual_activity', date: atHour(19) },
          auto,
        ),
      ).toBe('Evening Virtual Ride');
    });

    it('includes Indoor prefix for indoor cycling', () => {
      expect(
        formatSessionName({ sport: 'cycling', subSport: 'indoor_cycling', date: atHour(8) }, auto),
      ).toBe('Morning Indoor Ride');
    });

    it('includes Indoor prefix for indoor running', () => {
      expect(
        formatSessionName({ sport: 'running', subSport: 'indoor_running', date: atHour(8) }, auto),
      ).toBe('Morning Indoor Run');
    });

    it('includes Treadmill prefix for treadmill', () => {
      expect(
        formatSessionName({ sport: 'running', subSport: 'treadmill', date: atHour(8) }, auto),
      ).toBe('Morning Treadmill Run');
    });

    it('includes Gravel prefix for gravel cycling', () => {
      expect(
        formatSessionName({ sport: 'cycling', subSport: 'gravel_cycling', date: atHour(14) }, auto),
      ).toBe('Afternoon Gravel Ride');
    });

    it('includes Mountain prefix for mountain biking', () => {
      expect(
        formatSessionName({ sport: 'cycling', subSport: 'mountain', date: atHour(8) }, auto),
      ).toBe('Morning Mountain Ride');
    });

    it('includes Track prefix for track running', () => {
      expect(
        formatSessionName({ sport: 'running', subSport: 'track', date: atHour(18) }, auto),
      ).toBe('Evening Track Run');
    });

    it('includes Pool prefix for lap swimming', () => {
      expect(
        formatSessionName({ sport: 'swimming', subSport: 'lap_swimming', date: atHour(8) }, auto),
      ).toBe('Morning Pool Swim');
    });

    it('includes Open Water prefix for open water swimming', () => {
      expect(
        formatSessionName({ sport: 'swimming', subSport: 'open_water', date: atHour(14) }, auto),
      ).toBe('Afternoon Open Water Swim');
    });
  });

  describe('skipped sub-sports', () => {
    it('skips road sub-sport', () => {
      expect(formatSessionName({ sport: 'running', subSport: 'road', date: atHour(8) }, auto)).toBe(
        'Morning Run',
      );
    });

    it('skips generic sub-sport', () => {
      expect(
        formatSessionName({ sport: 'cycling', subSport: 'generic', date: atHour(8) }, auto),
      ).toBe('Morning Ride');
    });

    it('skips unknown sub-sport', () => {
      expect(
        formatSessionName(
          { sport: 'running', subSport: 'some_unknown_sport', date: atHour(8) },
          auto,
        ),
      ).toBe('Morning Run');
    });
  });

  describe('useAutoNames fallback (default)', () => {
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

    it('defaults to useAutoNames false when no options provided', () => {
      expect(formatSessionName({ sport: 'running', date: atHour(8), name: 'Lauf am Morgen' })).toBe(
        'Lauf am Morgen',
      );
    });
  });
});

describe('getSessionZoneLabel', () => {
  // Profile: maxHr=200, restHr=50 → hrReserve=150
  // In bpm: recovery 125-140, aerobic 140-155, tempo 155-170, threshold 170-185, vo2max 185+

  it('returns Recovery for low avgHr', () => {
    expect(formatSessionZoneLabel(130, 200, 50)).toBe('Recovery');
  });

  it('returns Aerobic zone', () => {
    expect(formatSessionZoneLabel(145, 200, 50)).toBe('Aerobic');
  });

  it('returns Tempo zone', () => {
    expect(formatSessionZoneLabel(160, 200, 50)).toBe('Tempo');
  });

  it('returns Threshold zone', () => {
    expect(formatSessionZoneLabel(175, 200, 50)).toBe('Threshold');
  });

  it('returns VO2max zone', () => {
    expect(formatSessionZoneLabel(190, 200, 50)).toBe('VO2max');
  });

  it('returns undefined when avgHr is missing', () => {
    expect(formatSessionZoneLabel(undefined, 200, 50)).toBeUndefined();
  });

  it('returns undefined when maxHr is missing', () => {
    expect(formatSessionZoneLabel(150, undefined, 50)).toBeUndefined();
  });

  it('returns undefined when restHr is missing', () => {
    expect(formatSessionZoneLabel(150, 200, undefined)).toBeUndefined();
  });

  it('returns undefined when maxHr <= restHr', () => {
    expect(formatSessionZoneLabel(150, 50, 60)).toBeUndefined();
  });

  it('returns undefined when avgHr <= restHr', () => {
    expect(formatSessionZoneLabel(40, 200, 50)).toBeUndefined();
  });
});

import { describe, it, expect } from 'vitest';
import { createDefaultProfile } from '../../src/lib/defaults.ts';

describe('createDefaultProfile', () => {
  it('returns a profile with the provided ID', () => {
    const profile = createDefaultProfile('abc-123');
    expect(profile.id).toBe('abc-123');
  });

  it('defaults gender to male', () => {
    const profile = createDefaultProfile('test');
    expect(profile.gender).toBe('male');
  });

  it('sets default thresholds', () => {
    const profile = createDefaultProfile('test');
    expect(profile.thresholds.maxHr).toBe(203);
    expect(profile.thresholds.restHr).toBe(44);
    expect(profile.thresholds.ftp).toBe(305);
  });

  it('defaults showMetricHelp to true', () => {
    const profile = createDefaultProfile('test');
    expect(profile.showMetricHelp).toBe(true);
  });

  it('sets createdAt to a valid timestamp', () => {
    const before = Date.now();
    const profile = createDefaultProfile('test');
    const after = Date.now();
    expect(profile.createdAt).toBeGreaterThanOrEqual(before);
    expect(profile.createdAt).toBeLessThanOrEqual(after);
  });
});

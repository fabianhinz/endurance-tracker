import { describe, it, expect, beforeEach } from 'vitest';
import { useLapOptionsStore } from '../../src/store/lapOptions.ts';

describe('useLapOptionsStore', () => {
  beforeEach(() => {
    useLapOptionsStore.setState({ splitDistance: {} });
  });

  it('defaults splitDistance to empty object', () => {
    expect(useLapOptionsStore.getState().splitDistance).toEqual({});
  });

  it('sets split distance for a sport', () => {
    useLapOptionsStore.getState().setLapSplitDistance('running', 1000);
    expect(useLapOptionsStore.getState().splitDistance.running).toBe(1000);
  });

  it('resets split distance to undefined (device mode)', () => {
    useLapOptionsStore.getState().setLapSplitDistance('running', 1000);
    useLapOptionsStore.getState().setLapSplitDistance('running', undefined);
    expect(useLapOptionsStore.getState().splitDistance.running).toBeUndefined();
  });

  it('maintains per-sport independence', () => {
    useLapOptionsStore.getState().setLapSplitDistance('running', 1000);
    useLapOptionsStore.getState().setLapSplitDistance('cycling', 10000);
    expect(useLapOptionsStore.getState().splitDistance.running).toBe(1000);
    expect(useLapOptionsStore.getState().splitDistance.cycling).toBe(10000);
  });

  it('updating one sport does not affect another', () => {
    useLapOptionsStore.getState().setLapSplitDistance('running', 1000);
    useLapOptionsStore.getState().setLapSplitDistance('cycling', 5000);
    useLapOptionsStore.getState().setLapSplitDistance('running', 2000);
    expect(useLapOptionsStore.getState().splitDistance.running).toBe(2000);
    expect(useLapOptionsStore.getState().splitDistance.cycling).toBe(5000);
  });
});

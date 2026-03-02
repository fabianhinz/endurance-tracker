import { describe, it, expect, beforeEach } from 'vitest';
import { useLapOptionsStore } from '../../src/store/lapOptions.ts';

describe('useLapOptionsStore', () => {
  beforeEach(() => {
    useLapOptionsStore.setState({ splitDistance: {}, useDeviceLaps: {} });
  });

  it('defaults splitDistance to empty object', () => {
    expect(useLapOptionsStore.getState().splitDistance).toEqual({});
  });

  it('defaults useDeviceLaps to empty object', () => {
    expect(useLapOptionsStore.getState().useDeviceLaps).toEqual({});
  });

  it('sets split distance for a sport', () => {
    useLapOptionsStore.getState().setLapSplitDistance('running', 1000);
    expect(useLapOptionsStore.getState().splitDistance.running).toBe(1000);
  });

  it('maintains per-sport independence for splitDistance', () => {
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

  it('sets useDeviceLaps for a sport', () => {
    useLapOptionsStore.getState().setUseDeviceLaps('running', false);
    expect(useLapOptionsStore.getState().useDeviceLaps.running).toBe(false);
  });

  it('toggles useDeviceLaps back to true', () => {
    useLapOptionsStore.getState().setUseDeviceLaps('running', false);
    useLapOptionsStore.getState().setUseDeviceLaps('running', true);
    expect(useLapOptionsStore.getState().useDeviceLaps.running).toBe(true);
  });

  it('maintains per-sport independence for useDeviceLaps', () => {
    useLapOptionsStore.getState().setUseDeviceLaps('running', false);
    useLapOptionsStore.getState().setUseDeviceLaps('cycling', true);
    expect(useLapOptionsStore.getState().useDeviceLaps.running).toBe(false);
    expect(useLapOptionsStore.getState().useDeviceLaps.cycling).toBe(true);
  });

  it('splitDistance and useDeviceLaps are independent', () => {
    useLapOptionsStore.getState().setLapSplitDistance('running', 2000);
    useLapOptionsStore.getState().setUseDeviceLaps('running', false);
    expect(useLapOptionsStore.getState().splitDistance.running).toBe(2000);
    expect(useLapOptionsStore.getState().useDeviceLaps.running).toBe(false);

    useLapOptionsStore.getState().setUseDeviceLaps('running', true);
    expect(useLapOptionsStore.getState().splitDistance.running).toBe(2000);
  });
});

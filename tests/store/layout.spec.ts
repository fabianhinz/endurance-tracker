import { describe, it, expect, beforeEach } from 'vitest';
import { useLayoutStore } from '@/store/layout.ts';

describe('useLayoutStore', () => {
  beforeEach(() => {
    useLayoutStore.setState({
      dockExpanded: true,
      compactLayout: false,
      onboardingComplete: false,
      demoMode: false,
      mobileMapActive: false,
    });
  });

  it('defaults dockExpanded to true', () => {
    expect(useLayoutStore.getState().dockExpanded).toBe(true);
  });

  it('toggleDock flips to false', () => {
    useLayoutStore.getState().toggleDock();
    expect(useLayoutStore.getState().dockExpanded).toBe(false);
  });

  it('double toggle returns to true', () => {
    useLayoutStore.getState().toggleDock();
    useLayoutStore.getState().toggleDock();
    expect(useLayoutStore.getState().dockExpanded).toBe(true);
  });

  it('defaults compactLayout to false', () => {
    expect(useLayoutStore.getState().compactLayout).toBe(false);
  });

  it('toggleCompactLayout flips to true', () => {
    useLayoutStore.getState().toggleCompactLayout();
    expect(useLayoutStore.getState().compactLayout).toBe(true);
  });

  it('double toggleCompactLayout returns to false', () => {
    useLayoutStore.getState().toggleCompactLayout();
    useLayoutStore.getState().toggleCompactLayout();
    expect(useLayoutStore.getState().compactLayout).toBe(false);
  });

  it('defaults onboardingComplete to false', () => {
    expect(useLayoutStore.getState().onboardingComplete).toBe(false);
  });

  it('completeOnboarding sets onboardingComplete and compactLayout to true', () => {
    useLayoutStore.getState().completeOnboarding();
    expect(useLayoutStore.getState().onboardingComplete).toBe(true);
    expect(useLayoutStore.getState().compactLayout).toBe(true);
  });

  it('completeOnboarding is idempotent', () => {
    useLayoutStore.getState().completeOnboarding();
    useLayoutStore.getState().completeOnboarding();
    expect(useLayoutStore.getState().onboardingComplete).toBe(true);
    expect(useLayoutStore.getState().compactLayout).toBe(true);
  });

  it('defaults demoMode to false', () => {
    expect(useLayoutStore.getState().demoMode).toBe(false);
  });

  it('setDemoMode(true) sets demoMode to true', () => {
    useLayoutStore.getState().setDemoMode(true);
    expect(useLayoutStore.getState().demoMode).toBe(true);
  });

  it('setDemoMode(false) sets demoMode back to false', () => {
    useLayoutStore.getState().setDemoMode(true);
    useLayoutStore.getState().setDemoMode(false);
    expect(useLayoutStore.getState().demoMode).toBe(false);
  });

  it('toggleMobileMap flips to true', () => {
    useLayoutStore.getState().toggleMobileMap();
    expect(useLayoutStore.getState().mobileMapActive).toBe(true);
  });

  it('double toggleMobileMap returns to false', () => {
    useLayoutStore.getState().toggleMobileMap();
    useLayoutStore.getState().toggleMobileMap();
    expect(useLayoutStore.getState().mobileMapActive).toBe(false);
  });
});

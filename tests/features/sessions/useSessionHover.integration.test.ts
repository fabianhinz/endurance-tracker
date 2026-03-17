import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSessionHover } from '@/features/sessions/hooks/useSessionHover.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';

describe('useSessionHover', () => {
  beforeEach(() => {
    useMapFocusStore.setState({ hoveredSessionId: null });
  });

  it('clears hoveredSessionId on unmount (pointerLeave may not fire)', () => {
    useMapFocusStore.getState().setHoveredSession('session-abc');
    expect(useMapFocusStore.getState().hoveredSessionId).toBe('session-abc');

    const { unmount } = renderHook(() => useSessionHover('session-abc'));
    unmount();

    expect(useMapFocusStore.getState().hoveredSessionId).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChartZoom } from '../../src/lib/use-chart-zoom.ts';
import type { MouseHandlerDataParam } from 'recharts/types/synchronisation/types';

const sampleData = [
  { date: '2024-01-01', value: 10 },
  { date: '2024-01-02', value: 20 },
  { date: '2024-01-03', value: 30 },
  { date: '2024-01-04', value: 40 },
  { date: '2024-01-05', value: 50 },
];

function mockEvent(activeLabel: string | number | undefined): MouseHandlerDataParam {
  return {
    activeLabel,
    activeTooltipIndex: undefined,
    isTooltipActive: false,
    activeIndex: undefined,
    activeDataKey: undefined,
    activeCoordinate: undefined,
  };
}

describe('useChartZoom', () => {
  it('returns full data initially with isZoomed false', () => {
    const { result } = renderHook(() => useChartZoom({ data: sampleData, xKey: 'date' }));
    expect(result.current.zoomedData).toEqual(sampleData);
    expect(result.current.isZoomed).toBe(false);
    expect(result.current.refAreaLeft).toBeNull();
    expect(result.current.refAreaRight).toBeNull();
  });

  it('zooms to selected range on mousedown + mousemove + mouseup', () => {
    const { result } = renderHook(() => useChartZoom({ data: sampleData, xKey: 'date' }));

    act(() => result.current.onMouseDown(mockEvent('2024-01-02')));
    act(() => result.current.onMouseMove(mockEvent('2024-01-04')));
    act(() => result.current.onMouseUp());

    expect(result.current.isZoomed).toBe(true);
    expect(result.current.zoomedData).toEqual([
      { date: '2024-01-02', value: 20 },
      { date: '2024-01-03', value: 30 },
      { date: '2024-01-04', value: 40 },
    ]);
  });

  it('handles reversed selection (right-to-left drag)', () => {
    const { result } = renderHook(() => useChartZoom({ data: sampleData, xKey: 'date' }));

    act(() => result.current.onMouseDown(mockEvent('2024-01-04')));
    act(() => result.current.onMouseMove(mockEvent('2024-01-02')));
    act(() => result.current.onMouseUp());

    expect(result.current.isZoomed).toBe(true);
    expect(result.current.zoomedData).toHaveLength(3);
    expect(result.current.zoomedData[0]).toEqual({ date: '2024-01-02', value: 20 });
  });

  it('single-point selection does not zoom', () => {
    const { result } = renderHook(() => useChartZoom({ data: sampleData, xKey: 'date' }));

    act(() => result.current.onMouseDown(mockEvent('2024-01-03')));
    act(() => result.current.onMouseMove(mockEvent('2024-01-03')));
    act(() => result.current.onMouseUp());

    expect(result.current.isZoomed).toBe(false);
    expect(result.current.zoomedData).toEqual(sampleData);
  });

  it('resetZoom returns to full data', () => {
    const { result } = renderHook(() => useChartZoom({ data: sampleData, xKey: 'date' }));

    act(() => result.current.onMouseDown(mockEvent('2024-01-02')));
    act(() => result.current.onMouseMove(mockEvent('2024-01-04')));
    act(() => result.current.onMouseUp());
    expect(result.current.isZoomed).toBe(true);

    act(() => result.current.resetZoom());
    expect(result.current.isZoomed).toBe(false);
    expect(result.current.zoomedData).toEqual(sampleData);
  });

  it('onMouseDown with undefined activeLabel is a no-op', () => {
    const { result } = renderHook(() => useChartZoom({ data: sampleData, xKey: 'date' }));

    act(() => result.current.onMouseDown(mockEvent(undefined)));
    expect(result.current.refAreaLeft).toBeNull();
  });

  it('zooms correctly with numeric x-axis data', () => {
    const numericData = [
      { time: 1.23, value: 10 },
      { time: 2.46, value: 20 },
      { time: 3.69, value: 30 },
      { time: 4.92, value: 40 },
      { time: 6.15, value: 50 },
    ];
    const { result } = renderHook(() => useChartZoom({ data: numericData, xKey: 'time' }));

    act(() => result.current.onMouseDown(mockEvent(2.46)));
    expect(result.current.refAreaLeft).toBe(2.46);

    act(() => result.current.onMouseMove(mockEvent(4.92)));
    expect(result.current.refAreaRight).toBe(4.92);

    act(() => result.current.onMouseUp());

    expect(result.current.isZoomed).toBe(true);
    expect(result.current.zoomedData).toEqual([
      { time: 2.46, value: 20 },
      { time: 3.69, value: 30 },
      { time: 4.92, value: 40 },
    ]);
  });

  it('resets zoom when data changes', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useChartZoom({ data, xKey: 'date' }),
      { initialProps: { data: sampleData } },
    );

    act(() => result.current.onMouseDown(mockEvent('2024-01-02')));
    act(() => result.current.onMouseMove(mockEvent('2024-01-04')));
    act(() => result.current.onMouseUp());
    expect(result.current.isZoomed).toBe(true);

    const newData = sampleData.slice(0, 3);
    rerender({ data: newData });
    expect(result.current.isZoomed).toBe(false);
    expect(result.current.zoomedData).toEqual(newData);
  });
});

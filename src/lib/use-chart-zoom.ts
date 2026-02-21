import { useState, useCallback, useEffect } from 'react';
import type { MouseHandlerDataParam } from 'recharts/types/synchronisation/types';

interface UseChartZoomOptions<T> {
  data: T[];
  xKey: keyof T & string;
  onZoomComplete?: (from: string | number, to: string | number) => void;
  onZoomReset?: () => void;
}

interface UseChartZoomReturn<T> {
  zoomedData: T[];
  refAreaLeft: string | number | null;
  refAreaRight: string | number | null;
  isZoomed: boolean;
  onMouseDown: (e: MouseHandlerDataParam) => void;
  onMouseMove: (e: MouseHandlerDataParam) => void;
  onMouseUp: () => void;
  resetZoom: () => void;
}

export const useChartZoom = <T>(options: UseChartZoomOptions<T>): UseChartZoomReturn<T> => {
  const data = options.data;
  const xKey = options.xKey;
  const onZoomComplete = options.onZoomComplete;
  const onZoomReset = options.onZoomReset;
  const [refAreaLeft, setRefAreaLeft] = useState<string | number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | number | null>(null);
  const [startIndex, setStartIndex] = useState<number | null>(null);
  const [endIndex, setEndIndex] = useState<number | null>(null);
  const [prevData, setPrevData] = useState(data);

  // Auto-reset when data changes (setState during render is the official React pattern)
  if (data !== prevData) {
    setPrevData(data);
    setStartIndex(null);
    setEndIndex(null);
    setRefAreaLeft(null);
    setRefAreaRight(null);
  }

  // Prevent text selection across the page during drag
  useEffect(() => {
    if (!refAreaLeft) return;
    const prev = document.body.style.userSelect;
    document.body.style.userSelect = 'none';
    return () => { document.body.style.userSelect = prev; };
  }, [refAreaLeft]);

  const onMouseDown = useCallback((e: MouseHandlerDataParam) => {
    if (e.activeLabel == null) return;
    setRefAreaLeft(e.activeLabel);
    setRefAreaRight(null);
  }, []);

  const onMouseMove = useCallback((e: MouseHandlerDataParam) => {
    if (refAreaLeft && e.activeLabel != null) {
      setRefAreaRight(e.activeLabel);
    }
  }, [refAreaLeft]);

  const onMouseUp = useCallback(() => {
    if (!refAreaLeft || !refAreaRight) {
      if (startIndex !== null && refAreaLeft) {
        // Has internal zoom → reset it
        setStartIndex(null);
        setEndIndex(null);
      } else if (refAreaLeft) {
        // No internal zoom to reset → notify parent (used for custom range revert)
        onZoomReset?.();
      }
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    let leftIdx = data.findIndex((d) => d[xKey] === refAreaLeft);
    let rightIdx = data.findIndex((d) => d[xKey] === refAreaRight);

    if (leftIdx < 0 || rightIdx < 0) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    // Normalize (handle right-to-left drag)
    if (leftIdx > rightIdx) {
      [leftIdx, rightIdx] = [rightIdx, leftIdx];
    }

    // Single-point click — no zoom
    if (leftIdx === rightIdx) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    setStartIndex(leftIdx);
    setEndIndex(rightIdx);
    setRefAreaLeft(null);
    setRefAreaRight(null);

    onZoomComplete?.(String(data[leftIdx][xKey]), String(data[rightIdx][xKey]));
  }, [data, xKey, refAreaLeft, refAreaRight, startIndex, onZoomComplete, onZoomReset]);

  const resetZoom = useCallback(() => {
    setStartIndex(null);
    setEndIndex(null);
  }, []);

  const isZoomed = startIndex !== null;
  const zoomedData = isZoomed ? data.slice(startIndex, endIndex! + 1) : data;

  return {
    zoomedData,
    refAreaLeft,
    refAreaRight,
    isZoomed,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    resetZoom,
  };
};

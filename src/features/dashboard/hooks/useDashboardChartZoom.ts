import { useCallback } from "react";
import { useFiltersStore } from "../../../store/filters.ts";

export const useDashboardChartZoom = () => {
  const range = useFiltersStore((s) => s.timeRange);
  const customRange = useFiltersStore((s) => s.customRange);
  const setDashboardChartRange = useFiltersStore((s) => s.setDashboardChartRange);
  const clearDashboardChartRange = useFiltersStore((s) => s.clearDashboardChartRange);

  const onZoomComplete = useCallback(
    (from: string | number, to: string | number) => {
      setDashboardChartRange(String(from), String(to));
    },
    [setDashboardChartRange],
  );

  const onZoomReset = useCallback(() => {
    clearDashboardChartRange();
  }, [clearDashboardChartRange]);

  return { range, customRange, onZoomComplete, onZoomReset };
};

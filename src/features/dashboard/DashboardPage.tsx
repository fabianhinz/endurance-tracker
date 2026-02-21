import { useCallback } from "react";
import { ReadinessDial } from "./ReadinessDial.tsx";
import { ACWRIndicator } from "./ACWRIndicator.tsx";
import { MetricsChart } from "./MetricsChart.tsx";
import { WeeklyLoadChart } from "./WeeklyLoadChart.tsx";
import { RecentSessions } from "./RecentSessions.tsx";
import { PersonalBestsCard } from "./PersonalBestsCard.tsx";
import { useFiltersStore } from "../../store/filters.ts";
import { PageGrid } from "../../components/ui/PageGrid.tsx";

export const DashboardPage = () => {
  const timeRange = useFiltersStore((s) => s.timeRange);
  const customRange = useFiltersStore((s) => s.customRange);
  const setCustomRange = useFiltersStore((s) => s.setCustomRange);
  const clearCustomRange = useFiltersStore((s) => s.clearCustomRange);

  const handleZoomReset = useCallback(() => {
    clearCustomRange();
  }, [clearCustomRange]);

  const handleZoomComplete = useCallback(
    (from: string | number, to: string | number) => {
      setCustomRange(String(from), String(to));
    },
    [setCustomRange],
  );

  return (
    <PageGrid>
      <ReadinessDial />
      <ACWRIndicator />
      <div className="md:col-span-2">
        <WeeklyLoadChart range={timeRange} customRange={customRange} onZoomComplete={handleZoomComplete} onZoomReset={handleZoomReset} />
      </div>
      <div className="md:col-span-2">
        <MetricsChart range={timeRange} customRange={customRange} onZoomComplete={handleZoomComplete} onZoomReset={handleZoomReset} />
      </div>
      <RecentSessions />
      <PersonalBestsCard />
    </PageGrid>
  );
};

import { MetricsChart } from '@/features/dashboard/MetricsChart.tsx';
import { WeeklyLoadChart } from '@/features/dashboard/WeeklyLoadChart.tsx';
import { TrainingSummaryCard } from '@/features/dashboard/TrainingSummaryCard.tsx';
import { PageGrid } from '@/components/ui/PageGrid.tsx';
import { CoachStatusCard } from '@/features/coach/CoachStatusCard.tsx';

export const DashboardPage = () => {
  return (
    <PageGrid>
      <CoachStatusCard />
      <TrainingSummaryCard />
      <div className="md:col-span-2">
        <WeeklyLoadChart />
      </div>
      <div className="md:col-span-2">
        <MetricsChart />
      </div>
    </PageGrid>
  );
};

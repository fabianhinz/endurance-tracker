import { PerformanceChart } from '@/features/dashboard/PerformanceChart';
import { LoadChart } from '@/features/dashboard/LoadChart';
import { TrainingSummaryCard } from '@/features/dashboard/TrainingSummaryCard.tsx';
import { PageGrid } from '@/components/ui/PageGrid.tsx';
import { CoachStatusCard } from '@/features/coach/CoachStatusCard.tsx';

export const DashboardPage = () => {
  return (
    <PageGrid>
      <CoachStatusCard />
      <div className="lg:col-span-2">
        <LoadChart />
      </div>
      <div className="lg:col-span-2">
        <PerformanceChart />
      </div>
      <TrainingSummaryCard />
    </PageGrid>
  );
};

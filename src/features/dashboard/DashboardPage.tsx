import { MetricsChart } from "./MetricsChart.tsx";
import { WeeklyLoadChart } from "./WeeklyLoadChart.tsx";
import { RecentActivityCard } from "./RecentActivityCard.tsx";
import { PageGrid } from "../../components/ui/PageGrid.tsx";
import { CoachStatusCard } from "../coach/CoachStatusCard.tsx";

export const DashboardPage = () => {
  return (
    <PageGrid>
      <CoachStatusCard />
      <div className="md:col-span-2">
        <WeeklyLoadChart />
      </div>
      <div className="md:col-span-2">
        <MetricsChart />
      </div>
      <RecentActivityCard />
    </PageGrid>
  );
};

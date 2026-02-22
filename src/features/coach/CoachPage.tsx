import { Link } from 'react-router-dom';
import { useCoachPlan } from '../../hooks/useCoachPlan.ts';
import { PageGrid } from '../../components/ui/PageGrid.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { CardHeader } from '../../components/ui/CardHeader.tsx';
import { Typography } from '../../components/ui/Typography.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { CoachStatusCard } from './CoachStatusCard.tsx';
import { WeeklyPlanTimeline } from './WeeklyPlanTimeline.tsx';
import { Settings } from 'lucide-react';

export const CoachPage = () => {
  const coach = useCoachPlan();

  if (!coach.hasThresholdPace) {
    return (
      <PageGrid>
        <Card className="md:col-span-2 flex flex-col items-center justify-center py-12 gap-4">
          <Typography variant="h2" color="primary">Set Your Threshold Pace</Typography>
          <Typography variant="body" color="tertiary" className="text-center max-w-md">
            To generate training plans, set your threshold pace in Settings.
            This is your pace at lactate threshold — roughly your 1-hour race pace.
          </Typography>
          <Button asChild variant="secondary">
            <Link to="/settings">
              <Settings size={16} />
              Go to Settings
            </Link>
          </Button>
        </Card>
      </PageGrid>
    );
  }

  return (
    <PageGrid>
      <div className="md:col-span-2">
        <CoachStatusCard />
      </div>
      <div className="md:col-span-2">
        <Card>
          <CardHeader
            title="Weekly Plan"
            subtitle={`Week of ${coach.plan!.weekOf} — ${coach.plan!.totalEstimatedTss} TSS`}
          />
          <WeeklyPlanTimeline plan={coach.plan!} zones={coach.zones} today={coach.today} />
        </Card>
      </div>
    </PageGrid>
  );
};

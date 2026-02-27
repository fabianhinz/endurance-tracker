import { Link } from 'react-router-dom';
import { useCoachPlan } from '../../hooks/useCoachPlan.ts';
import { PageGrid } from '../../components/ui/PageGrid.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { CardHeader } from '../../components/ui/CardHeader.tsx';
import { Typography } from '../../components/ui/Typography.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { MetricLabel } from '../../components/ui/MetricLabel.tsx';
import { ActionPromptCard } from '../../components/ui/ActionPromptCard.tsx';
import { METRIC_EXPLANATIONS } from '../../lib/explanations.ts';

import { CoachStatusCard } from './CoachStatusCard.tsx';
import { WeeklyPlanTimeline } from './WeeklyPlanTimeline.tsx';
import { Settings } from 'lucide-react';
import { ZoneLegend } from '../../components/ui/ZoneLegend.tsx';

export const CoachPage = () => {
  const coach = useCoachPlan();

  if (!coach.hasThresholdPace) {
    return (
      <PageGrid>
        <ActionPromptCard
          title="Set Your Threshold Pace"
          description="To generate training plans, set your threshold pace in Settings. This is your pace at lactate threshold — roughly your 1-hour race pace."
          className="md:col-span-2"
        >
          <Button asChild variant="secondary">
            <Link to="/settings">
              <Settings size={16} />
              Go to Settings
            </Link>
          </Button>
        </ActionPromptCard>
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
            titleSlot={
              <div className="flex items-center gap-1">
                <Typography variant="overline" as="h3">
                  {METRIC_EXPLANATIONS.trainingZones.friendlyName}
                </Typography>
                <MetricLabel metricId="trainingZones" size="sm" />
              </div>
            }
            subtitle={METRIC_EXPLANATIONS.trainingZones.oneLiner}
          />
          <ZoneLegend zones={coach.zones} />
        </Card>
      </div>
      <div className="md:col-span-2">
        <Card>
          <CardHeader
            title="Weekly Plan"
            subtitle={`Week of ${coach.plan!.weekOf} — ${coach.plan!.totalEstimatedTss} TSS`}
          />
          <WeeklyPlanTimeline plan={coach.plan!} zones={coach.zones} />
        </Card>
      </div>
    </PageGrid>
  );
};

import { Link } from 'react-router-dom';
import { useCoachPlan } from '../../hooks/useCoachPlan.ts';
import { PageGrid } from '../../components/ui/PageGrid.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { CardHeader } from '../../components/ui/CardHeader.tsx';
import { Typography } from '../../components/ui/Typography.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { MetricLabel } from '../../components/ui/MetricLabel.tsx';
import { METRIC_EXPLANATIONS } from '../../engine/explanations.ts';

import { CoachStatusCard } from './CoachStatusCard.tsx';
import { WeeklyPlanTimeline } from './WeeklyPlanTimeline.tsx';
import { Settings } from 'lucide-react';
import { formatPace } from '../../lib/utils.ts';

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
          <div className="flex flex-wrap gap-2">
            {coach.zones.map((zone) => (
              <span key={zone.name} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 text-xs text-text-secondary">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: zone.color }}
                />
                {zone.label}
                <span className="text-text-quaternary">
                  {formatPace(zone.maxPace)} – {formatPace(zone.minPace)}
                </span>
              </span>
            ))}
          </div>
        </Card>
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

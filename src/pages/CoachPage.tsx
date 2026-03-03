import { Link } from 'react-router-dom';
import { m } from '@/paraglide/messages.js';
import { useCoachPlan } from '@/features/coach/hooks/useCoachPlan.ts';
import { PageGrid } from '@/components/ui/PageGrid.tsx';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { MetricLabel } from '@/components/ui/MetricLabel.tsx';
import { ActionPromptCard } from '@/components/ui/ActionPromptCard.tsx';
import { METRIC_EXPLANATIONS } from '@/lib/explanations.ts';

import { CoachStatusCard } from '@/features/coach/CoachStatusCard.tsx';
import { WeeklyPlanTimeline } from '@/features/coach/WeeklyPlanTimeline.tsx';
import { Settings } from 'lucide-react';
import { ZoneLegend } from '@/features/sessions/ZoneLegend.tsx';

export const CoachPage = () => {
  const coach = useCoachPlan();

  if (!coach.hasThresholdPace) {
    return (
      <PageGrid>
        <ActionPromptCard
          title={m.ui_coach_threshold_title()}
          description={m.ui_coach_threshold_desc()}
          className="md:col-span-2"
        >
          <Button asChild variant="secondary">
            <Link to="/settings">
              <Settings size={16} />
              {m.ui_coach_go_settings()}
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
                <Typography variant="title" as="h3">
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
            title={m.ui_coach_weekly_plan()}
            subtitle={m.ui_coach_weekly_plan_subtitle({
              weekOf: coach.plan!.weekOf,
              tss: String(coach.plan!.totalEstimatedTss),
            })}
          />
          <WeeklyPlanTimeline plan={coach.plan!} zones={coach.zones} />
        </Card>
      </div>
    </PageGrid>
  );
};

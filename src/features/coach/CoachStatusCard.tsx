import { useMetrics } from '../../hooks/useMetrics.ts';
import { Card } from '../../components/ui/Card.tsx';
import { CardHeader } from '../../components/ui/CardHeader.tsx';
import { Typography } from '../../components/ui/Typography.tsx';
import { getFormMessageDetailed } from '../../engine/coaching.ts';
import { getInjuryRisk } from '../../engine/coaching.ts';
import { ReadinessGauge } from '../dashboard/ReadinessDial.tsx';
import { ACWRGauge } from '../dashboard/ACWRIndicator.tsx';

export const CoachStatusCard = () => {
  const metrics = useMetrics();
  const acwr = metrics.current?.acwr ?? 0;
  const risk = getInjuryRisk(acwr);

  return (
    <Card
      footer={
        <div className="space-y-1">
          <Typography variant="overline" as="p" color="secondary">
            {metrics.coaching.status}
          </Typography>
          <Typography variant="caption" color="tertiary" as="p">
            {getFormMessageDetailed(metrics.coaching.status)}
          </Typography>
          <Typography variant="caption" color="tertiary" as="p">
            {risk} injury risk
          </Typography>
        </div>
      }
    >
      <CardHeader title="Current Form" subtitle="Your training readiness" />

      <div className="flex justify-center gap-6">
        <div className="w-28">
          <ReadinessGauge />
          <Typography variant="caption" color="tertiary" className="text-center block mt-1">
            TSB
          </Typography>
        </div>

        <div className="w-28">
          <ACWRGauge />
          <Typography variant="caption" color="tertiary" className="text-center block mt-1">
            ACWR
          </Typography>
        </div>
      </div>
    </Card>
  );
};

import { useMetrics } from "../../hooks/useMetrics.ts";
import { Card } from "../../components/ui/Card.tsx";
import { CardHeader } from "../../components/ui/CardHeader.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { getFormMessageDetailed } from "../../lib/coaching-messages.ts";
import { ReadinessGauge } from "../dashboard/ReadinessDial.tsx";
import { ACWRGauge } from "../dashboard/ACWRIndicator.tsx";

export const CoachStatusCard = () => {
  const metrics = useMetrics();

  return (
    <Card
      footer={
        <Typography variant="caption" color="tertiary" as="p">
          {getFormMessageDetailed(metrics.coaching)}
        </Typography>
      }
    >
      <CardHeader title="Current Form" subtitle="Your training readiness" />

      <div className="flex justify-center gap-6">
        <div className="w-28">
          <ReadinessGauge />
        </div>

        <div className="w-28">
          <ACWRGauge />
        </div>
      </div>
    </Card>
  );
};

import { useMetrics } from '../../hooks/useMetrics.ts';
import { Card } from '../../components/ui/Card.tsx';
import { CardHeader } from '../../components/ui/CardHeader.tsx';
import { Typography } from '../../components/ui/Typography.tsx';
import { GaugeDial } from '../../components/ui/GaugeDial.tsx';
import { getFormMessageDetailed } from '../../engine/coaching.ts';
import { tokens } from '../../lib/tokens.ts';
import { statusTextClass, statusFill, acwrColorMap } from '../../lib/status-colors.ts';
import { getACWRColor } from '../../engine/coaching.ts';
import { cn } from '../../lib/utils.ts';

const TSB_ZONES = [
  { from: -40, to: -30, color: tokens.statusDangerStrong },
  { from: -30, to: -10, color: tokens.accent },
  { from: -10, to: 5, color: tokens.statusNeutral },
  { from: 5, to: 25, color: tokens.statusSuccessStrong },
  { from: 25, to: 40, color: tokens.statusWarning },
];

export const CoachStatusCard = () => {
  const metrics = useMetrics();
  const tsb = metrics.current?.tsb ?? 0;
  const acwr = metrics.current?.acwr ?? 0;
  const acwrColor = getACWRColor(acwr);
  const colors = acwrColorMap[acwrColor];

  return (
    <Card>
      <CardHeader title="Current Form" subtitle="Your training readiness" />

      <div className="flex gap-4 items-start">
        <div className="relative w-32 shrink-0">
          <GaugeDial
            min={-40}
            max={40}
            value={tsb}
            zones={TSB_ZONES}
            valueFill={statusFill[metrics.coaching.status] ?? tokens.statusNeutral}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-end">
            <Typography
              variant="h1"
              className={cn('leading-none pb-1', statusTextClass[metrics.coaching.status])}
            >
              {tsb > 0 ? '+' : ''}{tsb.toFixed(0)}
            </Typography>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <Typography
            variant="overline"
            as="p"
            className={statusTextClass[metrics.coaching.status]}
          >
            {metrics.coaching.status}
          </Typography>
          <Typography variant="caption" color="tertiary" as="p">
            {getFormMessageDetailed(metrics.coaching.status)}
          </Typography>
          <div className="flex items-center gap-2 mt-2">
            <span className={cn('inline-block w-2 h-2 rounded-full', colors.bg)} />
            <Typography variant="caption" color="secondary" as="span">
              ACWR {acwr.toFixed(2)} — {metrics.coaching.injuryRisk} risk
            </Typography>
          </div>
        </div>
      </div>
    </Card>
  );
};

import { m } from '@/paraglide/messages.js';
import { useMetrics } from '@/hooks/useMetrics.ts';
import { Typography } from '@/components/ui/Typography.tsx';
import { cn } from '@/lib/utils.ts';
import { acwrColorMap, acwrFill, ACWR_ZONES } from '@/lib/statusColors.ts';
import { getACWRColor, getInjuryRisk } from '@/engine/coaching.ts';
import { MetricLabel } from '@/components/ui/MetricLabel.tsx';
import { GaugeDial } from '@/components/ui/GaugeDial.tsx';

export const ACWRGauge = () => {
  const metrics = useMetrics();
  const acwr = metrics.current?.acwr ?? 0;
  const color = getACWRColor(acwr);
  const risk = getInjuryRisk(acwr);

  return (
    <div className="flex gap-1 flex-1 h-full flex-col items-center justify-end">
      <div className="relative w-full max-w-[160px]">
        <GaugeDial min={0} max={2} value={acwr} zones={ACWR_ZONES} valueFill={acwrFill[color]} />
        <div className="absolute inset-0 flex flex-col items-center justify-end">
          <Typography variant="h1" className={cn('leading-none pb-1', acwrColorMap[color].text)}>
            {acwr.toFixed(1)}
          </Typography>
        </div>
      </div>
      <Typography variant="overline" as="p" className={acwrColorMap[color].text}>
        {m.ui_acwr_risk({ risk })}
      </Typography>
      <MetricLabel metricId="acwr" size="sm" contextLabel="asd" />
    </div>
  );
};

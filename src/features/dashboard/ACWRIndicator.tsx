import { useMetrics } from "../../hooks/useMetrics.ts";
import { ChartCard } from "../../components/ui/ChartCard.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { cn } from "../../lib/utils.ts";
import { acwrColorMap, acwrFill, ACWR_ZONES } from "../../lib/statusColors.ts";
import { getACWRColor, getInjuryRisk } from "../../engine/coaching.ts";
import { METRIC_EXPLANATIONS } from "../../lib/explanations.ts";
import { MetricLabel } from "../../components/ui/MetricLabel.tsx";
import { GaugeDial } from "../../components/ui/GaugeDial.tsx";

export const ACWRGauge = () => {
  const metrics = useMetrics();
  const acwr = metrics.current?.acwr ?? 0;
  const color = getACWRColor(acwr);
  const risk = getInjuryRisk(acwr);

  return (
    <div className="flex gap-1 flex-1 h-full flex-col items-center justify-end">
      <div className="relative w-full max-w-[160px]">
        <GaugeDial
          min={0}
          max={2}
          value={acwr}
          zones={ACWR_ZONES}
          valueFill={acwrFill[color]}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-end">
          <Typography
            variant="h1"
            className={cn("leading-none pb-1", acwrColorMap[color].text)}
          >
            {acwr.toFixed(1)}
          </Typography>
        </div>
      </div>
      <Typography
        variant="overline"
        as="p"
        className={acwrColorMap[color].text}
      >
        {risk} risk
      </Typography>
    </div>
  );
};

export const ACWRIndicator = () => (
  <ChartCard
    titleSlot={
      <div className="flex items-center gap-1">
        <Typography variant="overline" as="h3">{METRIC_EXPLANATIONS.acwr.friendlyName}</Typography>
        <MetricLabel metricId="acwr" size="sm" />
      </div>
    }
    title=""
    subtitle={METRIC_EXPLANATIONS.acwr.oneLiner}
    scrollable={false}
    minHeight="min-h-28"
  >
    <ACWRGauge />
  </ChartCard>
);

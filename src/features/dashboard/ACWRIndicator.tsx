import { useMetrics } from "../../hooks/useMetrics.ts";
import { ChartCard } from "../../components/ui/ChartCard.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { cn } from "../../lib/utils.ts";
import { tokens } from "../../lib/tokens.ts";
import { acwrColorMap, acwrFill } from "../../lib/status-colors.ts";
import { getACWRColor, getInjuryRisk } from "../../engine/coaching.ts";
import { METRIC_EXPLANATIONS } from "../../engine/explanations.ts";
import { MetricLabel } from "../../components/ui/MetricLabel.tsx";
import { GaugeDial } from "../../components/ui/GaugeDial.tsx";

const ACWR_ZONES = [
  { from: 0, to: 0.8, color: tokens.statusNeutral },
  { from: 0.8, to: 1.3, color: tokens.statusSuccessStrong },
  { from: 1.3, to: 1.5, color: tokens.statusWarningStrong },
  { from: 1.5, to: 2.0, color: tokens.statusDangerStrong },
];

export const ACWRIndicator = () => {
  const metrics = useMetrics();
  const acwr = metrics.current?.acwr ?? 0;
  const color = getACWRColor(acwr);
  const risk = getInjuryRisk(acwr);

  return (
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
    </ChartCard>
  );
};

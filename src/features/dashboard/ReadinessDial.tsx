import { useMetrics } from "../../hooks/useMetrics.ts";
import { ChartCard } from "../../components/ui/ChartCard.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { cn } from "../../lib/utils.ts";
import { tokens } from "../../lib/tokens.ts";
import { statusTextClass, statusFill } from "../../lib/status-colors.ts";
import { METRIC_EXPLANATIONS } from "../../lib/explanations.ts";
import { MetricLabel } from "../../components/ui/MetricLabel.tsx";
import { GaugeDial } from "../../components/ui/GaugeDial.tsx";

const TSB_ZONES = [
  { from: -40, to: -30, color: tokens.statusDangerStrong },
  { from: -30, to: -10, color: tokens.accent },
  { from: -10, to: 5, color: tokens.statusNeutral },
  { from: 5, to: 25, color: tokens.statusSuccessStrong },
  { from: 25, to: 40, color: tokens.statusWarning },
];

export const ReadinessGauge = () => {
  const metrics = useMetrics();
  const tsb = metrics.current?.tsb ?? 0;

  return (
    <div className="flex gap-1 flex-1 h-full flex-col items-center justify-end">
      <div className="relative w-full max-w-[160px]">
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
            className={cn(
              "leading-none pb-1",
              statusTextClass[metrics.coaching.status],
            )}
          >
            {tsb > 0 ? "+" : ""}
            {tsb.toFixed(1)}
          </Typography>
        </div>
      </div>
      <Typography
        variant="overline"
        as="p"
        className={statusTextClass[metrics.coaching.status]}
      >
        {metrics.coaching.status === "fresh"
          ? "Go"
          : metrics.coaching.status === "overload"
            ? "No-Go"
            : metrics.coaching.status}
      </Typography>
    </div>
  );
};

export const ReadinessDial = () => (
  <ChartCard
    titleSlot={
      <div className="flex items-center gap-1">
        <Typography variant="overline" as="h3">{METRIC_EXPLANATIONS.tsb.friendlyName}</Typography>
        <MetricLabel metricId="tsb" size="sm" />
      </div>
    }
    title=""
    subtitle={METRIC_EXPLANATIONS.tsb.oneLiner}
    scrollable={false}
    minHeight="min-h-28"
  >
    <ReadinessGauge />
  </ChartCard>
);

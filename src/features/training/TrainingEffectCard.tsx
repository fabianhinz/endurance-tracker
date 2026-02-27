import { useMemo } from "react";
import { Card } from "../../components/ui/Card.tsx";
import { CardHeader } from "../../components/ui/CardHeader.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { GaugeDial } from "../../components/ui/GaugeDial.tsx";
import { MetricLabel } from "../../components/ui/MetricLabel.tsx";
import { tokens } from "../../lib/tokens.ts";
import { useUserStore } from "../../store/user.ts";
import { useMetrics } from "../../hooks/useMetrics.ts";
import {
  calculateTrainingEffect,
  getTrainingEffectLabel,
  getTrainingEffectSummary,
} from "../../engine/trainingEffect.ts";
import type { SessionRecord, TrainingSession } from "../../engine/types.ts";

const TE_ZONES = [
  { from: 0, to: 1, color: tokens.statusNeutral },
  { from: 1, to: 2, color: tokens.accent },
  { from: 2, to: 3, color: tokens.statusSuccessStrong },
  { from: 3, to: 4, color: tokens.statusWarningStrong },
  { from: 4, to: 5, color: tokens.chartCadence },
];

const TE_FILL: Record<string, string> = {
  neutral: tokens.statusNeutral,
  blue: tokens.accent,
  green: tokens.statusSuccessStrong,
  amber: tokens.statusWarningStrong,
  orange: tokens.chartCadence,
  red: tokens.statusDangerStrong,
};

const TE_TEXT: Record<string, string> = {
  neutral: "text-text-tertiary",
  blue: "text-accent",
  green: "text-status-success",
  amber: "text-status-warning",
  orange: "text-chart-cadence",
  red: "text-status-danger",
};

type TrainingEffectCardProps = {
  records: SessionRecord[];
  session: TrainingSession;
};

export const TrainingEffectCard = (props: TrainingEffectCardProps) => {
  const profile = useUserStore((s) => s.profile);
  const metrics = useMetrics();
  const ctl = metrics.current?.ctl ?? 0;

  const te = useMemo(() => {
    if (!profile) return undefined;
    return calculateTrainingEffect(
      props.records,
      profile.thresholds.maxHr,
      profile.thresholds.restHr,
      profile.gender,
      ctl,
    );
  }, [props.records, profile, ctl]);

  if (!te) return null;

  const aerobicLabel = getTrainingEffectLabel(te.aerobic);
  const anaerobicLabel = getTrainingEffectLabel(te.anaerobic);
  const summary = getTrainingEffectSummary(te.aerobic, te.anaerobic);

  return (
    <Card
      footer={
        <Typography variant="caption" color="tertiary" as="p">
          {summary}
        </Typography>
      }
    >
      <CardHeader
        title="Training Effect"
        subtitle="Per-session aerobic & anaerobic impact"
      />

      <div className="flex justify-center gap-6">
        <div className="w-28">
          <div className="flex gap-1 flex-1 h-full flex-col items-center justify-end">
            <div className="relative w-full max-w-[160px]">
              <GaugeDial
                min={0}
                max={5}
                value={te.aerobic}
                zones={TE_ZONES}
                valueFill={TE_FILL[aerobicLabel.color]}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-end">
                <Typography
                  variant="h1"
                  className={`leading-none pb-1 ${TE_TEXT[aerobicLabel.color]}`}
                >
                  {te.aerobic.toFixed(1)}
                </Typography>
              </div>
            </div>
            <Typography
              variant="overline"
              as="p"
              className={TE_TEXT[aerobicLabel.color]}
            >
              {aerobicLabel.label}
            </Typography>
            <MetricLabel metricId="aerobicTE" size="sm" />
          </div>
        </div>

        <div className="w-28">
          <div className="flex gap-1 flex-1 h-full flex-col items-center justify-end">
            <div className="relative w-full max-w-[160px]">
              <GaugeDial
                min={0}
                max={5}
                value={te.anaerobic}
                zones={TE_ZONES}
                valueFill={TE_FILL[anaerobicLabel.color]}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-end">
                <Typography
                  variant="h1"
                  className={`leading-none pb-1 ${TE_TEXT[anaerobicLabel.color]}`}
                >
                  {te.anaerobic.toFixed(1)}
                </Typography>
              </div>
            </div>
            <Typography
              variant="overline"
              as="p"
              className={TE_TEXT[anaerobicLabel.color]}
            >
              {anaerobicLabel.label}
            </Typography>
            <MetricLabel metricId="anaerobicTE" size="sm" />
          </div>
        </div>
      </div>
    </Card>
  );
};

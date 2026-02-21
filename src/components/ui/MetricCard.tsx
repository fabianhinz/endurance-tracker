import type { ReactNode } from "react";
import { Card } from "./Card.tsx";
import { Typography } from "./Typography.tsx";
import { MetricLabel } from "./MetricLabel.tsx";
import { METRIC_EXPLANATIONS } from "../../engine/explanations.ts";
import type { MetricId } from "../../engine/explanations.ts";

interface MetricCardProps {
  label: string;
  subtitle: string;
  metricId?: MetricId;
  value: ReactNode;
  unit?: string;
  subDetail?: ReactNode;
  size?: "lg" | "md";
}

export const MetricCard = (props: MetricCardProps) => {
  const hasMetricId = props.metricId !== undefined;

  return (
    <Card className="h-[160px]">
      {hasMetricId ? (
        <div className="mb-4 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-1">
              <Typography variant="overline" as="h3">{props.label}</Typography>
              <MetricLabel metricId={props.metricId!} size="sm" />
            </div>
            <Typography variant="caption" color="quaternary" as="p" className="mt-0.5">
              {METRIC_EXPLANATIONS[props.metricId!].oneLiner}
            </Typography>
          </div>
        </div>
      ) : (
        <>
          <Typography variant="overline" as="h3">{props.label}</Typography>
          <Typography variant="caption" color="quaternary" as="p" className="mt-0.5">{props.subtitle}</Typography>
        </>
      )}
      <Typography
        variant={props.size === "lg" ? "h1" : "h3"}
        as="p"
        className={hasMetricId ? undefined : "mt-2"}
      >
        {props.value}
        {props.unit && (
          <Typography variant="caption" as="span" className="ml-1 font-normal">
            {props.unit}
          </Typography>
        )}
      </Typography>
      {props.subDetail && <div className="mt-1">{props.subDetail}</div>}
    </Card>
  );
};

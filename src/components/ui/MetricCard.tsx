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
  const subtitle = props.metricId
    ? METRIC_EXPLANATIONS[props.metricId].oneLiner
    : props.subtitle;

  return (
    <Card className="h-[140px]">
      <div className="flex items-center gap-1">
        <Typography variant="overline" as="h3">
          {props.label}
        </Typography>
        {props.metricId && <MetricLabel metricId={props.metricId} size="sm" />}
      </div>
      {subtitle && (
        <Typography
          variant="caption"
          color="quaternary"
          as="p"
          className="mt-0.5"
        >
          {subtitle}
        </Typography>
      )}
      {props.subDetail && <div className="mt-1">{props.subDetail}</div>}
      <Typography
        variant={props.size === "lg" ? "h1" : "h3"}
        as="p"
        className="mt-auto"
      >
        {props.value}
        {props.unit && (
          <Typography variant="caption" as="span" className="ml-1 font-normal">
            {props.unit}
          </Typography>
        )}
      </Typography>
    </Card>
  );
};

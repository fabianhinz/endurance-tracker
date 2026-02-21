import { Info } from "lucide-react";
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
} from "./Popover.tsx";
import {
  METRIC_EXPLANATIONS,
  type MetricId,
} from "../../engine/explanations.ts";
import { useUserStore } from "../../store/user.ts";
import { cn } from "../../lib/utils.ts";
import { Button } from "./Button.tsx";
import { Typography } from "./Typography.tsx";
import type { ReactNode } from "react";

interface MetricLabelProps {
  metricId: MetricId;
  size?: "default" | "sm";
  showValue?: ReactNode;
  className?: string;
}

export const MetricLabel = (props: MetricLabelProps) => {
  const explanation = METRIC_EXPLANATIONS[props.metricId];
  const showHelp = useUserStore((s) => s.profile?.showMetricHelp ?? true);
  const size = props.size ?? "default";

  return (
    <span className={cn("inline-flex items-center gap-1", props.className)}>
      {size === "default" ? (
        <>
          <Typography variant="label">
            {explanation.friendlyName}
          </Typography>
          <Typography variant="caption" color="quaternary">
            ({explanation.shortLabel})
          </Typography>
        </>
      ) : (
        <Typography variant="caption">
          {explanation.shortLabel}
        </Typography>
      )}

      {props.showValue && (
        <Typography variant="emphasis" as="span">
          {props.showValue}
        </Typography>
      )}

      {showHelp && (
        <PopoverRoot>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="cursor-help text-text-quaternary hover:text-accent focus-visible:text-accent"
              aria-label={`Learn about ${explanation.friendlyName}`}
              aria-haspopup="dialog"
            >
              <Info size={size === "sm" ? 14 : 16} strokeWidth={1.5} className="shrink-0" />
            </Button>
          </PopoverTrigger>

          <PopoverContent side="top">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-text-primary">
                {explanation.friendlyName}
              </span>
              <span className="text-xs rounded bg-white/10 px-1.5 py-0.5 text-text-tertiary">
                {explanation.shortLabel}
              </span>
            </div>

            <p className="mt-2 text-sm text-text-secondary">
              {explanation.oneLiner}
            </p>

            <p className="mt-2 text-sm italic text-text-tertiary">
              Think of it as: {explanation.analogy}
            </p>

            <p className="mt-2 border-t border-white/10 pt-2 text-xs text-text-quaternary">
              {explanation.range}
            </p>

          </PopoverContent>
        </PopoverRoot>
      )}
    </span>
  );
};

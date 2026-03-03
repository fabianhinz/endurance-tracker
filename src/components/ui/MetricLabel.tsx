import { Info } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { PopoverRoot, PopoverTrigger, PopoverContent } from './Popover.tsx';
import { METRIC_EXPLANATIONS, type MetricId } from '@/lib/explanations.ts';
import { useUserStore } from '@/store/user.ts';
import { cn } from '@/lib/utils.ts';
import { Button } from './Button.tsx';
import { Typography } from './Typography.tsx';
import type { ReactNode } from 'react';

interface MetricLabelProps {
  metricId: MetricId;
  size?: 'default' | 'sm';
  showValue?: ReactNode;
  className?: string;
  contextLabel?: string;
}

export const MetricLabel = (props: MetricLabelProps) => {
  const explanation = METRIC_EXPLANATIONS[props.metricId];
  const showHelp = useUserStore((s) => s.profile?.showMetricHelp ?? true);
  const size = props.size ?? 'default';

  const hideShortLabel =
    size === 'sm' &&
    props.contextLabel !== undefined &&
    explanation.shortLabel.localeCompare(props.contextLabel, undefined, {
      sensitivity: 'base',
    }) === 0;

  return (
    <span className={cn('inline-flex items-center gap-1', props.className)}>
      <span className="hidden sm:contents">
        {size === 'default' ? (
          <>
            <Typography variant="subtitle2">{explanation.friendlyName}</Typography>
            <Typography variant="caption" color="textQuaternary">
              ({explanation.shortLabel})
            </Typography>
          </>
        ) : hideShortLabel ? null : (
          <Typography variant="caption">{explanation.shortLabel}</Typography>
        )}

        {props.showValue && (
          <Typography variant="subtitle1" as="span">
            {props.showValue}
          </Typography>
        )}
      </span>

      {showHelp && (
        <PopoverRoot>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="cursor-help text-text-quaternary hover:text-accent focus-visible:text-accent"
              aria-label={m.ui_learn_about({ metric: explanation.friendlyName })}
              aria-haspopup="dialog"
            >
              <Info size={size === 'sm' ? 14 : 16} strokeWidth={1.5} className="shrink-0" />
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

            <p className="mt-2 text-sm text-text-secondary">{explanation.oneLiner}</p>

            <p className="mt-2 text-sm italic text-text-tertiary">
              {m.ui_think_of_it_as()} {explanation.analogy}
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

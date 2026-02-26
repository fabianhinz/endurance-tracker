import { useRef, type ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { glassClass } from "./Card.tsx";
import { Typography } from "./Typography.tsx";
import { Button } from "./Button.tsx";
import { cn } from "../../lib/utils.ts";
import { useExpandCard } from "../../lib/use-expand-card.ts";

interface ChartPreviewCardProps {
  title: string;
  icon?: LucideIcon;
  color?: string;
  compactHeight?: string;
  subtitle?: string;
  footer?: ReactNode;
  titleSlot?: ReactNode;
  children: (mode: "compact" | "expanded") => ReactNode;
}

export const ChartPreviewCard = (props: ChartPreviewCardProps) => {
  const Icon = props.icon;
  const cardRef = useRef<HTMLDivElement>(null);
  const expandCard = useExpandCard(cardRef);
  const isFullyExpanded = expandCard.isExpanded && !expandCard.isAnimating;

  return (
    <div
      ref={cardRef}
      className={cn(
        glassClass,
        "flex flex-col rounded-2xl shadow-lg overflow-hidden",
      )}
    >
      <div className="flex items-center px-4 py-2">
        {Icon && <Icon size={16} style={{ color: props.color }} />}
        {props.titleSlot ?? (
          <Typography variant="overline" className={cn("flex-1 text-left", Icon && "ml-2")}>
            {props.title}
          </Typography>
        )}
        {!props.titleSlot && !Icon && <div className="flex-1" />}
        <Button
          variant="ghost"
          size="icon"
          onClick={expandCard.toggle}
          aria-label={
            expandCard.isExpanded ? "Collapse chart" : "Expand chart"
          }
        >
          {expandCard.isExpanded ? (
            <Minimize2 size={16} />
          ) : (
            <Maximize2 size={16} />
          )}
        </Button>
      </div>

      {props.subtitle && (
        <p className="px-4 -mt-1 mb-1 text-xs text-[var(--color-text-tertiary)]">
          {props.subtitle}
        </p>
      )}

      <div
        className={cn(
          expandCard.isExpanded ? "flex-1 min-h-0 px-4 pb-4" : `${props.compactHeight ?? "h-[140px]"} px-2 pb-2`,
        )}
      >
        {props.children(isFullyExpanded ? "expanded" : "compact")}
      </div>

      {props.footer && (
        <div className="px-4 pb-3">
          {props.footer}
        </div>
      )}
    </div>
  );
};

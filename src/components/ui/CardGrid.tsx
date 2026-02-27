import { Children, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "./Button.tsx";
import { Typography } from "./Typography.tsx";
import { cn } from "../../lib/utils.ts";

interface CardGridProps {
  children: ReactNode;
  collapsedRows?: number;
  title?: string;
}

export const CardGrid = (props: CardGridProps) => {
  const [expanded, setExpanded] = useState(false);
  const totalCount = Children.count(props.children);
  const collapsible = props.collapsedRows !== undefined && props.title;
  const maxVisible = collapsible ? props.collapsedRows! * 2 : totalCount;
  const needsToggle = collapsible && totalCount > maxVisible;
  const visibleChildren =
    needsToggle && !expanded
      ? Children.toArray(props.children).slice(0, maxVisible)
      : props.children;

  return (
    <>
      {collapsible && (
        <div className="mb-4 flex items-start justify-between gap-2">
          <Typography variant="overline" as="h3">
            {props.title}
          </Typography>
          {needsToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded((prev) => !prev)}
            >
              <ChevronRight
                className={cn(
                  "size-4 transition-transform",
                  expanded && "rotate-90",
                )}
              />
              <Typography variant="caption" color="secondary">
                ({totalCount})
              </Typography>
            </Button>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {Children.map(visibleChildren, (child) =>
          child != null ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              {child}
            </div>
          ) : null,
        )}
      </div>
    </>
  );
};

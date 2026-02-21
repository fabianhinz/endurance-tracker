import type { ReactNode } from "react";
import { Typography } from "./Typography.tsx";

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  titleSlot?: ReactNode;
}

export const CardHeader = (props: CardHeaderProps) => {
  const titleContent = props.titleSlot ?? (
    <Typography variant="overline" as="h3">{props.title}</Typography>
  );

  const textBlock = (
    <div>
      {titleContent}
      {props.subtitle && (
        <Typography variant="caption" color="quaternary" as="p" className="mt-0.5">
          {props.subtitle}
        </Typography>
      )}
    </div>
  );

  if (props.icon) {
    return (
      <div className="mb-4 flex items-center gap-3">
        {props.icon}
        {textBlock}
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-start justify-between gap-4 flex-wrap">
      {textBlock}
      {props.actions && <div className="shrink-0">{props.actions}</div>}
    </div>
  );
};

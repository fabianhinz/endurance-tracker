import type { ReactNode } from "react";
import { Card } from "./Card.tsx";
import { CardHeader } from "./CardHeader.tsx";
import { cn } from "../../lib/utils.ts";

interface ChartCardProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
  minHeight?: string;
  scrollable?: boolean;
  minWidth?: string;
  footer?: ReactNode;
  titleSlot?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ChartCard = (props: ChartCardProps) => {
  const chartArea = (
    <div
      className={cn(
        "h-full select-none",
        props.minHeight ?? "h-64",
        (props.scrollable ?? true) && (props.minWidth ?? "min-w-[400px]"),
      )}
    >
      {props.children}
    </div>
  );

  return (
    <Card className={props.className} style={props.style}>
      <CardHeader
        title={props.title}
        subtitle={props.subtitle}
        actions={props.actions}
        titleSlot={props.titleSlot}
      />
      {(props.scrollable ?? true) ? (
        <div className="overflow-hidden flex-1">{chartArea}</div>
      ) : (
        <div className="flex-1">{chartArea}</div>
      )}
      {props.footer}
    </Card>
  );
};

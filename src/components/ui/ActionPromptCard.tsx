import type { ReactNode } from "react";
import { cn } from "../../lib/utils.ts";
import { Card } from "./Card.tsx";
import { Typography } from "./Typography.tsx";

interface ActionPromptCardProps {
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
}

export const ActionPromptCard = (props: ActionPromptCardProps) => {
  return (
    <Card className={cn("flex flex-col items-center justify-center py-12 gap-4", props.className)}>
      <Typography variant="h2" color="primary">{props.title}</Typography>
      <Typography variant="body" color="tertiary" className="text-center max-w-md">
        {props.description}
      </Typography>
      {props.children}
    </Card>
  );
};

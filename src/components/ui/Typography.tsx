import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils.ts";

const variants = {
  display: { element: "p", classes: "text-3xl font-bold", defaultColor: "primary" },
  h1: { element: "h1", classes: "text-2xl font-bold", defaultColor: "primary" },
  h2: { element: "h2", classes: "text-xl font-bold", defaultColor: "primary" },
  h3: { element: "h3", classes: "text-lg font-bold", defaultColor: "primary" },
  body: { element: "p", classes: "text-sm", defaultColor: "primary" },
  emphasis: { element: "p", classes: "text-sm font-medium", defaultColor: "primary" },
  label: { element: "span", classes: "text-sm font-medium", defaultColor: "secondary" },
  caption: { element: "span", classes: "text-xs", defaultColor: "tertiary" },
  overline: { element: "span", classes: "text-xs font-medium uppercase tracking-wider", defaultColor: "tertiary" },
} as const;

const colorMap = {
  primary: "text-text-primary",
  secondary: "text-text-secondary",
  tertiary: "text-text-tertiary",
  quaternary: "text-text-quaternary",
  accent: "text-accent",
  success: "text-status-success",
  danger: "text-status-danger",
  warning: "text-status-warning",
  info: "text-accent",
  inherit: "",
} as const;

type Variant = keyof typeof variants;
type Color = keyof typeof colorMap;

interface TypographyProps extends HTMLAttributes<HTMLElement> {
  variant?: Variant;
  color?: Color;
  as?: ElementType;
  tabularNums?: boolean;
  children?: ReactNode;
}

export const Typography = (props: TypographyProps) => {
  const { variant = "body", color, as, tabularNums, className, children, ...rest } = props;
  const config = variants[variant];
  const resolvedColor = color ?? (config.defaultColor as Color);
  const Component = (as ?? config.element) as ElementType;

  return (
    <Component
      className={cn(
        config.classes,
        colorMap[resolvedColor],
        tabularNums && "tabular-nums",
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
};

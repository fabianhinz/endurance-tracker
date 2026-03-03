import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils.ts';

const variants = {
  h1: { element: 'h1', classes: 'text-2xl font-bold', defaultColor: 'textPrimary' },
  h2: { element: 'h2', classes: 'text-xl font-bold', defaultColor: 'textPrimary' },
  h3: { element: 'h3', classes: 'text-lg font-bold', defaultColor: 'textPrimary' },
  body1: { element: 'p', classes: 'text-sm', defaultColor: 'textPrimary' },
  subtitle1: { element: 'p', classes: 'text-sm font-medium', defaultColor: 'textPrimary' },
  subtitle2: { element: 'span', classes: 'text-sm font-medium', defaultColor: 'textSecondary' },
  caption: { element: 'span', classes: 'text-xs', defaultColor: 'textTertiary' },
  overline: {
    element: 'span',
    classes: 'text-xs font-medium uppercase tracking-wider',
    defaultColor: 'textTertiary',
  },
} as const;

const colorMap = {
  textPrimary: 'text-text-primary',
  textSecondary: 'text-text-secondary',
  textTertiary: 'text-text-tertiary',
  textQuaternary: 'text-text-quaternary',
  success: 'text-status-success',
  error: 'text-status-danger',
  warning: 'text-status-warning',
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
  const config = variants[props.variant ?? 'body1'];
  const resolvedColor = props.color ?? (config.defaultColor as Color);
  const Component = (props.as ?? config.element) as ElementType;
  const { variant: _, color: _c, as: _a, tabularNums: _t, ...rest } = props;

  return (
    <Component
      className={cn(
        config.classes,
        colorMap[resolvedColor],
        props.tabularNums && 'tabular-nums',
        props.className,
      )}
      {...rest}
    >
      {props.children}
    </Component>
  );
};

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cardClass } from './Card.tsx';
import { cn } from '../../lib/utils.ts';

export const ToggleGroup = (props: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) => {
  const { className, ...rest } = props;
  return (
    <ToggleGroupPrimitive.Root
      className={cn(cardClass, 'inline-flex flex-row p-2', className)}
      {...rest}
    />
  );
};

export const ToggleGroupItem = (props: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) => {
  const { className, ...rest } = props;
  return (
    <ToggleGroupPrimitive.Item
      className={cn(
        'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-text-tertiary transition-colors cursor-pointer hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent data-[state=on]:bg-white/10 data-[state=on]:text-text-primary data-[state=on]:data-[variant=accent]:bg-accent/15 data-[state=on]:data-[variant=accent]:text-accent',
        className,
      )}
      {...rest}
    />
  );
};

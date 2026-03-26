import * as Toggle from '@radix-ui/react-toggle';
import { cn } from '@/lib/utils.ts';

interface ToggleButtonProps {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  className?: string;
  children: React.ReactNode;
  'aria-label': string;
}

export const ToggleButton = (props: ToggleButtonProps) => {
  return (
    <Toggle.Root
      pressed={props.pressed}
      onPressedChange={props.onPressedChange}
      aria-label={props['aria-label']}
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-sunken',
        'text-text-tertiary hover:bg-white/10 hover:text-text-primary',
        'data-[state=on]:bg-white/10 data-[state=on]:text-text-primary',
        props.className,
      )}
    >
      {props.children}
    </Toggle.Root>
  );
};

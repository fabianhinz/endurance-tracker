import * as Toggle from '@radix-ui/react-toggle';
import { cn } from '@/lib/utils.ts';
import { glassClass } from './Card';

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
        glassClass,
        'inline-flex items-center justify-center rounded-lg transition-[color,background-color] cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-sunken',
        'text-text-tertiary hover:bg-white/10 hover:text-text-primary',
        'data-[state=on]:bg-white/80 data-[state=on]:text-black rounded-full size-12',
        props.className,
      )}
    >
      {props.children}
    </Toggle.Root>
  );
};

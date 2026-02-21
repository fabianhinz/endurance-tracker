import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '../../lib/utils.ts';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export const Switch = (props: SwitchProps) => {
  return (
    <SwitchPrimitive.Root
      checked={props.checked}
      onCheckedChange={props.onCheckedChange}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors',
        props.checked ? 'bg-accent' : 'bg-white/10',
        props.className,
      )}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform mt-0.5',
          props.checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </SwitchPrimitive.Root>
  );
};

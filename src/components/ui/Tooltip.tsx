import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '../../lib/utils.ts';

export const TooltipProvider = TooltipPrimitive.Provider;
export const TooltipRoot = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = (props: TooltipPrimitive.TooltipContentProps) => {
  const { className, sideOffset = 4, ...rest } = props;
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 overflow-hidden rounded-lg border border-white/10 bg-white/5 backdrop-blur-xl px-3 py-1.5 text-xs text-text-primary shadow-md animate-in fade-in-0 zoom-in-95',
          className,
        )}
        {...rest}
      />
    </TooltipPrimitive.Portal>
  );
};

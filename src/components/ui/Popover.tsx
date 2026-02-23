import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../../lib/utils.ts";

export const PopoverRoot = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export const PopoverContent = (props: PopoverPrimitive.PopoverContentProps) => {
  const { className, sideOffset = 4, ...rest } = props;
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        className={cn(
          "z-50 max-w-xs rounded-xl border border-white/10 bg-surface-raised/95 backdrop-blur-xl p-4 shadow-xl",
          className,
        )}
        sideOffset={sideOffset}
        avoidCollisions
        {...rest}
      />
    </PopoverPrimitive.Portal>
  );
};

export const PopoverArrow = (props: PopoverPrimitive.PopoverArrowProps) => {
  const { className, ...rest } = props;
  return (
    <PopoverPrimitive.Arrow
      className={cn("fill-surface-elevated", className)}
      {...rest}
    />
  );
};

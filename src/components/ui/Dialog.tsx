import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../../lib/utils.ts";

export const DialogRoot = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogOverlay = (props: DialogPrimitive.DialogOverlayProps) => {
  const { className, ...rest } = props;
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/60 backdrop-blur-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...rest}
    />
  );
};

export const DialogContent = (props: DialogPrimitive.DialogContentProps) => {
  const { className, children, ...rest } = props;
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl focus:outline-none",
          className,
        )}
        {...rest}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
};

export const DialogTitle = (props: DialogPrimitive.DialogTitleProps) => {
  const { className, ...rest } = props;
  return (
    <DialogPrimitive.Title
      className={cn("text-lg font-bold text-text-primary", className)}
      {...rest}
    />
  );
};

export const DialogDescription = (
  props: DialogPrimitive.DialogDescriptionProps,
) => {
  const { className, ...rest } = props;
  return (
    <DialogPrimitive.Description
      className={cn("mt-2 text-sm text-text-tertiary", className)}
      {...rest}
    />
  );
};

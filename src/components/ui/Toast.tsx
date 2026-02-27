import * as ToastPrimitive from "@radix-ui/react-toast";
import { cn } from "../../lib/utils.ts";
import { useToastStore } from "./toastStore.ts";

const variantClasses: Record<string, string> = {
  default: "border-white/10",
  success: "border-status-success-strong/30",
  error: "border-status-danger-strong/30",
  warning: "border-status-warning-strong/30",
};

export const ToastViewport = () => {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((t) => (
        <ToastPrimitive.Root
          key={t.id}
          className={cn(
            "rounded-lg border p-4 shadow-lg bg-white/5 backdrop-blur-xl",
            variantClasses[t.variant ?? "default"],
          )}
          onOpenChange={(open) => {
            if (!open) removeToast(t.id);
          }}
          duration={t.persistent ? Infinity : 4000}
        >
          <ToastPrimitive.Title className="text-sm font-semibold text-text-primary">
            {t.title}
          </ToastPrimitive.Title>
          {t.description && (
            <ToastPrimitive.Description className="mt-1 text-sm text-text-tertiary">
              {t.description}
            </ToastPrimitive.Description>
          )}
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex max-w-sm flex-col gap-2 rounded-lg" />
    </ToastPrimitive.Provider>
  );
};

import * as ToastPrimitive from '@radix-ui/react-toast';
import { cn } from '@/lib/utils.ts';
import { useToastStore } from './toastStore.ts';
import type { MessageToastItem, ProgressToastItem } from './toastStore.ts';

const variantClasses: Record<string, string> = {
  default: 'border-white/10',
  success: 'border-status-success-strong/30',
  error: 'border-status-danger-strong/30',
  warning: 'border-status-warning-strong/30',
};

const SIZE = 20;
const STROKE = 2.5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ProgressSpinner = (props: { item: ProgressToastItem }) => {
  const saving = props.item.saving;
  const pct =
    props.item.total > 0 ? Math.min(props.item.processed, props.item.total) / props.item.total : 0;
  const offset = saving ? CIRCUMFERENCE * 0.75 : CIRCUMFERENCE * (1 - pct);

  return (
    <svg width={SIZE} height={SIZE} className={cn('-rotate-90', saving && 'animate-spin')}>
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE}
        className="text-white/10"
      />
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={cn('text-accent', !saving && 'transition-[stroke-dashoffset] duration-500')}
      />
    </svg>
  );
};

export const ToastViewport = () => {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((t) => {
        if (t.kind === 'progress') {
          return (
            <ToastPrimitive.Root
              key={t.id}
              className="rounded-lg border border-white/10 p-4 shadow-lg bg-white/5 backdrop-blur-xl flex items-center gap-2"
              duration={Infinity}
              onSwipeStart={(e) => e.preventDefault()}
            >
              <ProgressSpinner item={t} />
              <ToastPrimitive.Title className="text-sm font-semibold text-text-primary">
                {t.label}
              </ToastPrimitive.Title>
            </ToastPrimitive.Root>
          );
        }

        const msg = t as MessageToastItem;
        return (
          <ToastPrimitive.Root
            key={msg.id}
            className={cn(
              'rounded-lg border p-4 shadow-lg bg-white/5 backdrop-blur-xl',
              variantClasses[msg.variant ?? 'default'],
            )}
            onOpenChange={(open) => {
              if (!open) removeToast(msg.id);
            }}
            duration={msg.persistent ? Infinity : 4000}
            {...(msg.testId ? { 'data-testid': msg.testId } : {})}
          >
            <ToastPrimitive.Title className="text-sm font-semibold text-text-primary">
              {msg.title}
            </ToastPrimitive.Title>
            {msg.description && (
              <ToastPrimitive.Description className="mt-1 text-sm text-text-tertiary">
                {msg.description}
              </ToastPrimitive.Description>
            )}
          </ToastPrimitive.Root>
        );
      })}
      <ToastPrimitive.Viewport className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex max-w-sm flex-col gap-2 rounded-lg" />
    </ToastPrimitive.Provider>
  );
};

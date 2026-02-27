import { useEffect, useRef } from "react";
import { cn } from "../../lib/utils.ts";
import { useUploadProgressStore } from "../../store/uploadProgress.ts";

const SIZE = 20;
const STROKE = 2.5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const DONE_DISMISS_MS = 4000;

const variantBorder: Record<string, string> = {
  success: "border-status-success-strong/30",
  error: "border-status-danger-strong/30",
  warning: "border-status-warning-strong/30",
};

export const UploadProgress = () => {
  const uploading = useUploadProgressStore((s) => s.uploading);
  const processed = useUploadProgressStore((s) => s.processed);
  const total = useUploadProgressStore((s) => s.total);
  const fileCount = useUploadProgressStore((s) => s.fileCount);
  const doneMessage = useUploadProgressStore((s) => s.doneMessage);
  const doneVariant = useUploadProgressStore((s) => s.doneVariant);
  const reset = useUploadProgressStore((s) => s.reset);

  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (doneMessage) {
      timerRef.current = setTimeout(reset, DONE_DISMISS_MS);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [doneMessage, reset]);

  if (!uploading && !doneMessage) return null;

  if (doneMessage) {
    return (
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] rounded-lg border bg-white/5 backdrop-blur-xl p-4 shadow-lg",
          variantBorder[doneVariant ?? "success"],
        )}
      >
        <span className="text-sm font-semibold text-text-primary">
          {doneMessage}
        </span>
      </div>
    );
  }

  const saving = uploading && processed >= total && total > 0;
  const pct = total > 0 ? Math.min(processed, total) / total : 0;
  const offset = saving ? CIRCUMFERENCE * 0.75 : CIRCUMFERENCE * (1 - pct);
  const label = saving
    ? "Saving…"
    : `${fileCount} session${fileCount !== 1 ? "s" : ""} processing`;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-lg">
      <svg
        width={SIZE}
        height={SIZE}
        className={cn("-rotate-90", saving && "animate-spin")}
      >
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
          className={cn(
            "text-accent",
            !saving && "transition-[stroke-dashoffset] duration-500",
          )}
        />
      </svg>
      <span className="text-sm font-semibold text-text-primary">
        {label}
      </span>
    </div>
  );
};

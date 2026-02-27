import { useState, useRef, useCallback } from "react";
import { GripVertical } from "lucide-react";
import { Card } from "../../components/ui/Card.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { useDeckMetricsStore } from "../../store/deckMetrics.ts";
import type { DeckMetrics } from "../../store/deckMetrics.ts";

const formatMs = (v: number) => `${v.toFixed(1)} ms`;
const formatMB = (v: number) => `${(v / 1024 / 1024).toFixed(1)} MB`;

type HealthDirection = "lower-is-better" | "higher-is-better";

type MetricRow = {
  key: keyof DeckMetrics;
  label: string;
  format: (v: number) => string;
  thresholds?: { green: number; yellow: number; direction: HealthDirection };
};

const METRIC_ROWS: MetricRow[] = [
  { key: "fps", label: "FPS", format: (v) => Math.round(v).toString(), thresholds: { green: 55, yellow: 30, direction: "higher-is-better" } },
  { key: "gpuTimePerFrame", label: "GPU / frame", format: formatMs, thresholds: { green: 4, yellow: 8, direction: "lower-is-better" } },
  { key: "cpuTimePerFrame", label: "CPU / frame", format: formatMs, thresholds: { green: 4, yellow: 8, direction: "lower-is-better" } },
  { key: "pickTime", label: "Pick time", format: formatMs, thresholds: { green: 2, yellow: 5, direction: "lower-is-better" } },
  { key: "framesRedrawn", label: "Redrawn", format: (v) => v.toString() },
  { key: "bufferMemory", label: "Buf mem", format: formatMB, thresholds: { green: 50 * 1024 * 1024, yellow: 100 * 1024 * 1024, direction: "lower-is-better" } },
];

const getHealthColor = (value: number, thresholds: NonNullable<MetricRow["thresholds"]>) => {
  if (thresholds.direction === "higher-is-better") {
    if (value >= thresholds.green) return "bg-status-success";
    if (value >= thresholds.yellow) return "bg-status-warning";
    return "bg-status-danger";
  }
  if (value <= thresholds.green) return "bg-status-success";
  if (value <= thresholds.yellow) return "bg-status-warning";
  return "bg-status-danger";
};

export const DeckMetricsOverlay = () => {
  const expanded = useDeckMetricsStore((s) => s.expanded);
  const metrics = useDeckMetricsStore((s) => s.metrics);
  const toggle = useDeckMetricsStore((s) => s.toggle);

  const initialPos = { x: 16, y: 16 };
  const posRef = useRef(initialPos);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [pos, setPos] = useState(initialPos);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: posRef.current.x,
      originY: posRef.current.y,
    };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const nx = dragRef.current.originX + (e.clientX - dragRef.current.startX);
    const ny = dragRef.current.originY + (e.clientY - dragRef.current.startY);
    posRef.current = { x: nx, y: ny };
    setPos({ x: nx, y: ny });
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  if (!import.meta.env.DEV) return null;

  return (
    <Card
      variant="compact"
      className="absolute z-50 w-48 select-none"
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="flex items-center gap-1">
        <div
          className="cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <GripVertical className="size-4 text-text-tertiary" />
        </div>
        <button onClick={toggle} className="cursor-pointer flex">
          <Typography variant="overline">Deck Metrics</Typography>
        </button>
      </div>
      {expanded && (
        <div className="mt-3 flex flex-col gap-1">
          {METRIC_ROWS.map((row) => (
            <div key={row.key} className="flex items-center justify-between">
              <Typography variant="caption" color="tertiary">
                {row.label}
              </Typography>
              <span className="flex items-center gap-1.5">
                <Typography variant="caption" tabularNums>
                  {metrics ? row.format(metrics[row.key]) : "—"}
                </Typography>
                <span className={`size-2 rounded-full ${metrics && row.thresholds ? getHealthColor(metrics[row.key], row.thresholds) : ""}`} />
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

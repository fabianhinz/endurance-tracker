import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceArea,
} from "recharts";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { useSessionsStore } from "../../store/sessions.ts";
import { getSessionRecords, getSessionLaps } from "../../lib/indexeddb.ts";
import { Button } from "../../components/ui/Button.tsx";
import { MetricCard } from "../../components/ui/MetricCard.tsx";
import { ChartCard } from "../../components/ui/ChartCard.tsx";
import { Typography } from "../../components/ui/Typography.tsx";
import { PageGrid } from "../../components/ui/PageGrid.tsx";
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/Dialog.tsx";
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/ui/DropdownMenu.tsx";
import {
  formatDate,
  formatDuration,
  formatDistance,
  formatSubSport,
} from "../../lib/utils.ts";
import { cn } from "../../lib/utils.ts";
import { useChartZoom } from "../../lib/use-chart-zoom.ts";
import { chartTheme } from "../../lib/chart-theme.ts";
import { tokens } from "../../lib/tokens.ts";
import { SportChip } from "../../components/ui/SportChip.tsx";
import { SessionStatsGrid } from "./SessionStatsGrid.tsx";
import type { SessionRecord, SessionLap } from "../../types/index.ts";
import { METRIC_EXPLANATIONS } from "../../engine/explanations.ts";

export const SessionDetailPage = () => {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sessions = useSessionsStore((s) => s.sessions);
  const deleteSession = useSessionsStore((s) => s.deleteSession);
  const renameSession = useSessionsStore((s) => s.renameSession);
  const session = sessions.find((s) => s.id === params.id);
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [laps, setLaps] = useState<SessionLap[]>([]);
  const [showGrade, setShowGrade] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    if (params.id && session?.hasDetailedRecords) {
      getSessionRecords(params.id).then(setRecords);
      getSessionLaps(params.id).then(setLaps);
    }
  }, [params.id, session?.hasDetailedRecords]);

  // Downsample records for chart (every 10th point)
  const chartData = useMemo(
    () =>
      records
        .filter((_, i) => i % 10 === 0)
        .map((r) => ({
          time: Math.round((r.timestamp / 60) * 100) / 100,
          hr: r.hr,
          power: r.power,
          speed: r.speed ? Math.round(r.speed * 3.6 * 10) / 10 : undefined,
          grade:
            r.grade !== undefined ? Math.round(r.grade * 10) / 10 : undefined,
        })),
    [records],
  );

  const hasGradeData = chartData.some((d) => d.grade !== undefined);

  const zoom = useChartZoom({ data: chartData, xKey: "time" });

  if (!session) {
    return (
      <Typography variant="body" color="tertiary">
        Session not found.
      </Typography>
    );
  }

  const subSportLabel =
    session.subSport && session.subSport !== "generic"
      ? formatSubSport(session.subSport)
      : null;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="flex justify-center flex-col">
          <Typography variant="h2" as="h1">
            {session.name ?? formatDate(session.date)}
          </Typography>
          {session.name && (
            <Typography variant="caption" color="tertiary">
              {formatDate(session.date)}
            </Typography>
          )}
        </div>
        <div className="flex flex-grow justify-end flex-wrap gap-3">
          <SportChip sport={session.sport} />
          {subSportLabel && (
            <Typography
              variant="caption"
              color="quaternary"
              className="rounded-md bg-white/10 px-2 py-0.5"
            >
              {subSportLabel}
            </Typography>
          )}
          <DropdownMenuRoot>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Session actions">
                <Ellipsis size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => {
                  setNameInput(session.name ?? formatDate(session.date));
                  setShowRenameDialog(true);
                }}
              >
                <Pencil size={14} />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-status-danger focus:text-status-danger"
                onSelect={() => setShowDeleteDialog(true)}
              >
                <Trash2 size={14} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuRoot>
        </div>
      </div>

      <PageGrid>
        <MetricCard
          label="Duration"
          subtitle="Total elapsed time"
          size="lg"
          value={formatDuration(session.duration)}
          subDetail={
            session.movingTime !== undefined &&
            session.movingTime !== session.duration ? (
              <div className="space-y-0.5">
                <Typography variant="caption" as="p">
                  Moving: {formatDuration(session.movingTime)}
                </Typography>
                <Typography variant="caption" as="p">
                  Stopped:{" "}
                  {formatDuration(session.duration - session.movingTime)}
                </Typography>
              </div>
            ) : undefined
          }
        />
        <MetricCard
          label="Distance"
          subtitle="Total distance covered"
          size="lg"
          value={formatDistance(session.distance)}
        />
        <MetricCard
          label={METRIC_EXPLANATIONS[session.stressMethod].friendlyName}
          subtitle=""
          metricId={session.stressMethod}
          size="lg"
          value={session.tss.toFixed(0)}
        />
        {session.avgHr && (
          <MetricCard
            label="Avg HR"
            subtitle="Average heart rate"
            size="lg"
            value={session.avgHr}
            unit="bpm"
          />
        )}

        <div className="md:col-span-2">
          <SessionStatsGrid session={session} laps={laps} />
        </div>

        {chartData.length > 0 && (
          <div className="md:col-span-2">
            <ChartCard
              title="Performance"
              subtitle="Heart rate, power, and speed over time"
              actions={
                hasGradeData ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowGrade((v) => !v)}
                    aria-pressed={showGrade}
                    aria-label="Toggle grade overlay on chart"
                    className={cn(
                      "px-2 py-1 text-xs",
                      showGrade
                        ? "bg-chart-grade/20 text-chart-grade"
                        : "bg-white/5 text-text-quaternary hover:text-text-tertiary",
                    )}
                  >
                    Grade %
                  </Button>
                ) : undefined
              }
              minHeight="h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={zoom.zoomedData}
                  onMouseDown={zoom.onMouseDown}
                  onMouseMove={zoom.onMouseMove}
                  onMouseUp={zoom.onMouseUp}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartTheme.grid.stroke}
                  />
                  <XAxis
                    dataKey="time"
                    tick={chartTheme.tick}
                    tickLine={false}
                    axisLine={chartTheme.axisLine}
                    tickFormatter={(v: number) => `${Math.round(v)} min`}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={chartTheme.tick}
                    tickLine={false}
                    axisLine={false}
                  />
                  <RechartsTooltip
                    contentStyle={chartTheme.tooltip.contentStyle}
                    labelStyle={chartTheme.tooltip.labelStyle}
                    isAnimationActive={chartTheme.tooltip.isAnimationActive}
                    labelFormatter={(v) => `${Math.round(Number(v))} min`}
                  />
                  {chartData.some((d) => d.hr) && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="hr"
                      stroke={tokens.chartHr}
                      strokeWidth={1.5}
                      dot={false}
                      name="HR (bpm)"
                    />
                  )}
                  {chartData.some((d) => d.power) && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="power"
                      stroke={tokens.chartPower}
                      strokeWidth={1.5}
                      dot={false}
                      name="Power (W)"
                    />
                  )}
                  {chartData.some((d) => d.speed) && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="speed"
                      stroke={tokens.chartSpeed}
                      strokeWidth={1.5}
                      dot={false}
                      name="Speed (km/h)"
                    />
                  )}
                  {showGrade && (
                    <>
                      <YAxis
                        yAxisId="grade"
                        orientation="right"
                        tick={chartTheme.tick}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `${v}%`}
                        domain={["auto", "auto"]}
                      />
                      <Line
                        yAxisId="grade"
                        type="monotone"
                        dataKey="grade"
                        stroke={tokens.chartGrade}
                        strokeWidth={1}
                        strokeDasharray="4 2"
                        dot={false}
                        name="Grade (%)"
                      />
                    </>
                  )}
                  {zoom.refAreaLeft && zoom.refAreaRight && (
                    <ReferenceArea
                      yAxisId="left"
                      x1={zoom.refAreaLeft}
                      x2={zoom.refAreaRight}
                      strokeOpacity={0.3}
                      fill={tokens.accent}
                      fillOpacity={0.15}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}
      </PageGrid>

      <DialogRoot
        open={showRenameDialog}
        onOpenChange={(open) => {
          if (!open) setShowRenameDialog(false);
        }}
      >
        <DialogContent>
          <DialogTitle>Rename Session</DialogTitle>
          <DialogDescription>
            Enter a new name for this session.
          </DialogDescription>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && nameInput.trim()) {
                renameSession(session.id, nameInput.trim());
                setShowRenameDialog(false);
              }
            }}
            className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            autoFocus
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowRenameDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (nameInput.trim()) {
                  renameSession(session.id, nameInput.trim());
                  setShowRenameDialog(false);
                }
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </DialogRoot>

      <DialogRoot
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) setShowDeleteDialog(false);
        }}
      >
        <DialogContent>
          <DialogTitle>Delete Session</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the {session.sport} session from{" "}
            {formatDate(session.date)}? This action cannot be undone.
          </DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-status-danger text-white hover:bg-status-danger/80"
              onClick={() => {
                deleteSession(session.id);
                setShowDeleteDialog(false);
                navigate("/training");
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </DialogRoot>
    </div>
  );
};

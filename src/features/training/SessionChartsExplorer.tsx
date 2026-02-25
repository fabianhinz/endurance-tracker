import { useCallback, useEffect, useMemo } from "react";
import {
  Heart,
  Zap,
  Gauge,
  Mountain,
  Timer,
  TrendingUp,
  ArrowUpDown,
  Activity,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUserStore } from "../../store/user.ts";
import { ChartPreviewCard } from "../../components/ui/ChartPreviewCard.tsx";
import { downsample } from "../../engine/downsample.ts";
import {
  prepareHrData,
  preparePowerData,
  prepareSpeedData,
  prepareCadenceData,
  prepareElevationData,
  prepareGradeData,
  preparePaceData,
  prepareGAPData,
  buildTimeToGpsLookup,
} from "../../engine/chart-data.ts";
import { useMapFocusStore } from "../../store/map-focus.ts";
import {
  computeHrZoneDistribution,
  computePowerZoneDistribution,
  computePaceZoneDistribution,
} from "../../engine/zone-distribution.ts";
import { sportIcon } from "../../lib/sport-icons.ts";
import { HrChart } from "./HrChart.tsx";
import { PowerChart } from "./PowerChart.tsx";
import { SpeedChart } from "./SpeedChart.tsx";
import { CadenceChart } from "./CadenceChart.tsx";
import { ElevationChart } from "./ElevationChart.tsx";
import { GradeChart } from "./GradeChart.tsx";
import { PaceChart } from "./PaceChart.tsx";
import { GradeAdjustedPaceChart } from "./GradeAdjustedPaceChart.tsx";
import { ZoneDistributionChart } from "./ZoneDistributionChart.tsx";
import { tokens } from "../../lib/tokens.ts";
import type { SessionRecord, TrainingSession } from "../../types/index.ts";

interface ChartEntry {
  key: string;
  title: string;
  icon: LucideIcon;
  color: string;
  hasData: boolean;
  compactHeight?: string;
  render: (mode: "compact" | "expanded") => React.ReactNode;
}

interface SessionChartsExplorerProps {
  records: SessionRecord[];
  session: TrainingSession;
}

export const SessionChartsExplorer = (props: SessionChartsExplorerProps) => {
  const profile = useUserStore((s) => s.profile);
  const isRunning = props.session.sport === "running";

  const sampled = useMemo(() => downsample(props.records), [props.records]);

  // Time-series data
  const hrData = useMemo(() => prepareHrData(sampled), [sampled]);
  const powerData = useMemo(() => preparePowerData(sampled), [sampled]);
  const speedData = useMemo(() => prepareSpeedData(sampled), [sampled]);
  const cadenceData = useMemo(() => prepareCadenceData(sampled), [sampled]);
  const elevationData = useMemo(() => prepareElevationData(sampled), [sampled]);
  const gradeData = useMemo(() => prepareGradeData(sampled), [sampled]);
  const paceData = useMemo(
    () => (isRunning ? preparePaceData(sampled) : []),
    [sampled, isRunning],
  );
  const gapData = useMemo(
    () => (isRunning && gradeData.length > 0 ? prepareGAPData(sampled) : []),
    [sampled, isRunning, gradeData.length],
  );

  // Zone data
  const hrZoneData = useMemo(() => {
    const thresholds = profile?.thresholds;
    if (!thresholds?.maxHr || !thresholds?.restHr) return [];
    return computeHrZoneDistribution(
      props.records,
      thresholds.maxHr,
      thresholds.restHr,
    );
  }, [props.records, profile?.thresholds]);

  const powerZoneData = useMemo(() => {
    const ftp = profile?.thresholds?.ftp;
    if (!ftp) return [];
    return computePowerZoneDistribution(props.records, ftp);
  }, [props.records, profile?.thresholds?.ftp]);

  const paceZoneData = useMemo(() => {
    const thresholdPace = profile?.thresholds?.thresholdPace;
    if (!thresholdPace || !isRunning) return [];
    return computePaceZoneDistribution(props.records, thresholdPace);
  }, [props.records, profile?.thresholds?.thresholdPace, isRunning]);

  const gpsLookup = useMemo(() => buildTimeToGpsLookup(sampled), [sampled]);

  const setHoveredPoint = useMapFocusStore((s) => s.setHoveredPoint);
  const clearHoveredPoint = useMapFocusStore((s) => s.clearHoveredPoint);

  const onActiveTimeChange = useCallback(
    (time: number | null) => {
      if (time == null) {
        clearHoveredPoint();
        return;
      }
      const point = gpsLookup.get(time);
      if (point) {
        setHoveredPoint(point);
      }
    },
    [gpsLookup, setHoveredPoint, clearHoveredPoint],
  );

  useEffect(() => clearHoveredPoint, [clearHoveredPoint]);

  const hasGps = gpsLookup.size > 0;

  const cadenceIcon = sportIcon[props.session.sport] ?? sportIcon.running;

  // Chart registry
  const charts: ChartEntry[] = useMemo(
    () => [
      {
        key: "hr",
        title: "Heart Rate",
        icon: Heart,
        color: tokens.chartHr,
        hasData: hrData.length > 0,
        render: (mode: "compact" | "expanded") => (
          <HrChart data={hrData} mode={mode} onActiveTimeChange={hasGps ? onActiveTimeChange : undefined} />
        ),
      },
      {
        key: "power",
        title: "Power",
        icon: Zap,
        color: tokens.chartPower,
        hasData: powerData.length > 0,
        render: (mode: "compact" | "expanded") => (
          <PowerChart data={powerData} mode={mode} onActiveTimeChange={hasGps ? onActiveTimeChange : undefined} />
        ),
      },
      {
        key: "speed",
        title: "Speed",
        icon: Gauge,
        color: tokens.chartSpeed,
        hasData: speedData.length > 0,
        render: (mode: "compact" | "expanded") => (
          <SpeedChart data={speedData} mode={mode} onActiveTimeChange={hasGps ? onActiveTimeChange : undefined} />
        ),
      },
      {
        key: "elevation",
        title: "Elevation",
        icon: Mountain,
        color: tokens.chartElevation,
        hasData: elevationData.length > 0,
        render: (mode: "compact" | "expanded") => (
          <ElevationChart data={elevationData} mode={mode} onActiveTimeChange={hasGps ? onActiveTimeChange : undefined} />
        ),
      },
      {
        key: "cadence",
        title: "Cadence",
        icon: cadenceIcon,
        color: tokens.chartCadence,
        hasData: cadenceData.length > 0,
        render: (mode: "compact" | "expanded") => (
          <CadenceChart data={cadenceData} mode={mode} onActiveTimeChange={hasGps ? onActiveTimeChange : undefined} />
        ),
      },
      {
        key: "grade",
        title: "Grade",
        icon: TrendingUp,
        color: tokens.chartGrade,
        hasData: gradeData.length > 0,
        render: (mode: "compact" | "expanded") => (
          <GradeChart data={gradeData} mode={mode} onActiveTimeChange={hasGps ? onActiveTimeChange : undefined} />
        ),
      },
      {
        key: "pace",
        title: "Pace",
        icon: Timer,
        color: tokens.chartPace,
        hasData: paceData.length > 0,
        render: (mode: "compact" | "expanded") => (
          <PaceChart data={paceData} mode={mode} onActiveTimeChange={hasGps ? onActiveTimeChange : undefined} />
        ),
      },
      {
        key: "gap",
        title: "Grade Adjusted Pace",
        icon: ArrowUpDown,
        color: tokens.chartGap,
        hasData: gapData.length > 0,
        render: (mode: "compact" | "expanded") => (
          <GradeAdjustedPaceChart
            data={gapData}
            mode={mode}
            onActiveTimeChange={hasGps ? onActiveTimeChange : undefined}
          />
        ),
      },
      {
        key: "zones",
        title: "Zone Distribution",
        icon: Activity,
        color: tokens.accent,
        hasData:
          hrZoneData.length > 0 ||
          powerZoneData.length > 0 ||
          paceZoneData.length > 0,
        compactHeight: "h-[250px]",
        render: (mode: "compact" | "expanded") => (
          <ZoneDistributionChart
            hrZones={hrZoneData}
            powerZones={powerZoneData}
            paceZones={paceZoneData}
            mode={mode}
          />
        ),
      },
    ],
    [
      hrData,
      powerData,
      speedData,
      elevationData,
      cadenceData,
      gradeData,
      paceData,
      gapData,
      cadenceIcon,
      hrZoneData,
      powerZoneData,
      paceZoneData,
      hasGps,
      onActiveTimeChange,
    ],
  );

  const visibleCharts = charts.filter((c) => c.hasData);

  if (visibleCharts.length === 0) return null;

  return (
    <div className="space-y-3">
      {visibleCharts.map((chart) => (
        <ChartPreviewCard
          key={chart.key}
          title={chart.title}
          icon={chart.icon}
          color={chart.color}
          compactHeight={chart.compactHeight}
        >
          {chart.render}
        </ChartPreviewCard>
      ))}
    </div>
  );
};

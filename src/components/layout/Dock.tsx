import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Zap,
  Settings,
  Ellipsis,
  Upload,
  X,
  Activity,
  Clock,
  HeartPulse,
} from "lucide-react";
import { useFileUpload } from "../../features/training/use-file-upload.ts";
import { cn } from "../../lib/utils.ts";
import { cardClass } from "../ui/Card.tsx";
import { useSlideIndicator } from "../ui/SlideIndicator.tsx";
import { useLayoutStore } from "../../store/layout.ts";
import { useFiltersStore } from "../../store/filters.ts";
import { Button } from "../ui/Button.tsx";
import { DockRevealPanel } from "./DockRevealPanel.tsx";
import { DockFilterOptions } from "./DockFilterOptions.tsx";
import { sportIcon } from "../../lib/sport-icons.ts";
import {
  type TimeRange,
  timeRangeOptions,
  rangeLabelMap,
  formatCustomRangeDuration,
} from "../../lib/time-range.ts";
import type { Sport } from "../../engine/types.ts";

const tabs = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/training", label: "Training", icon: Zap },
  { to: "/coach", label: "Coach", icon: HeartPulse },
  { to: "/settings", label: "Settings", icon: Settings },
];

const sportOptions = [
  { value: "all", label: "All" },
  { value: "running", label: "Run" },
  { value: "cycling", label: "Cycle" },
  { value: "swimming", label: "Swim" },
];

const dockItemMiniClass =
  "w-12 md:w-10 h-10 rounded-lg text-text-tertiary hover:bg-white/10 hover:text-text-primary";

const dockItemMaxiClass =
  "w-14 md:w-16 h-14 rounded-lg text-text-tertiary hover:bg-white/10 hover:text-text-primary flex-col gap-0.5";

const revealItemClass =
  "w-12 md:w-10 h-12 rounded-lg text-text-tertiary hover:bg-white/10 hover:text-text-primary flex-col gap-0.5";

type DockRevealLayer = "menu" | "sport-filter" | "time-filter";

export const Dock = () => {
  const location = useLocation();
  const activeIndex = tabs.findIndex((tab) =>
    tab.to === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(tab.to),
  );
  const dockBarRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dockExpanded = useLayoutStore((s) => s.dockExpanded);
  const indicatorElement = useSlideIndicator(
    dockBarRef,
    tabRefs,
    activeIndex,
    dockExpanded,
  );
  const upload = useFileUpload(fileInputRef);

  const [revealStack, setRevealStack] = useState<DockRevealLayer[]>([]);

  const isOpen = useCallback(
    (layer: DockRevealLayer) => revealStack.includes(layer),
    [revealStack],
  );

  const closeAll = useCallback(() => setRevealStack([]), []);

  const closeFrom = useCallback(
    (layer: DockRevealLayer) =>
      setRevealStack((prev) => {
        const idx = prev.indexOf(layer);
        return idx === -1 ? prev : prev.slice(0, idx);
      }),
    [],
  );

  const toggleMaxiFilter = useCallback((layer: DockRevealLayer) => {
    setRevealStack((prev) =>
      prev.length === 1 && prev[0] === layer ? [] : [layer],
    );
  }, []);

  const toggleMiniFilter = useCallback((layer: DockRevealLayer) => {
    setRevealStack((prev) =>
      prev.includes(layer)
        ? prev.filter((l) => l !== layer)
        : ["menu" as const, layer],
    );
  }, []);

  // Filter state
  const sportFilter = useFiltersStore((s) => s.sportFilter);
  const setSportFilter = useFiltersStore((s) => s.setSportFilter);
  const timeRange = useFiltersStore((s) => s.timeRange);
  const setTimeRange = useFiltersStore((s) => s.setTimeRange);
  const customRange = useFiltersStore((s) => s.customRange);

  const SportIcon = sportFilter === "all" ? Activity : sportIcon[sportFilter];
  const sportLabel =
    sportFilter === "all"
      ? "All"
      : sportFilter.charAt(0).toUpperCase() + sportFilter.slice(1);

  const timeLabel =
    timeRange === "custom" && customRange
      ? formatCustomRangeDuration(customRange)
      : rangeLabelMap[timeRange];

  const timeFilterOptions =
    timeRange === "custom" && customRange
      ? [
          ...timeRangeOptions,
          {
            value: "custom",
            label: formatCustomRangeDuration(customRange),
            variant: "accent" as const,
          },
        ]
      : timeRangeOptions;

  // Escape key handler — pop top layer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && revealStack.length > 0) {
        setRevealStack((prev) => prev.slice(0, -1));
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [revealStack.length]);

  return (
    <>
      <nav
        data-layout="dock"
        className={cn(
          cardClass,
          "fixed z-50 md:flex-row md:items-center",
          "border-0 border-t rounded-none shadow-none bottom-0 inset-x-0",
          "md:border md:rounded-2xl md:shadow-lg md:inset-x-auto md:bottom-auto md:left-3 md:top-1/2 md:-translate-y-1/2",
          "transition-all duration-300",
        )}
      >
        {/* Filter options panels (Level C) — top on mobile, rightmost on desktop */}
        <DockRevealPanel open={isOpen("sport-filter")} className="md:order-3">
          <DockFilterOptions
            options={sportOptions}
            value={sportFilter}
            onValueChange={(v) => {
              setSportFilter(v as Sport | "all");
              closeFrom("sport-filter");
            }}
          />
        </DockRevealPanel>

        <DockRevealPanel open={isOpen("time-filter")} className="md:order-3">
          <DockFilterOptions
            options={timeFilterOptions}
            value={timeRange}
            onValueChange={(v) => {
              setTimeRange(v as TimeRange);
              closeFrom("time-filter");
            }}
          />
        </DockRevealPanel>

        {/* Mini dock menu panel (Level B) — between dock bar and filters on desktop */}
        <DockRevealPanel
          open={isOpen("menu") && !dockExpanded}
          className="md:order-2"
        >
          <Button
            variant="ghost"
            size="icon"
            className={revealItemClass}
            disabled={upload.uploading || !upload.profile}
            onClick={() => {
              upload.triggerUpload();
              closeFrom("menu");
            }}
            aria-label="Upload .FIT files"
          >
            <Upload size={20} strokeWidth={1.5} />
            <span className="text-[10px] leading-none">Upload</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              revealItemClass,
              isOpen("sport-filter") && "bg-white/10 text-text-primary",
            )}
            onClick={() => toggleMiniFilter("sport-filter")}
            aria-label="Sport filter"
          >
            <SportIcon size={20} strokeWidth={1.5} />
            <span className="text-[10px] leading-none">Sport</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              revealItemClass,
              isOpen("time-filter") && "bg-white/10 text-text-primary",
            )}
            onClick={() => toggleMiniFilter("time-filter")}
            aria-label="Time range filter"
          >
            <Clock size={20} strokeWidth={1.5} />
            <span className="text-[10px] leading-none">Range</span>
          </Button>
        </DockRevealPanel>

        {/* Main dock bar */}
        <div
          ref={dockBarRef}
          className="relative flex flex-row md:flex-col items-center justify-center p-2 md:order-1"
        >
          {indicatorElement}

          {tabs.map((tab, i) => (
            <NavLink
              key={tab.to}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              to={tab.to}
              end={tab.to === "/"}
              onClick={closeAll}
              aria-label={tab.label}
              className={({ isActive }) =>
                cn(
                  "relative flex items-center justify-center rounded-lg transition-all duration-300 overflow-hidden",
                  dockExpanded ? dockItemMaxiClass : "w-12 md:w-10 h-10",
                  isActive
                    ? "text-text-primary"
                    : "text-text-tertiary hover:bg-white/10 hover:text-text-primary",
                )
              }
            >
              <tab.icon size={20} strokeWidth={1.5} />
              {dockExpanded && (
                <span className="text-[10px] leading-none">{tab.label}</span>
              )}
            </NavLink>
          ))}

          {/* Separator */}
          <div
            className={cn(
              "bg-white/10 shrink-0 transition-all duration-300",
              "w-px h-6 mx-1 md:w-6 md:h-px md:my-1 md:mx-0",
            )}
          />

          {dockExpanded ? (
            <>
              {/* Filter buttons in maxi dock */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  dockItemMaxiClass,
                  isOpen("sport-filter") && "bg-white/10 text-text-primary",
                )}
                onClick={() => toggleMaxiFilter("sport-filter")}
                aria-label="Sport filter"
              >
                <SportIcon size={20} strokeWidth={1.5} />
                <span className="text-[10px] leading-none truncate max-w-14">
                  {sportLabel}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  dockItemMaxiClass,
                  isOpen("time-filter") && "bg-white/10 text-text-primary",
                )}
                onClick={() => toggleMaxiFilter("time-filter")}
                aria-label="Time range filter"
              >
                <Clock size={20} strokeWidth={1.5} />
                <span className="text-[10px] leading-none truncate max-w-14">
                  {timeLabel}
                </span>
              </Button>

              {/* Separator */}
              <div
                className={cn(
                  "bg-white/10 shrink-0 transition-all duration-300",
                  "w-px h-6 mx-1 md:w-6 md:h-px md:my-1 md:mx-0",
                )}
              />

              <Button
                variant="ghost"
                size="icon"
                className={dockItemMaxiClass}
                disabled={upload.uploading || !upload.profile}
                onClick={upload.triggerUpload}
                aria-label="Upload .FIT files"
              >
                <Upload size={20} strokeWidth={1.5} />
                <span className="text-[10px] leading-none">Upload</span>
              </Button>

            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className={dockItemMiniClass}
              onClick={() =>
                setRevealStack((prev) =>
                  prev.includes("menu") ? [] : ["menu"],
                )
              }
              aria-label={isOpen("menu") ? "Close menu" : "More actions"}
            >
              {isOpen("menu") ? (
                <X size={20} strokeWidth={1.5} />
              ) : (
                <Ellipsis size={20} strokeWidth={1.5} />
              )}
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".fit"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && upload.handleFiles(e.target.files)}
          disabled={upload.uploading}
        />
      </nav>

      {/* Backdrop — closes reveals on click, purely in React's event system */}
      {revealStack.length > 0 && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeAll}
          aria-hidden="true"
        />
      )}
    </>
  );
};

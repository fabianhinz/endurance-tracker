import { formatPace } from "../../lib/utils.ts";
import type { RunningZone } from "../../engine/types.ts";

export const ZoneLegend = (props: {
  zones: RunningZone[];
  compact?: boolean;
}) => {
  return (
    <div
      className={
        props.compact
          ? "flex flex-nowrap overflow-x-auto gap-1"
          : "flex flex-wrap gap-2"
      }
    >
      {props.zones.map((zone) => (
        <span
          key={zone.name}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 text-xs text-text-secondary whitespace-nowrap"
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: zone.color }}
          />
          {zone.label}
          {!props.compact && (
            <span className="text-text-quaternary">
              {formatPace(zone.maxPace)} – {formatPace(zone.minPace)}
            </span>
          )}
        </span>
      ))}
    </div>
  );
};

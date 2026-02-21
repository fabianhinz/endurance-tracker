type GaugeZone = { from: number; to: number; color: string };

type GaugeDialProps = {
  min: number;
  max: number;
  value: number;
  zones: GaugeZone[];
  valueFill: string;
};

const CX = 100;
const CY = 100;
const R = 83;
const STROKE = 14;
const GAP_RAD = (1 * Math.PI) / 180; // 1° gap between segments

const valueToAngle = (v: number, min: number, max: number) =>
  Math.PI * (1 - (v - min) / (max - min));

const angleToXY = (angle: number) => ({
  x: CX + R * Math.cos(angle),
  y: CY - R * Math.sin(angle),
});

const arcPath = (startAngle: number, endAngle: number) => {
  const start = angleToXY(startAngle);
  const end = angleToXY(endAngle);
  const largeArc = startAngle - endAngle > Math.PI ? 1 : 0;
  return `M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y}`;
};

export const GaugeDial = (props: GaugeDialProps) => {
  const clamped = Math.max(props.min, Math.min(props.max, props.value));
  const valueAngle = valueToAngle(clamped, props.min, props.max);

  return (
    <svg viewBox="0 0 200 115" className="w-full h-full">
      {props.zones.map((zone, i) => {
        const fromAngle = valueToAngle(
          Math.max(zone.from, props.min),
          props.min,
          props.max,
        );
        const toAngle = valueToAngle(
          Math.min(zone.to, props.max),
          props.min,
          props.max,
        );
        const adjFrom = i > 0 ? fromAngle - GAP_RAD / 2 : fromAngle;
        const adjTo =
          i < props.zones.length - 1 ? toAngle + GAP_RAD / 2 : toAngle;

        if (adjFrom <= adjTo) return null;

        return (
          <path
            key={i}
            d={arcPath(adjFrom, adjTo)}
            fill="none"
            stroke={zone.color}
            strokeWidth={STROKE}
            opacity={0.25}
          />
        );
      })}

      {clamped !== props.min && (
        <path
          d={arcPath(Math.PI, valueAngle)}
          fill="none"
          stroke={props.valueFill}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};

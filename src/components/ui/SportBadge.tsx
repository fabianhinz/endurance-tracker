import { cn } from "../../lib/utils.ts";
import { sportColorClass } from "../../lib/status-colors.ts";
import { sportIcon } from "../../lib/sport-icons.ts";
import type { Sport } from "../../engine/types.ts";

const sizeMap = {
  sm: { container: "h-8 w-8 rounded-md", iconSize: 16 },
  md: { container: "h-10 w-10 rounded-lg", iconSize: 18 },
} as const;

export const SportBadge = (props: { sport: Sport; size?: "sm" | "md" }) => {
  const config = sizeMap[props.size ?? "md"];
  const Icon = sportIcon[props.sport];

  return (
    <div
      className={cn(
        "flex items-center justify-center font-bold",
        config.container,
        sportColorClass[props.sport],
      )}
    >
      <Icon size={config.iconSize} strokeWidth={2} />
    </div>
  );
};

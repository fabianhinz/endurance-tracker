import { cn } from "../../lib/utils.ts";
import { sportColorClass } from "../../lib/statusColors.ts";
import { sportIcon } from "../../lib/sportIcons.ts";
import type { Sport } from "../../engine/types.ts";

export const SportChip = (props: { sport: Sport }) => {
  const Icon = sportIcon[props.sport];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium capitalize",
        sportColorClass[props.sport],
      )}
    >
      <Icon size={14} strokeWidth={2} />
      {props.sport}
    </span>
  );
};

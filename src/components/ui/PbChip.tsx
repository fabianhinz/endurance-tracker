import { Typography } from "./Typography.tsx";
import { sportIcon } from "../../lib/sport-icons.ts";
import { pbLabel, formatPBValue } from "../../lib/utils.ts";
import type { PersonalBest } from "../../types/index.ts";

export const PbChip = (props: { pb: PersonalBest }) => {
  const Icon = sportIcon[props.pb.sport];
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-1.5">
      <Icon size={14} className="text-yellow-400" />
      <Typography variant="caption" color="primary">
        {pbLabel(props.pb)}{" "}
        <span className="text-yellow-400 font-medium">
          {formatPBValue(props.pb)}
        </span>
      </Typography>
    </div>
  );
};

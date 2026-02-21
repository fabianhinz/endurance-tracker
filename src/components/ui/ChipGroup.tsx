import { ToggleGroup, ToggleGroupItem } from "./ToggleGroup.tsx";
import { cn } from "../../lib/utils.ts";

interface ChipGroupControl {
  options: { value: string; label: string; variant?: "accent" }[];
  value: string;
  onValueChange: (value: string) => void;
}

interface ChipGroupProps {
  controls: ChipGroupControl[];
  className?: string;
}

export const ChipGroup = (props: ChipGroupProps) => {
  return (
    <div
      className={cn(
        "flex flex-wrap justify-end items-center gap-3",
        props.className,
      )}
    >
      {props.controls.map((control, i) => (
        <ToggleGroup
          key={i}
          type="single"
          value={control.value}
          onValueChange={(v) => v && control.onValueChange(v)}
        >
          {control.options.map((opt) => (
            <ToggleGroupItem
              key={opt.value}
              value={opt.value}
              data-variant={opt.variant}
            >
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ))}
    </div>
  );
};

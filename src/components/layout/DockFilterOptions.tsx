import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "../../lib/utils.ts";

interface FilterOption {
  value: string;
  label: string;
  variant?: "accent";
}

interface DockFilterOptionsProps {
  options: FilterOption[];
  value: string;
  onValueChange: (value: string) => void;
}

const itemClass =
  "w-12 md:w-10 h-12 rounded-lg font-medium text-text-tertiary hover:bg-white/10 hover:text-text-primary flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors data-[state=on]:bg-white/10 data-[state=on]:text-text-primary data-[state=on]:data-[variant=accent]:text-accent";

export const DockFilterOptions = (props: DockFilterOptionsProps) => {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={props.value}
      onValueChange={(v) => v && props.onValueChange(v)}
      className="flex flex-row md:flex-col gap-1"
    >
      {props.options.map((opt) => (
        <ToggleGroupPrimitive.Item
          key={opt.value}
          value={opt.value}
          data-variant={opt.variant}
          className={cn(itemClass)}
        >
          <span className="text-[10px] leading-none">{opt.label}</span>
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
};

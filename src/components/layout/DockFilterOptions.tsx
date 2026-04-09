import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cn } from '@/lib/utils.ts';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  variant?: 'accent';
}

interface DockFilterOptionsProps<T extends string> {
  options: FilterOption<T>[];
  value: string;
  onValueChange: (value: T) => void;
}

const itemClass =
  'w-12 lg:w-10 h-12 rounded-lg font-medium text-text-tertiary hover:bg-white/10 hover:text-text-primary flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors data-[state=on]:bg-white/10 data-[state=on]:text-text-primary data-[state=on]:data-[variant=accent]:text-accent';

export const DockFilterOptions = <T extends string>(props: DockFilterOptionsProps<T>) => {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={props.value}
      className="flex flex-row lg:flex-col gap-1"
    >
      {props.options.map((opt) => (
        <ToggleGroupPrimitive.Item
          key={opt.value}
          value={opt.value}
          data-variant={opt.variant}
          // we cannot use onValueChange of the ToggleGroupPrimitive. "Custom" trigger the RangePickerDialog
          onClick={() => props.onValueChange(opt.value as T)}
          className={cn(itemClass)}
        >
          <span className="text-[10px] leading-none truncate w-full text-center">{opt.label}</span>
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
};

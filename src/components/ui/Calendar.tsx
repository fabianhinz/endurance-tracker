import { useMemo, useRef } from 'react';
import { useRangeCalendarState } from '@react-stately/calendar';
import { useRangeCalendar, useCalendarGrid, useCalendarCell } from '@react-aria/calendar';
import { useButton } from '@react-aria/button';
import { createCalendar, isSameDay, CalendarDate } from '@internationalized/date';
import type { DateValue } from '@internationalized/date';
import type { RangeCalendarState } from '@react-stately/calendar';
import type { CalendarAria } from '@react-aria/calendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getLocale } from '@/paraglide/runtime.js';
import { cn } from '@/lib/utils.ts';
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select.tsx';
import { sportDotBgClass } from '@/lib/statusColors.ts';
import type { Sport } from '@/packages/engine/types.ts';

export interface DateRange {
  start: CalendarDate;
  end: CalendarDate;
}

interface RangeCalendarProps {
  value: DateRange | null;
  onChange: (value: DateRange) => void;
  minValue?: DateValue;
  maxValue?: DateValue;
  defaultFocusedValue?: DateValue;
  activityDots?: Map<string, Sport[]>;
  years?: number[];
}

const FIXED_WEEKS = 6;

const isInRange = (date: CalendarDate, range: DateRange | null): boolean => {
  if (!range) {
    return false;
  }
  return date.compare(range.start) >= 0 && date.compare(range.end) <= 0;
};

const isRangeEndpoint = (date: CalendarDate, range: DateRange | null): boolean => {
  if (!range) {
    return false;
  }
  return isSameDay(date, range.start) || isSameDay(date, range.end);
};

const NavButton = (props: {
  ariaProps: CalendarAria['prevButtonProps'];
  children: React.ReactNode;
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const btn = useButton(props.ariaProps, ref);
  return (
    <button
      {...btn.buttonProps}
      ref={ref}
      className="size-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-white/10 hover:text-text-primary transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none disabled:cursor-default"
    >
      {props.children}
    </button>
  );
};

const CalendarCell = (props: { date: CalendarDate; state: RangeCalendarState; dots?: Sport[] }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const cell = useCalendarCell({ date: props.date }, props.state, ref);
  const highlighted = props.state.highlightedRange;
  const inRange = isInRange(props.date, highlighted);
  const endpoint = isRangeEndpoint(props.date, highlighted);
  const isStart = highlighted && isSameDay(props.date, highlighted.start);
  const isEnd = highlighted && isSameDay(props.date, highlighted.end);
  const hidden = cell.isOutsideVisibleRange || cell.isDisabled;

  const showBand = inRange && !hidden;
  const bandOnly = showBand && !endpoint;
  const bandStart = showBand && isStart && !isEnd;
  const bandEnd = showBand && isEnd && !isStart;

  return (
    <td
      {...cell.cellProps}
      className={cn(
        'relative p-0',
        bandOnly && 'bg-accent/10',
        bandStart && 'bg-gradient-to-l from-accent/10 from-50% to-transparent to-50%',
        bandEnd && 'bg-gradient-to-r from-accent/10 from-50% to-transparent to-50%',
      )}
    >
      <button
        {...cell.buttonProps}
        ref={ref}
        className={cn(
          'relative size-9 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          hidden && 'text-text-tertiary/20 cursor-default',
          !hidden && 'cursor-pointer',
          !cell.isSelected && !hidden && 'hover:bg-white/10',
          endpoint && !hidden && 'bg-accent text-white',
        )}
      >
        {cell.formattedDate}
        {props.dots && props.dots.length > 0 && !hidden && (
          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-px">
            {props.dots.map((sport, i) => (
              <span
                key={i}
                className={cn(
                  'size-1 rounded-full',
                  endpoint ? 'bg-white/70' : sportDotBgClass[sport],
                )}
              />
            ))}
          </span>
        )}
      </button>
    </td>
  );
};

const CalendarGrid = (props: {
  state: RangeCalendarState;
  startDate?: CalendarDate;
  activityDots?: Map<string, Sport[]>;
}) => {
  const gridArgs = props.startDate ? { startDate: props.startDate } : {};
  const grid = useCalendarGrid(gridArgs, props.state);

  return (
    <table {...grid.gridProps} className="w-full border-collapse">
      <thead {...grid.headerProps}>
        <tr>
          {grid.weekDays.map((day, i) => (
            <th key={i} className="pb-2 text-xs font-medium text-text-tertiary text-center">
              {day}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...Array(FIXED_WEEKS).keys()].map((weekIndex) => {
          const dates = props.state.getDatesInWeek(weekIndex, props.startDate);
          const isEmpty = dates.every((d) => d === null);

          if (isEmpty) {
            return (
              <tr key={weekIndex} aria-hidden="true">
                {Array.from({ length: 7 }, (_, i) => (
                  <td key={i}>
                    <div className="size-9" />
                  </td>
                ))}
              </tr>
            );
          }

          return (
            <tr key={weekIndex}>
              {dates.map((date, i) =>
                date ? (
                  <CalendarCell
                    key={i}
                    date={date}
                    state={props.state}
                    dots={props.activityDots?.get(date.toString())}
                  />
                ) : (
                  <td key={i} />
                ),
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export const RangeCalendar = (props: RangeCalendarProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const locale = getLocale();

  const state = useRangeCalendarState({
    value: props.value,
    onChange: props.onChange,
    minValue: props.minValue,
    maxValue: props.maxValue,
    defaultFocusedValue: props.defaultFocusedValue,
    locale,
    createCalendar,
  });

  const calendar = useRangeCalendar(
    {
      value: props.value,
      onChange: props.onChange,
      minValue: props.minValue,
      maxValue: props.maxValue,
      defaultFocusedValue: props.defaultFocusedValue,
    },
    state,
    ref,
  );

  const focusedMonth = state.focusedDate.month;
  const focusedYear = state.focusedDate.year;

  const months = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { month: 'long' });
    return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(2000, i)));
  }, [locale]);

  const handleMonthChange = (month: string) => {
    state.setFocusedDate(state.focusedDate.set({ month: Number(month) }));
  };

  const handleYearChange = (year: string) => {
    state.setFocusedDate(state.focusedDate.set({ year: Number(year) }));
  };

  return (
    <div {...calendar.calendarProps} ref={ref}>
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SelectRoot value={String(focusedMonth)} onValueChange={handleMonthChange}>
            <SelectTrigger className="h-8 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((name, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
          {props.years && props.years.length > 0 && (
            <SelectRoot value={String(focusedYear)} onValueChange={handleYearChange}>
              <SelectTrigger className="h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {props.years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          )}
        </div>
        <div className="flex items-center gap-1">
          <NavButton ariaProps={calendar.prevButtonProps}>
            <ChevronLeft size={16} />
          </NavButton>
          <NavButton ariaProps={calendar.nextButtonProps}>
            <ChevronRight size={16} />
          </NavButton>
        </div>
      </header>
      <CalendarGrid state={state} activityDots={props.activityDots} />
    </div>
  );
};

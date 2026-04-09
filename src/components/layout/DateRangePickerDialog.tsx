import { useMemo, useRef, useState } from 'react';
import { today, getLocalTimeZone, parseDate, CalendarDate } from '@internationalized/date';
import { m } from '@/paraglide/messages.js';
import { DialogRoot, DialogContent, DialogTitle } from '@/components/ui/Dialog.tsx';
import { RangeCalendar } from '@/components/ui/Calendar.tsx';
import type { DateRange } from '@/components/ui/Calendar.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { useFiltersStore } from '@/store/filters.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { toDateString } from '@/lib/formatters.ts';
import type { Sport } from '@/packages/engine/types.ts';

interface DateRangePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const todayDate = () => today(getLocalTimeZone());

const getStoredRange = (): DateRange | null => {
  const customRange = useFiltersStore.getState().customRange;
  if (customRange) {
    return { start: parseDate(customRange.from), end: parseDate(customRange.to) };
  }
  return null;
};

export const DateRangePickerDialog = (props: DateRangePickerDialogProps) => {
  const [range, setRange] = useState<DateRange | null>(null);
  const initialFocusRef = useRef(todayDate());
  const sessions = useSessionsStore((s) => s.sessions);

  const { activityDots, years, minYear } = useMemo(() => {
    const dots = new Map<string, Sport[]>();
    let min = new Date().getFullYear();
    const yearSet = new Set<number>([min]);

    for (const session of sessions) {
      if (session.isPlanned) {
        continue;
      }
      const key = toDateString(session.date);
      const existing = dots.get(key);
      if (existing) {
        if (!existing.includes(session.sport)) {
          existing.push(session.sport);
        }
      } else {
        dots.set(key, [session.sport]);
      }
      const y = new Date(session.date).getFullYear();
      yearSet.add(y);
      if (y < min) {
        min = y;
      }
    }

    return {
      activityDots: dots,
      years: [...yearSet].sort((a, b) => b - a),
      minYear: min,
    };
  }, [sessions]);

  const minValue = useMemo(() => new CalendarDate(minYear, 1, 1), [minYear]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      const stored = getStoredRange();
      setRange(stored);
      initialFocusRef.current = stored ? stored.start : todayDate();
    }
    props.onOpenChange(open);
  };

  const handleApply = () => {
    if (range) {
      useFiltersStore.getState().setCustomDateRange(range.start.toString(), range.end.toString());
    }
    props.onOpenChange(false);
  };

  return (
    <DialogRoot open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogTitle>{m.ui_date_range_title()}</DialogTitle>
        <div className="mt-2">
          <RangeCalendar
            value={range}
            onChange={setRange}
            minValue={minValue}
            maxValue={todayDate()}
            defaultFocusedValue={initialFocusRef.current}
            activityDots={activityDots}
            years={years}
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => props.onOpenChange(false)}>
            {m.ui_btn_cancel()}
          </Button>
          <Button disabled={!range} onClick={handleApply}>
            {m.ui_btn_apply()}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  );
};

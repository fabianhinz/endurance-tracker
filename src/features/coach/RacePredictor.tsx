import { m } from '@/paraglide/messages.js';
import type { RaceDistance } from '@/engine/types.ts';
import { RACE_DISTANCE_METERS } from '@/engine/vdot.ts';
import { DISTANCE_OPTIONS, usesLongFormat } from '@/lib/raceTime.ts';
import { formatPaceInput, formatRaceTime } from '@/lib/utils.ts';
import { useRacePredictor } from '@/features/coach/hooks/useRacePredictor.ts';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Label } from '@/components/ui/Label.tsx';
import { List, ListItem } from '@/components/ui/List.tsx';
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select.tsx';
import { MetricLabel } from '@/components/ui/MetricLabel.tsx';
import { METRIC_EXPLANATIONS } from '@/lib/explanations.ts';
import { glassClass } from '@/components/ui/Card.tsx';
import { cn } from '@/lib/utils.ts';

const DISTANCE_KEYS = Object.keys(RACE_DISTANCE_METERS) as RaceDistance[];

export const RacePredictor = () => {
  const predictor = useRacePredictor();

  return (
    <Card>
      <CardHeader title={m.ui_coach_predictor_title()} subtitle={m.ui_coach_predictor_subtitle()} />

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{m.ui_pace_est_distance()}</Label>
            <SelectRoot value={predictor.distance} onValueChange={predictor.handleDistanceChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISTANCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </div>

          <div>
            <Label>{m.ui_pace_est_race_time_short()}</Label>
            <Input
              type="text"
              placeholder={usesLongFormat(predictor.distance) ? '1:45:00' : '20:00'}
              helperText={usesLongFormat(predictor.distance) ? 'h:mm:ss' : 'mm:ss'}
              value={predictor.timeInput}
              onChange={(e) => predictor.setTimeInput(e.target.value)}
            />
          </div>
        </div>

        <div className={cn(glassClass, 'rounded-2xl shadow-lg overflow-hidden')}>
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="text-text-tertiary text-xs">
                <th className="px-3 py-2 text-left font-medium">
                  {m.ui_coach_predictor_distance()}
                </th>
                <th className="px-3 py-2 text-right font-medium">{m.ui_coach_predictor_time()}</th>
                <th className="px-3 py-2 text-right font-medium">{m.ui_coach_predictor_pace()}</th>
              </tr>
            </thead>
            <tbody>
              {DISTANCE_KEYS.map((key) => {
                const pred = predictor.predictions?.[key];
                return (
                  <tr key={key}>
                    <td className="px-3 py-1.5 font-medium">
                      {DISTANCE_OPTIONS.find((opt) => opt.value === key)?.label}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      {pred ? formatRaceTime(pred.timeSeconds) : '--'}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      {pred ? `${formatPaceInput(pred.paceSecPerKm)} /km` : '--'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <List>
          <ListItem
            primary={
              <span className="inline-flex items-center gap-1">
                VDOT <MetricLabel metricId="vdot" size="sm" contextLabel="VDOT" />
              </span>
            }
            secondary={METRIC_EXPLANATIONS.vdot.oneLiner}
          >
            {predictor.vdot?.toFixed(1) ?? '--'}
          </ListItem>
        </List>
      </div>
    </Card>
  );
};

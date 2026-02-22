import { useState, useTransition } from 'react';
import type { Gender } from '../../types/index.ts';
import { useUserStore } from '../../store/user.ts';
import { Input } from '../../components/ui/Input.tsx';
import { Label } from '../../components/ui/Label.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { CardHeader } from '../../components/ui/CardHeader.tsx';
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/Select.tsx';
import { parsePaceInput, formatPaceInput } from '../../lib/utils.ts';

export const ThresholdsSection = () => {
  const profile = useUserStore((s) => s.profile);
  const updateThresholds = useUserStore((s) => s.updateThresholds);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const [, startTransition] = useTransition();

  const thresholds = profile?.thresholds;

  const [restHr, setRestHr] = useState(String(thresholds?.restHr ?? ''));
  const [maxHr, setMaxHr] = useState(String(thresholds?.maxHr ?? ''));
  const [ftp, setFtp] = useState(String(thresholds?.ftp ?? ''));
  const [thresholdPace, setThresholdPace] = useState(
    thresholds?.thresholdPace ? formatPaceInput(thresholds.thresholdPace) : '',
  );

  const [restHrError, setRestHrError] = useState('');
  const [maxHrError, setMaxHrError] = useState('');
  const [ftpError, setFtpError] = useState('');
  const [thresholdPaceError, setThresholdPaceError] = useState('');

  const save = (field: 'restHr' | 'maxHr' | 'ftp', value: string) => {
    const current = { ...thresholds! };
    const num = Number(value);

    const constraints: Record<string, { min: number; max: number; minLabel: string; maxLabel: string; setError: (e: string) => void }> = {
      restHr: { min: 30, max: 100, minLabel: 'Min 30 bpm', maxLabel: 'Max 100 bpm', setError: setRestHrError },
      maxHr: { min: 120, max: 230, minLabel: 'Min 120 bpm', maxLabel: 'Max 230 bpm', setError: setMaxHrError },
      ftp: { min: 50, max: 500, minLabel: 'Min 50W', maxLabel: 'Max 500W', setError: setFtpError },
    };

    const c = constraints[field];

    if (field === 'ftp') {
      if (!value) {
        c.setError('');
        current[field] = undefined;
        startTransition(() => updateThresholds(current));
        return;
      }
    }

    if (!value || isNaN(num)) {
      c.setError('Required');
      return;
    }
    if (num < c.min) { c.setError(c.minLabel); return; }
    if (num > c.max) { c.setError(c.maxLabel); return; }

    if (field === 'maxHr' && num <= (Number(restHr) || 0)) {
      c.setError('Max HR must be greater than resting HR');
      return;
    }
    if (field === 'restHr' && (Number(maxHr) || Infinity) <= num) {
      c.setError('Resting HR must be less than max HR');
      return;
    }

    c.setError('');

    if (field === 'ftp') {
      current[field] = num;
    } else {
      (current as Record<string, number>)[field] = num;
    }

    startTransition(() => updateThresholds(current));
  };

  const saveThresholdPace = (value: string) => {
    const current = { ...thresholds! };

    if (!value) {
      setThresholdPaceError('');
      current.thresholdPace = undefined;
      startTransition(() => updateThresholds(current));
      return;
    }

    const parsed = parsePaceInput(value);
    if (parsed === undefined) {
      setThresholdPaceError('Format: m:ss (2:30-9:00)');
      return;
    }

    setThresholdPaceError('');
    current.thresholdPace = parsed;
    startTransition(() => updateThresholds(current));
  };

  return (
    <Card>
      <CardHeader title="Thresholds" />

      <div className="space-y-4">
        <div>
          <Label>Gender</Label>
          <SelectRoot
            value={profile?.gender ?? 'male'}
            onValueChange={(v) => startTransition(() => updateProfile({ gender: v as Gender }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </SelectRoot>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="thresh-restHr">Resting HR (bpm)</Label>
            <Input
              id="thresh-restHr"
              type="number"
              value={restHr}
              onChange={(e) => setRestHr(e.target.value)}
              onBlur={() => save('restHr', restHr)}
              error={restHrError}
            />
          </div>
          <div>
            <Label htmlFor="thresh-maxHr">Max HR (bpm)</Label>
            <Input
              id="thresh-maxHr"
              type="number"
              value={maxHr}
              onChange={(e) => setMaxHr(e.target.value)}
              onBlur={() => save('maxHr', maxHr)}
              error={maxHrError}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="thresh-ftp">FTP (watts)</Label>
            <Input
              id="thresh-ftp"
              type="number"
              value={ftp}
              onChange={(e) => setFtp(e.target.value)}
              onBlur={() => save('ftp', ftp)}
              error={ftpError}
            />
          </div>
          <div>
            <Label htmlFor="thresh-pace">Threshold Pace (min/km)</Label>
            <Input
              id="thresh-pace"
              type="text"
              placeholder="4:30"
              value={thresholdPace}
              onChange={(e) => setThresholdPace(e.target.value)}
              onBlur={() => saveThresholdPace(thresholdPace)}
              error={thresholdPaceError}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

import { useState, useMemo } from 'react';
import { parsePaceInput, formatPaceInput } from '@/lib/utils.ts';
import {
  timeFromPaceAndDistance,
  paceFromDistanceAndTime,
  distanceFromPaceAndTime,
} from '@/engine/paceCalculator.ts';

type Field = 'pace' | 'distance' | 'time';

const parseTime = (input: string): number | undefined => {
  const match = input.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if (!match) return undefined;
  const h = Number(match[1]);
  const m = Number(match[2]);
  const s = Number(match[3]);
  if (m >= 60 || s >= 60) return undefined;
  const total = h * 3600 + m * 60 + s;
  if (total > 0) {
    return total;
  }
  return undefined;
};

const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const usePaceCalculator = () => {
  const [paceInput, setPaceInput] = useState('');
  const [distanceInput, setDistanceInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [solveFor, setSolveFor] = useState<Field>('time');

  const computed = useMemo(() => {
    const pace = parsePaceInput(paceInput);
    let distance: number | undefined = undefined;
    if (distanceInput) {
      distance = Number(distanceInput) * 1000;
    }
    const time = parseTime(timeInput);

    if (solveFor === 'time' && pace !== undefined && distance !== undefined && distance > 0) {
      return { value: formatTime(timeFromPaceAndDistance(pace, distance)) };
    }
    if (solveFor === 'pace' && distance !== undefined && distance > 0 && time !== undefined) {
      return { value: formatPaceInput(paceFromDistanceAndTime(distance, time)) };
    }
    if (solveFor === 'distance' && pace !== undefined && pace > 0 && time !== undefined) {
      return { value: (distanceFromPaceAndTime(pace, time) / 1000).toFixed(2) };
    }
    return undefined;
  }, [paceInput, distanceInput, timeInput, solveFor]);

  return {
    paceInput,
    distanceInput,
    timeInput,
    computed,
    solveFor,
    setSolveFor,
    handlePaceChange: setPaceInput,
    handleDistanceChange: setDistanceInput,
    handleTimeChange: setTimeInput,
  };
};

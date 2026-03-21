import { useMemo } from 'react';
import { useUserStore } from '@/store/user.ts';
import {
  computeHrZoneDistribution,
  computePowerZoneDistribution,
  computePaceZoneDistribution,
} from '@/packages/engine/zoneDistribution.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';
import type { ZoneColorMode } from '@/features/map/zoneColoredPath.ts';

export const useZoneData = (records: SessionRecord[], isRunning: boolean) => {
  const profile = useUserStore((s) => s.profile);

  const hrZoneData = useMemo(() => {
    const thresholds = profile?.thresholds;
    if (!thresholds?.maxHr || !thresholds?.restHr) return [];
    return computeHrZoneDistribution(records, thresholds.maxHr, thresholds.restHr);
  }, [records, profile?.thresholds]);

  const powerZoneData = useMemo(() => {
    const ftp = profile?.thresholds?.ftp;
    if (!ftp) return [];
    return computePowerZoneDistribution(records, ftp);
  }, [records, profile?.thresholds?.ftp]);

  const paceZoneData = useMemo(() => {
    const thresholdPace = profile?.thresholds?.thresholdPace;
    if (!thresholdPace || !isRunning) return [];
    return computePaceZoneDistribution(records, thresholdPace);
  }, [records, profile?.thresholds?.thresholdPace, isRunning]);

  const availableModes = useMemo(() => {
    const modes: ZoneColorMode[] = [];
    if (hrZoneData.length > 0) modes.push('hr');
    if (powerZoneData.length > 0) modes.push('power');
    if (paceZoneData.length > 0) modes.push('pace');
    return modes;
  }, [hrZoneData, powerZoneData, paceZoneData]);

  return { hrZoneData, powerZoneData, paceZoneData, availableModes };
};

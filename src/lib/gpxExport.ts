import { buildGpxString } from '@/packages/gpx/buildGpx.ts';
import { isValidCoordinate } from '@/packages/engine/gps.ts';
import type { TrainingSession, SessionRecord } from '@/packages/engine/types.ts';
import type { GpxPoint } from '@/packages/gpx/buildGpx.ts';

export const buildSessionGpx = (
  session: TrainingSession,
  records: SessionRecord[],
): string | null => {
  const points = records.reduce<GpxPoint[]>((acc, r) => {
    if (isValidCoordinate(r)) {
      acc.push({
        lat: r.lat!,
        lon: r.lng!,
        ele: r.elevation,
        time: new Date(session.date + r.timestamp * 1000),
      });
    }
    return acc;
  }, []);

  return buildGpxString(points, {
    name: session.name,
    time: new Date(session.date),
  });
};

import { buildGpxString } from '@/packages/gpx/buildGpx.ts';
import { simplifyGpxPoints } from '@/packages/gpx/simplifyGpxPoints.ts';
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

  const simplified = simplifyGpxPoints(points);

  return buildGpxString(simplified, {
    name: session.name,
    time: new Date(session.date),
  });
};

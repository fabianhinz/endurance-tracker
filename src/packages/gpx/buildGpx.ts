export interface GpxPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: Date;
}

export interface GpxMetadata {
  name?: string;
  time?: Date;
}

const escapeXml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const buildGpxString = (points: GpxPoint[], metadata?: GpxMetadata): string | null => {
  if (points.length < 2) return null;

  const parts: string[] = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push('<gpx version="1.1" creator="PaceVault" xmlns="http://www.topografix.com/GPX/1/1">');

  if (metadata) {
    parts.push('<metadata>');
    if (metadata.name) {
      parts.push(`<name>${escapeXml(metadata.name)}</name>`);
    }
    if (metadata.time) {
      parts.push(`<time>${metadata.time.toISOString()}</time>`);
    }
    parts.push('</metadata>');
  }

  parts.push('<trk><trkseg>');

  for (const p of points) {
    parts.push(`<trkpt lat="${p.lat}" lon="${p.lon}">`);
    if (p.ele != null) {
      parts.push(`<ele>${p.ele}</ele>`);
    }
    if (p.time) {
      parts.push(`<time>${p.time.toISOString()}</time>`);
    }
    parts.push('</trkpt>');
  }

  parts.push('</trkseg></trk>');
  parts.push('</gpx>');

  return parts.join('');
};

export const buildGpxFilename = (sport: string, dateMs: number): string => {
  const date = new Date(dateMs).toISOString().slice(0, 10);
  const sportLabel = sport.charAt(0).toUpperCase() + sport.slice(1);
  return `PaceVault_${sportLabel}_${date}.gpx`;
};

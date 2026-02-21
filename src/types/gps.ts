export interface GPSPoint {
  lat: number;
  lng: number;
}

export interface GPSBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface SessionGPS {
  sessionId: string;
  encodedPolyline: string;
  pointCount: number;
  bounds: GPSBounds;
}

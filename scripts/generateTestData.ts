/**
 * Standalone Node script to generate Munich routes via OSRM demo API.
 * Run once with: pnpm generate-test-data
 * Output: public/testData.json
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const OSRM_BASE = 'https://router.project-osrm.org/route/v1';

type RouteConfig = {
  name: string;
  profile: 'foot' | 'bike';
  waypoints: Array<[number, number]>; // [lng, lat]
};

// Home: Glockenbach/Sendling area near Goetheplatz
const HOME: [number, number] = [11.565, 48.125];

const ROUTE_CONFIGS: RouteConfig[] = [
  // --- Running (foot) — circular loops from home ---
  {
    name: 'Isar South Loop',
    profile: 'foot',
    waypoints: [HOME, [11.579, 48.12], [11.575, 48.11], [11.56, 48.115], HOME],
  },
  {
    name: 'Isar North Loop',
    profile: 'foot',
    waypoints: [HOME, [11.58, 48.128], [11.583, 48.135], [11.575, 48.138], [11.568, 48.132], HOME],
  },
  {
    name: 'Westpark Loop',
    profile: 'foot',
    waypoints: [HOME, [11.545, 48.118], [11.53, 48.112], [11.54, 48.108], [11.555, 48.118], HOME],
  },
  {
    name: 'Theresienwiese–Marienplatz Loop',
    profile: 'foot',
    waypoints: [HOME, [11.555, 48.132], [11.57, 48.138], [11.576, 48.137], [11.572, 48.13], HOME],
  },
  {
    name: 'Big Isar Loop',
    profile: 'foot',
    waypoints: [
      HOME,
      [11.579, 48.12],
      [11.575, 48.105],
      [11.557, 48.099],
      [11.545, 48.11],
      [11.555, 48.12],
      HOME,
    ],
  },

  // --- Cycling (bike) — expanding loops from home ---
  {
    name: 'North Loop — Schwabing/Garching',
    profile: 'bike',
    waypoints: [HOME, [11.575, 48.165], [11.65, 48.25], [11.68, 48.22], [11.63, 48.155], HOME],
  },
  {
    name: 'South Loop — Grünwald/Pullach',
    profile: 'bike',
    waypoints: [HOME, [11.575, 48.1], [11.53, 48.05], [11.49, 48.06], [11.51, 48.1], HOME],
  },
  {
    name: 'West Loop — Nymphenburg/Dachau',
    profile: 'bike',
    waypoints: [HOME, [11.505, 48.158], [11.435, 48.26], [11.53, 48.25], [11.575, 48.17], HOME],
  },
  {
    name: 'East Loop — Riem/Markt Schwaben',
    profile: 'bike',
    waypoints: [
      HOME,
      [11.63, 48.135],
      [11.72, 48.14],
      [11.75, 48.11],
      [11.68, 48.095],
      [11.6, 48.11],
      HOME,
    ],
  },
  {
    name: 'Long South — Starnberger See',
    profile: 'bike',
    waypoints: [
      HOME,
      [11.53, 48.08],
      [11.35, 47.91],
      [11.3, 47.95],
      [11.4, 48.04],
      [11.5, 48.1],
      HOME,
    ],
  },
];

type RouteResult = {
  name: string;
  polyline: string;
  distanceM: number;
};

const fetchRoute = async (config: RouteConfig): Promise<RouteResult> => {
  const coords = config.waypoints.map(([lng, lat]) => `${lng},${lat}`).join(';');
  const url = `${OSRM_BASE}/${config.profile}/${coords}?overview=full&geometries=polyline`;

  console.log(`Fetching: ${config.name} (${config.profile})...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM error ${res.status} for ${config.name}`);

  const data = (await res.json()) as {
    routes: Array<{ geometry: string; distance: number }>;
  };
  if (!data.routes || data.routes.length === 0) throw new Error(`No routes for ${config.name}`);

  const route = data.routes[0];
  return {
    name: config.name,
    polyline: route.geometry,
    distanceM: Math.round(route.distance),
  };
};

const main = async () => {
  const running: RouteResult[] = [];
  const cycling: RouteResult[] = [];

  for (const config of ROUTE_CONFIGS) {
    // Small delay to be polite to the demo server
    await new Promise((r) => setTimeout(r, 500));
    const result = await fetchRoute(config);
    if (config.profile === 'foot') {
      running.push(result);
    } else {
      cycling.push(result);
    }
  }

  const output = { running, cycling };
  const outPath = resolve(__dirname, '..', 'public', 'testData.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
  console.log(`\nWrote ${running.length} running + ${cycling.length} cycling routes to ${outPath}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

# Forge

*Your training. Your device. Your edge.*

A local-first endurance training tracker built entirely in the browser. Import Garmin .FIT files, track training load with the Banister impulse-response model, detect personal bests, plan tapers, and get coaching recommendations — all without a server.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Build | Vite 7, TypeScript 5.9 strict |
| Framework | React 19 |
| Routing | React Router v7 |
| UI | Radix primitives, Tailwind v4, dark mode only |
| State | Zustand (persisted to IndexedDB) |
| Forms | React Hook Form + Zod v4 |
| Charts | Recharts |
| File parsing | fit-file-parser (.FIT binaries) |
| Storage | IndexedDB via `idb` (no localStorage, no server) |

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Type-check and build for production |
| `pnpm test` | Run tests (vitest) |
| `pnpm lint` | Lint with ESLint |
| `pnpm typecheck` | Type-check with tsc |
| `pnpm preview` | Preview production build |

## Project Structure

```
src/
├── components/
│   ├── layout/          # AppLayout, Sidebar, Header
│   └── ui/              # Radix-wrapped primitives (Button, Card, Dialog, …)
├── engine/              # Pure business logic (no React, no state)
│   ├── coaching.ts      # Training recommendations (TSB/ACWR thresholds)
│   ├── defaults.ts      # Default profile factory
│   ├── efficiency.ts    # Aerobic efficiency & decoupling
│   ├── metrics.ts       # Banister model (CTL/ATL/TSB/ACWR)
│   ├── normalize.ts     # Normalized power, grade-adjusted pace
│   ├── records.ts       # Personal best detection (rolling windows)
│   ├── stress.ts        # TSS & TRIMP calculation
│   ├── taper.ts         # Race taper projection
│   └── validation.ts    # Sensor data quality checks
├── features/
│   ├── dashboard/       # Dashboard page
│   ├── planning/        # Race planning & ghost sessions
│   ├── settings/        # Profile, thresholds, data management
│   └── training/        # Session list & detail pages
├── lib/
│   ├── db.ts            # Typed IDB schema & singleton connection
│   ├── idb-storage.ts   # Zustand StateStorage adapter for IndexedDB
│   ├── indexeddb.ts      # Session records CRUD (time-series data)
│   ├── migrate-storage.ts # One-time localStorage → IDB migration
│   ├── use-hydrated.ts  # Async hydration gate hook
│   └── utils.ts         # cn(), formatters
├── parsers/
│   └── fit.ts           # .FIT file parser → session + records
├── store/               # Zustand stores (user, sessions, notifications)
└── types/               # Shared TypeScript interfaces
```

## Storage Architecture

All data lives in IndexedDB via the `idb` package:

- **`session-records`** store: time-series data from .FIT files (HR, power, cadence, GPS, etc.)
- **`kv`** store: Zustand-persisted state (user profile, training sessions, personal bests)

No data leaves the browser. Export/import is available as JSON from the Settings page.

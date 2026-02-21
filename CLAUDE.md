# Forge

Client-side only SPA. No server, no APIs, no `fetch`/`axios`.

## Stack

| Layer           | Choice                                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build           | Vite 7 + `@tailwindcss/vite`                                                                                                                                                                |
| Framework       | React 19, TypeScript 5.9 strict                                                                                                                                                             |
| Routing         | React Router v7 (`<Routes>`, `<Route>`, `<BrowserRouter>`)                                                                                                                                  |
| UI              | `@radix-ui/*` primitives wrapped in `src/components/ui/`, styled with Tailwind v4. Dark mode only. Use `clsx` + `tailwind-merge` via `cn()`. No component libraries (no MUI, AntD, Shadcn). |
| State           | Zustand (`persist` middleware) for global state                                                                                                                                             |
| Charts          | Recharts                                                                                                                                                                                    |
| File parsing    | `fit-file-parser` for .FIT binaries                                                                                                                                                         |
| Icons           | `lucide-react`                                                                                                                                                                              |
| Storage         | IndexedDB via `idb` — `kv` store for Zustand persist, `session-records` store for time-series (`src/lib/db.ts`)                                                                             |
| Package manager | **pnpm** (`pnpm add`, `pnpm dev`, `pnpm build`, etc.)                                                                                                                                       |

## Architecture Rules

- **Local-first**: browser is the database. IDs via `crypto.randomUUID()`. Never call external APIs.
- **Pure engine**: all business logic lives in `src/engine/` as pure functions — no React, no state imports.
- **Headless UI**: import Radix primitive → wrap in `src/components/ui/` → style with Tailwind.
- **Reuse UI components**: before inlining layout or UI patterns in feature code, check `src/components/ui/` for existing components (`CardHeader`, `SettingToggle`, `ValueSkeleton`, etc.). Extract new shared components when a pattern appears in 2+ places.
- **Named exports only** everywhere.
- **Arrow functions only**: never use the `function` keyword — use arrow functions (`const fn = () => {}`) everywhere.
- **No object destructuring** for component props and hook return values — access via `props.x` and `result.x` instead.

## Dev Workflow

> create a new branch for every feature. Once approved by the user merge it into main

```bash
pnpm test          # vitest run — must pass
pnpm lint --fix    # eslint — must pass
pnpm typecheck     # tsc --noEmit — must pass
```

- Write tests for new functionality: happy path, edge cases, error conditions.
- Test files go in `tests/` with `*.integration.test.ts` or `*.spec.ts` naming.
- You might need to update the README

## Testing Strategy

- **Engine & lib** (`src/engine/`, `src/lib/`): tests required for every change. Cover happy path, edge cases, error conditions.
- **Stores** (`src/store/`): tests required for state transitions, persistence, and derived computations.
- **UI components**: no unit tests. Bugs here are caught visually, not by render tests.
- **Integration tests**: required when wiring new cross-layer flows (e.g., file import → engine → store → recomputation).

# Forge

**WHY:** Forge is a local-first, Progressive Web App (PWA) designed for mapping, analyzing, and storing fitness/GPS activities (primarily parsing `.FIT` binaries).
**WHAT:** A pure client-side SPA. There is no backend server, no external APIs to call, and no `fetch`/`axios`. The browser _is_ the database.

## 1. Tech Stack

| Layer           | Choice                                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build & PWA     | Vite 7 + `@tailwindcss/vite` + `vite-plugin-pwa`                                                                                                                                            |
| Framework       | React 19, TypeScript 5.9 strict                                                                                                                                                             |
| Routing         | React Router v7 (`<Routes>`, `<Route>`, `<BrowserRouter>`)                                                                                                                                  |
| UI              | `@radix-ui/*` primitives wrapped in `src/components/ui/`, styled with Tailwind v4. Dark mode only. Use `clsx` + `tailwind-merge` via `cn()`. No component libraries (no MUI, AntD, Shadcn). |
| Mapping / GIS   | `deck.gl` (core, layers, mapbox), `maplibre-gl`, `react-map-gl`, `@googlemaps/polyline-codec`                                                                                               |
| State           | Zustand (`persist` middleware) for global state                                                                                                                                             |
| Data Vis        | Recharts                                                                                                                                                                                    |
| Icons           | `lucide-react`                                                                                                                                                                              |
| File parsing    | `fit-file-parser` for .FIT binaries                                                                                                                                                         |
| Storage         | IndexedDB via `idb` — `kv` store for Zustand persist, `session-records` store for time-series (`src/lib/db.ts`)                                                                             |
| Package manager | **pnpm** (`pnpm add`, `pnpm dev`, `pnpm build`, etc.)                                                                                                                                       |

## 2. Core Architecture Rules

- **Local-first absolute rule**: IDs are generated via `crypto.randomUUID()`. Never attempt to call an external API.
- **Pure engine**: All business logic lives in `src/engine/` as pure functions — absolutely no React or state imports in this directory.
- **Headless UI**: Import Radix primitive → wrap in `src/components/ui/` → style with Tailwind.
- **Reuse UI components**: Before inlining layout or UI patterns in feature code, check `src/components/ui/` for existing components (`CardHeader`, `SettingToggle`, `ValueSkeleton`, etc.). Extract new shared components when a pattern appears in 2+ places.
- **Named exports only**: Use named exports everywhere.
- **Arrow functions only**: Never use the `function` keyword — use arrow functions (`const fn = () => {}`) everywhere.
- **No object destructuring** for component props and hook return values — access via `props.x` and `result.x` instead.
- **Delete dead code**: Exported but never-imported code should be removed immediately, not left around.
- **No `as any` for external data**: Use Zod schemas with `safeParse` + `z.infer` to validate and type data from untyped sources (file parsers, IndexedDB, etc.). Schemas live next to the parser/consumer (e.g. `fitSchemas.ts`). On failure: return a safe fallback (`undefined`, `[]`), never throw.
- **Syntax & Formatting**: Defer to ESLint and Prettier. Do not waste time manually formatting code or enforcing linting rules; focus on logic.

## 3. File Naming Conventions

| Category | Convention | Example |
|---|---|---|
| React components | PascalCase | `SessionDetail.tsx`, `ChartPreview.tsx` |
| Hooks | camelCase with `use` prefix | `useChartZoom.ts`, `useDeckLayers.ts` |
| Stores | camelCase | `toastStore.ts`, `mapFocus.ts` |
| Engine modules | camelCase | `trainingEffect.ts`, `zoneDistribution.ts` |
| Lib utilities | camelCase | `chartData.ts`, `timeRange.ts` |
| Tests | Match source name + `.spec.ts` / `.integration.test.ts` | `trainingEffect.spec.ts` |
| Web Workers | camelCase | `gpsBuild.worker.ts` |

- Feature hooks live in `src/features/<feature>/hooks/`
- Shared hooks live in `src/lib/hooks/`
- No kebab-case for TypeScript files.

## 4. Directory Structure & Deep Context (Progressive Disclosure)

Specific guidelines for features, testing, and state management are located in their respective directories. Read these files when working in these areas:

- `@src/features/CLAUDE.md`: Rules for feature-level hooks and store colocation.
- `@src/store/CLAUDE.md`: Rules for Zustand store scope-naming and persist middleware.
- `@tests/CLAUDE.md`: The testing strategy (Engine/Lib vs. Integration vs. UI).

## 5. Dev Workflow & Actionable Verification

> **Plan first, then build.** Create a new branch for every feature or bug fix.

1. **Plan**: Write a plan in `./plans/<feature-name>.md` detailing context, approach, files to modify, and verification steps. Review with the user before writing code.
2. **Implement**: Write the code and the corresponding tests (happy path, edge cases, error conditions).
3. **Verify**: Run the following suite:
   ```bash
   pnpm test          # vitest run
   pnpm lint --fix    # eslint
   pnpm typecheck     # tsc --noEmit
   ```

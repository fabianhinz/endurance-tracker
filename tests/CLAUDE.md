# Testing Strategy

- **File Naming**: Test files must be placed in the `tests/` directory using `*.integration.test.ts` or `*.spec.ts` naming conventions.
- **Engine & Lib** (`src/engine/`, `src/lib/`): Tests are required for _every_ change. You must cover the happy path, edge cases, and error conditions.
- **Integration Tests**: Required when wiring new cross-layer flows (e.g., file import → engine → store → recomputation).
- **UI Components**: Absolutely NO unit tests for components. Bugs here are caught visually, not by React render tests.

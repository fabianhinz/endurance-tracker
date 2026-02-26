# Store & State Rules

- **Scope-clear store naming**: When store actions serve one specific feature, name them to reflect that exact scope (e.g., `setDashboardChartRange`, not `setCustomRange`).
- **Persistence**: We use Zustand's `persist` middleware backed by IndexedDB (via the `idb` kv store). Ensure any state requiring cross-session persistence is configured correctly.
- **Testing Requirement**: Tests are strictly required for all state transitions, persistence logic, and derived computations.

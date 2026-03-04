# Testing Guide

This project now ships with an initial Vitest-based suite focused on deterministic utilities and UI smoke checks. The goal is to provide a foundation for expanding coverage across the backend agent network services and the complex portal UI workflows.

## Tooling
- **Runner**: [Vitest](https://vitest.dev) with the Vite React plugin so component tests reuse the app's JSX/TSX pipeline.
- **DOM Environment**: `jsdom` + `@testing-library/react`/`user-event` for React assertions and event simulation.
- **Assertions**: `@testing-library/jest-dom` is loaded via `vitest.setup.ts`.
- **Crypto Polyfills**: Node's `webcrypto`, `TextEncoder`, and `TextDecoder` are attached to `globalThis` in `vitest.setup.ts` so browser-only helpers (e.g., `crypto.subtle.digest`) work in Node.

Run the suite with:

```bash
bun run test
```

`vitest.config.ts` also enables V8 coverage reporters. Generate coverage locally using:

```bash
bun x vitest run --coverage
```

## Implemented Tests
| Area | File | Notes |
| --- | --- | --- |
| Risk heuristics | `src/lib/riskHeuristics.test.ts` | Verifies each branch of `evaluateRisk`, ensuring the heuristics will not regress silently. |
| Portal API helpers | `src/services/portalApi.test.ts` | Exercises hashing determinism, authenticated login flows (with `fetch` mocked), and validates the mocked dashboard stats schema. |
| Marketing footer | `src/components/Footer.test.tsx` | Ensures the CTA renders branded copy and calls `onNavigate` for both the logo and mission button interactions. |
| Portal dashboard | `src/pages/portal/Dashboard.test.tsx` | Uses MSW to intercept `/api/projects`, `/api/history`, `/api/stats`, and `/api/analytics/links` so the dashboard can hydrate and expose saved threat thresholds via the UI. |
| Portal lens pipeline | `src/pages/portal/Lens.test.tsx` | Runs the strategic ingestion workflow end-to-end with MSW stubs and portalApi spies so the overlay progress indicators and button states remain stable without waiting on long timers. |
| Daily reports view | `src/pages/portal/DailyReports.test.tsx` | Confirms the marketing/reporting experience hydrates from `/api/admin/reports/daily` and `/api/rss`, ensuring RSS tickers and summaries render expected content. |
| Express API surface | `tests/server/api.test.ts` | Supertest drives `/api/search`, `/api/osint/shodan`, `/api/forge/analyze`, `/api/agent/investigate`, and `/api/auth/login`, with Gemini, Supabase, and external fetches mocked to assert both error handling and success flows. Requires allowing a local listener (run `bun run test` with elevated permissions when sandboxed). |

## Known Gaps / Next Targets
- **Remaining Express routes**: Reporting endpoints, org profiling flows, combinatorial analysis, and clip/graph management routes are still untested. Cover them with Supertest + mocks similar to the new suites.
- **React portal flows**: D3-heavy experiences (graph explorer, job correlation visuals) and automation surfaces (Forge, Shield) remain untested. Use Testing Library + MSW or targeted spies to capture their behavior.
- **Stateful hooks & stores**: Any shared hooks/utilities under `src/lib` or context providers (if introduced later) should gain unit tests once stabilized.
- **Strategy/graph persistence**: `strategy` imports + master graph mutations are not validated. When persistence layers solidify, add tests to guard deduplication logic in `updateMasterGraph`.

Expanding the suite in those areas will significantly increase confidence before integrating real data sources or deploying the autonomous agents.

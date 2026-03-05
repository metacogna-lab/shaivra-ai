# Repository Guidelines

## Project Structure & Module Organization
The Vite + Express monorepo lives at the root: `src/` hosts the React portal (components, pages, data, lib, portal/server helpers), while `src/server/**` powers API middleware, repositories, integrations, and services invoked from `server.ts`. Shared domain definitions live under `src/contracts` and `src/constants.ts`. Back-end persistence is defined in `prisma/schema.prisma` with migrations in `prisma/migrations`. Operational automations and intelligence skills live in `skills/`, agent workflows in `langgraph/`, infrastructure manifests in `infra/`, and high-level docs in `docs/` and `tasks/`. Tests sit in `tests/` and next to components such as `src/components/Footer.test.tsx`.

## Build, Test, and Development Commands
Run `bun install` for dependencies, then use:
- `bun run dev` – starts the Express + Vite pipeline through `server.ts`.
- `bun run build` – produces the production client bundle and regenerates Prisma types.
- `bun run preview` or `bun run start` – serve built assets for smoke-testing.
- `bun run lint` – type-checks the entire workspace via `tsc --noEmit`.
- `bun run test`, `bun run test:watch`, `bun run test:coverage` – execute the Vitest suite.  
Database flows use `bunx prisma generate`, `bunx prisma migrate deploy`, and `bun run db:studio`.

## Coding Style & Naming Conventions
TypeScript is mandatory across client and server. Components and hooks live in PascalCase files (e.g., `Navigation.tsx`), functions and variables use `camelCase`, and shared constants use `SCREAMING_SNAKE_CASE` in `constants.ts`. Prefer 2-space indentation, keep imports sorted (React, third-party, local), and colocate related UI assets within `src/components`. Tailwind-style utility classes plus the existing design tokens must remain untouched—compose new layouts through existing atoms in `src/components/ui`. Use explicit return types for exported functions and zod schemas to guard inputs.

## Design System Cardinal Rules
All UI or visual adjustments must comply with `docs/design-system.md` and the enforcement checklist in `tasks/agent-design-rules.md`. Reuse the existing palette, typography stack, background layers, button styles, and portal card patterns; do not introduce new colors, fonts, or layout primitives unless a deviation is recorded in `tasks/bridge.md`.

## Testing Guidelines
Vitest with `@testing-library/react` and `msw` drives both unit and integration coverage. Create `*.test.ts`/`*.test.tsx` files either in `tests/` for backend/service coverage or next to the component under test. Mock API calls via MSW handlers in `tests/mocks`. New features should include at least one behavior test proving the contract (e.g., queue orchestration or UI state transitions). Keep coverage near existing baselines by running `bun run test:coverage` locally before review.

## Commit & Pull Request Guidelines
Git history follows Conventional Commit prefixes (`fix:`, `chore:`, `docs:`). Mirror that style, referencing tickets or task IDs when relevant. Pull requests must include: concise summary, verification steps (commands executed), screenshots or Loom links for any UI-visible change, and links to related issues/specs. Highlight impacts to `server.ts`, Prisma schema, or external services so reviewers can trigger the appropriate integration tests or infra updates.

## Security & Configuration Tips
Secrets such as `GEMINI_API_KEY`, Supabase credentials, AWS/Redis settings, and database URLs belong only in `.env` or deployment targets; never check them in. Keep rate-limiters, CSRF middleware, and authentication guards enabled when adding routes under `/api`. For new tooling, extend the existing security middleware (`src/server/middleware/`) rather than bypassing it, and update `tasks/bridge.md` with any decision that affects compliance or agent coordination.

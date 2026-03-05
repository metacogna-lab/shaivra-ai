---
title: Shaivra Platform Overview
description: Understand the core layers, key workflows, and environment contracts that power the Shaivra Intelligence Suite.
sidebarTitle: Platform
badge: Stable
---

## Outcome
By the end of this guide you will know how the backend, portal, and OSINT subsystems interact, what env vars must be configured, and where to extend the current feature set.

:::info
Mintlify pages begin with the “why.” Keep summaries under three sentences so readers can decide if they should keep going.
:::

## Architecture Layers
| Layer | Description | Primary Files |
| --- | --- | --- |
| API Gateway | Express server hosting `/api/*` routes, Gemini orchestration, OSINT proxies, auth. | `server.ts` |
| Agent Network | `runAgentNetwork` loop coordinating Google GenAI calls and LangGraph-style reasoning. | `server.ts` lines 65-119 |
| Portal UI | React/Vite front-end housing Lens, Dashboard, Reports, and portal components. | `src/pages/portal/*`, `src/components/*` |
| Strategy & Plans | Operational docs plus `.plans/` backlog to guide implementation. | `.plans/*`, `docs/*` |

## Core Workflows
### 1. User Auth & Sessions
1. User hits `/api/auth/login` with email/password.
2. Supabase handles credential validation; a JWT is minted via `generateToken`.
3. Clients store the JWT (`auth_token`) locally and send it with subsequent requests to access portal routes.

### 2. Advanced Ingestion (Lens)
1. `/api/ingestion/advanced` accepts a comma-separated target list, project ID, and source filters.
2. The server prioritizes News + OSINT sources, prompts Gemini for recursive enrichment, and traces activity via LangSmith-style logs.
3. Results are streamed back to Lens, which visualizes each pipeline stage (ingestion → normalization → enrichment → clustering → LLM).

### 3. OSINT Proxies
- `/api/osint/shodan`, `/api/osint/alienvault`, `/api/osint/virustotal`, `/api/osint/fingerprint`, `/api/osint/maltego` act as thin wrappers around SDKs or Gemini prompts.
- New tooling (SpiderFoot, IntelOwl, OpenCTI) should be added behind these routes to diversify data sources, as described in `docs/osint.md`.

## Environment Contracts
| Variable | Purpose | Required |
| --- | --- | --- |
| `GEMINI_API_KEY` | Used by search, OSINT fingerprinting, Forge analysis, and agent loops. | Yes |
| `SHODAN_API_KEY` | Enables `/api/osint/shodan`. | Only if using Shodan |
| `ALIENVAULT_API_KEY` | Enables `/api/osint/alienvault`. | Optional |
| `VIRUSTOTAL_API_KEY` | Enables `/api/osint/virustotal`. | Optional |
| `LANGSMITH_API_KEY` | Traces AI actions if provided. | Optional |

Set these in `.env.local` (frontend) and `.env` (backend) before running `bun run dev`.

## Operational Tasks
### Run Locally
1. Install dependencies: `bun install`.
2. Copy `.env.example` ➜ `.env` and add required secrets.
3. Start the dev server: `bun run dev` (spawns Express + Vite).

### Validate Changes
1. Type-check: `bun run lint`.
2. Test suite: `bun run test` (requires elevated permissions for Supertest).
3. Build (optional): `bun run build`.

## Extension Backlog
- **Mintlify Migration**: Convert every doc into Mintlify MDX with the structure defined in `docs/mintlify_style.md`.
- **OpenCTI Connector**: Replace in-memory master graph with a STIX-compatible backend.
- **Queue + Workers**: Offload ingestion and OSINT scans to background workers (Temporal/BullMQ) for reliability.

Reference `docs/osint.md`, `docs/testing.md`, and `.plans/osint-pipeline.md` for deeper dives into each initiative.

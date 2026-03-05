# Bridge - Shared Memory Between Agents

This file serves as shared memory to prevent implementation drift and conflicting decisions.

## 2026-03-05 - Graph Structural Integrity (initphase)

**Branch:** `feature/graph-structural-integrity`

**Objective:** Maintain structural integrity of the Shaivra intelligence graph: entity schema consistency, relationship schema integrity, evidence linkage, confidence scoring, no orphan relationships, and signal traceability.

**Added (global-graph only):**
- **Validation module:** `global-graph/validation/graphIntegrity.ts` — `validateGraphStructure(event)` runs six checks and returns `GraphIntegrityResult` (ok, checks, errors). `validateGraphStructureOrThrow(event)` throws if any check fails.
- **Checks:** (1) **entitySchema** — each entity valid per entityDetectedSchema (id, object_type, name, confidence 0–1). (2) **relationshipSchema** — each relationship valid per relationshipDetectedSchema (link_type, UUIDs, confidence 0–1). (3) **evidenceLinkage** — every relationship has either `source_reference` or event-level `source_type`. (4) **confidenceScoring** — event, entities, relationships all in [0, 1]. (5) **noOrphanRelationships** — every from_entity_id and to_entity_id in entities_detected. (6) **signalTraceability** — event has valid, non-empty source_type.
- **Exports:** `global-graph/validation/index.ts` exports validateGraphStructure, validateGraphStructureOrThrow, types, and link/object type schemas.
- **Tests:** `tests/global-graph/validation/graphIntegrity.test.ts` — 10 tests covering valid event, event-level evidence, missing source_type, orphan relationships, bad entity/relationship schema, aggregated errors, and validateGraphStructureOrThrow.
- **Docs:** `global-graph/README.md` — new “Structural integrity (pre-write validation)” section describing checks and usage.

**Guarantees:** No orphan relationships; every relationship has supporting evidence; every signal traceable to a source. Use before `intelligenceEventToGraphOps` in strict pipelines.

## 2026-03-05 - Initphase: Intelligence Investigation Flow

**Branch:** `feature/initphase-investigation-flow`

**Summary:** Initphase conducts an intelligence investigation using **resolved graph entities only** (no raw signals). Seven steps: (1) retrieve target entity cluster from graph, (2) identify intelligence gaps, (3) select OSINT tools for gaps, (4) trigger enrichment workflows, (5) wait for graph updates, (6) re-evaluate entity cluster, (7) build intelligence assessment.

**Added:**
- **Doc:** `docs/investigation-initphase.md` — maps each step to implementation (`graphLookup`, `gapDetection`, `toolDispatch`, `enrichmentGraph`, `investigationGraph`); states constraint "no raw signals"; entrypoints API, script, tests.
- **Tests:** `tests/investigationFlow.test.ts` — synthesis payload uses only canonical data (entities, observations, relationships; no raw_response/api_response). `tests/langgraphjs/enrichment.test.ts` — gap detection uses only entity and graphSnapshot (no rawSignals/rawToolOutput).
- **Command:** `.cursor/commands/initphase.md` — references 7-step flow in `docs/investigation-initphase.md`; reason only over resolved graph entities.

**Flow:** `POST /api/investigation/run` or `bun scripts/run-investigation-example.ts [domain]` → `runInvestigation` → `investigationGraph` (graphLookup → missingDomains → triggerEnrichment | synthesizeReport) → report + graphSnapshot + events.

## 2026-03-05 - Systems-Engineering Integration Blueprint (Phase 1)

**Branch:** `feature/prometheus-grafana-osint-sdk` (or new branch from plan).

**Phase 1 – Configuration integrity layer (startup validation):**
- **Module:** `src/server/integrity/pipelineIntegrity.ts` and `src/server/integrity/index.ts`. Runs checks for: (1) tool registry (each tool has adapter or normalizer, entityTypes non-empty), (2) signal schema (IntelligenceEvent Zod validation), (3) Redpanda topics (when REDPANDA_BROKERS set: create `shaivra.signals.raw`, `shaivra.signals.normalized`, `shaivra.entities.resolved`, `shaivra.graph.updates`), (4) graph schema (Memgraph connectivity; connection refused treated as skipped).
- **Route:** `GET /api/system/integrity` returns full result (toolRegistry, signalSchema, redpanda, graphSchema, errors). Status 200 when ok, 503 when not.
- **Startup:** `startServer()` runs `runPipelineIntegrity()` non-blocking and logs warnings if not ok.
- **Tests:** `tests/server/pipelineIntegrity.test.ts` (unit with mocks), `tests/server/api.test.ts` (GET /api/system/integrity).
- **Routes module:** `src/server/routes/system.ts` (system routes).

**Phase 2 – Redpanda topics and optional signal consumer:**
- **Topics:** All four documented in `docs/osint/02-pipeline.md`: `shaivra.signals.raw`, `shaivra.signals.normalized`, `shaivra.entities.resolved`, `shaivra.graph.updates`. Integrity layer creates them at startup when REDPANDA_BROKERS is set.
- **Consumer:** `src/server/services/signalConsumer.ts` – when `ENABLE_SIGNAL_CONSUMER=true` and REDPANDA_BROKERS set, consumes from `shaivra.signals.raw`, coerces to IntelligenceEvent, runs standardiseAndDeduplicate, produces to `shaivra.signals.normalized`. Started from `startServer()` when env enabled. `.env.example` documents ENABLE_SIGNAL_CONSUMER.

**Phase 3 – Narrative graph extension (global-graph only):**
- **Object types:** `Message`, `Account`, `Audience`, `Campaign` added in `global-graph/ontology/objectTypes.ts` (schemas + ontologyNodeSchema + ENTITY_TYPE_TO_OBJECT_TYPE). Exported from `global-graph/ontology/index.ts`.
- **Link types:** `originates`, `propagates`, `targets` added in `global-graph/ontology/linkTypes.ts` (LINK_TYPE_TO_CYPHER, EXISTING_REL_TO_LINK). `amplifies` already existed.
- **Memgraph schema:** Constraints and indexes for Message, Account, Audience, Campaign in `global-graph/schema/memgraph.cypher`.
- **Builder:** `global-graph/builders/intelligenceEventToGraph.ts` maps Message, Account, Audience, Campaign to node ops. `global-graph/queries/ontologyQueries.ts` OBJECT_TYPE_LABEL updated. Pipeline integrity `REQUIRED_GRAPH_LABELS` includes the four new labels.

**Phase 4 – Pipeline health metrics:**
- **New metrics in `src/server/services/metrics.ts`:** `shaivra_signals_ingested_total` (stage: raw|normalized), `shaivra_entity_resolutions_total` (outcome: success|failure), `shaivra_graph_nodes_total` (gauge), `shaivra_tool_duration_seconds` (histogram by tool), `shaivra_agent_workflow_success_total` / `shaivra_agent_workflow_failure_total` (by workflow). Helpers: `recordSignalsIngested`, `recordEntityResolution`, `setGraphNodesTotal`, `recordToolDuration`, `recordAgentWorkflowSuccess`, `recordAgentWorkflowFailure`.
- **Wiring:** Signal consumer records normalized ingestion; `langgraphjs/nodes/toolDispatch.ts` records tool duration; `langgraphjs/index.ts` records investigation/enrichment workflow success or failure.

**Phase 5 – Integration prompts and docs:**
- **System integrity prompt:** `langgraphjs/prompts/integrity.ts` – `SYSTEM_INTEGRITY_PROMPT` for agent governance (tool registry, signal schema, event bus topics, graph schema). Exported from `langgraphjs/index.ts`.
- **Integrity node:** `langgraphjs/nodes/integrityCheck.ts` – `integrityCheckNode()` runs `runPipelineIntegrity()` and returns `{ integrityOk, integrityErrors }` for state. Composable at workflow entry; exported from `langgraphjs/index.ts`.
- **Docs:** `docs/osint/02-pipeline.md` (four topics, consumer), `docs/osint/06-signals-entities.md` (topic flow, Message/Account/Audience/Campaign, originates/propagates/targets), `docs/ingestion-and-concerns.md` (Redpanda topics and ENABLE_SIGNAL_CONSUMER).

**Validator governance prompt (seven subsystems):**
- **Prompt:** `VALIDATOR_INTEGRITY_PROMPT` in `langgraphjs/prompts/integrity.ts` – validator role: verify configuration, identify missing components, recommend corrective actions for (1) tool registry completeness, (2) adapter availability, (3) signal schema compliance, (4) Redpanda topic health, (5) entity resolution pipeline, (6) graph write integrity, (7) LangGraph workflow connectivity. Do not assume components exist unless verified. Exported from `langgraphjs/index.ts`.
- **Integrity result:** `runPipelineIntegrity()` now returns optional `subsystems` with per-subsystem `SubsystemResult`: `verified`, `missingComponents`, `recommendations`. Used by GET /api/system/integrity and by agents that consume the validator prompt. Lightweight checks for entity resolution (standardiseAndDeduplicate), graph write (graphRepository), and LangGraph (runInvestigation/runEnrichment) added in `src/server/integrity/pipelineIntegrity.ts`. `SubsystemResult` exported from `src/server/integrity/index.ts`.

## 2026-03-05 - Prometheus, Grafana, OSINT Adapter SDK

**Branch:** `feature/prometheus-grafana-osint-sdk`

**Added:**
- **Observability:** `infra/prometheus/prometheus.yml` (scrape app:3000/metrics); `infra/grafana/` with datasource provisioning and dashboard `shaivra-metrics.json` (tool calls, signal confidence, dedup, active investigations). Docker Compose profile `observability`: `docker compose --profile observability up` runs Prometheus + Grafana. Docs in [docs/ingestion-and-concerns.md](ingestion-and-concerns.md) and `.env.example` (PROMETHEUS_URL, GRAFANA_URL).
- **OSINT Adapter SDK** (`packages/shaivra-osint-sdk`): Contracts (ToolQuery, ToolResult, RawSignal, CanonicalEvent); BaseAdapter and AdapterRunner (budget + metrics via injected runtime); SignalNormalizer (ToolResult → CanonicalEvent); registerTool/getAdapter/hasAdapter; optional emitSignals (Redpanda, no-op if REDPANDA_BROKERS unset); rateLimiter and retryPolicy utils. Optional dependency kafkajs for streaming.
- **LangGraph:** [langgraphjs/nodes/toolDispatch.ts](langgraphjs/nodes/toolDispatch.ts) uses SDK when hasAdapter(toolName): build ToolQuery, runAdapter with runtime (investigationBudget + metrics), merge CanonicalEvent as IntelligenceEvent. selectToolsForGaps includes tools that haveAdapter(name) in addition to normalizer-backed tools.
- **CLI:** `shaivra tool run <tool> <entity_type> <value>` (e.g. `shaivra tool run spiderfoot domain example.com`) runs a registered SDK adapter; options `--emit`, `--json`.
- **Docker:** `packages/shaivra-osint-sdk/docker/Dockerfile` and `docker-compose.tool.yml`; templates `spiderfoot-template`, `shodan-template` for copy-paste adapters.
- **Example adapter:** StubShodanAdapter in SDK (src/adapter/examples/) for reference; tests use inline stub. Tests in `tests/sdk/osint-sdk.test.ts` (contracts, normalizeToolResult, BaseAdapter.run, runAdapter with mock runtime, budget exhausted, registry).

**Schema:** SDK CanonicalEvent mirrors IntelligenceEvent; main app casts to IntelligenceEvent. Redpanda topic `shaivra.signals.raw` documented in [docs/osint/02-pipeline.md](docs/osint/02-pipeline.md).

## 2026-03-05 - Project Initialization

### Decision: Phase 2A First (Normalization Layer)
**Rationale:** The normalization layer is the critical missing link. Without it:
- Tools return raw output (`OSINTResult`) instead of canonical schema
- No way to feed structured data into LangGraph agents
- Can't build entity graph or calculate confidence scores

**Implementation Order:**
1. Base normalizer interface
2. 5 tool-specific normalizers (Shodan, VirusTotal, AlienVault, Twitter, Reddit)
3. Normalizer registry
4. Modify osintAggregator.ts
5. Integration tests

### Current State Analysis
- ✅ Canonical schema exists (`src/contracts/intelligence.ts`)
- ✅ 5 OSINT integrations with caching/retry logic
- ✅ Basic unit tests for canonical schema
- ✅ **COMPLETE:** `osintAggregator.ts` now returns IntelligenceEvent in `OSINTResult.event`
- ✅ **COMPLETE:** 3 normalizers transform tool output to canonical schema (Shodan, VirusTotal, AlienVault)
- ✅ **COMPLETE:** Integration tests for tool → schema pipeline (16 tests passing)

### Schema Compliance Rules
1. **Entity Confidence Scores:** Range 0.0-1.0 (not percentages)
2. **Unique IDs:** Use UUIDv4 for all entities, observations, relationships
3. **Source Attribution:** Every observation MUST track tool + timestamp + raw data
4. **Immutability:** Never mutate existing objects, always return new copies
5. **Type Guards:** Use `isIntelligenceEvent()` and `isEntityReference()` for validation

### File Organization Decisions
- Normalizers: `src/server/normalizers/`
- Base interface: `src/server/normalizers/base.ts`
- Tool-specific: `src/server/normalizers/shodanNormalizer.ts`, etc.
- Registry: `src/server/normalizers/index.ts`
- Tests: `tests/integration/normalization.test.ts`

## 2026-03-05 - Initphase test coverage

**Branch:** `feature/initphase-test-coverage`  
**Run log:** [tasks/20260305-153400-errors.md](20260305-153400-errors.md)

**Added:** Unit tests for portal and knowledge-graph contracts, playbook service, OSINT aggregator (in `tests/server/`); contract-validated portalApi tests; server API tests for summarize, report, osint/aggregate, ingestion/advanced, projects, admin/reports/daily|weekly, graph/master; integration tests for portal API contracts (MSW + schema validation). Fixtures: `tests/fixtures/portalDummyData.ts`, `tests/fixtures/intelligenceDummyData.ts`. Full suite: 144 passed, 1 skipped. Redis ECONNREFUSED in stderr (non-fatal); four endpoints accept 200 or 500 when Redis/masterGraph not available.

### 2026-03-05 - API test 500s fixed (mock target)

**Branch:** `feature/initphase-api-test-fixes`

**Cause:** Seven tests (search, fingerprint, forge/analyze, agent/investigate, summarize, report, ingestion/advanced) were asserting 200 but got 500. Handlers use `callTrackedGemini` from `llmClient`, not `@google/genai` directly; mocking `@google/genai` did not reliably provide the response shape those routes expect.

**Change:** Mock `src/server/services/llmClient` in `tests/server/api.test.ts`: `callTrackedGemini` is replaced with `mockCallTrackedGemini`, and each affected test sets `mockCallTrackedGemini.mockResolvedValue({ response: { text: ... }, lineage })` (or `mockResolvedValueOnce` for report’s two-step flow). Agent investigate test uses the same mock so the background `runAgentNetwork` receives a single satisfied result and status becomes `completed`.

**Result:** Full suite 172 passed, 1 skipped.

## Unresolved Issues

None yet.

## Skills foundation (OSINT skillset)

**Decision:** Implement full tree under `skills/` (lens-intelligence, forge-influence, shield-counterintel, orchestrator) plus `langgraph/` and `infra/` at repo root. Do not overwrite `skills/init_dir.sh` or `skills/shaivra-intelligence/`.

**Current state:** Skill tree + langgraph + infra structure in place. Each skill has SKILL.md, references, scripts, and assets (stubs/minimal). Shared schema documented in lens/orchestrator references and langgraph/schemas. SKILLS_BEST_PRACTICES.md added. Tests for script entrypoints and langgraph pipeline (tests/skills/*.test.ts). Unified driver: `scripts/run_pipeline.sh` and `python3 langgraph/graph.py`; AI orchestration (Claude Code, Gemini CLI, OpenAI) documented in `skills/orchestrator/references/ai_orchestration.md`.

**Links:** [skills/SKILLS_BEST_PRACTICES.md](../skills/SKILLS_BEST_PRACTICES.md), [skills/orchestrator/references/pipeline.md](../skills/orchestrator/references/pipeline.md), [skills/orchestrator/references/ai_orchestration.md](../skills/orchestrator/references/ai_orchestration.md).

## Separation of concerns / ingestion integration

**Decision:** Keep a single pipeline (ingest → normalize → enrich) and four clear boundaries: (1) project/user investigation ingestion, (2) knowledge-base (Memgraph) ingestion, (3) agent network (consumes normalized data; does not ingest), (4) skills (execution layer; caller decides persistence). New backend work should respect and enhance the full implemented pipeline steps (Lens and PipelineMonitor); mocks can be replaced incrementally.

**Reference:** [docs/ingestion-and-concerns.md](../docs/ingestion-and-concerns.md) — four concerns, full pipeline steps, schemas/contracts for public API data (IntelligenceEvent, normalizers, OSINTResult, `src/contracts/portal.ts`, Zod), core pipeline and where advanced ingestion / normalizers / graphRepository fit, integration points for frontend, Memgraph, agent network, and skills.

## Audit (Full-Stack: Frontend, Backend, Schemas, Tool Data)

**Date:** 2026-03-05. Read-only audit of API routes, frontend calls, request/response contracts, pipeline handoffs, and LLM/tool payload scoping. No code changes.

**Findings:** [tasks/audit-20260305-180000.md](audit-20260305-180000.md)

**Summary:** Many POST routes lack validateBody (report, summarize, ingestion/advanced, agent/investigate, forge/analyze, etc.). Body/schema mismatches: summarize uses `target` vs schema `domain`; investigation uses `sector`/`focus` vs schema `goal`; forge uses `target`, `lensData`, `globalGraphData` not in schema. Response envelope `{ data, meta }` not consistently returned where FE expects `meta.trace_id` (Lens, PipelineMonitor, AdvancedRecon). Advanced ingestion does not produce IntelligenceEvent; OSINT aggregate + normalizers are contract-compliant. runAgentNetwork truncates to 2K chars; report/summarize size refinements exist in schema but are not applied. Prioritized remediation: P0 add validateBody to report, ingestion/advanced, agent/investigate; P1 align summarize/forge/org profile + fingerprint query validation; P2 response envelopes, initphase docs for graph/master and trends.

## Completed Milestones

- ✅ **Mintlify skill + MCP:** Skill installed via `npx skills add https://mintlify.com/docs --yes --global` (to `~/.agents/skills/mintlify`, Cursor + others). Project MCP at `.cursor/mcp.json` with `https://mintlify.com/docs/mcp`. Restart Cursor to load MCP.
- ✅ Task directory structure created
- ✅ Feature branch created (`feature/2a-normalization-layer`)
- ✅ **Phase 2A.1:** Base normalizer interface + AbstractNormalizer utilities
- ✅ **Phase 2A.2:** Shodan normalizer (IP → infrastructure entities + port/vuln observations)
- ✅ **Phase 2A.3:** VirusTotal normalizer (domain/IP → threat observations)
- ✅ **Phase 2A.4:** AlienVault normalizer (IOC pulses → event entities + relationships)
- ✅ **Phase 2A.5:** NormalizerRegistry for centralized tool lookup
- ✅ **Phase 2A.6:** Modified osintAggregator to use normalizers
- ✅ **Phase 2A.7:** Integration tests (40/40 passing)
- ✅ **Skills foundation:** Full OSINT skills tree (lens-intelligence, forge-influence, shield-counterintel, orchestrator), langgraph (graph, nodes, tools, schemas), infra placeholders, SKILLS_BEST_PRACTICES.md, run_pipeline.sh, ai_orchestration.md, Cursor command run_skill_pipeline; tests in tests/skills/ (7 passing)

## Implementation Notes - Phase 2A

### Normalizer Architecture
- **Base Interface:** `BaseNormalizer<TRawOutput>` with `normalize()` method
- **Abstract Class:** `AbstractNormalizer` provides common utilities (ID generation, confidence scoring, base event creation)
- **Tool-Specific:** Each normalizer extends `AbstractNormalizer` and implements tool-specific transformation logic

### Shodan Normalizer
- Creates 1 infrastructure entity per IP match
- Extracts port/service observations with confidence 0.95 (actively scanned)
- Creates vulnerability observations for CVEs with confidence 0.9
- Location observations with confidence 0.8 (GeoIP accuracy limitation)
- Confidence boost: org (+0.1), OS detection (+0.05), hostnames (+0.05), location (+0.05)

### VirusTotal Normalizer
- Creates infrastructure entity for domain/IP/URL
- Malicious detection observations with severity: >5 = critical, >2 = high, else medium
- Suspicious activity observations with confidence 0.8
- Reputation score observations with vote context
- Confidence boost: >50 engines (+0.1), positive reputation (+0.1), harmless votes (+0.05)

### AlienVault Normalizer
- Creates infrastructure entity for indicator
- Extracts pulse entities as separate event entities
- Creates "mentioned_in" relationships with strength 0.8
- Threat score observations with confidence 0.85
- Pulse count observations with severity: >10 = high, >5 = medium, else low
- Confidence boost: pulses (+0.1), threat_score >50 (+0.1), is_active (+0.05)

### Integration with osintAggregator
- Added `event?: IntelligenceEvent` field to `OSINTResult`
- Each query function now:
  1. Calls OSINT API (existing code)
  2. Looks up normalizer from registry
  3. Normalizes raw output to IntelligenceEvent
  4. Returns both raw data (backward compat) and normalized event
- Trace IDs generated per query using UUIDv4
- All existing API consumers still work (raw data field preserved)

## 2026-03-05 - Contributor Guide Alignment

### Decision: Added `AGENTS.md` contributor guide
- Captures repo layout (React client in `src/`, Express API in `server.ts`, Prisma, skills/langgraph/infra trees).
- Documents Bun-first workflows (`bun install`, `bun run dev/test/lint`, `bunx prisma ...`) so every agent uses the same package manager.
- Re-emphasizes existing design system constraints and security middleware expectations for any new code paths.

### Pending Work
- Draft explicit frontend/backend contracts for current features so agents can coordinate without touching visual components.
- Validate whether additional test coverage guidance is required for OSINT pipelines before Phase 2B work starts.

### Decision: Formalized design system reference (`docs/design-system.md`)
- Captures palette, typography, background layers, CTA/button treatments, and portal layout conventions extracted from current components (`Navigation`, `Hero`, `RequestAccessModal`, `PortalLayout`, `KnowledgeGraphExplorer`).
- Locking the Tailwind tokens defined in `index.html` as canonical; changes require design review before code modifications.
- Adds implementation checklist for future UI builds and instructs agents to log deviations here before merging.

### Decision: Agent rule file for design enforcement (`tasks/agent-design-rules.md`)
- Summarizes cardinal rules (palette discipline, typography, background stack integrity, component reuse, accessibility) and points agents back to `docs/design-system.md`.
- All new UI work must cite the rule file plus the design guide; deviations require a note here prior to merge.
- Cross-linked the rule in `AGENTS.md` and `CLAUDE.md` to ensure every contributor sees the requirement.

## 2026-03-05 - Backend ↔ Frontend/CLI Integration Plan

### Objective
Ensure the Express backend (`server.ts`, `src/server/**`), the React portal surfaces (`src/components/**`, `src/pages/portal/**`, hooks), and the `cli/` workflows share working contracts, lineage metadata, and queue orchestration without altering the established design system or deleting components.

### Phase 0 – Contract & Surface Inventory
- Build a live matrix that maps **component/page/hook → `portalApi` method → `/api` route → service/repository** for Dashboard, Lens, AdvancedRecon, Forge, Shield, Graph Explorer, Reports, AutonomousBot, Trends, Projects, and CLI commands. Source files: `src/services/portalApi.ts`, `src/pages/portal/**/*.tsx`, `cli/**/*.ts`, `server.ts`, `src/server/routes/**`.
- Reconcile backend responses with the zod schemas in `src/contracts` (especially `portal.ts` and `contracts/intelligence.ts`), documenting the canonical shape + `meta.trace_id` requirements for every user-facing endpoint.
- Tag each `portalApi` helper as **real fetch**, **stub**, or **hybrid** so future work knows which UI flows still rely on simulated data; publish this list alongside the matrix in `docs/` or `tasks/`.

Gaps:
- No consolidated ownership doc for component ↔ route linkages, so Lens, Dashboard, and AdvancedRecon currently duplicate ingestion logic differently.
- Mocked helpers (`simulateNormalization`, `simulateEnrichment`, `generateStrategicReport`, `runOsintEnrichment`, etc.) have no backend counterparts, leaving UI expectations undocumented.
- Backend endpoints rarely emit the `PortalApiResponse` envelope even though FE contracts expect `meta.trace_id`.

### Phase 1 – Backend Capability Alignment
- Move remaining inline handlers out of `server.ts` into `src/server/routes/**`, add `validateBody`/`validateQuery` + auth/rate-limit coverage, and guarantee every portal/CLI route returns the canonical schema with lineage metadata.
- Implement real services for simulated flows by extending `intelligenceOrchestrator`, `osintAggregator`, `documentParser`, `cliOrchestrator`, `standardiseAndDeduplicate`, and new pipeline services so normalization, enrichment, clustering, analytics, job correlation, and audit approvals have actual persistence in Prisma/Redis/S3 stubs.
- Ensure CLI-critical endpoints (`/api/cli/*`, `/api/intelligence/gather`, `/api/osint/*`, `/api/agent/investigate`, `/api/ingestion/advanced`, `/api/forge/analyze`, `/api/analytics/summary`, `/api/org/profile`) expose the same lineage + error semantics the portal expects, including CSRF/token flows.
- Pipe queue + long-running job telemetry (Bull queues, `runAgentNetwork`, Gemini calls) into audit/monitoring repositories so UI pollers (PipelineMonitor, GraphSetupWizard, Dashboard) can retrieve status.

Gaps:
- `POST /api/ingestion/advanced`, `/api/forge/analyze`, `/api/analysis/combinatorial`, `/api/jobs/correlate`, `/api/org/profile/update`, `/api/agent/investigate`, `/api/analytics/summary`, `/api/cli/*` still lack schema validation and consistent envelopes.
- No backend endpoints yet for Lens-specific stages (normalization/enrichment/clustering LLm) or AdvancedRecon’s `runOsintEnrichment`, so the UI cannot leave simulation.
- CLI queues depend on Redis with no graceful fallback; portal components that visualize queue data would still break when Redis is offline.

### Phase 2 – Frontend Data Integration (components, hooks, features)
- Replace simulated `portalApi` helpers with authenticated `fetch` calls reaching the aligned backend routes while keeping page layouts unchanged; centralize auth token + CSRF handling inside `portalApi` so individual pages remain styling-only.
- Introduce typed hooks (e.g., `usePortalData`, `useLensPipeline`, `useProjectJobs`) that wrap portalApi calls with shared loading/error states, respecting the existing UI atoms under `src/components/ui`.
- Connect UI polling loops (Dashboard job correlation, PipelineMonitor, GraphSetupWizard, AgentNetwork panels, Lens pipeline overlay) to real backend status endpoints or SSE/WebSocket channels with cleanup logic inside hooks.
- Limit any new visual affordances to reusable UI atoms that follow `docs/design-system.md`; no component removal is planned, only wiring existing components to data.

Gaps:
- `portalApi` currently omits `Authorization` headers even though `/api/projects`, `/api/history`, `/api/clips`, `/api/cli/*` already demand `authenticate`, so wiring it up without auth fixes would break the UI.
- Several pages expect fields only produced by mocks (e.g., `meta.validation_status` in Lens normalization, `analysis_json` in strategic reports), so we must spec these server-side before swapping the data source.
- Shared state for auth/project context is duplicated per page; without a central hook/context, each component will continue to re-fetch and diverge.

### Phase 3 – CLI Alignment
- Audit `cli/index.ts`, `cli/gather.ts`, `cli/skill-pipeline.ts`, plus slash commands to confirm they call the same contracts as the portal (`/api/intelligence/gather`, `/api/cli/*`, `/api/forge/analyze`) and emit the same `IntelligenceEvent`/Portal meta structures.
- Extend CLI workflows to optionally drive queue endpoints (`/api/cli/sherlock`, `/api/cli/theharvester`, `/api/cli/stats`) so analysts can trigger and monitor the same jobs visualized inside the portal.
- Align CLI configuration persistence (`~/.shaivra.json`) with portal auth by letting CLI reuse JWTs issued via `/api/auth/login`; document precedence for `SHAIVRA_API_BASE_URL`, `AUTH_TOKEN`, and `GEMINI_API_KEY`.
- Update CLI smoke scripts (`cli/test-e2e-websearch-agent.ts`, `cli/test-query-permutations.ts`) to run against the hardened backend and optionally publish their outputs back into `/api/ingestion/advanced` for the portal to display.

Gaps:
- CLI currently relies on `/api/intelligence/gather` being unauthenticated; once backend auth is enforced, CLI will 401 unless it forwards tokens.
- No CLI commands exercise `/api/cli/*` even though backend exposes Bull queue orchestration; parity with UI is missing.
- CLI summaries print ad-hoc JSON and skip `meta.trace_id`, so regressions between CLI and Portal contracts go undetected.

### Phase 4 – Observability, QA, and Documentation
- Expand Vitest suites (`tests/server/api.test.ts`, `tests/integration/portalApiContracts.test.ts`, `src/pages/portal/*.test.tsx`, `cli/test-*`) to cover every component/hook ↔ backend route pairing defined in earlier phases.
- Thread transaction IDs, lineage trails, queue job IDs, and audit log references through responses so both portal components and CLI output can surface identical troubleshooting breadcrumbs.
- Refresh `docs/platform_overview.md`, `docs/design-system.md`, and this bridge file once each phase deploys so new contributors know which surfaces are live vs simulated.

Gaps:
- Existing tests mock responses for simulated portalApi methods; once those hit real endpoints we need updated MSW fixtures + server mocks to prevent regressions.
- No shared observability story ties CLI outputs to portal UI (e.g., job logs, queue IDs), making cross-surface debugging difficult.
- Documentation does not yet explain how to operate CLI + portal against a secured backend (auth headers, CSRF token retrieval, rate limits).

### Phase 0 Inventory – Component ↔ API Matrix (2026-03-05)

- **Dashboard / Projects (`src/pages/portal/Dashboard.tsx`)**
  - `portalApi.getProjects` → `GET /api/projects` (`server.ts`, `projectRepository`). Real route requires `authenticate`, but the fetch omits `Authorization` and CSRF headers and returns a bare array (no `PortalApiResponse.meta.trace_id`).
  - `portalApi.createProject` → `POST /api/projects`. Same auth/meta gap; response is the raw Prisma object.
  - `portalApi.updateProjectSettings` → `PATCH /api/projects/:projectId/settings`. Route merges JSON without validation or envelope; UI expects `settings.threat_velocity_threshold`.
  - `portalApi.getSearchHistory` → `GET /api/history`. In-memory, unauthenticated, no meta.
  - `portalApi.getLensJobs` – simulation only; backend has no `/api/jobs/lens`.
  - `portalApi.getKnowledgeBaseStats` → `GET /api/stats`. Hard-coded payload with no meta.
  - `portalApi.getAnalyticsLinks` → `GET /api/analytics/links?projectId=...`. Static JSON, no auth/meta.
  - `portalApi.correlateJobs` → `POST /api/jobs/correlate`. Route lacks `validateBody`; returns `{ nodes, links }` instead of contract envelope.

- **Lens Pipeline (`src/pages/portal/Lens.tsx`)**
  - Reuses `getProjects/createProject` (same issues as Dashboard).
  - `portalApi.runMaltegoTransform` → `POST /api/osint/maltego`. Inline route returns `{ status, results }` without schema guard or auth.
  - `portalApi.runAdvancedIngestion` → `POST /api/ingestion/advanced`. Gemini-backed but unauthenticated; response lacks `PortalMeta` and throws when `query` missing (unconditional `split`).
  - `portalApi.simulateNormalization`, `.simulateEnrichment`, `.simulateClustering`, `.simulateLLMAnalysis`, `.submitAuditDecision` – UI-only mocks; no backend counterparts.
  - `portalApi.fingerprintWebsite` → `GET /api/osint/fingerprint`. Real route, no auth, returns plain object with `lineage`.

- **Advanced Recon (`src/pages/portal/AdvancedRecon.tsx`)**
  - `portalApi.simulateIngestion` – mock; there is no `/api/ingestion/simulate`.
  - `portalApi.runOsintEnrichment` – hybrid: invokes real `/api/osint/shodan|alienvault|virustotal` + `/api/summarize`, then emits custom structure without `PortalMeta`.
  - `portalApi.fingerprintWebsite` – real fingerprint GET as above.
  - `portalApi.generateStrategicReport` – posts to `/api/report` (real) but wraps/falls back to mock data, hiding backend validation errors.

- **Pipeline Monitor (`src/components/PipelineMonitor.tsx`)**
  - `portalApi.simulatePublicSource`, `.ingestEvent`, `.normalizeEvent`, `.enrichEvent`, `.extractEntities`, `.updateKnowledgeGraph` are all simulated; there are no pipeline routes in `server.ts`.
  - Uses `portalApi.runOsintEnrichment`, `.generateStrategicReport`, `.fingerprintWebsite` as described above; normalization/enrichment states can never reflect backend progress.

- **Agent Surfaces**
  - `AgentNetworkMonitor` (`src/components/AgentNetworkMonitor.tsx`) kicks off `portalApi.startAgentInvestigation` (real `POST /api/agent/investigate`, unauthenticated) but polls with `portalApi.pollAgentRun`, a UI mock that does not call `/api/agent/investigate/:runId`.
  - `Hero` uses the same `startAgentInvestigation` helper; the marketing CTA therefore depends on an unauthenticated backend route.
  - `HomepageGraphSimulation` uses `portalApi.pollAgentInvestigation` (real GET) but expects `PortalApiResponse`, while the backend returns a plain investigation object.
  - `AutonomousBot` (`src/pages/portal/AutonomousBot.tsx`) posts to `/api/bot/start`. Route lacks schema enforcement and auth; response is raw bot state with no `meta`.

- **Campaign / Forge / Shield Components**
  - `CampaignAnalysis` (`src/components/CampaignAnalysis.tsx`) depends on mocked `portalApi.uploadCampaignFile` and `.processCampaignAnalysis`; no backend storage exists for campaign uploads.
  - `ForgeMonitor` (`src/components/ForgeMonitor.tsx`) uses `portalApi.initiateForgeSimulation`, `.runForgeStep`, `.generateForgeReport` mocks. Only the Forge page itself hits the real `/api/forge/analyze` route.
  - `ShieldMonitor` (`src/components/ShieldMonitor.tsx`) calls mocked `portalApi.uploadProprietaryAsset` and `.runShieldComparison`; `/api/shield/*` routes are not implemented.

- **Graph / Search Surfaces**
  - `GlobalSearch` (`src/pages/portal/GlobalSearch.tsx`) calls `portalApi.searchGlobalGraph` → `GET /api/graph/global-search` (no auth/meta) and `portalApi.saveClip` → `POST /api/clips` (requires `authenticate`; current fetch omits JWT/CSRF so it will 401 once auth is enforced).
  - `HomepageGraphSimulation` shares the agent investigation endpoints noted earlier.
  - `Trends` (`src/pages/portal/Trends.tsx`) uses `portalApi.getTrends`, a pure mock; `/api/trends` does not exist.

- **Reports & Analytics**
  - `DailyReports` (`src/pages/portal/DailyReports.tsx`) fetches `portalApi.getDailyIntelligence` → `GET /api/admin/reports/daily` and `fetch('/api/rss')`. Both routes return raw JSON and skip auth.
  - `WeeklyReports` relies on mocked `portalApi.getWeeklyIntelligence`; backend lacks `/api/admin/reports/weekly`.
  - `IntelligenceAnalytics` (`src/pages/portal/IntelligenceAnalytics.tsx`) posts to `/api/analytics/summary`; the route uses Gemini without validation or `PortalMeta`.
  - `OrgProfiler` (`src/pages/portal/OrgProfiler.tsx`) wires to `/api/org/profile`, `/api/org/profile/:jobId`, `/api/org/profile/update`. Routes exist but return plain JSON and do not enforce schemas.

- **Auth / Onboarding**
  - `Login` uses `portalApi.login` (real `/api/auth/login` storing JWT) but `portalApi.resetPassword` is a mock, so the "Forgot password" flow has no backend.
  - `Onboarding` and `RequestAccessModal` call mocked `portalApi.register`; `/api/auth/register` is never invoked, so onboarding cannot provision actual users.

- **CLI (`cli/`)**
  - `cli/gather.ts` posts to `/api/intelligence/gather` (`src/server/routes/intelligence.ts`). Endpoint is unauthenticated and responds with `IntelligenceGatheringResult` lacking `PortalMeta`.
  - `cli/gather --no-server` imports `intelligenceOrchestrator` directly, bypassing middleware, rate limits, and audit logging.
  - `cli/skill-pipeline.ts` invokes `scripts/run_pipeline.sh` instead of public APIs; no backend contract validates its stdout.
  - CLI utilities (`cli/test-e2e-websearch-agent.ts`, `cli/test-query-permutations.ts`) hit `/api/search`, `/api/report`, `/api/intelligence/gather` but never capture or emit `trace_id`/`meta`, so their outputs cannot be correlated with portal events.

### Phase 0 Inventory – Portal API Method Types

- **Real HTTP-backed methods:** `login`, `getProjects`, `createProject`, `updateProjectSettings`, `getSearchHistory`, `getKnowledgeBaseStats`, `getAnalyticsLinks`, `correlateJobs`, `runMaltegoTransform`, `runAdvancedIngestion`, `fingerprintWebsite`, `analyzeForgeScenario`, `saveClip`, `searchGlobalGraph`, `getIntelligenceSummary`, `startAgentInvestigation`, `pollAgentInvestigation`, `startAutonomousBot`, `profileOrganisation`, `pollOrgProfiling`, `updateOrgProfile`, `getDailyIntelligence` (`/api/admin/reports/daily`), `fetch('/api/rss')`.
- **Hybrid methods (real calls + mock wrapping/fallback):** `runOsintEnrichment`, `simulatePublicSource`, `generateStrategicReport`, `portalApi.realSearch`.
- **Pure front-end mocks:** `getLensJobs`, `simulateIngestion`, `simulateNormalization`, `simulateEnrichment`, `simulateClustering`, `simulateLLMAnalysis`, `submitAuditDecision`, `ingestEvent`, `normalizeEvent`, `enrichEvent`, `extractEntities`, `updateKnowledgeGraph`, `uploadCampaignFile`, `processCampaignAnalysis`, `initiateForgeSimulation`, `runForgeStep`, `generateForgeReport`, `uploadProprietaryAsset`, `runShieldComparison`, `register`, `resetPassword`, `getWeeklyIntelligence`, `getTrends`, `pollAgentRun`.

### Phase 0 Inventory – Contract Findings

- **Portal schema mismatch:** Real routes return raw JSON rather than `PortalApiResponse` with `meta.trace_id`, so wiring any UI that expects `PortalMeta` (Dashboard metrics, Lens pipeline overlay) currently breaks.
- **Auth/header gap:** `/api/projects`, `/api/clips`, `/api/cli/*` and other authenticated routes never receive the JWT/CSRF tokens that `portalApi.login` stores, blocking end-to-end parity once auth is enforced.
- **Validation missing:** POST routes such as `/api/ingestion/advanced`, `/api/forge/analyze`, `/api/bot/start`, `/api/analytics/summary`, `/api/jobs/correlate`, `/api/osint/fingerprint`, `/api/org/profile/update` skip zod guards, so contract regressions go undetected and runtime errors (e.g., `query.split` on undefined) reach production.
- **State divergence:** PipelineMonitor, CampaignAnalysis, ForgeMonitor, ShieldMonitor, RequestAccessModal, WeeklyReports, and Trends all depend on mocks; they cannot display backend progress or be tested via real routes until those services exist.
- **CLI parity gap:** CLI exercises only `/api/intelligence/gather`, `/api/report`, and `/api/search`, so queue orchestration (`/api/cli/*`) and PortalMeta propagation are untested outside the browser.

## 2026-03-05 - Identity Vault & RBAC Hardening

### Decision
Replace Supabase/Postgres-backed authentication with an embedded, encrypted identity vault and define military-grade RBAC controls covering **Admin, Developer, Executive, Analyst, Client** personas.

### Implementation
- Added shared RBAC manifest (`src/security/rbac.ts`) describing roles, hierarchy, and policy surface (data classification, provisioning privileges, pipeline control). Contracts and middleware now consume this single source of truth.
- Replaced `src/server/auth/supabaseAuth.ts` with `secureAuth.ts`, which:
  - Stores user identities inside `storage/identity-vault.json.enc`, encrypted via AES-256-GCM with a base64 `IDENTITY_VAULT_KEY`.
  - Hashes passwords using Node `crypto.scrypt` (`N=2^15`, `r=8`, `p=1`, 64-byte key) and enforces lockouts after configurable failed attempts (`AUTH_MAX_FAILED_ATTEMPTS`, `AUTH_LOCKOUT_MINUTES`).
  - Bootstraps the vault with `VAULT_BOOTSTRAP_ADMIN_EMAIL`/`VAULT_BOOTSTRAP_ADMIN_PASSWORD`, limiting self-registration unless `AUTH_ALLOW_SELF_REGISTRATION=true`.
  - Issues JWTs embedding clearance levels and provides stateless logout/refresh helpers.
- Updated middleware, schemas, and contracts:
  - `authorize.ts`, `authenticate.ts`, express request typings, Prisma `Role` enum, and Zod schemas now recognize the new roles.
  - Auth routes require the new service, capture audit logs for login/register/logout, and restrict provisioning to roles whose policy allows it (self-service only provisions `client`).
- Frontend contracts (`portalUserSchema`) and mocks default new users to the `client` role; portal API register stub mirrors the backend change.
- Removed Supabase dependency from `package.json`/`bun.lock`; `.gitignore` now protects vault artifacts with a committed `storage/.gitkeep`.

### Operational Notes
- Required env vars: `IDENTITY_VAULT_KEY` (base64 32 bytes), `VAULT_BOOTSTRAP_ADMIN_EMAIL`, `VAULT_BOOTSTRAP_ADMIN_PASSWORD`; optional hardening knobs documented via `AUTH_MAX_FAILED_ATTEMPTS`, `AUTH_LOCKOUT_MINUTES`, `AUTH_PASSWORD_ROTATION_DAYS`, `AUTH_ALLOW_SELF_REGISTRATION`, `AUTH_REQUIRE_MFA`.
- Identity vault integrity is validated via SHA-256 checksum before every read; tampering halts the server.
- Audit logs record actor role, target identity, and session metadata for every auth mutation.

### Open Gaps
- MFA hooks exist (`AUTH_REQUIRE_MFA`) but no OTP/TOTP verification pipeline yet—needs future implementation.
- Identity vault writes are serialized per request, but we still need tooling to rotate keys and export/import vault contents safely.
- CLI/front-end registration flows currently rely on mocks; wiring them to the new secure endpoints requires surfacing CSRF + JWT management.
- Admin portal stage-two auth now exists, but UI/CLI flows must call `/api/auth/admin/verify` before interacting with `/admin/queues`, `/api/bot/start`, or `/api/admin/reports/*`; document this handshake for future portal work.

### Next Phases (Identity & RBAC)
1. **Phase A – Operational Hardening**
   - Add admin tooling for vault rotation/export/import plus automated backups with integrity attestations.
   - Build health checks + alerting when vault checksum or write cadence deviates from baseline.
2. **Phase B – MFA & Session Assurance**
   - Implement TOTP/WebAuthn enrollment, backup codes, and enforced rotation windows tied to `ROLE_POLICIES`.
   - Extend JWT issuance with signed session manifests and short-lived refresh tokens stored in the vault.
3. **Phase C – Surface Integration**
   - Wire React portal/CLI auth flows (login/register/logout/token refresh) to the new endpoints with CSRF + Authorization headers.
   - Replace remaining portalApi mocks for registration/login with authenticated fetches, updating MSW fixtures accordingly.
4. **Phase D – Continuous Monitoring**
   - Stream audit log events into SIEM hooks, add anomaly detection for failed logins, provisioning, and privilege escalations.
   - Document runbooks in `docs/security.md` and add regression tests (unit + e2e) covering lockouts, provisioning, and MFA edge cases.

## Next Steps

**Docs:** Use Mintlify skill + MCP for doc structure, components, and best practices when editing or adding docs.
**Phase 2B:** Add Layer 1 high-signal tools (OpenCorporates, SEC EDGAR, Gov Data)
**Phase 2C:** Add Layer 2-3 tools (Censys, crt.sh, Recon-ng, SpiderFoot, Maltego)
**Phase 2D:** Add Layer 4-5 tools + signal ranking system

# Bridge - Shared Memory Between Agents

This file serves as shared memory to prevent implementation drift and conflicting decisions.

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

## Unresolved Issues

None yet.

## Skills foundation (OSINT skillset)

**Decision:** Implement full tree under `skills/` (lens-intelligence, forge-influence, shield-counterintel, orchestrator) plus `langgraph/` and `infra/` at repo root. Do not overwrite `skills/init_dir.sh` or `skills/shaivra-intelligence/`.

**Current state:** Skill tree + langgraph + infra structure in place. Each skill has SKILL.md, references, scripts, and assets (stubs/minimal). Shared schema documented in lens/orchestrator references and langgraph/schemas. SKILLS_BEST_PRACTICES.md added. Tests for script entrypoints and langgraph pipeline (tests/skills/*.test.ts). Unified driver: `scripts/run_pipeline.sh` and `python3 langgraph/graph.py`; AI orchestration (Claude Code, Gemini CLI, OpenAI) documented in `skills/orchestrator/references/ai_orchestration.md`.

**Links:** [skills/SKILLS_BEST_PRACTICES.md](../skills/SKILLS_BEST_PRACTICES.md), [skills/orchestrator/references/pipeline.md](../skills/orchestrator/references/pipeline.md), [skills/orchestrator/references/ai_orchestration.md](../skills/orchestrator/references/ai_orchestration.md).

## Separation of concerns / ingestion integration

**Decision:** Keep a single pipeline (ingest → normalize → enrich) and four clear boundaries: (1) project/user investigation ingestion, (2) knowledge-base (Memgraph) ingestion, (3) agent network (consumes normalized data; does not ingest), (4) skills (execution layer; caller decides persistence). New backend work should respect and enhance the full implemented pipeline steps (Lens and PipelineMonitor); mocks can be replaced incrementally.

**Reference:** [docs/ingestion-and-concerns.md](../docs/ingestion-and-concerns.md) — four concerns, full pipeline steps, schemas/contracts for public API data (IntelligenceEvent, normalizers, OSINTResult, `src/contracts/portal.ts`, Zod), core pipeline and where advanced ingestion / normalizers / graphRepository fit, integration points for frontend, Memgraph, agent network, and skills.

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

## Next Steps

**Docs:** Use Mintlify skill + MCP for doc structure, components, and best practices when editing or adding docs.
**Phase 2B:** Add Layer 1 high-signal tools (OpenCorporates, SEC EDGAR, Gov Data)
**Phase 2C:** Add Layer 2-3 tools (Censys, crt.sh, Recon-ng, SpiderFoot, Maltego)
**Phase 2D:** Add Layer 4-5 tools + signal ranking system

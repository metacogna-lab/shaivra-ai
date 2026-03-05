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
- ✅ Canonical schema exists (`src/types/intelligence.ts`)
- ✅ 5 OSINT integrations with caching/retry logic
- ✅ Basic unit tests for canonical schema
- ❌ **Gap:** `osintAggregator.ts` returns `OSINTResult`, not `IntelligenceEvent`
- ❌ **Gap:** No normalizers to transform tool output to canonical schema
- ❌ **Gap:** No integration tests for tool → schema pipeline

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

## Unresolved Issues

None yet.

## Completed Milestones

- ✅ Task directory structure created
- ✅ Feature branch created (`feature/2a-normalization-layer`)

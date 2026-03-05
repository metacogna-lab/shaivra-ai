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

## Unresolved Issues

None yet.

## Completed Milestones

- ✅ Task directory structure created
- ✅ Feature branch created (`feature/2a-normalization-layer`)
- ✅ **Phase 2A.1:** Base normalizer interface + AbstractNormalizer utilities
- ✅ **Phase 2A.2:** Shodan normalizer (IP → infrastructure entities + port/vuln observations)
- ✅ **Phase 2A.3:** VirusTotal normalizer (domain/IP → threat observations)
- ✅ **Phase 2A.4:** AlienVault normalizer (IOC pulses → event entities + relationships)
- ✅ **Phase 2A.5:** NormalizerRegistry for centralized tool lookup
- ✅ **Phase 2A.6:** Modified osintAggregator to use normalizers
- ✅ **Phase 2A.7:** Integration tests (40/40 passing)

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

## Next Steps

**Phase 2B:** Add Layer 1 high-signal tools (OpenCorporates, SEC EDGAR, Gov Data)
**Phase 2C:** Add Layer 2-3 tools (Censys, crt.sh, Recon-ng, SpiderFoot, Maltego)
**Phase 2D:** Add Layer 4-5 tools + signal ranking system

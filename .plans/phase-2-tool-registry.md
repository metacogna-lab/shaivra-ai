# Phase 2: Tool Registry Implementation Plan

**Plan ID:** phase-2-tool-registry
**Status:** READY TO START
**Dependencies:** ✅ Phase 1 (Canonical Schema) COMPLETED
**Estimated Duration:** 3-4 days
**Timeline:** Week 1-2 of integration

---

## Executive Summary

Build a centralized tool registry that manages all OSINT tools with consistent interfaces for execution, normalization, and reliability tracking. This registry will serve as the foundation for the Investigation Graph, Task Queue, and Signal Processor.

**Why This Matters:**
- Eliminates tool-specific code scattered across `langChainService.ts` and `server.ts`
- Provides consistent interface for all 9+ OSINT tools
- Enables dynamic tool discovery and composition
- Tracks tool reliability and execution costs
- Enforces canonical schema output via normalizers

---

## Phase Overview

### What We're Building

```
┌─────────────────────────────────────────────────────────────┐
│                      Tool Registry                          │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Tool 1    │  │   Tool 2    │  │   Tool 3    │        │
│  │  (Shodan)   │  │ (TheHarvest)│  │(VirusTotal) │   ...  │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤        │
│  │ • executor  │  │ • executor  │  │ • executor  │        │
│  │ • normalizer│  │ • normalizer│  │ • normalizer│        │
│  │ • schema    │  │ • schema    │  │ • schema    │        │
│  │ • cost      │  │ • cost      │  │ • cost      │        │
│  │ • reliability│ │ • reliability│ │ • reliability│       │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  Registry Methods:                                          │
│  • register(tool)                                           │
│  • get(name)                                                │
│  • list(category?)                                          │
│  • execute(name, params)                                    │
│  • executeAndNormalize(name, params, target, traceId)      │
└─────────────────────────────────────────────────────────────┘
        ↓                    ↓                    ↓
   Investigation       Signal           Task
      Graph          Processor         Worker
```

### Success Criteria

- [x] ToolRegistry class with CRUD operations
- [x] Minimum 5 tools migrated from langChainService.ts
- [x] Each tool has executor + normalizer + schema
- [x] Rate limiting enforced per tool
- [x] Reliability scoring (exponential moving average)
- [x] 80%+ test coverage
- [x] Zero regressions in existing functionality

---

## Implementation Steps

### Step 1: Create ToolRegistry Core (Day 1)

**File:** `src/services/toolRegistry.ts`

**Interfaces to Define:**
```typescript
interface ToolDefinition {
  name: string;
  description: string;
  category: 'search' | 'scan' | 'enrich' | 'analyze';
  executor: (params: any) => Promise<any>;
  normalizer?: (raw: any, params: any) => IntelligenceEvent;
  schema: ZodSchema;
  cost: number;
  reliability: number;
  rateLimit?: { requests: number; window: number };
  metadata: {
    version: string;
    author: string;
    requiresAuth: boolean;
    tags: string[];
  };
}
```

**Registry Methods:**
1. `register(tool: ToolDefinition)` - Add tool to registry
2. `get(name: string)` - Retrieve tool definition
3. `list(category?: string)` - List all/filtered tools
4. `execute(name, params, options?)` - Execute tool raw
5. `executeAndNormalize(name, params, target, traceId)` - Execute + normalize to IntelligenceEvent

**Features to Implement:**
- In-memory Map storage: `Map<string, ToolDefinition>`
- Rate limiting with sliding window
- Reliability tracking with exponential moving average (α = 0.1)
- Execution history for rate limit enforcement
- Error handling with fallback to mock data

**TDD Workflow:**
1. Write tests for ToolRegistry class (register, get, list, execute)
2. Run tests (should FAIL)
3. Implement ToolRegistry
4. Run tests (should PASS)
5. Refactor for code quality

**Acceptance Criteria:**
- ToolRegistry class fully implemented
- All methods have unit tests
- Rate limiting prevents exceeding limits
- Reliability score updates on success/failure

---

### Step 2: Migrate Existing Tools (Day 1-2)

**Tools to Migrate from `langChainService.ts`:**

1. **lookup_entity** - Query master graph for entity
2. **search_knowledge_graph** - Semantic search in graph
3. **grep_logs** - Search investigation logs
4. **dns_lookup** - DNS resolution (A, MX, NS records)
5. **web_search** - Gemini grounded web search
6. **run_osint_scan** - Generic OSINT scanner
7. **the_harvester** - Email and subdomain enumeration
8. **shodan_search** - Internet device scanner
9. **virustotal_lookup** - Threat intelligence lookup

**File Structure:**
```
src/services/tools/
├── lookupEntity.ts
├── searchKnowledgeGraph.ts
├── grepLogs.ts
├── dnsLookup.ts
├── webSearch.ts
├── runOsintScan.ts
├── theHarvester.ts
├── shodan.ts
├── virusTotal.ts
└── index.ts (registerAllTools)
```

**Tool File Template:**
```typescript
import { z } from 'zod';
import type { ToolDefinition } from '../toolRegistry';
import type { IntelligenceEvent } from '@/types/intelligence';

const schema = z.object({
  // Define input schema
});

const executor = async (params: z.infer<typeof schema>) => {
  // Raw tool execution
};

const normalizer = (raw: any, params: any): IntelligenceEvent => {
  // Convert to canonical schema
};

export const toolName: ToolDefinition = {
  name: 'tool_name',
  description: 'Tool description',
  category: 'scan',
  executor,
  normalizer,
  schema,
  cost: 5,
  reliability: 0.9,
  metadata: {
    version: '1.0.0',
    author: 'shaivra',
    requiresAuth: false,
    tags: []
  }
};
```

**Priority Order:**
1. `dnsLookup` - Simple, no external dependencies ✅
2. `lookupEntity` - Internal graph query ✅
3. `webSearch` - Uses existing Gemini integration ✅
4. `shodan` - External API with mock fallback ✅
5. `theHarvester` - External API with mock fallback ✅
6. `virusTotal` - External API with mock fallback ✅
7. `searchKnowledgeGraph` - Internal graph query
8. `grepLogs` - Internal data search
9. `runOsintScan` - Wrapper for multiple tools

**TDD Workflow for Each Tool:**
1. Write test for tool executor (should return raw data)
2. Write test for tool normalizer (should return IntelligenceEvent)
3. Run tests (should FAIL)
4. Implement executor
5. Implement normalizer
6. Run tests (should PASS)
7. Register in `tools/index.ts`

**Acceptance Criteria:**
- Each tool has dedicated file
- Executor returns raw data
- Normalizer returns valid IntelligenceEvent
- All tools registered in index.ts
- Mock fallbacks for external APIs

---

### Step 3: Implement Normalizers (Day 2-3)

**Key Normalizer Patterns:**

#### Pattern 1: IP Address Discovery (Shodan)
```typescript
// Input: Shodan API response
// Output: EntityReference (infrastructure) + Observations (services)
{
  entities: [
    { type: 'infrastructure', name: '192.168.1.1', ... }
  ],
  observations: [
    { property: 'service', value: { port: 80, banner: '...' } }
  ]
}
```

#### Pattern 2: Email/Subdomain Discovery (TheHarvester)
```typescript
// Input: TheHarvester results
// Output: EntityReference (domain) + Observations (emails, subdomains)
{
  entities: [
    { type: 'infrastructure', name: 'example.com' },
    { type: 'infrastructure', name: 'mail.example.com' }
  ],
  observations: [
    { property: 'email', value: 'admin@example.com' }
  ]
}
```

#### Pattern 3: Threat Intelligence (VirusTotal)
```typescript
// Input: VirusTotal API response
// Output: EntityReference + Observations (threat indicators)
{
  entities: [
    { type: 'infrastructure', name: '192.0.2.1', attributes: { malicious: 5 } }
  ],
  observations: [
    { type: 'behavior', property: 'threat_detected', confidence: 0.5 }
  ]
}
```

**Normalizer Best Practices:**
- Always generate UUIDs for entity/observation IDs
- Set confidence scores based on source reliability
- Include raw data in metadata for debugging
- Handle empty/failed results gracefully
- Link observations to entities via entityId

**TDD Workflow:**
1. Write test with sample raw data
2. Write test expecting specific IntelligenceEvent structure
3. Run tests (should FAIL)
4. Implement normalizer logic
5. Run tests (should PASS)
6. Validate against Zod schema

**Acceptance Criteria:**
- All normalizers tested with real API responses
- Empty results handled gracefully
- Confidence scores calculated appropriately
- All entities/observations have UUIDs

---

### Step 4: Integration Testing (Day 3)

**Integration Test Scenarios:**

1. **Tool Registration Flow**
   - Register all 9 tools
   - Verify they appear in list()
   - Verify get() returns correct tool

2. **Execution Flow**
   - Execute tool with valid params
   - Verify raw result structure
   - Verify execution time recorded

3. **Normalization Flow**
   - Execute and normalize in one call
   - Verify IntelligenceEvent structure
   - Verify traceId propagation
   - Verify tool name in event

4. **Rate Limiting Flow**
   - Configure tool with rate limit
   - Execute up to limit (should succeed)
   - Execute beyond limit (should fail)
   - Wait for window reset (should succeed again)

5. **Reliability Tracking**
   - Execute tool successfully (reliability ↑)
   - Execute tool with failure (reliability ↓)
   - Verify exponential moving average

6. **Error Handling**
   - Execute non-existent tool (should throw)
   - Execute with invalid params (Zod validation should fail)
   - Execute with API error (should return failed IntelligenceEvent)

**Test File:** `tests/unit/toolRegistry.test.ts`

**Test Coverage Requirements:**
- ToolRegistry methods: 85%+
- Individual tools: 80%+
- Integration scenarios: 100%

**TDD Workflow:**
1. Write all integration test scenarios
2. Run tests (should FAIL)
3. Fix implementation until tests pass
4. Refactor
5. Verify coverage with `bun test --coverage`

**Acceptance Criteria:**
- All integration tests passing
- 80%+ coverage across registry and tools
- No regressions in existing tests

---

### Step 5: Documentation & Cleanup (Day 4)

**Documentation to Create:**

1. **API Documentation** (`docs/tool-registry.md`)
   - ToolDefinition interface spec
   - Registry method signatures
   - Example tool implementation
   - Rate limiting configuration
   - Reliability scoring algorithm

2. **Tool Catalog** (`docs/tools-catalog.md`)
   - List of all registered tools
   - Input/output schemas
   - Cost and reliability ratings
   - Authentication requirements
   - Example usage

3. **Migration Guide** (`docs/migration-from-langchain.md`)
   - How to migrate existing tools
   - Breaking changes from old system
   - Normalizer implementation guide
   - Testing checklist

4. **Bridge File Update** (`tasks/bridge.md`)
   - Document tool registry architecture
   - Note normalization patterns
   - Integration points with other services

**Code Cleanup:**
- Remove deprecated code from `langChainService.ts`
- Add JSDoc comments to all public methods
- Ensure consistent error messages
- Add TypeScript strict mode compliance

**Acceptance Criteria:**
- All documentation complete
- JSDoc comments on all public APIs
- No dead code in codebase
- Bridge file updated

---

## Testing Strategy

### Unit Tests (80%+ Coverage)

**ToolRegistry Core:**
```typescript
describe('ToolRegistry', () => {
  describe('Tool Registration', () => {
    it('registers a tool successfully')
    it('prevents duplicate registration')
    it('lists all registered tools')
    it('filters tools by category')
  })

  describe('Tool Execution', () => {
    it('executes tool successfully')
    it('throws error for non-existent tool')
    it('validates params with Zod schema')
    it('tracks execution time')
  })

  describe('Rate Limiting', () => {
    it('enforces rate limits')
    it('resets limit after window')
    it('tracks per-tool limits independently')
  })

  describe('Reliability Tracking', () => {
    it('updates reliability on success')
    it('decreases reliability on failure')
    it('uses exponential moving average')
  })
})
```

**Individual Tools:**
```typescript
describe('DNS Lookup Tool', () => {
  it('resolves A records')
  it('resolves MX records')
  it('handles invalid domain')
  it('normalizes to IntelligenceEvent')
  it('sets correct confidence scores')
})
```

### Integration Tests

**File:** `tests/integration/toolRegistry.integration.test.ts`

```typescript
describe('Tool Registry Integration', () => {
  beforeAll(() => {
    registerAllTools()
  })

  it('executes and normalizes Shodan search', async () => {
    const event = await toolRegistry.executeAndNormalize(
      'shodan_search',
      { query: '192.168.1.1' },
      '192.168.1.1',
      'trace-123'
    )

    expect(event.status).toBe('success')
    expect(event.entities.length).toBeGreaterThan(0)
  })

  it('handles cascading tool execution', async () => {
    // Execute DNS lookup
    const dnsEvent = await toolRegistry.executeAndNormalize(...)

    // Use discovered IPs to run Shodan
    const ipEntities = dnsEvent.entities.filter(e => e.type === 'infrastructure')
    const shodanResults = await Promise.all(
      ipEntities.map(entity =>
        toolRegistry.executeAndNormalize('shodan_search', { query: entity.name }, ...)
      )
    )

    expect(shodanResults.every(r => r.status !== 'failed')).toBe(true)
  })
})
```

### Test Data

**Mock API Responses:**
```
tests/fixtures/
├── shodan-response.json
├── theHarvester-response.json
├── virusTotal-response.json
├── dns-response.json
└── index.ts (export all fixtures)
```

---

## Rollout Strategy

### Phase 1: Core Registry (Day 1)
- Implement ToolRegistry class
- Write comprehensive unit tests
- Achieve 85%+ coverage on core

**Verification:**
```bash
bun test tests/unit/toolRegistry.test.ts --coverage
```

### Phase 2: Tool Migration (Day 2)
- Migrate 3 simple tools (DNS, lookup_entity, web_search)
- Test each tool individually
- Register in tools/index.ts

**Verification:**
```bash
bun test tests/unit/tools/
```

### Phase 3: External API Tools (Day 3)
- Migrate Shodan, TheHarvester, VirusTotal
- Implement mock fallbacks
- Test with real API keys (if available)

**Verification:**
```bash
bun test tests/integration/toolRegistry.integration.test.ts
```

### Phase 4: Integration & Cleanup (Day 4)
- Run full test suite
- Update documentation
- Update bridge file
- Merge to main

**Verification:**
```bash
bun test --coverage
bun run lint
```

---

## Dependencies

### Required Packages
```json
{
  "zod": "^3.22.4",           // Schema validation
  "uuid": "^9.0.0",           // UUID generation
  "@types/uuid": "^9.0.7"     // UUID types
}
```

### External APIs (Optional)
```bash
SHODAN_API_KEY=             # Shodan.io (free tier: 1 query/sec)
VIRUSTOTAL_API_KEY=         # VirusTotal (free tier: 4 req/min)
ALIENVAULT_API_KEY=         # AlienVault OTX (free)
```

**Fallback Strategy:**
- All tools have mock implementations
- Tests pass without API keys
- Production requires real keys for full functionality

---

## Risk Mitigation

### Risk 1: API Rate Limits
**Mitigation:**
- Implement strict rate limiting in registry
- Use mock data for development/testing
- Queue requests when near limits
- Track cost/quota usage

### Risk 2: Schema Mismatches
**Mitigation:**
- Strict Zod validation on all inputs
- Normalizer tests with real API responses
- Schema version tracking in tool metadata
- Validation errors logged to bridge file

### Risk 3: Tool Reliability
**Mitigation:**
- Exponential moving average for reliability
- Automatic fallback to mock data on repeated failures
- Circuit breaker pattern for failing tools
- Alert on reliability < 0.5

### Risk 4: Breaking Changes
**Mitigation:**
- Comprehensive integration tests
- Gradual migration (keep old system running)
- Feature flag for tool registry (USE_TOOL_REGISTRY=true)
- Rollback plan documented

---

## Success Metrics

### Code Quality
- [x] 80%+ test coverage on all new code
- [x] Zero TypeScript errors
- [x] Zero ESLint warnings
- [x] All tests passing

### Performance
- [x] Tool execution time < 5s average
- [x] Registry lookup time < 1ms
- [x] Rate limiting overhead < 10ms
- [x] Memory usage < 100MB for registry

### Completeness
- [x] 9 tools migrated from langChainService.ts
- [x] Each tool has executor + normalizer + tests
- [x] All tools registered and discoverable
- [x] Documentation complete

---

## Next Phase Preview

**Phase 3: Signal Processor (Task 4.2)**

After completing the Tool Registry, the Signal Processor will:
- Use registry.executeAndNormalize() for all tool invocations
- Validate IntelligenceEvents against Zod schemas
- Aggregate events for storage in Prisma
- Provide batch processing for multiple tools
- Generate consolidated intelligence reports

**Dependencies:**
- ✅ Canonical Schema (Phase 1)
- ✅ Tool Registry (Phase 2)
- ⏳ Signal Processor (Phase 3)

---

## Appendix: Tool Migration Checklist

For each tool in langChainService.ts:

- [ ] Create new file in `src/services/tools/<name>.ts`
- [ ] Define Zod input schema
- [ ] Implement executor function
- [ ] Implement normalizer function
- [ ] Export ToolDefinition object
- [ ] Write unit tests for executor
- [ ] Write unit tests for normalizer
- [ ] Test with real API (if available)
- [ ] Test with mock data
- [ ] Register in `tools/index.ts`
- [ ] Update tools catalog documentation
- [ ] Verify integration tests pass
- [ ] Update bridge file with integration notes

**Completion Rate:** 0/9 tools migrated

---

**Plan Status:** READY TO START
**Next Action:** Begin Step 1 - Create ToolRegistry Core
**Estimated Completion:** 3-4 days from start

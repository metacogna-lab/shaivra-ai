# Bridge File - Shared Memory Between Agents

**Purpose:** This file serves as shared memory between agents to prevent architectural drift, conflicting implementations, and ensure consistency across the LanggraphJS integration project.

**Last Updated:** 2026-03-05

---

## 2026-03-05 - Project Initialization

### Decision: Project Structure
- Created `.plans/` directory for plan storage
- Created `tasks/` directory for task definitions
- Established strict TDD workflow (RED-GREEN-REFACTOR)
- All tasks must update this bridge file with architectural decisions

### Schema Discipline Agreement
- All OSINT data MUST normalize to canonical `IntelligenceEvent` schema
- Database models in Prisma MUST match TypeScript types exactly
- State updates MUST use immutable patterns (no mutations)
- API responses MUST validate against Zod schemas

### Tool Chain Decisions
- Package manager: `bun` (per user's global instructions)
- ORM: Prisma with PostgreSQL
- Testing: Vitest for unit/integration, Playwright for E2E
- StateGraph: LangGraph (@langchain/langgraph)
- AI: Google Gemini (`gemini-2.0-flash-exp`)
- Validation: Zod schemas

### Coverage Requirements
- Minimum 80% coverage across all new code
- Unit tests for all services and utilities
- Integration tests for all API endpoints
- E2E tests for critical user flows

---

## Architectural Decisions Log

### 2026-03-05 - Decision: Canonical Schema Structure
- **EntityReference**: Represents discovered entities with confidence scoring
  - Confidence scores: 0.0-1.0 (not percentages)
  - Support for 5 entity types: person, organization, infrastructure, event, unknown
  - Flexible attributes object for entity-specific data
  - Source tracking via sourceIds array
- **Observation**: Atomic intelligence units with full provenance
  - Links to entity via entityId
  - Contains source metadata (tool, url, timestamp, raw data)
  - Supports optional expiration for time-sensitive data
- **Relationship**: Entity connections with evidence
  - Strength and confidence are separate scores (both 0.0-1.0)
  - Evidence array tracks supporting observations
  - Bidirectional flag for symmetric relationships
- **IntelligenceEvent**: Top-level wrapper for tool execution results
  - Contains entities, observations, relationships from single tool run
  - Status: success | partial | failed
  - Metadata includes executionTime, cost, errors, raw output

### 2026-03-05 - Decision: Type Guards
- Implemented `isEntityReference()` and `isIntelligenceEvent()` type guards
- Provides runtime validation of canonical types
- Will be used by signal processor for validation

### Unresolved Questions

_(None yet)_

---

## Schema Changes Log

### 2026-03-05 - Added IntelligenceEvent and TaskQueue Models
**Prisma Models Added:**
- `IntelligenceEvent`: Stores normalized OSINT data from tool executions
  - Foreign key to Investigation (optional)
  - Indexes on: investigationId, traceId, timestamp, tool, status
  - JSON fields for entities, observations, relationships
  - Cascade delete when investigation deleted
- `TaskQueue`: Background task processing queue
  - Priority-based queue (1-10, higher = more urgent)
  - Status: pending | running | completed | failed
  - Retry logic with maxAttempts (default 3)
  - Indexes on: (status, priority), taskType, createdAt

**Investigation Model Extended:**
- Added `intelligenceEvents` relation (one-to-many)

**Migration Status:** Schema updated, migration ready to apply when database available
**Command:** `npx prisma migrate dev --name add_intelligence_events`

### 2026-03-05 - TypeScript Types Created
- Created `src/types/intelligence.ts` with canonical schema
- All types exported for use across application
- Type guards included for runtime validation

---

## Integration Notes

### Data Flow Pattern: Tool → Signal Processor → IntelligenceEvent → Database
1. OSINT tool executes and returns raw data
2. Signal processor normalizes to canonical schema
3. IntelligenceEvent created with all entities/observations/relationships
4. Stored in Prisma database via intelligenceEvents table
5. Linked to Investigation if part of active investigation

### Type Alignment: TypeScript ↔ Prisma
- All TypeScript types in `intelligence.ts` map directly to JSON fields in Prisma
- Prisma client will deserialize JSON to TypeScript types
- No schema drift between code and database

---

## Completed Milestones

- [x] Project structure created
- [x] Task files initialized
- [x] TDD workflow established
- [x] Canonical schema defined (**Task 2.1 COMPLETED**)
  - [x] TypeScript types created
  - [x] Prisma models added
  - [x] Tests written and passing (24 tests, 100% pass rate)
  - [x] Type guards implemented
- [ ] Tool registry implemented
- [ ] Signal processor functional
- [ ] StateGraph operational
- [ ] Task queue + worker running
- [ ] API endpoints migrated
- [ ] Production deployment ready

---

## Notes for Future Agents

**When working on a task:**
1. Read this bridge file FIRST
2. Log all architectural decisions HERE
3. Update schema changes immediately
4. Note integration patterns for other agents
5. Flag unresolved issues for user input

**This file prevents:**
- Conflicting type definitions
- Incompatible state management
- Schema mismatches
- Integration failures
- Architectural drift

# Task Management - LanggraphJS Integration

## Overview

This directory contains task definitions for the LanggraphJS integration project. Each task follows a strict TDD workflow and logs progress, decisions, and completion status.

## Workflow Rules

### TDD Cycle (Mandatory)

For every task:

1. **RED Phase** - Write tests first
   - Create test file
   - Write comprehensive test cases
   - Run tests - they MUST fail
   - Commit: `test: add tests for <feature>`

2. **GREEN Phase** - Minimal implementation
   - Write code to pass tests
   - Run tests - they MUST pass
   - Commit: `feat: implement <feature>`

3. **IMPROVE Phase** - Refactor
   - Clean up code
   - Ensure immutability patterns
   - Run tests - they MUST still pass
   - Commit: `refactor: improve <feature>`

### Schema Discipline

**CRITICAL:** All components must align with canonical schema:

- OSINT tools MUST output raw data
- Signal processor MUST normalize to `IntelligenceEvent`
- Investigation state MUST use immutable updates
- Database models MUST match TypeScript types
- API responses MUST validate against schemas

### Branch Strategy

```bash
# Create feature branch
git checkout -b feature/<task-id>-<short-name>

# Example
git checkout -b feature/2.1-canonical-schema
```

### Task Log Updates

After each phase, update task log:

```markdown
## Task Log

### [Date] - Status Update
- Status: IN PROGRESS / COMPLETED / BLOCKED
- Phase: RED / GREEN / IMPROVE
- Notes: What was accomplished
- Blockers: Any issues encountered
- Commit: <commit-hash>
```

### Integration via Bridge

All architectural decisions, schema changes, and integration notes MUST be logged in `tasks/bridge.md` to prevent drift between agents and ensure consistency.

## Task File Structure

Each task file contains:

- **Objective** - What needs to be built
- **Implementation** - Step-by-step instructions
- **File Locations** - Paths to create/modify
- **Integration** - Dependencies and connections
- **Tests** - Test requirements and scenarios
- **Acceptance Criteria** - Definition of done
- **Task Log** - Status, Notes, Commits

## Epics Overview

| Epic | Description | Status |
|------|-------------|--------|
| 1 | Investigation Orchestrator | NOT STARTED |
| 2 | Canonical Schema | NOT STARTED |
| 3 | Tool Registry | NOT STARTED |
| 4 | Signal Processor | NOT STARTED |
| 5 | Actor Fingerprint Engine | NOT STARTED |
| 6 | Identity Investigation Graph | NOT STARTED |
| 7 | LangSmith Observability | NOT STARTED |
| 8 | Report Generation | NOT STARTED |

## Task Dependencies

```
2.1 (Canonical Schema) → 3.1 (Tool Registry)
3.1 → 4.2 (Signal Processor)
4.2 → 1.2 (Investigation State)
1.2 → 1.3 (Investigation Graph)
1.3 → 1.4 (Task Queue)
1.4 → 1.5 (Async Worker)
```

## Coverage Requirements

- Unit tests: 80%+ coverage
- Integration tests: Cover all API endpoints
- E2E tests: Critical user flows
- Run `bun test --coverage` after each task

## Verification Checklist

Before marking task COMPLETED:

- [ ] All tests passing (RED-GREEN cycle verified)
- [ ] 80%+ test coverage achieved
- [ ] Code follows immutability patterns
- [ ] Types align with canonical schema
- [ ] Bridge file updated with decisions
- [ ] Task log updated with commit hash
- [ ] Branch merged to main

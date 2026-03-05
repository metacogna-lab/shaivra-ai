# LanggraphJS Integration Plan - Shaivra Intelligence Suite

**Plan ID:** piped-tinkering-puzzle
**Created:** 2026-03-05
**Status:** IN PROGRESS
**Timeline:** 6 weeks (42 days)

## Overview

Replace the basic agent network system with production-ready LangGraph StateGraph architecture, implementing canonical intelligence schemas, persistent state management, centralized tool registry, and async task processing.

## Goals

1. ✅ StateGraph replaces `runAgentNetwork()` loop
2. ✅ All OSINT signals normalized to canonical schema
3. ✅ Tool registry manages all 9+ OSINT tools
4. ✅ Persistent state management via Prisma
5. ✅ Task queue enables async background processing
6. ✅ 80%+ test coverage across all new code
7. ✅ Zero regression in existing functionality
8. ✅ API endpoints functional and documented
9. ✅ Production-ready error handling and monitoring
10. ✅ Clean migration with feature flag strategy

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Epic 2.1: Canonical Schema
- Epic 3.1: Tool Registry

### Phase 2: Signal Processing (Week 2)
- Epic 4.2: Signal Processor
- Epic 1.2: Investigation State

### Phase 3: StateGraph (Week 3)
- Epic 1.3: Investigation Graph + Orchestrator

### Phase 4: Async Processing (Week 4)
- Epic 1.4: Task Queue
- Epic 1.5: Async Worker

### Phase 5: Advanced Features (Week 5)
- Epic 5.1: Actor Fingerprint Engine
- Epic 6.1: Identity Investigation Graph
- Epic 7.1: LangSmith Observability
- Epic 8.3: Report Generation

### Phase 6: Migration (Week 6)
- API Integration
- Cleanup and Documentation

## Current Status

**Phase:** 1 - Foundation
**Current Task:** Setting up project structure
**Next Task:** 2.1 - Canonical Schema

## Notes

- Using strict TDD workflow (RED-GREEN-REFACTOR)
- All tasks logged in `tasks/` directory
- Bridge file tracks decisions and integration points
- Minimum 80% test coverage required
- Using bun as package manager
- Prisma for database ORM

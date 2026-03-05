# Shaivra Intelligence Suite - Task Management

This directory contains task definitions for implementing the LanggraphJS integration plan.

## Workflow Rules

1. **Schema Discipline**: All OSINT tools MUST normalize to the canonical schema (`src/contracts/intelligence.ts`)
2. **Immutability**: Always create new objects, never mutate existing ones
3. **TDD Workflow**: Write tests first (RED), implement (GREEN), refactor (IMPROVE)
4. **File Organization**: Many small files > few large files (200-400 lines typical, 800 max)
5. **Error Handling**: Handle errors explicitly at every level with user-friendly messages

## Task Structure

Each task file (tasks/*.md) contains:
- **Objective** - What needs to be built
- **Implementation** - Step-by-step instructions
- **File Locations** - Paths to create/modify
- **Integration** - Dependencies and connections
- **Tests** - Test requirements and scenarios
- **Acceptance Criteria** - Definition of done
- **Task Log** - Status, Notes, Commit Hash

## Bridge File

The `bridge.md` file serves as **shared memory between agents** to prevent drift and conflicting implementations.

## Current Phase

**Phase 2A: Normalization Layer** - Create the critical missing link between tool integrations and canonical schema.

## Active Tasks

- `2a-1-base-normalizer.md` - Create normalizer interface
- `2a-2-shodan-normalizer.md` - Shodan → IntelligenceEvent
- `2a-3-virustotal-normalizer.md` - VirusTotal → IntelligenceEvent
- `2a-4-alienvault-normalizer.md` - AlienVault → IntelligenceEvent
- `2a-5-twitter-normalizer.md` - Twitter → IntelligenceEvent
- `2a-6-reddit-normalizer.md` - Reddit → IntelligenceEvent
- `2a-7-normalizer-registry.md` - Central normalizer lookup
- `2a-8-osint-aggregator-integration.md` - Modify osintAggregator to use normalizers
- `2a-9-integration-tests.md` - End-to-end normalization tests

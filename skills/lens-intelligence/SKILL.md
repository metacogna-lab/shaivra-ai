---
name: analyzing-osint-intelligence
description: Extracts entities, relationships, and sentiment from open-source intelligence and builds a structured knowledge graph.
---

# OSINT Intelligence Analysis

## Instructions

1. **Collect sources** — Ingest from selected public sources (see references/ingestion_sources.md).
2. **Normalize data** — Unify schemas and timestamps.
3. **Extract entities** — NER and relationship extraction (entity_extraction.py).
4. **Resolve identities** — Deduplicate and merge entities (resolve_entities.py).
5. **Construct graph relationships** — Build nodes and edges (build_graph.ts).
6. **Store intelligence objects** — Output graph compatible with Neo4j/GraphDB and canonical schema.

## Entity types

- Person
- Organization
- Infrastructure
- Digital Asset
- Financial Flow
- Event
- Narrative

## Output

Graph data (nodes/edges JSON) compatible with Neo4j/GraphDB; maps to `EntityReference`, `Relationship`, and `IntelligenceEvent` in `src/types/intelligence.ts`. See references/schemas.md and assets/entity_schema.json.

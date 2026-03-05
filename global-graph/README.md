# Global Graph — Palantir-style Intelligence Ontology

Ontology-driven graph layer for the Shaivra intelligence suite. Defines object types, link types, temporal model, Intelligence Event schema, and Decision layer. All graph logic lives under `/global-graph`; the backend uses Memgraph and Qdrant and calls into this module for schema and writes.

## Ontology overview

- **Object types (entities):** Actor, Organization, Infrastructure, Event, Narrative, Document, Source, Decision. Each has a fixed set of properties (see `ontology/objectTypes.ts`).
- **Link types (edges):** controls, funds, participates_in, owns, located_in, amplifies, mentions, hosts, registered_to, associated_with, communicated_with, part_of, promotes, attacked, derived_from. Stored in Memgraph as Cypher relationship types (e.g. `FUNDS`).
- **Temporal model:** Nodes and edges can carry `observed_at`, `valid_from`, `valid_to`, `confidence`. Aligns with `firstSeen`/`lastSeen` and `firstObserved`/`lastObserved` in downstream contracts.
- **Intelligence Event (ontology):** Normalized shape for signals entering the graph: `event_id`, `timestamp`, `source_type` (osint | cyber | financial), `raw_source`, `entities_detected`, `relationships_detected`, `confidence`, `vector_embedding` (optional).
- **Decision layer:** Type `Decision` with `decision_id`, `related_entities`, `hypothesis`, `confidence`, `recommended_action` (monitor | escalate | archive | investigate). Storable as `:Decision` nodes in Memgraph or in Postgres; ontology defines the shape only.

## Mapping from existing IntelligenceEvent

Backend/ingestion currently produce `IntelligenceEvent` (see `src/contracts/intelligence.ts`). To feed the ontology builder without changing ingestion:

| IntelligenceEvent field | Ontology Intelligence Event field |
|------------------------|-----------------------------------|
| `id`                   | `event_id`                        |
| `timestamp`            | `timestamp` (ISO string)          |
| `tool`                 | Map to `source_type`: osint / cyber / financial by tool name or config |
| —                      | `raw_source` (optional, from metadata or target) |
| `entities`             | Map each to `entities_detected`: `id`, `object_type` from `ENTITY_TYPE_TO_OBJECT_TYPE[entity.type]`, `name`, `alias` from `aliases`, `confidence`, `attributes` |
| `relationships`        | Map each to `relationships_detected`: `from_entity_id`, `to_entity_id`, `link_type` via `EXISTING_REL_TO_LINK[rel.type]`, `confidence`, optional `source_reference` |
| —                      | `confidence` (event-level; e.g. from status or metadata) |
| —                      | `vector_embedding` (optional; from enrichment if available) |

Adapter logic can live in the backend or in a thin wrapper that accepts `IntelligenceEvent` and returns `IntelligenceEventOntology` (e.g. by calling the ontology’s `intelligenceEventSchema.parse` after mapping).

## Memgraph schema (apply steps)

1. Ensure Memgraph is running (e.g. `docker compose up -d memgraph`).
2. Run the Cypher DDL once. From repo root, statements in `global-graph/schema/memgraph.cypher` must be executed in order (constraints and indexes). Memgraph typically does not run multi-statement scripts in one call; execute each statement separately via your driver or mgconsole.
3. See `global-graph/schema/README.md` for apply options and migration notes from the legacy `Entity`/`RELATED` model.

## Structural integrity (pre-write validation)

Before writing to the graph, run `validateGraphStructure(event)` from `global-graph/validation`. It ensures:

- **Entity schema consistency** — valid object types, UUIDs, confidence in [0, 1].
- **Relationship schema integrity** — valid link types, endpoints and confidence in range.
- **Evidence linkage** — every relationship has supporting evidence (per-relationship `source_reference` or event-level `source_type`).
- **Confidence scoring** — all confidence values in [0, 1].
- **No orphan relationships** — every `from_entity_id` and `to_entity_id` appears in `entities_detected`.
- **Signal traceability** — event has a valid `source_type` so every signal is traceable to a source.

Use `validateGraphStructureOrThrow(event)` in strict pipelines to throw on any failure.

## Using the builder and queries

- **Builder:** `intelligenceEventToGraphOps(event)` returns `{ nodes, edges }`. Call `validateGraphStructure(event)` first if you need structural guarantees. `toCypherWrites(ops, idToLabelMap(ops))` returns Cypher strings for MERGE of nodes and edges. The backend (or a job) should run these in order with a Memgraph session.
- **Queries:** `queryByObjectType('Actor', { minRiskScore: 50 })`, `queryByLinkType('funds', { fromLabel: 'Actor', toLabel: 'Organization' })`, `queryTemporalWindow({ atTime: '2025-01-01T00:00:00Z', objectType: 'Event' })`, `queryNeighborhood(nodeId, 2)`. Each returns `{ cypher, params }` for use with the Memgraph driver.

## AWS as deployment target

Production deployment is targeted at **AWS** (no Railway). Recommended pattern:

- **Compute:** ECS/Fargate for the app and any graph workers.
- **Graph:** Managed Memgraph (e.g. Memgraph Cloud) or self-hosted Memgraph on EC2/ECS, with Bolt on 7687.
- **Vector:** Qdrant Cloud or self-hosted Qdrant; same as current hybrid retrieval (vector + graph).
- **Relational:** RDS (Postgres) for app and optional Decision table if not stored in graph.
- **Raw data:** S3 for raw intelligence and artifacts.
- **Streaming:** Redpanda/Kafka (e.g. MSK) if event-driven ingestion is added.

No Terraform or ECS task definitions are included in this repo; document and implement infra in your own AWS accounts.

## Decision storage (Memgraph vs Postgres)

- **Memgraph:** Create `:Decision` nodes and edges to related entities. Use the same ontology schema and `queryByObjectType('Decision')` / `queryTemporalWindow` for retrieval.
- **Postgres:** Add a `decisions` table with columns matching `DecisionOntology` (`decision_id`, `related_entities` array or JSONB, `hypothesis`, `confidence`, `recommended_action`, `created_at`). No change to the ontology; it remains the single shape definition.

## Observability

No new tooling is added. Use existing LangSmith/tracing and Prometheus/Grafana. Recommended metrics for future instrumentation: `nodes_created` (by label), `edges_created` (by type), `duplicate_rate`, `graph_query_latency` (p50/p99).

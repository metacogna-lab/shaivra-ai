# Lens schemas and canonical mapping

Skill-layer objects used by Lens and how they map to the app canonical schema in `src/contracts/intelligence.ts`.

## Intelligence Object (skill-layer)

- `entity_id` (uuid) → `EntityReference.id`
- `type` (person | organization | infrastructure | event | unknown; skill-layer may add digital_asset, financial_flow, narrative) → `EntityReference.type`
- `name` → `EntityReference.name`
- `aliases` → `EntityReference.aliases`
- `confidence` (0.0–1.0) → `EntityReference.confidence`
- `sources` → `EntityReference.sourceIds` (observation IDs)
- `relationships` → expressed as separate Relationship objects

## Relationship Object (skill-layer)

- `source` → `Relationship.fromEntityId`
- `target` → `Relationship.toEntityId`
- `relationship` → `Relationship.type`
- `confidence` (0.0–1.0) → `Relationship.confidence` and/or `strength`
- Evidence and temporal metadata map to `Relationship.evidence` and `Relationship.metadata`

## Narrative Object (Forge-facing)

- `narrative_id`, `topic`, `origin` (entity_id), `sentiment`, `vector_embedding`
- Logical type for influence modeling; not a separate `EntityReference.type` in canonical schema unless extended later. Map to event or store in Forge-specific outputs.

## Temporal and uncertainty

- Design guidance only in this phase: use `event_time`, `observation_time`, `prediction_time` where relevant; model confidence with Bayesian or 0–1 scores per bridge rules.

# Entity resolution

Identity resolution and deduplication design for Lens.

## Goals

- Merge entities that refer to the same real-world person, organization, or asset.
- Preserve source attribution and confidence; combine evidence into a single canonical entity per resolution group.

## Approach

- **Input:** JSON array of entities from entity_extraction (and optional relationship hints).
- **Steps:** Normalize names (lowercase, trim), match on name + type; optional fuzzy match (e.g. Levenshtein) for aliases. Group by equivalence class; pick canonical id (e.g. first or highest-confidence).
- **Output:** Resolved/merged entity list with stable ids; relationships updated to reference resolved ids.

## Script

`scripts/resolve_entities.py` — reads entity list from stdin or file; outputs resolved entities JSON. Stub implementation may pass through with simple dedup by name.

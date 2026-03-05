"""Entity node: extract and resolve entities (entity_extraction, resolve_entities)."""
from langgraph.tools import lens_tools


def run(state: dict) -> dict:
    """Run entity extraction and resolution; state has raw_text or ingestion. Return state with entities."""
    raw = state.get("raw_text") or (state.get("ingestion", {}).get("target") or "")
    if not raw:
        return {**state, "entities": []}
    entities = lens_tools.entity_extraction(raw)
    entities = lens_tools.resolve_entities(entities)
    return {**state, "entities": entities}

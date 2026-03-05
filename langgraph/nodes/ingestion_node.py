"""Ingestion node: call Lens ingest (ingest_sources)."""
from langgraph.tools import lens_tools


def run(state: dict) -> dict:
    """Run ingestion; state has target, sources. Return state with ingestion key."""
    target = state.get("target", "")
    sources = state.get("sources", "web")
    out = lens_tools.ingest_sources(target, sources)
    return {**state, "ingestion": out}

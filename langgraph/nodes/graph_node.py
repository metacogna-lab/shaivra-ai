"""Graph node: build graph from entities (build_graph)."""
from langgraph.tools import lens_tools


def run(state: dict) -> dict:
    """Build graph from entities; state has entities, optional relationships. Return state with graph."""
    entities = state.get("entities", [])
    relationships = state.get("relationships", [])
    graph = lens_tools.build_graph(entities, relationships if relationships else None)
    return {**state, "graph": graph}

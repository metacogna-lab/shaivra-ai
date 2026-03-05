"""Narrative node: Forge simulation and narrative embedding."""
from langgraph.tools import forge_tools


def run(state: dict) -> dict:
    """Simulate propagation and optional embedding; state has graph. Return state with narrative_simulation."""
    graph = state.get("graph", {})
    nodes = graph.get("nodes", [])
    seeds = [n["id"] for n in nodes[:1]] if nodes and isinstance(nodes[0], dict) else []
    activated = forge_tools.simulate_network(graph, seeds, steps=5)
    text = " ".join(str(n.get("label", n)) for n in nodes[:5]) if nodes else "stub"
    embedding = forge_tools.narrative_embedding(text)
    return {
        **state,
        "narrative_simulation": {"activated": activated, "embedding": embedding},
    }

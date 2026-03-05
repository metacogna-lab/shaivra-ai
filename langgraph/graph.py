"""
LangGraph workflow: ingestion -> entity -> graph -> narrative -> defense.
Reference: skills/orchestrator/references/pipeline.md
"""
import json
import sys
from pathlib import Path

# Allow running from repo root: python langgraph/graph.py
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from langgraph.nodes import ingestion_node, entity_node, graph_node, narrative_node, defense_node


def run_pipeline(target: str, sources: str = "web", raw_text: str = "") -> dict:
    """Run full DAG; return state with graph, narrative_simulation, threat_surface."""
    state = {"target": target, "sources": sources, "raw_text": raw_text or target}
    state = ingestion_node.run(state)
    state = entity_node.run(state)
    state = graph_node.run(state)
    state = narrative_node.run(state)
    state = defense_node.run(state)
    return state


def main():
    target = "example.com"
    if len(sys.argv) > 1:
        target = sys.argv[1]
    sources = sys.argv[2] if len(sys.argv) > 2 else "web"
    state = run_pipeline(target, sources)
    # Emit standard outputs
    print(json.dumps({
        "entity_graph": state.get("graph"),
        "narrative_simulation": state.get("narrative_simulation"),
        "threat_surface": state.get("threat_surface"),
    }, indent=2))


if __name__ == "__main__":
    main()

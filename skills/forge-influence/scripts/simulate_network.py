#!/usr/bin/env python3
"""Run diffusion on a graph from seed nodes. Input: graph JSON (nodes/edges) and seed list. Output: list of activated node ids."""
import json
import random
import sys

def simulate_diffusion(G, seed_nodes: list, steps: int = 5, prob: float = 0.3) -> list:
    activated = set(seed_nodes)
    for _ in range(steps):
        new_nodes = set()
        for node in activated:
            for neighbor in G.neighbors(node):
                if neighbor not in activated and random.random() < prob:
                    new_nodes.add(neighbor)
        activated |= new_nodes
    return list(activated)

if __name__ == "__main__":
    try:
        import networkx as nx
    except ImportError:
        print(json.dumps({"error": "networkx required"}), file=sys.stderr)
        try:
            data = json.load(sys.stdin)
        except (json.JSONDecodeError, EOFError):
            data = {}
        seeds = data.get("seeds", [])
        if isinstance(seeds, str):
            seeds = [seeds]
        print(json.dumps({"activated": seeds}))
        sys.exit(0)
    if len(sys.argv) >= 2 and sys.argv[1] != "-":
        with open(sys.argv[1]) as f:
            data = json.load(f)
        seeds = json.loads(sys.argv[2]) if len(sys.argv) > 2 else None
    else:
        data = json.load(sys.stdin)
        seeds = data.get("seeds")
        data = data.get("graph", data)
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])
    G = nx.Graph()
    for n in nodes:
        G.add_node(n.get("id", n) if isinstance(n, dict) else n)
    for e in edges:
        s, t = e.get("source"), e.get("target")
        if s is not None and t is not None:
            G.add_edge(s, t)
    if seeds is None:
        seeds = [nodes[0]["id"]] if nodes and isinstance(nodes[0], dict) else (list(G.nodes())[:1] if G.nodes() else [])
    if isinstance(seeds, str):
        seeds = [seeds]
    out = simulate_diffusion(G, seeds)
    print(json.dumps({"activated": out}))

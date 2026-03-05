---
name: modeling-information-ecosystems
description: Simulates narrative propagation across social networks using graph topology and psychographic audience modeling.
---

# Information Ecosystem Simulation

## Instructions

1. **Load entity graph** — Input graph from Lens (nodes/edges JSON).
2. **Identify narrative nodes** — Nodes that carry or propagate narratives.
3. **Model audience segments** — Psychographic profiles (see references/psychographic_models.md).
4. **Simulate propagation** — Run diffusion (simulate_network.py) and optional narrative_embedding.py.
5. **Evaluate influence impact** — Reach, echo chambers, mutation, resistance.

## Key metrics

- reach probability
- echo chamber amplification
- narrative mutation
- resistance threshold

## Scripts

- `simulate_network.py` — NetworkX diffusion from seed nodes; CLI accepts graph file and seed list.
- `narrative_embedding.py` — Stub or embedding API for narrative text/graph; optional deps.

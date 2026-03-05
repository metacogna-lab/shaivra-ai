# OSINT Skills

Claude Code skills for Lens (OSINT ingestion, entity extraction, graph), Forge (influence simulation), Shield (counterintelligence), and Orchestrator (pipeline).

## Structure

- **lens-intelligence** — Collect, normalize, extract entities, resolve, build graph.
- **forge-influence** — Narrative propagation and psychographic modeling.
- **shield-counterintel** — Credential leak check, domain watch, honeypot stubs.
- **orchestrator** — Pipeline reference and AI orchestration (Claude Code, Gemini CLI, OpenAI).

See [SKILLS_BEST_PRACTICES.md](SKILLS_BEST_PRACTICES.md) for agent guidance.

## Dependencies

- **Python 3:** Used by Lens and Forge scripts. Optional:
  - `spacy` + `en_core_web_trf` for `entity_extraction.py` (NER).
  - `networkx` for `simulate_network.py` (diffusion).
- **Bun / Node:** For `build_graph.ts` and `deploy_honeypot.ts`; run with `bun run <script>` or `ts-node`.
- **LangGraph:** `langgraph/graph.py` and nodes use the skill scripts; run with `python3 langgraph/graph.py <target> [sources]` from repo root. Optional: `langgraph` package if extending with LangGraph SDK.

## Running the pipeline

From repo root:

```bash
python3 langgraph/graph.py <target> [sources]
# or
./scripts/run_pipeline.sh <target> [sources]
```

Outputs: entity_graph, narrative_simulation, threat_surface (JSON).

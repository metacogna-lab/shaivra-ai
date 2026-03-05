---
name: orchestrating-intelligence-pipelines
description: Runs multi-stage intelligence workflows combining OSINT ingestion, knowledge graph analysis, influence simulation, and security monitoring.
---

# Orchestrating Intelligence Pipelines

## When to use

Use this skill when conducting strategic intelligence investigations requiring:

- multi-source OSINT collection
- entity relationship analysis
- narrative propagation modeling
- cybersecurity threat monitoring

## Workflow

1. **Collect intelligence** using `lens-intelligence` (ingest, normalize, extract entities).
2. **Resolve entities and build graph** (Lens scripts: resolve_entities, build_graph).
3. **Simulate narrative propagation** with `forge-influence` (simulate_network, narrative_embedding).
4. **Activate defensive monitoring** via `shield-counterintel` (credential_scan, domain_watch, deploy_honeypot).
5. **Generate intelligence brief** (entity_graph.json, narrative_simulation.json, threat_surface.json, intelligence_report.md).

## Outputs

- `entity_graph.json` — nodes and edges from Lens.
- `narrative_simulation.json` — propagation results from Forge.
- `threat_surface.json` — Shield scan summary.
- `intelligence_report.md` — human-readable brief.

## References

- [pipeline.md](references/pipeline.md) — DAG and schema pointers.
- [ai_orchestration.md](references/ai_orchestration.md) — Claude Code, Gemini CLI, OpenAI orchestration.

# AI Orchestration (Claude Code, Gemini CLI, OpenAI Codex)

How to use Claude Code (Cursor), Gemini CLI, or OpenAI API–based agents as the orchestration layer for the full application set: skills (Lens, Forge, Shield), langgraph, and the Shaivra app (Express server, React portal). Orchestrators decide when to run which skill or node; they do not replace the server or UI.

## Unified contract

All skill scripts and `langgraph/graph.py` expose a consistent interface:

- **CLI args:** e.g. `--target`, `--sources`; scripts document their own args.
- **Stdin:** Bulk input (e.g. raw text for entity_extraction, entity JSON for build_graph).
- **Stdout:** JSON or text output so pipelines can chain with `|` or driver scripts.
- **Env:** Secrets (API keys), feature flags, and optional config (e.g. `LEAKCHECK_API_KEY`).

Any AI orchestrator can invoke the same commands without tool-specific glue.

**Unified driver:** From repo root, run `./scripts/run_pipeline.sh <target> [sources]` (or `python3 langgraph/graph.py <target> [sources]`). Both produce the same JSON outputs (entity_graph, narrative_simulation, threat_surface). Use this entrypoint so Claude Code, Gemini CLI, and OpenAI callers get identical behavior.

## Claude Code (Cursor / Claude Code)

- **Role:** Primary IDE/agent for interactive development and one-off runs.
- **Loading:** Skills via SKILL.md and `.cursor/rules/`; scripts run via terminal.
- **Commands:** For “full pipeline” run the driver script with target (and optional sources). For “Lens only” run lens-intelligence scripts in order (ingest_sources.sh → entity_extraction.py → resolve_entities.py → build_graph.ts). For “Shield scan” run credential_scan.sh and/or domain_watch.py.
- **State:** Use `tasks/bridge.md` for shared state and decisions. Cursor commands (e.g. `.cursor/commands/run_skill_pipeline.md`) should call the unified contract so behavior is reproducible by other orchestrators.

## Gemini CLI

- **Role:** Scripted or CI runs when Gemini is already the LLM.
- **How:** Run the same pipeline via the unified driver script (target + optional sources). Alternatively, a small driver accepts target/sources and calls `ingest_sources.sh` → `entity_extraction.py` → … → `langgraph/graph.py`, or passes a prompt and pipeline description to Gemini with tool definitions that map to these scripts.
- **Secrets:** Reuse `GEMINI_API_KEY` where applicable. Gemini can also be used for narrative/report generation steps already in the Express server.

## OpenAI Codex / OpenAI API agents

- **Role:** “Codex” here means OpenAI-based code execution or agentic runners (Assistants API, custom agents that call tools). Use for teams standardized on OpenAI agents or for comparison.
- **Contract:** Same unified contract. Orchestrator receives a high-level task (e.g. “run OSINT pipeline for target X”) and executes the same skill scripts and/or langgraph via subprocess or a small local API.
- **Optional:** Wrapper that exposes pipeline steps as OpenAI-compatible tools (name, description, parameters) so an OpenAI agent can choose the next step. No Codex-specific product dependency.

## Orchestration matrix

| Context | Prefer |
|--------|--------|
| Interactive development, one-off runs in Cursor | Claude Code |
| Scripted or CI runs, Gemini as LLM | Gemini CLI |
| OpenAI-standardized teams or comparison | OpenAI API agents |

All three should produce the same outputs (`entity_graph.json`, `narrative_simulation.json`, `threat_surface.json`, `intelligence_report.md`) for the same inputs.

## Persistence

When an AI orchestrator runs the skill pipeline (unified driver or individual scripts), **persistence to the app is the caller’s responsibility**. Skills produce JSON output (entity_graph, narrative_simulation, threat_surface, etc.); they do not write to the project DB or Memgraph. To persist into the Shaivra app (project history or knowledge base), the caller must feed that output through the app’s ingest→normalize→enrich pipeline—e.g. via a future API that accepts pipeline output and runs it through that path. See [docs/ingestion-and-concerns.md](../../../docs/ingestion-and-concerns.md) for separation of concerns and integration points.

## Security and boundaries

- Orchestrators run in the same security context as the developer (or CI). No elevated privileges by default.
- **Credential scan** and other sensitive scripts must use env-based keys and respect rate limits; document in shield-counterintel references.
- Sandboxing (e.g. Docker) is optional; note in `infra/docker/` when used.

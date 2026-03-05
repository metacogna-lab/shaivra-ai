Run the OSINT skill pipeline and record the run in tasks/bridge.md.

1. Run the unified pipeline with a target (and optional sources):
   - `./scripts/run_pipeline.sh <target> [sources]`
   - or `python3 langgraph/graph.py <target> [sources]`
2. Append to tasks/bridge.md under "Completed Milestones" or a "Pipeline runs" subsection:
   - Date, target, sources, and one-line outcome (e.g. "Pipeline completed; entity_graph nodes: N").

Use the same entrypoint so behavior is reproducible by Claude Code, Gemini CLI, and OpenAI callers (see skills/orchestrator/references/ai_orchestration.md).

# OSINT Skills Best Practices

Summary for agents: how to prepare and use Claude Code skills in the Shaivra OSINT skillset.

## Progressive disclosure

- Load **metadata and SKILL.md** first when a skill is relevant.
- Load **references/** and **scripts/** only when needed for a specific step.
- Keeps context usage low while preserving full domain knowledge.

## Modular skill folders

- Each skill: **SKILL.md** + **references/** + **scripts/** (+ **assets/** where applicable).
- References hold schemas, source lists, and design docs; scripts are executable entrypoints.
- No implementation code in SKILL.md or best-practices docs.

## Script execution

- **Env:** Use environment variables for secrets (API keys) and feature flags; never hardcode.
- **Exit codes:** 0 = success; non-zero = failure; document expected codes in skill references.
- **Stdin/stdout:** Prefer stdin for bulk input and stdout for JSON/text so scripts compose in pipelines.
- **Optional deps:** Document optional dependencies (e.g. spacy, networkx); scripts should fail with a clear message if a dep is missing.

## DAG orchestration

- **Orchestrator** skill defines the pipeline (Lens → Forge → Shield).
- **LangGraph** implements the runnable DAG (ingestion → entity → graph → narrative → defense).
- AI orchestrators (Claude Code, Gemini CLI, OpenAI) invoke the same unified contract (CLI args, stdin/stdout, env).

## Security

- **Context isolation:** Skill scripts do not depend on global app state; pass inputs explicitly.
- **Tool permission:** Sensitive scripts (e.g. credential_scan) must respect env-based keys and rate limits.
- **Schema validation:** Validate inputs and outputs against the canonical schema where data crosses boundaries.
- **Sandbox:** Optional; document in infra/docker for production.
- **Audit:** Log invocations and outcomes for sensitive operations.

## Canonical schema alignment

- **Confidence:** 0.0–1.0 (not percentages).
- **IDs:** UUIDv4 for entities, observations, relationships.
- **Source attribution:** Every observation tracks tool, timestamp, and raw data.
- **Immutability:** Do not mutate existing objects; return new copies.
- See `src/types/intelligence.ts` and `tasks/bridge.md` for full rules.

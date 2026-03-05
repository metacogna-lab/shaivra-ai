# OSINT Pipeline Optimisation Plan

## Current State
- `/api/osint/*` routes proxy directly to Gemini or third-party APIs with no caching or persistence.
- Lens pipeline steps (`runAdvancedIngestion`, normalization, enrichment) live purely in the frontend mocks.
- Agent investigations and the "master graph" are stored in-memory; results disappear on restart.

## Opportunities
1. **Adopt OSS Recon Services**
   - **SpiderFoot**: Run automated sweeps per target and import JSON outputs into the master graph to replace scattered Gemini prompts.
   - **IntelOwl**: Centralize Shodan/AlienVault/VT lookups behind IntelOwl analyzers to gain caching, credential rotation, and multi-analyzer orchestration.
   - **OpenCTI**: Use as the canonical STIX graph store so `/api/agent/investigate` writes to a persistent intelligence database with audit trails.
2. **Queue + Workers**
   - Move Lens ingestion, fingerprinting, and Maltego tasks into a worker queue (BullMQ/Temporal) so the HTTP layer just enqueues jobs and streams updates via SSE/WebSocket.
3. **Evidence & Provenance**
   - Persist raw artifacts (JSON, screenshots, PCAP) alongside normalized triples. Every API response should reference stored evidence IDs.
4. **Caching & Rate Limits**
   - Use Redis to deduplicate identical queries for a TTL, track quota usage per provider, and surface metrics to observability dashboards.
5. **Tool Routing Layer**
   - Implement a policy module (LangGraph or custom rules) that selects which toolset (Gemini vs. SpiderFoot vs. IntelOwl) to call based on target attributes, improving coverage and reducing vendor lock-in.

## Next Steps
1. Stand up SpiderFoot/IntelOwl containers and create lightweight clients inside `src/services`.
2. Introduce a persistence layer (PostgreSQL + Redis) for master graph storage and caching.
3. Replace the mocked Lens pipeline by wiring each step to queued worker jobs that emit events back to the UI.
4. Expand automated tests to cover new tool adapters and queue lifecycles.

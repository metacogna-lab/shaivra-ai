# OSINT Capability Review

This document captures the current Open-Source Intelligence (OSINT) surface inside the Shaivra Intelligence Suite, highlights implementation gaps, and outlines next steps for expanding the autonomous agent network with resilient open tooling.

## What Exists Today

| Layer | Implementation | Notes |
| --- | --- | --- |
| **Server API** | `/api/osint/shodan`, `/api/osint/alienvault`, `/api/osint/virustotal`, `/api/osint/fingerprint`, `/api/osint/maltego` (`server.ts:228-413`, `1067-1103`) | Each route is a lightweight proxy that fans out to Gemini (`GoogleGenAI`) or raw HTTP requests. Responses are returned synchronously and never persisted. |
| **Search & Summaries** | `/api/search`, `/api/summarize`, `/api/analytics/summary` | Heavy reliance on Gemini for both retrieval-augmented search and analyst-facing summaries. No caching across users or projects. |
| **Lens Pipeline** | `portalApi.runAdvancedIngestion`, `simulateNormalization`, `simulateEnrichment`, etc. (`src/services/portalApi.ts:900-280`) consumed in `src/pages/portal/Lens.tsx`. | Pipeline stages are mocked client-side. They assume Gemini-backed ingest plus deterministic d3 updates but there is no queueing or persistence. |
| **Investigations** | `/api/agent/investigate` orchestrates `runAgentNetwork`, which also depends on Gemini. | The "agent network" keeps state in memory and loses history after process restarts. Logs/citations are not persisted. |

## Current Gaps

1. **Single Vendor Dependency** – Every enrichment step leans on Gemini, which limits resilience and makes it impossible to run in air-gapped or cost-sensitive environments.
2. **No Source Authentication / Rate-Limit Handling** – Shodan/AlienVault API keys are required but not centrally managed. There is no retry or quota awareness.
3. **No Persistence Layer** – OSINT results are never written to storage; the Lens UI receives ephemeral mocks and the backend maintains master graphs/jobs purely in-memory.
4. **Missing Evidence Chain** – Responses returned to the UI lack structured provenance beyond whatever Gemini produces. Analysts cannot cross-check raw evidence.
5. **Limited Tooling Diversity** – Apart from Gemini and placeholder fetches there is no integration with open-source reconnaissance frameworks that the agent network could delegate to.

## Recommended Open-Source Augmentations

| Tool | Why | Integration Sketch |
| --- | --- | --- |
| **SpiderFoot** (GPL) | Automated recon across >200 OSINT data sources with a headless CLI. | Run SpiderFoot scans per project via queued workers; ingest JSON results into the master graph instead of hitting each source manually. |
| **IntelOwl** (AGPL) | Modern microservice OSINT orchestrator that unifies malware, IOC, and CTI lookups. | Deploy IntelOwl as an internal service; replace direct Shodan/AlienVault fetches with IntelOwl analyzers so rate limiting, caching, and evidence storage are centralized. |
| **OpenCTI** (Apache 2.0) | Graph-first intelligence platform with STIX 2.1 support. | Use OpenCTI as the canonical master graph store; `/api/agent/investigate` would publish into OpenCTI collections, enabling deduplication, tagging, and sharing with analysts. |

Other candidates (Yeti, osintui, Maltego TRX) can ride the same architecture once a job queue is in place.

## Pipeline Optimizations

1. **Job Queue + Workers** – Move Lens ingestion, fingerprinting, and investigatory loops onto a queue (BullMQ/Temporal) so agents can orchestrate long-running SpiderFoot or IntelOwl tasks without blocking HTTP requests.
2. **Evidence Storage** – Persist raw source payloads plus normalized triples in a document store (e.g., PostgreSQL JSONB or OpenSearch). Each `/api/osint/*` response should include a `source_id` pointing to the stored evidence.
3. **Credential Vault** – Centralize Shodan/AlienVault/Google API keys in Hashicorp Vault or Doppler and inject at runtime. Rotate credentials automatically and expose usage metrics via Prometheus.
4. **Caching Layer** – Wrap expensive lookups with TTL caches (Redis) keyed by query hash to avoid refetching identical data.
5. **Tool Routing Engine** – Introduce a policy module (LangGraph or OpenAI ReAct style) that decides whether to call Gemini, SpiderFoot, IntelOwl, or OpenCTI depending on the query, enabling multi-tool ensembles inside the agent network.

These actions, combined with the OSS tools above, allow the Shaivra agent collective to operate even when Gemini is unavailable, increase observability, and provide analysts with verifiable OSINT dossiers.

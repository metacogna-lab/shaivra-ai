---
title: OSINT Capability Review
description: Map today’s OSINT stack, identify the gaps, and plan the open-source tooling roadmap for Shaivra.
sidebarTitle: OSINT
badge: Draft
---

## Outcome
Learn what OSINT integrations exist, where the current implementation falls short, and which open-source projects should be prioritized to harden the agent network.

## What Exists Today

| Layer | Implementation | Notes |
| --- | --- | --- |
| **Server API** | `/api/osint/shodan`, `/api/osint/alienvault`, `/api/osint/virustotal`, `/api/osint/fingerprint`, `/api/osint/maltego` (`server.ts:228-413`, `1067-1103`) | Each route proxies to Gemini (`GoogleGenAI`) or the third-party REST API. Results are synchronous, unauthenticated beyond API keys, and never persisted. |
| **Search & Summaries** | `/api/search`, `/api/summarize`, `/api/analytics/summary` | Rely entirely on Gemini for retrieval-augmented search and briefing text. There is no caching layer. |
| **Lens Pipeline** | `portalApi.runAdvancedIngestion`, `simulateNormalization`, `simulateEnrichment`, etc. (`src/services/portalApi.ts:900-280`) consumed in `src/pages/portal/Lens.tsx`. | Pipeline steps are mocked on the client and assume synchronous Gemini-backed ingestion; there is no queue, job status, or storage. |
| **Investigations** | `/api/agent/investigate` orchestrates `runAgentNetwork`, which also depends on Gemini and stores state in memory. | Investigations vanish after a process restart and have no evidence chain. |

## Implementation Gaps

1. **Vendor Lock-In** – Every enrichment and summary step depends on Gemini; outages or API caps halt the entire OSINT surface.
2. **Missing Persistence** – Shodan/AlienVault/Virustotal results are proxied back to the UI with no durable record, so analysts cannot audit or reuse prior fetches.
3. **No Credential Rotation** – API keys are read from environment variables per request; there is no vault or rotating secret store.
4. **Evidence Provenance** – Responses contain prose but not structured provenance metadata, making it impossible to trace findings back to raw artifacts.
5. **Frontend Mocking** – Lens pipeline stages never call the backend, so there is no path to productionizing ingestion jobs or scheduling multi-source sweeps.

## Open-Source Tools to Equip the Agent Network

| Tool | License | Capability | Integration Sketch |
| --- | --- | --- | --- |
| **SpiderFoot** | GPL | Automated recon across 200+ modules (DNS, WHOIS, leaks, etc.). | Run SpiderFoot headlessly per project via a queue worker; push JSON results into the master graph instead of hand-crafted Gemini prompts. |
| **IntelOwl** | AGPL | Microservice orchestrator aggregating malware/IOC lookups, Shodan, VirusTotal, and more. | Deploy as an internal service; replace `/api/osint/*` calls with IntelOwl analyzers so caching, rate limits, and provenance are centralized. |
| **OpenCTI** | Apache-2.0 | Graph-first CTI platform with STIX 2.1 objects, feeds, and connectors. | Use OpenCTI as the persistence backend for investigations and graphs; `/api/agent/investigate` would write STIX bundles that analysts can query. |

Additional tools (Yeti, osintui, Maltego TRX community transforms) can be slotted into the same worker-based architecture once the queue exists.

## Pipeline Optimisations

1. **Job Queue & Workers** – Offload Lens ingestion, fingerprinting, and Maltego/SpiderFoot sweeps to workers (BullMQ/Temporal). HTTP endpoints should enqueue jobs and stream status updates.
2. **Evidence Store** – Persist raw payloads plus normalized triples (PostgreSQL JSONB or OpenSearch) so analysts can retrieve historical OSINT packages.
3. **Credential Vaulting** – Store third-party API secrets in Vault or Doppler; track quota usage and rotate automatically.
4. **Caching + Deduplication** – Add Redis caches keyed by query hash to avoid redundant OSINT fetches and throttle identical requests.
5. **Tool Routing Layer** – Build a LangGraph or rules-based dispatcher that decides whether to call Gemini, IntelOwl, SpiderFoot, or OpenCTI depending on the investigation context.

These steps decouple the suite from a single provider, improve auditability, and let the agent network scale horizontally across OSS reconnaissance engines.

# Initphase: Intelligence Investigation Flow

Conduct an intelligence investigation using **resolved graph entities only**. Raw signals are never used for reasoning; only canonical entities, observations, and relationships from the graph (and normalized enrichment events) drive gap detection and the final assessment.

## Seven steps

| Step | Description | Implementation |
|------|-------------|-----------------|
| 1 | **Retrieve the target entity cluster from the graph** | `langgraphjs/nodes/graphLookup.ts`: `fetchGraphSnapshot(target)` → `graphRepository.getMasterGraph()`; result mapped to `GraphSnapshot` (entities, observations, relationships). |
| 2 | **Identify intelligence gaps** | `langgraphjs/nodes/gapDetection.ts`: `detectIntelligenceGaps(state)` — uses only `entity`, `graphSnapshot.entities`, `graphSnapshot.observations`, `graphSnapshot.relationships`; no raw tool output. |
| 3 | **Select appropriate OSINT tools to enrich missing intelligence** | `langgraphjs/nodes/toolDispatch.ts`: `selectToolsForGaps(state)` — tool selector + filter to tools with normalizers or SDK adapters. |
| 4 | **Trigger enrichment workflows** | `langgraphjs/workflows/enrichmentGraph.ts`: invoked from `investigationGraph` node `triggerEnrichment`; tools run via `toolDispatchNode`; output is **canonical `IntelligenceEvent`** only. |
| 5 | **Wait for graph updates** | Enrichment results are merged into `graphSnapshot` in investigation state (`triggerEnrichmentNode`); loop returns to gap detection. |
| 6 | **Re-evaluate the entity cluster** | `missingDomainsNode` runs again with updated `graphSnapshot`; routing decides `triggerEnrichment` or `synthesizeReport`. |
| 7 | **Build an intelligence assessment** | `langgraphjs/workflows/investigationGraph.ts`: `synthesizeReportNode` — receives only `graphSnapshot` and confidence-filtered observations (`filterByConfidence(applySignalConfidence(enrichmentResults))` + observations with `confidence > 0.6`); single LLM call produces the report. |

## Constraint: No raw signals

- **Gap detection** and **report synthesis** reason only over:
  - Resolved **graph entities** (from `GraphSnapshot`)
  - **Canonical events** (normalized `IntelligenceEvent` from normalizers/SDK adapters)
  - **Observations** with confidence > 0.6 or corroborated (see `signalConfidenceEngine` and `INVESTIGATION_REPORT_SYNTHESIS_PROMPT`)
- Raw API responses from OSINT tools are **never** passed into gap detection or the report LLM; they are normalized first (e.g. via `normalizerRegistry`, `runAdapter`).

## Entrypoints

- **API:** `POST /api/investigation/run` — body: `{ target, entityType?, budget?, investigationId?, traceId? }`.
- **Script:** `bun scripts/run-investigation-example.ts [domain]`.
- **Test:** `tests/investigationFlow.test.ts` (and initphase-specific tests in `tests/investigationFlow.test.ts`).

## References

- [Investigation example (company domain)](./investigation-example.md)
- [OSINT pipeline](./osint/02-pipeline.md)
- [Routing and gaps](./osint/05-routing-and-gaps.md)

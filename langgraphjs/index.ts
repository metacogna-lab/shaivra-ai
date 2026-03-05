/**
 * LangGraph JS enrichment and investigation agents. Reasons only on canonical intelligence objects.
 */

import { enrichmentGraph } from './workflows/enrichmentGraph';
import { investigationGraph } from './workflows/investigationGraph';
import type { EnrichmentState } from './state';
import { ENRICHMENT_AGENT_SYSTEM_PROMPT } from './prompts/enrichment';
import { INVESTIGATION_AGENT_SYSTEM_PROMPT } from './prompts/investigation';
import { v4 as uuidv4 } from 'uuid';
import { recordAgentWorkflowSuccess, recordAgentWorkflowFailure } from '../src/server/services/metrics';

export { enrichmentGraph } from './workflows/enrichmentGraph';
export { investigationGraph } from './workflows/investigationGraph';
export type { EnrichmentState, EnrichmentBudget, IntelligenceGap, GraphSnapshot } from './state';
export type { InvestigationState } from './workflows/investigationGraph';
export { ENRICHMENT_AGENT_SYSTEM_PROMPT } from './prompts/enrichment';
export { INVESTIGATION_AGENT_SYSTEM_PROMPT } from './prompts/investigation';
export { detectIntelligenceGaps, hasSufficientCoverage } from './nodes/gapDetection';
export { selectToolsForGaps, toolDispatchNode } from './nodes/toolDispatch';
export { integrityCheckNode } from './nodes/integrityCheck';
export { SYSTEM_INTEGRITY_PROMPT, VALIDATOR_INTEGRITY_PROMPT } from './prompts/integrity';

/** Default budget: max 5 tool runs per enrichment run. */
export const DEFAULT_ENRICHMENT_BUDGET: EnrichmentState['budget'] = {
  maxToolRuns: 5,
  maxCostTier: 1,
};

/**
 * Run the enrichment workflow for one entity. Returns final state (canonical events only).
 */
export async function runEnrichment(input: {
  entityValue: string;
  entityType: EnrichmentState['entity']['type'];
  graphSnapshot?: Partial<EnrichmentState['graphSnapshot']>;
  budget?: Partial<EnrichmentState['budget']>;
  investigationId?: string;
  traceId?: string;
}): Promise<EnrichmentState> {
  const traceId = input.traceId ?? uuidv4();
  const graphSnapshot = {
    entities: input.graphSnapshot?.entities ?? [],
    observations: input.graphSnapshot?.observations ?? [],
    relationships: input.graphSnapshot?.relationships ?? [],
  };
  const budget = {
    ...DEFAULT_ENRICHMENT_BUDGET,
    ...input.budget,
  };

  try {
    const result = await enrichmentGraph.invoke({
      entity: {
        type: input.entityType,
        value: input.entityValue,
        refs: [],
      },
      graphSnapshot,
      budget,
      gaps: [],
      events: [],
      toolRuns: [],
      investigationId: input.investigationId,
      traceId,
    });
    recordAgentWorkflowSuccess('enrichment');
    return result as EnrichmentState;
  } catch (e) {
    recordAgentWorkflowFailure('enrichment');
    throw e;
  }
}

/** Default max tool runs per investigation (aligned with investigationBudget). */
export const DEFAULT_INVESTIGATION_MAX_TOOL_RUNS = 30;

/**
 * Run the investigation workflow: graph lookup → gap detection → enrichment (when needed) → report synthesis.
 * Returns report, graphSnapshot, events, traceId. Uses only signals with confidence > 0.6 or corroborated.
 */
export async function runInvestigation(input: {
  target: string;
  entityType?: 'person' | 'organization' | 'infrastructure' | 'event' | 'unknown';
  budget?: { maxToolRuns?: number };
  investigationId?: string;
  traceId?: string;
}): Promise<{
  report: string;
  graphSnapshot: { entities: unknown[]; observations: unknown[]; relationships: unknown[] };
  events: unknown[];
  traceId: string;
  budgetConsumed: number;
}> {
  const traceId = input.traceId ?? uuidv4();
  const entityType = input.entityType ?? 'infrastructure';
  const maxToolRuns = input.budget?.maxToolRuns ?? DEFAULT_INVESTIGATION_MAX_TOOL_RUNS;
  try {
    const result = await investigationGraph.invoke({
      target: input.target,
      entityType,
      graphSnapshot: { entities: [], observations: [], relationships: [] },
      enrichmentResults: [],
      report: '',
      budgetConsumed: 0,
      traceId,
      investigationId: input.investigationId,
      maxToolRuns,
      gaps: [],
    });
    recordAgentWorkflowSuccess('investigation');
    return {
      report: result.report ?? '',
      graphSnapshot: result.graphSnapshot ?? { entities: [], observations: [], relationships: [] },
      events: result.enrichmentResults ?? [],
      traceId: result.traceId ?? traceId,
      budgetConsumed: result.budgetConsumed ?? 0,
    };
  } catch (e) {
    recordAgentWorkflowFailure('investigation');
    throw e;
  }
}

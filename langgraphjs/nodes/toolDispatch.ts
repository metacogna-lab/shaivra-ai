/**
 * Selects tools from registry for detected gaps and executes tools via normalizers or SDK adapters.
 * All outputs are canonical IntelligenceEvents; no raw tool output is passed to the agent.
 * @see docs/osint/04-tool-contracts.md, docs/osint/05-routing-and-gaps.md
 */

import { hasAdapter } from '@shaivra/osint-sdk';
import { runAdapter, type ToolQuery } from '@shaivra/osint-sdk/adapter';
import { toolSelector } from '../../src/server/services/toolSelector';
import { normalizerRegistry } from '../../src/server/normalizers';
import { querySingleSource } from '../../src/server/services/osintAggregator';
import { recordToolCall, recordToolDuration } from '../../src/server/services/metrics';
import { getRemaining, checkAndConsume } from '../../src/server/services/investigationBudget';
import type { EnrichmentState } from '../state';
import type { IntelligenceEvent } from '../../src/contracts/intelligence';
import { v4 as uuidv4 } from 'uuid';

/** Tools that have a normalizer and can be executed (passive collection only). */
const EXECUTABLE_SOURCES = new Set<string>(['shodan', 'virustotal', 'alienvault']);

type SingleSource = 'shodan' | 'alienvault' | 'virustotal';

/**
 * Resolve tool names that can address the given gaps and are within budget.
 * Includes tools with normalizers or SDK adapters.
 */
export function selectToolsForGaps(state: EnrichmentState): string[] {
  const { entity, budget, toolRuns } = state;
  const remaining = budget.maxToolRuns - toolRuns.length;
  if (remaining <= 0) return [];

  const requested = toolSelector.selectTools({
    target: entity.value,
    entityType: entity.type,
    ranked: true,
    costAware: true,
    maxTools: remaining,
  });

  return requested.filter(
    name =>
      (normalizerRegistry.has(name) && EXECUTABLE_SOURCES.has(name)) || hasAdapter(name)
  );
}

/** Map dispatch type to SDK entity_type. */
function toEntityType(type: 'domain' | 'ip' | 'url' | 'hostname'): ToolQuery['entity_type'] {
  if (type === 'ip') return 'ip';
  if (type === 'url') return 'infrastructure';
  return 'domain';
}

/**
 * Execute a single tool via SDK adapter (if registered) or normalizer. Returns canonical IntelligenceEvent or undefined.
 */
export async function executeTool(
  toolName: string,
  target: string,
  type: 'domain' | 'ip' | 'url' | 'hostname',
  traceId: string,
  investigationId?: string,
  maxToolRuns: number = 20
): Promise<IntelligenceEvent | undefined> {
  const start = Date.now();
  let out: IntelligenceEvent | undefined;
  if (hasAdapter(toolName)) {
    const query: ToolQuery = {
      entity_type: toEntityType(type),
      value: target,
      trace_id: traceId,
      investigation_id: investigationId,
    };
    const runtime = {
      getRemaining: (id: string, max: number) => getRemaining(id, max),
      checkAndConsume: (id: string, amount: number, max: number) =>
        checkAndConsume(id, amount, max),
      recordToolCall: (name: string) => recordToolCall(name),
    };
    const event = await runAdapter(toolName, query, runtime, maxToolRuns);
    out = event as unknown as IntelligenceEvent;
  } else if (normalizerRegistry.has(toolName) && EXECUTABLE_SOURCES.has(toolName)) {
    const source = toolName as SingleSource;
    try {
      const result = await querySingleSource(source, target, type);
      if (result.event) out = result.event;
      else if (result.data && normalizerRegistry.has(toolName)) {
        const normalizer = normalizerRegistry.get(toolName)!;
        out = normalizer.normalize(result.data, target, traceId, investigationId);
      }
    } catch (_) {
      out = minimalEvent(toolName, target, traceId, investigationId, 'failed');
    }
  }
  recordToolDuration(toolName, (Date.now() - start) / 1000);
  return out;
}

function minimalEvent(
  tool: string,
  target: string,
  traceId: string,
  investigationId?: string,
  status: 'success' | 'partial' | 'failed' = 'partial'
): IntelligenceEvent {
  return {
    id: uuidv4(),
    traceId,
    investigationId,
    tool,
    target,
    timestamp: new Date(),
    status,
    entities: [],
    observations: [],
    relationships: [],
    metadata: { executionTime: 0 },
  };
}

/**
 * Enrichment node: select tools from registry for current gaps, execute only normalizer-backed tools,
 * append canonical events to state. Respects budget; prefers passive (cost-aware) tools.
 */
export async function toolDispatchNode(state: EnrichmentState): Promise<Partial<EnrichmentState>> {
  const toolsToRun = selectToolsForGaps(state);
  if (toolsToRun.length === 0) return {};

  const traceId = state.traceId ?? uuidv4();
  const investigationId = state.investigationId;
  const target = state.entity.value;
  const type = inferTargetType(target);

  const newEvents: IntelligenceEvent[] = [];
  const newToolRuns: string[] = [];

  for (const toolName of toolsToRun) {
    if (state.toolRuns.length + newToolRuns.length >= state.budget.maxToolRuns) break;

    const event = await executeTool(
      toolName,
      target,
      type,
      traceId,
      investigationId,
      state.budget.maxToolRuns
    );
    if (event) {
      newEvents.push(event);
      newToolRuns.push(toolName);
      if (!hasAdapter(toolName)) recordToolCall(toolName);
    }
  }

  return {
    events: [...state.events, ...newEvents],
    toolRuns: [...state.toolRuns, ...newToolRuns],
  };
}

function inferTargetType(target: string): 'domain' | 'ip' | 'url' | 'hostname' {
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(target)) return 'ip';
  if (target.startsWith('http://') || target.startsWith('https://')) return 'url';
  if (target.includes('.')) return 'domain';
  return 'hostname';
}

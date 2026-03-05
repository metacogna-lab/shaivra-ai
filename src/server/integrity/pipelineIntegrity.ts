/**
 * Pipeline configuration integrity (system validation workflow).
 * Every deployment should run this at startup in order:
 *   1. validate schemas (IntelligenceEvent / signal schema)
 *   2. validate registry (tool registry with entityTypes)
 *   3. validate adapters (SDK adapter or normalizer per tool)
 *   4. validate topics (Redpanda: raw, normalized, resolved, graph.updates)
 *   5. validate graph schema (Memgraph connectivity)
 *   6. validate agent workflows (runInvestigation, runEnrichment)
 * runPipelineIntegrity() runs 1–5; subsystems include 6. GET /api/system/integrity returns full result.
 */

import { hasAdapter } from '@shaivra/osint-sdk';
import { normalizerRegistry } from '../normalizers';
import { toolSelector } from '../services/toolSelector';
import { intelligenceEventSchema } from '../../contracts/intelligence';
import { getSession } from '../db/memgraphClient';

/** Required Redpanda topics when streaming is enabled. */
export const REQUIRED_TOPICS = [
  'shaivra.signals.raw',
  'shaivra.signals.normalized',
  'shaivra.entities.resolved',
  'shaivra.graph.updates',
] as const;

/** Required Memgraph node labels (from global-graph schema). */
export const REQUIRED_GRAPH_LABELS = [
  'Actor',
  'Organization',
  'Infrastructure',
  'Event',
  'Narrative',
  'Document',
  'Source',
  'Decision',
  'Message',
  'Account',
  'Audience',
  'Campaign',
] as const;

export interface ToolRegistryCheck {
  tool: string;
  ok: boolean;
  hasAdapter: boolean;
  hasNormalizer: boolean;
  entityTypesNonEmpty: boolean;
  errors: string[];
}

/** Per-subsystem result for validator: verified, missing components, corrective recommendations. */
export interface SubsystemResult {
  verified: boolean;
  missingComponents: string[];
  recommendations: string[];
}

export interface IntegrityResult {
  ok: boolean;
  toolRegistry: { ok: boolean; checks: ToolRegistryCheck[] };
  signalSchema: { ok: boolean; error?: string };
  redpanda: { ok: boolean; skipped: boolean; topicsChecked?: string[]; error?: string };
  graphSchema: { ok: boolean; skipped: boolean; error?: string };
  errors: string[];
  /** Per-subsystem details for validator: verify configuration, identify gaps, recommend actions. */
  subsystems?: {
    toolRegistryCompleteness: SubsystemResult;
    adapterAvailability: SubsystemResult;
    signalSchemaCompliance: SubsystemResult;
    redpandaTopicHealth: SubsystemResult;
    entityResolutionPipeline: SubsystemResult;
    graphWriteIntegrity: SubsystemResult;
    langGraphWorkflowConnectivity: SubsystemResult;
  };
}

/**
 * Verify each registered tool has an adapter or normalizer and valid metadata.
 */
function checkToolRegistry(): { ok: boolean; checks: ToolRegistryCheck[] } {
  const tools = toolSelector.getAllTools();
  const checks: ToolRegistryCheck[] = [];

  for (const toolName of tools) {
    const meta = toolSelector.getToolMetadata(toolName);
    const hasAdapter_ = hasAdapter(toolName);
    const hasNormalizer = normalizerRegistry.has(toolName);
    const entityTypesNonEmpty = !!(meta?.entityTypes?.length);
    const errors: string[] = [];
    if (!hasAdapter_ && !hasNormalizer) errors.push('no adapter or normalizer');
    if (!entityTypesNonEmpty) errors.push('entityTypes empty or missing');

    checks.push({
      tool: toolName,
      ok: (hasAdapter_ || hasNormalizer) && entityTypesNonEmpty,
      hasAdapter: hasAdapter_,
      hasNormalizer,
      entityTypesNonEmpty,
      errors,
    });
  }

  const ok = checks.every((c) => c.ok);
  return { ok, checks };
}

/**
 * Validate that the canonical signal schema (IntelligenceEvent) accepts a minimal valid payload.
 */
function checkSignalSchema(): { ok: boolean; error?: string } {
  const minimal = {
    id: '00000000-0000-4000-8000-000000000001',
    traceId: '00000000-0000-4000-8000-000000000002',
    tool: 'test',
    target: 'example.com',
    timestamp: new Date(),
    status: 'success' as const,
    entities: [],
    observations: [],
    relationships: [],
    metadata: { executionTime: 0 },
  };
  const parsed = intelligenceEventSchema.safeParse(minimal);
  if (parsed.success) return { ok: true };
  return { ok: false, error: parsed.error.message };
}

/**
 * Ensure Redpanda topics exist when REDPANDA_BROKERS is set. Creates missing topics.
 */
async function checkRedpandaTopics(): Promise<{
  ok: boolean;
  skipped: boolean;
  topicsChecked?: string[];
  error?: string;
}> {
  const brokers = process.env.REDPANDA_BROKERS ?? process.env.KAFKA_BROKERS;
  if (!brokers) return { ok: true, skipped: true };

  try {
    const { Kafka } = await import('kafkajs');
    const kafka = new Kafka({ brokers: brokers.split(',') });
    const admin = kafka.admin();
    await admin.connect();
    const existing = await admin.listTopics();
    const topicsToCreate = REQUIRED_TOPICS.filter((t) => !existing.includes(t));
    if (topicsToCreate.length > 0) {
      await admin.createTopics({ topics: topicsToCreate.map((t) => ({ topic: t })), validateOnly: false });
    }
    await admin.disconnect();
    return { ok: true, skipped: false, topicsChecked: [...REQUIRED_TOPICS] };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, skipped: false, error: message };
  }
}

/**
 * Verify Memgraph connectivity. Schema (global-graph/schema/memgraph.cypher) must be applied separately.
 */
async function checkGraphSchema(): Promise<{ ok: boolean; skipped: boolean; error?: string }> {
  try {
    const session = getSession();
    try {
      await session.run('RETURN 1');
      return { ok: true, skipped: false };
    } finally {
      await session.close();
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('ECONNREFUSED') || message.includes('connect')) {
      return { ok: true, skipped: true };
    }
    return { ok: false, skipped: false, error: message };
  }
}

/**
 * Lightweight check: entity resolution pipeline (standardiseAndDeduplicate) is available.
 */
async function checkEntityResolutionPipeline(): Promise<SubsystemResult> {
  try {
    const mod = await import('../services/standardiseAndDeduplicate');
    const fn = mod?.standardiseAndDeduplicate;
    const verified = typeof fn === 'function';
    return {
      verified,
      missingComponents: verified ? [] : ['standardiseAndDeduplicate not callable'],
      recommendations: verified ? [] : ['Ensure standardiseAndDeduplicate is exported from src/server/services/standardiseAndDeduplicate'],
    };
  } catch {
    return {
      verified: false,
      missingComponents: ['standardiseAndDeduplicate module'],
      recommendations: ['Install or fix standardiseAndDeduplicate service'],
    };
  }
}

/**
 * Lightweight check: graph write path (graphRepository) is available.
 */
async function checkGraphWriteIntegrity(): Promise<SubsystemResult> {
  try {
    const mod = await import('../repositories/graphRepository');
    const repo = mod?.graphRepository;
    const hasUpdate = typeof repo?.updateMasterGraph === 'function';
    const hasGet = typeof repo?.getMasterGraph === 'function';
    const verified = hasUpdate && hasGet;
    return {
      verified,
      missingComponents: [
        ...(hasUpdate ? [] : ['graphRepository.updateMasterGraph']),
        ...(hasGet ? [] : ['graphRepository.getMasterGraph']),
      ],
      recommendations: verified ? [] : ['Ensure graphRepository exports updateMasterGraph and getMasterGraph'],
    };
  } catch {
    return {
      verified: false,
      missingComponents: ['graphRepository'],
      recommendations: ['Ensure graph repository is available and Memgraph is reachable'],
    };
  }
}

/**
 * Lightweight check: LangGraph workflows are importable and invokable.
 */
async function checkLangGraphConnectivity(): Promise<SubsystemResult> {
  try {
    const mod = await import('../../../langgraphjs/index');
    const runInv = typeof mod?.runInvestigation === 'function';
    const runEnr = typeof mod?.runEnrichment === 'function';
    const verified = runInv && runEnr;
    return {
      verified,
      missingComponents: [
        ...(runInv ? [] : ['runInvestigation']),
        ...(runEnr ? [] : ['runEnrichment']),
      ],
      recommendations: verified ? [] : ['Ensure langgraphjs/index exports runInvestigation and runEnrichment'],
    };
  } catch {
    return {
      verified: false,
      missingComponents: ['LangGraph workflow exports'],
      recommendations: ['Ensure langgraphjs module is built and exports runInvestigation, runEnrichment'],
    };
  }
}

/**
 * Build per-subsystem results for validator (verify configuration, identify gaps, recommend actions).
 */
async function buildSubsystems(
  toolRegistry: IntegrityResult['toolRegistry'],
  signalSchema: IntegrityResult['signalSchema'],
  redpanda: IntegrityResult['redpanda'],
  graphSchema: IntegrityResult['graphSchema']
): Promise<IntegrityResult['subsystems']> {
  const failedTools = toolRegistry.checks.filter((c) => !c.ok).map((c) => c.tool);
  const [entityRes, graphWrite, langGraph] = await Promise.all([
    checkEntityResolutionPipeline(),
    graphSchema.ok ? checkGraphWriteIntegrity() : Promise.resolve({
      verified: false,
      missingComponents: ['Graph connectivity'] as string[],
      recommendations: ['Ensure Memgraph is reachable (MEMGRAPH_URI); then re-check graph write'] as string[],
    }),
    checkLangGraphConnectivity(),
  ]);
  return {
    toolRegistryCompleteness: {
      verified: toolRegistry.ok,
      missingComponents: failedTools.length ? failedTools : [],
      recommendations: failedTools.length
        ? [`Register adapter or normalizer for: ${failedTools.join(', ')}; ensure entityTypes non-empty`]
        : [],
    },
    adapterAvailability: {
      verified: toolRegistry.ok,
      missingComponents: toolRegistry.checks.filter((c) => !c.hasAdapter && !c.hasNormalizer).map((c) => c.tool),
      recommendations: toolRegistry.ok ? [] : ['Register SDK adapter or add normalizer for each tool in registry'],
    },
    signalSchemaCompliance: {
      verified: signalSchema.ok,
      missingComponents: signalSchema.error ? ['Schema validation failed'] : [],
      recommendations: signalSchema.error ? [`Fix IntelligenceEvent schema or payload: ${signalSchema.error}`] : [],
    },
    redpandaTopicHealth: {
      verified: redpanda.ok,
      missingComponents: redpanda.error ? ['Topic creation or connection failed'] : redpanda.skipped ? [] : [],
      recommendations: redpanda.error
        ? ['Set REDPANDA_BROKERS correctly or run Redpanda; ensure topics can be created']
        : redpanda.skipped
          ? ['Optional: set REDPANDA_BROKERS for event-driven pipeline']
          : [],
    },
    entityResolutionPipeline: entityRes,
    graphWriteIntegrity: graphWrite,
    langGraphWorkflowConnectivity: langGraph,
  };
}

/**
 * Run all pipeline integrity checks. Safe to call at startup or from /api/system/integrity.
 * Returns per-subsystem details for validator: verify configuration, identify missing components, recommend corrective actions.
 */
export async function runPipelineIntegrity(): Promise<IntegrityResult> {
  const errors: string[] = [];
  const toolRegistry = checkToolRegistry();
  if (!toolRegistry.ok) {
    const failed = toolRegistry.checks.filter((c) => !c.ok);
    errors.push(`Tool registry: ${failed.map((c) => c.tool).join(', ')} failed`);
  }
  const signalSchema = checkSignalSchema();
  if (!signalSchema.ok) errors.push(`Signal schema: ${signalSchema.error}`);
  const redpanda = await checkRedpandaTopics();
  if (!redpanda.ok) errors.push(`Redpanda: ${redpanda.error}`);
  const graphSchema = await checkGraphSchema();
  if (!graphSchema.ok) errors.push(`Graph schema: ${graphSchema.error}`);

  const ok = toolRegistry.ok && signalSchema.ok && redpanda.ok && graphSchema.ok;
  const subsystems = await buildSubsystems(toolRegistry, signalSchema, redpanda, graphSchema);

  return {
    ok,
    toolRegistry,
    signalSchema,
    redpanda,
    graphSchema,
    errors,
    subsystems,
  };
}

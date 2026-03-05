#!/usr/bin/env node
/**
 * Dry-run script: test a range of query permutations (sector, ambiguous, specific)
 * through the pipeline. Verifies results without mutations and with comprehensive shape.
 * No storage; no reliance on services other than optional LLM (--with-llm).
 */

import { v4 as uuid } from 'uuid';
import chalk from 'chalk';
import { intelligenceEventSchema } from '../src/contracts/intelligence.js';
import type { EntityReference, IntelligenceEvent } from '../src/contracts/intelligence.js';
import { standardiseAndDeduplicate } from '../src/server/services/standardiseAndDeduplicate.js';

const now = new Date();

/** Query permutation: label and target string for fixture. */
interface QueryPermutation {
  category: 'sector' | 'ambiguous' | 'specific';
  label: string;
  target: string;
  entityType: EntityReference['type'];
}

const PERMUTATIONS: QueryPermutation[] = [
  { category: 'sector', label: 'sector fintech', target: 'fintech', entityType: 'organization' },
  { category: 'sector', label: 'sector healthcare', target: 'healthcare', entityType: 'organization' },
  { category: 'sector', label: 'sector energy', target: 'energy', entityType: 'organization' },
  { category: 'ambiguous', label: 'ambiguous Apple', target: 'Apple', entityType: 'organization' },
  { category: 'ambiguous', label: 'ambiguous Tesla', target: 'Tesla', entityType: 'organization' },
  { category: 'ambiguous', label: 'ambiguous Amazon', target: 'Amazon', entityType: 'organization' },
  { category: 'specific', label: 'specific domain', target: 'example.com', entityType: 'infrastructure' },
  { category: 'specific', label: 'specific IP', target: '93.184.216.34', entityType: 'infrastructure' },
  { category: 'specific', label: 'specific person', target: 'John Doe', entityType: 'person' },
];

function entity(overrides: Partial<EntityReference> & { name: string; type: EntityReference['type'] }): EntityReference {
  return {
    id: overrides.id ?? uuid(),
    type: overrides.type,
    name: overrides.name,
    aliases: overrides.aliases ?? [],
    confidence: overrides.confidence ?? 0.9,
    attributes: overrides.attributes ?? {},
    sourceIds: overrides.sourceIds ?? [],
    firstSeen: overrides.firstSeen ?? now,
    lastSeen: overrides.lastSeen ?? now,
    metadata: overrides.metadata ?? { verified: false, tags: [] },
  };
}

function observation(entityId: string, property: string, value: unknown) {
  return {
    id: uuid(),
    entityId,
    type: 'attribute' as const,
    property,
    value,
    confidence: 0.9,
    source: { tool: 'dry-run', timestamp: now, raw: {} },
    context: {},
  };
}

function buildFixtureEvent(perm: QueryPermutation): IntelligenceEvent {
  const e = entity({ name: perm.target, type: perm.entityType });
  return {
    id: uuid(),
    traceId: uuid(),
    tool: 'dry-run',
    target: perm.target,
    timestamp: now,
    status: 'success',
    entities: [e],
    observations: [observation(e.id, 'target_type', perm.category)],
    relationships: [],
    metadata: { executionTime: 0, raw: { permutation: perm.label } },
  };
}

/** Assert result is valid schema and comprehensive (no mutations). */
function verifyResult(result: IntelligenceEvent[], perm: QueryPermutation): { ok: boolean; message?: string } {
  if (result.length === 0) return { ok: false, message: 'empty result' };
  const event = result[0];
  const parsed = intelligenceEventSchema.safeParse(event);
  if (!parsed.success) {
    return { ok: false, message: 'schema invalid: ' + parsed.error.message };
  }
  if (!event.entities || !Array.isArray(event.entities)) return { ok: false, message: 'missing entities' };
  if (!event.observations || !Array.isArray(event.observations)) return { ok: false, message: 'missing observations' };
  if (!event.relationships || !Array.isArray(event.relationships)) return { ok: false, message: 'missing relationships' };
  const allEntityIds = new Set(event.entities.map((e) => e.id));
  for (const o of event.observations) {
    if (!allEntityIds.has(o.entityId)) return { ok: false, message: 'observation references unknown entityId' };
  }
  for (const r of event.relationships) {
    if (!allEntityIds.has(r.fromEntityId) || !allEntityIds.has(r.toEntityId))
      return { ok: false, message: 'relationship references unknown entityId' };
  }
  for (const e of event.entities) {
    if (!e.id || !e.name || e.confidence < 0 || e.confidence > 1)
      return { ok: false, message: 'entity missing id/name or invalid confidence' };
  }
  return { ok: true };
}

/** Optional: call LLM summarize with fixture payload (dry run, no storage). */
async function verifyWithLLM(baseUrl: string, perm: QueryPermutation, fixtureEvent: IntelligenceEvent): Promise<{ ok: boolean; message?: string }> {
  const payload = {
    target: perm.target,
    data: {
      entities: fixtureEvent.entities.length,
      observations: fixtureEvent.observations.length,
      sample: fixtureEvent.entities[0]?.name,
    },
  };
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/intelligence/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.status !== 200) return { ok: false, message: `HTTP ${res.status}` };
    const body = await res.json();
    if (!body.summary || typeof body.summary !== 'string') return { ok: false, message: 'missing or invalid summary' };
    if (body.summary.length < 10) return { ok: false, message: 'summary too short' };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e.message || 'request failed' };
  }
}

async function main(): Promise<void> {
  const withLlm = process.argv.includes('--with-llm');
  const baseUrl = process.env.SHAIVRA_API_BASE_URL || 'http://localhost:3000';

  console.log(chalk.bold.cyan('\n  Query permutation dry run (no storage, no external services)\n'));
  console.log(chalk.dim('  Permutations: sector (3), ambiguous (3), specific (3)\n'));

  let passed = 0;
  let failed = 0;

  for (const perm of PERMUTATIONS) {
    const fixture = buildFixtureEvent(perm);
    const inputEvents = [fixture];
    const result = standardiseAndDeduplicate(inputEvents);

    const verify = verifyResult(result, perm);
    if (!verify.ok) {
      console.log(chalk.red('  ✗ ' + perm.label + ': ' + (verify.message || 'fail')));
      failed++;
      continue;
    }

    if (withLlm) {
      const llmOk = await verifyWithLLM(baseUrl, perm, result[0]);
      if (!llmOk.ok) {
        console.log(chalk.yellow('  ~ ' + perm.label + ': pipeline ok, LLM ' + (llmOk.message || 'fail')));
        failed++;
        continue;
      }
    }

    console.log(chalk.green('  ✓ ' + perm.label + ' — entities: ' + result[0].entities.length + ', observations: ' + result[0].observations.length + ', schema ok'));
    passed++;
  }

  console.log();
  console.log(chalk.bold('  Result: ' + passed + ' passed, ' + failed + ' failed'));
  if (withLlm) console.log(chalk.dim('  (--with-llm: summarize endpoint used; server must be running)'));
  console.log();

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(chalk.red(e.message));
  process.exit(1);
});

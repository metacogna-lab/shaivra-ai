/**
 * Unit tests for standardiseAndDeduplicate service.
 * Covers entity unique ID, name-variant deduplication, observation/relationship dedup.
 */

import { describe, it, expect } from 'vitest';
import { v4 as uuid } from 'uuid';
import {
  standardiseAndDeduplicate,
  normaliseEntityName,
  stringSimilarity,
} from '../../src/server/services/standardiseAndDeduplicate';
import type { EntityReference, IntelligenceEvent } from '../../src/contracts/intelligence';

const now = new Date();

function entity(
  overrides: Partial<EntityReference> & { name: string; type: EntityReference['type'] }
): EntityReference {
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

function event(overrides: Partial<IntelligenceEvent> & { entities: EntityReference[] }): IntelligenceEvent {
  return {
    id: uuid(),
    traceId: uuid(),
    tool: overrides.tool ?? 'shodan',
    target: overrides.target ?? 'example.com',
    timestamp: now,
    status: 'success',
    entities: overrides.entities,
    observations: overrides.observations ?? [],
    relationships: overrides.relationships ?? [],
    metadata: { executionTime: 0 },
    ...overrides,
  };
}

describe('standardiseAndDeduplicate', () => {
  it('returns empty array when given no events', () => {
    const result = standardiseAndDeduplicate([]);
    expect(result).toEqual([]);
  });

  it('returns one merged event with same entity count when single event has one entity', () => {
    const e = entity({ name: 'Example', type: 'infrastructure' });
    const ev = event({ entities: [e] });
    const result = standardiseAndDeduplicate([ev]);
    expect(result).toHaveLength(1);
    expect(result[0].entities).toHaveLength(1);
    expect(result[0].entities[0].id).toBe(e.id);
    expect(result[0].tool).toBe('standardise-and-deduplicate');
  });

  it('merges duplicate entities: same normalised name resolves to one entity', () => {
    const id1 = uuid();
    const id2 = uuid();
    const ev1 = event({
      tool: 'shodan',
      entities: [entity({ id: id1, name: 'Elon Musk', type: 'person' })],
    });
    const ev2 = event({
      tool: 'virustotal',
      entities: [entity({ id: id2, name: 'elon musk', type: 'person' })],
    });
    const result = standardiseAndDeduplicate([ev1, ev2]);
    expect(result).toHaveLength(1);
    expect(result[0].entities).toHaveLength(1);
    expect(result[0].entities[0].id).toBe(id1);
    expect([result[0].entities[0].name, ...result[0].entities[0].aliases].sort()).toContain('Elon Musk');
    expect([result[0].entities[0].name, ...result[0].entities[0].aliases].sort()).toContain('elon musk');
  });

  it('merges handle and display name variants into one entity', () => {
    const id1 = uuid();
    const id2 = uuid();
    const ev1 = event({
      entities: [entity({ id: id1, name: 'Elon Musk', type: 'person' })],
    });
    const ev2 = event({
      entities: [entity({ id: id2, name: '@elonmusk', type: 'person' })],
    });
    const result = standardiseAndDeduplicate([ev1, ev2]);
    expect(result[0].entities).toHaveLength(1);
    expect(result[0].entities[0].id).toBe(id1);
    const allNames = [result[0].entities[0].name, ...result[0].entities[0].aliases];
    expect(allNames.some((n) => n.toLowerCase().includes('elon'))).toBe(true);
    expect(allNames.some((n) => n.includes('@') || n === 'elonmusk')).toBe(true);
  });

  it('merges misspelling when fuzzy threshold is relaxed', () => {
    const id1 = uuid();
    const id2 = uuid();
    const ev1 = event({
      entities: [entity({ id: id1, name: 'Elon Musk', type: 'person' })],
    });
    const ev2 = event({
      entities: [entity({ id: id2, name: 'Elon Muskk', type: 'person' })],
    });
    const result = standardiseAndDeduplicate([ev1, ev2], { fuzzyThreshold: 0.8 });
    expect(result[0].entities).toHaveLength(1);
    expect(result[0].entities[0].id).toBe(id1);
  });

  it('deduplicates observations by entityId+property+value', () => {
    const e = entity({ name: 'Host', type: 'infrastructure' });
    const ev = event({
      entities: [e],
      observations: [
        {
          id: uuid(),
          entityId: e.id,
          type: 'attribute',
          property: 'port',
          value: 443,
          confidence: 0.9,
          source: { tool: 'shodan', timestamp: now, raw: {} },
          context: {},
        },
        {
          id: uuid(),
          entityId: e.id,
          type: 'attribute',
          property: 'port',
          value: 443,
          confidence: 0.9,
          source: { tool: 'virustotal', timestamp: now, raw: {} },
          context: {},
        },
      ],
    });
    const result = standardiseAndDeduplicate([ev]);
    expect(result[0].observations).toHaveLength(1);
  });

  it('deduplicates relationships by fromEntityId+toEntityId+type', () => {
    const e1 = entity({ id: uuid(), name: 'A', type: 'organization' });
    const e2 = entity({ id: uuid(), name: 'B', type: 'organization' });
    const ev = event({
      entities: [e1, e2],
      relationships: [
        {
          id: uuid(),
          fromEntityId: e1.id,
          toEntityId: e2.id,
          type: 'OWNS',
          strength: 0.8,
          confidence: 0.9,
          evidence: [],
          bidirectional: false,
          metadata: { firstSeen: now, lastSeen: now, count: 1 },
        },
        {
          id: uuid(),
          fromEntityId: e1.id,
          toEntityId: e2.id,
          type: 'OWNS',
          strength: 0.9,
          confidence: 0.95,
          evidence: [],
          bidirectional: false,
          metadata: { firstSeen: now, lastSeen: now, count: 1 },
        },
      ],
    });
    const result = standardiseAndDeduplicate([ev]);
    expect(result[0].relationships).toHaveLength(1);
  });

  it('rewrites observation and relationship entityIds to canonical ID after merge', () => {
    const id1 = uuid();
    const id2 = uuid();
    const ev1 = event({
      entities: [entity({ id: id1, name: 'Same Person', type: 'person' })],
      observations: [
        {
          id: uuid(),
          entityId: id1,
          type: 'attribute',
          property: 'role',
          value: 'CEO',
          confidence: 0.9,
          source: { tool: 'twitter', timestamp: now, raw: {} },
          context: {},
        },
      ],
    });
    const ev2 = event({
      entities: [entity({ id: id2, name: 'same person', type: 'person' })],
      observations: [
        {
          id: uuid(),
          entityId: id2,
          type: 'attribute',
          property: 'role',
          value: 'CEO',
          confidence: 0.9,
          source: { tool: 'reddit', timestamp: now, raw: {} },
          context: {},
        },
      ],
    });
    const result = standardiseAndDeduplicate([ev1, ev2]);
    expect(result[0].entities).toHaveLength(1);
    const canonicalId = result[0].entities[0].id;
    expect(result[0].observations.every((o) => o.entityId === canonicalId)).toBe(true);
  });
});

describe('normaliseEntityName', () => {
  it('lowercases and trims person name', () => {
    expect(normaliseEntityName('  Elon Musk  ', 'person')).toBe('elon musk');
  });

  it('strips leading @ for person', () => {
    expect(normaliseEntityName('@elonmusk', 'person')).toBe('elonmusk');
  });

  it('lowercases domain for infrastructure', () => {
    expect(normaliseEntityName('Example.COM', 'infrastructure')).toBe('example.com');
  });

  it('lowercases IP for infrastructure', () => {
    expect(normaliseEntityName('192.168.1.1', 'infrastructure')).toBe('192.168.1.1');
  });
});

describe('stringSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(stringSimilarity('Elon Musk', 'Elon Musk')).toBe(1);
  });

  it('returns high similarity for misspelling', () => {
    const s = stringSimilarity('Elon Musk', 'Elon Muskk');
    expect(s).toBeGreaterThan(0.8);
    expect(s).toBeLessThanOrEqual(1);
  });

  it('returns 0 for empty string', () => {
    expect(stringSimilarity('', 'x')).toBe(0);
    expect(stringSimilarity('x', '')).toBe(0);
  });
});

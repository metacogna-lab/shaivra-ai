/**
 * Dummy data conforming to intelligence Zod schemas for tests.
 * Uses UUIDs and Date objects where schemas require them.
 */

import { v4 as uuidv4 } from 'uuid';

const now = new Date();

export function entityReference(overrides: Partial<{
  id: string;
  type: 'person' | 'organization' | 'infrastructure' | 'event' | 'unknown';
  name: string;
  confidence: number;
}> = {}) {
  return {
    id: overrides.id ?? uuidv4(),
    type: overrides.type ?? 'infrastructure',
    name: overrides.name ?? 'Test Entity',
    aliases: [],
    confidence: overrides.confidence ?? 0.9,
    attributes: {},
    sourceIds: [],
    firstSeen: now,
    lastSeen: now,
    metadata: { verified: false, tags: [] },
    ...overrides,
  };
}

export function observation(overrides: Partial<{
  id: string;
  entityId: string;
  type: 'attribute' | 'behavior' | 'event' | 'relationship';
  property: string;
  value: unknown;
  confidence: number;
}> = {}) {
  const entityId = overrides.entityId ?? uuidv4();
  return {
    id: overrides.id ?? uuidv4(),
    entityId,
    type: overrides.type ?? 'attribute',
    property: overrides.property ?? 'status',
    value: overrides.value ?? 'active',
    confidence: overrides.confidence ?? 0.85,
    source: { tool: 'shodan', timestamp: now, raw: {} },
    context: {},
    ...overrides,
  };
}

export function relationship(overrides: Partial<{
  id: string;
  fromEntityId: string;
  toEntityId: string;
  type: string;
  strength: number;
  confidence: number;
}> = {}) {
  const fromId = overrides.fromEntityId ?? uuidv4();
  const toId = overrides.toEntityId ?? uuidv4();
  return {
    id: overrides.id ?? uuidv4(),
    fromEntityId: fromId,
    toEntityId: toId,
    type: overrides.type ?? 'HOSTS',
    strength: overrides.strength ?? 0.8,
    confidence: overrides.confidence ?? 0.9,
    evidence: [],
    bidirectional: false,
    metadata: { firstSeen: now, lastSeen: now, count: 1 },
    ...overrides,
  };
}

export function intelligenceEvent(overrides: Partial<{
  id: string;
  traceId: string;
  tool: string;
  target: string;
  status: 'success' | 'partial' | 'failed';
  entities: ReturnType<typeof entityReference>[];
  observations: ReturnType<typeof observation>[];
  relationships: ReturnType<typeof relationship>[];
}> = {}) {
  const ent = entityReference({ name: 'Host', type: 'infrastructure' });
  const obs = observation({ entityId: ent.id });
  return {
    id: overrides.id ?? uuidv4(),
    traceId: overrides.traceId ?? uuidv4(),
    tool: overrides.tool ?? 'shodan',
    target: overrides.target ?? '93.184.216.34',
    timestamp: now,
    status: overrides.status ?? 'success',
    entities: overrides.entities ?? [ent],
    observations: overrides.observations ?? [obs],
    relationships: overrides.relationships ?? [],
    metadata: { executionTime: 10, errors: undefined, raw: undefined },
    ...overrides,
  };
}

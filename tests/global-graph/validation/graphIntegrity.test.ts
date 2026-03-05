import { describe, it, expect } from 'vitest';
import { validateGraphStructure, validateGraphStructureOrThrow } from '../../../global-graph/validation/graphIntegrity';
import type { IntelligenceEventOntology } from '../../../global-graph/ontology/intelligenceEventSchema';

const eventId = '11111111-1111-4111-a111-111111111111';
const actorId = '22222222-2222-4222-a222-222222222222';
const orgId = '33333333-3333-4333-a333-333333333333';
const ts = '2025-01-15T12:00:00.000Z';

const validEvent: IntelligenceEventOntology = {
  event_id: eventId,
  timestamp: ts,
  source_type: 'osint',
  raw_source: 'https://example.com',
  entities_detected: [
    { id: actorId, object_type: 'Actor', name: 'Test Actor', confidence: 0.9 },
    { id: orgId, object_type: 'Organization', name: 'Test Org', confidence: 0.85 },
  ],
  relationships_detected: [
    {
      from_entity_id: actorId,
      to_entity_id: orgId,
      link_type: 'funds',
      confidence: 0.8,
      source_reference: 'ref1',
    },
  ],
  confidence: 0.85,
};

describe('validateGraphStructure', () => {
  it('passes for a valid event with entities, relationships, and source', () => {
    const result = validateGraphStructure(validEvent);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.checks.entitySchema.ok).toBe(true);
    expect(result.checks.relationshipSchema.ok).toBe(true);
    expect(result.checks.evidenceLinkage.ok).toBe(true);
    expect(result.checks.confidenceScoring.ok).toBe(true);
    expect(result.checks.noOrphanRelationships.ok).toBe(true);
    expect(result.checks.signalTraceability.ok).toBe(true);
  });

  it('passes when event has source_type but relationships lack source_reference (event-level evidence)', () => {
    const event: IntelligenceEventOntology = {
      ...validEvent,
      relationships_detected: [
        { from_entity_id: actorId, to_entity_id: orgId, link_type: 'funds', confidence: 0.8 },
      ],
    };
    const result = validateGraphStructure(event);
    expect(result.ok).toBe(true);
    expect(result.checks.evidenceLinkage.ok).toBe(true);
  });

  it('fails evidenceLinkage when event has no source_type and relationship has no source_reference', () => {
    const event: IntelligenceEventOntology = {
      ...validEvent,
      source_type: undefined as unknown as 'osint',
      relationships_detected: [
        { from_entity_id: actorId, to_entity_id: orgId, link_type: 'funds', confidence: 0.8 },
      ],
    };
    const result = validateGraphStructure(event);
    expect(result.checks.evidenceLinkage.ok).toBe(false);
    expect(result.checks.evidenceLinkage.errors.length).toBeGreaterThan(0);
  });

  it('fails signalTraceability when source_type is missing', () => {
    const event: IntelligenceEventOntology = {
      ...validEvent,
      source_type: undefined as unknown as 'osint',
    };
    const result = validateGraphStructure(event);
    expect(result.checks.signalTraceability.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('source_type'))).toBe(true);
  });

  it('fails noOrphanRelationships when a relationship references an entity not in entities_detected', () => {
    const otherId = '44444444-4444-4444-a444-444444444444';
    const event: IntelligenceEventOntology = {
      ...validEvent,
      relationships_detected: [
        { from_entity_id: actorId, to_entity_id: otherId, link_type: 'funds', confidence: 0.8, source_reference: 'x' },
      ],
    };
    const result = validateGraphStructure(event);
    expect(result.checks.noOrphanRelationships.ok).toBe(false);
    expect(result.checks.noOrphanRelationships.errors.some((e) => e.includes(otherId))).toBe(true);
  });

  it('fails entitySchema for invalid entity (e.g. bad confidence)', () => {
    const event: IntelligenceEventOntology = {
      ...validEvent,
      entities_detected: [
        { id: actorId, object_type: 'Actor', name: 'Test', confidence: 1.5 },
        { id: orgId, object_type: 'Organization', name: 'Org', confidence: 0.85 },
      ],
    };
    const result = validateGraphStructure(event);
    expect(result.checks.entitySchema.ok).toBe(false);
    expect(result.checks.confidenceScoring.ok).toBe(false);
  });

  it('fails relationshipSchema for invalid link_type or bad confidence', () => {
    const event: IntelligenceEventOntology = {
      ...validEvent,
      relationships_detected: [
        {
          from_entity_id: actorId,
          to_entity_id: orgId,
          link_type: 'invalid_link' as any,
          confidence: 0.8,
          source_reference: 'ref',
        },
      ],
    };
    const result = validateGraphStructure(event);
    expect(result.checks.relationshipSchema.ok).toBe(false);
  });

  it('aggregates all errors into result.errors', () => {
    const event: IntelligenceEventOntology = {
      ...validEvent,
      source_type: undefined as unknown as 'osint',
      entities_detected: [{ id: actorId, object_type: 'Actor', name: 'Test', confidence: 2 }],
      relationships_detected: [
        { from_entity_id: actorId, to_entity_id: '44444444-4444-4444-a444-444444444444', link_type: 'funds', confidence: 0.8 },
      ],
    };
    const result = validateGraphStructure(event);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

describe('validateGraphStructureOrThrow', () => {
  it('does not throw for valid event', () => {
    expect(() => validateGraphStructureOrThrow(validEvent)).not.toThrow();
  });

  it('throws with combined error message for invalid event', () => {
    const event: IntelligenceEventOntology = {
      ...validEvent,
      source_type: undefined as unknown as 'osint',
    };
    expect(() => validateGraphStructureOrThrow(event)).toThrow('Graph integrity failed');
  });
});

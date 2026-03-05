/**
 * Structural integrity validation for the Shaivra intelligence graph.
 * Ensures entity schema consistency, relationship integrity, evidence linkage,
 * confidence bounds, no orphan relationships, and signal traceability.
 */
import type { IntelligenceEventOntology } from '../ontology/intelligenceEventSchema';
import { entityDetectedSchema, relationshipDetectedSchema, sourceTypeSchema } from '../ontology/intelligenceEventSchema';
import { linkTypeSchema, type LinkType } from '../ontology/linkTypes';
import { objectTypeSchema, type ObjectType } from '../ontology/objectTypes';

export interface GraphIntegrityCheck {
  name: string;
  ok: boolean;
  errors: string[];
}

export interface GraphIntegrityResult {
  ok: boolean;
  checks: {
    entitySchema: GraphIntegrityCheck;
    relationshipSchema: GraphIntegrityCheck;
    evidenceLinkage: GraphIntegrityCheck;
    confidenceScoring: GraphIntegrityCheck;
    noOrphanRelationships: GraphIntegrityCheck;
    signalTraceability: GraphIntegrityCheck;
  };
  errors: string[];
}

const CONFIDENCE_MIN = 0;
const CONFIDENCE_MAX = 1;

/**
 * Validates entity schema: each entity has valid id, object_type, name, confidence in [0,1].
 */
function checkEntitySchema(event: IntelligenceEventOntology): GraphIntegrityCheck {
  const errors: string[] = [];
  for (let i = 0; i < event.entities_detected.length; i++) {
    const e = event.entities_detected[i];
    const result = entityDetectedSchema.safeParse(e);
    if (!result.success) {
      const msg = result.error.flatten().formErrors.join('; ') || result.error.message;
      errors.push(`entity[${i}] (id=${e.id}): ${msg}`);
    }
  }
  return { name: 'entitySchema', ok: errors.length === 0, errors };
}

/**
 * Validates relationship schema: valid link_type, UUID endpoints, confidence in [0,1].
 */
function checkRelationshipSchema(event: IntelligenceEventOntology): GraphIntegrityCheck {
  const errors: string[] = [];
  for (let i = 0; i < event.relationships_detected.length; i++) {
    const r = event.relationships_detected[i];
    const result = relationshipDetectedSchema.safeParse(r);
    if (!result.success) {
      const msg = result.error.flatten().formErrors.join('; ') || result.error.message;
      errors.push(`relationship[${i}] (${r.from_entity_id}->${r.to_entity_id}): ${msg}`);
    }
  }
  return { name: 'relationshipSchema', ok: errors.length === 0, errors };
}

/**
 * Ensures every relationship has supporting evidence: either source_reference or event-level source_type.
 */
function checkEvidenceLinkage(event: IntelligenceEventOntology): GraphIntegrityCheck {
  const errors: string[] = [];
  const hasEventSource = event.source_type != null && event.source_type.length > 0;
  for (let i = 0; i < event.relationships_detected.length; i++) {
    const r = event.relationships_detected[i];
    const hasRef = r.source_reference != null && String(r.source_reference).trim().length > 0;
    if (!hasRef && !hasEventSource) {
      errors.push(`relationship[${i}] (${r.from_entity_id}->${r.to_entity_id}): missing source_reference and event has no source_type`);
    }
  }
  return { name: 'evidenceLinkage', ok: errors.length === 0, errors };
}

/**
 * Ensures all confidence values are in [0, 1] for event, entities, and relationships.
 */
function checkConfidenceScoring(event: IntelligenceEventOntology): GraphIntegrityCheck {
  const errors: string[] = [];
  const inRange = (v: number, label: string) => {
    if (typeof v !== 'number' || v < CONFIDENCE_MIN || v > CONFIDENCE_MAX) {
      errors.push(`${label}: confidence ${v} not in [${CONFIDENCE_MIN}, ${CONFIDENCE_MAX}]`);
    }
  };
  inRange(event.confidence, 'event');
  event.entities_detected.forEach((e, i) => inRange(e.confidence, `entity[${i}] (${e.id})`));
  event.relationships_detected.forEach((r, i) => inRange(r.confidence, `relationship[${i}]`));
  return { name: 'confidenceScoring', ok: errors.length === 0, errors };
}

/**
 * Ensures no orphan relationships: every from_entity_id and to_entity_id appears in entities_detected.
 */
function checkNoOrphanRelationships(event: IntelligenceEventOntology): GraphIntegrityCheck {
  const errors: string[] = [];
  const entityIds = new Set(event.entities_detected.map((e) => e.id));
  for (let i = 0; i < event.relationships_detected.length; i++) {
    const r = event.relationships_detected[i];
    if (!entityIds.has(r.from_entity_id)) {
      errors.push(`relationship[${i}]: from_entity_id ${r.from_entity_id} not in entities_detected`);
    }
    if (!entityIds.has(r.to_entity_id)) {
      errors.push(`relationship[${i}]: to_entity_id ${r.to_entity_id} not in entities_detected`);
    }
  }
  return { name: 'noOrphanRelationships', ok: errors.length === 0, errors };
}

/**
 * Ensures every signal is traceable to a source: event has valid, non-empty source_type.
 */
function checkSignalTraceability(event: IntelligenceEventOntology): GraphIntegrityCheck {
  const errors: string[] = [];
  const raw = event.source_type;
  if (raw == null || String(raw).trim().length === 0) {
    errors.push('event source_type is required for signal traceability');
    return { name: 'signalTraceability', ok: false, errors };
  }
  const result = sourceTypeSchema.safeParse(raw);
  if (!result.success) {
    errors.push(`event source_type invalid: ${result.error.message}`);
  }
  return { name: 'signalTraceability', ok: errors.length === 0, errors };
}

/**
 * Runs all graph structural integrity checks on an intelligence event (pre-write).
 * Use before calling intelligenceEventToGraphOps to ensure no orphan edges and full evidence.
 */
export function validateGraphStructure(event: IntelligenceEventOntology): GraphIntegrityResult {
  const entitySchema = checkEntitySchema(event);
  const relationshipSchema = checkRelationshipSchema(event);
  const evidenceLinkage = checkEvidenceLinkage(event);
  const confidenceScoring = checkConfidenceScoring(event);
  const noOrphanRelationships = checkNoOrphanRelationships(event);
  const signalTraceability = checkSignalTraceability(event);

  const checks = {
    entitySchema,
    relationshipSchema,
    evidenceLinkage,
    confidenceScoring,
    noOrphanRelationships,
    signalTraceability,
  };

  const allErrors = Object.values(checks).flatMap((c) => c.errors);
  const ok = allErrors.length === 0;

  return { ok, checks, errors: allErrors };
}

/**
 * Validates graph structure and throws if any check fails. Use in strict pipelines before write.
 */
export function validateGraphStructureOrThrow(event: IntelligenceEventOntology): void {
  const result = validateGraphStructure(event);
  if (!result.ok) {
    throw new Error(`Graph integrity failed: ${result.errors.join('; ')}`);
  }
}

/** Re-export schema types for callers that need to assert link/object types. */
export { linkTypeSchema, objectTypeSchema };
export type { LinkType, ObjectType };

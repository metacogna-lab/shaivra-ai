/**
 * Intelligence event ontology: normalized shape for signals entering the graph.
 * Used by graph integrity and builders.
 */
import { z } from 'zod';
import { objectTypeSchema } from './objectTypes';
import { linkTypeSchema } from './linkTypes';

const uuidSchema = z.string().uuid();

export const sourceTypeSchema = z.enum(['osint', 'cyber', 'financial']);
export type SourceType = z.infer<typeof sourceTypeSchema>;

export const entityDetectedSchema = z.object({
  id: uuidSchema,
  object_type: objectTypeSchema,
  name: z.string().min(1),
  confidence: z.number().min(0).max(1),
});
export type EntityDetected = z.infer<typeof entityDetectedSchema>;

export const relationshipDetectedSchema = z.object({
  from_entity_id: uuidSchema,
  to_entity_id: uuidSchema,
  link_type: linkTypeSchema,
  confidence: z.number().min(0).max(1),
  source_reference: z.string().optional(),
});
export type RelationshipDetected = z.infer<typeof relationshipDetectedSchema>;

export const intelligenceEventOntologySchema = z.object({
  event_id: uuidSchema,
  timestamp: z.string(),
  source_type: sourceTypeSchema,
  raw_source: z.string().optional(),
  entities_detected: z.array(entityDetectedSchema),
  relationships_detected: z.array(relationshipDetectedSchema),
  confidence: z.number().min(0).max(1),
  vector_embedding: z.array(z.number()).optional(),
});
export type IntelligenceEventOntology = z.infer<typeof intelligenceEventOntologySchema>;

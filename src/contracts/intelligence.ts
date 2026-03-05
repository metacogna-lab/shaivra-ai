import { z } from 'zod';

/**
 * Canonical Intelligence Schemas
 *
 * These Zod contracts define the cross-service data model for
 * entities, observations, relationships, and events that power
 * the Shaivra intelligence pipeline. All OSINT tools and
 * knowledge graph integrations must normalize to these shapes.
 */

export const entityClassificationSchema = z.enum([
  'person',
  'organization',
  'infrastructure',
  'event',
  'unknown',
]);

export const entityReferenceSchema = z.object({
  id: z.string().uuid('Entity identifiers must be UUID v4'),
  type: entityClassificationSchema,
  name: z.string().min(1, 'Entity name required'),
  aliases: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  attributes: z.record(z.string(), z.unknown()).default({}),
  sourceIds: z.array(z.string().uuid()).default([]),
  firstSeen: z.date(),
  lastSeen: z.date(),
  metadata: z.object({
    verified: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    notes: z.string().optional(),
  }),
});

export const observationTypeSchema = z.enum([
  'attribute',
  'behavior',
  'event',
  'relationship',
]);

export const observationSchema = z.object({
  id: z.string().uuid(),
  entityId: z.string().uuid(),
  type: observationTypeSchema,
  property: z.string().min(1),
  value: z.unknown(),
  confidence: z.number().min(0).max(1),
  source: z.object({
    tool: z.string().min(1),
    url: z.string().url().optional(),
    timestamp: z.date(),
    raw: z.unknown(),
  }),
  context: z.record(z.string(), z.unknown()).default({}),
  expiresAt: z.date().optional(),
});

export const relationshipSchema = z.object({
  id: z.string().uuid(),
  fromEntityId: z.string().uuid(),
  toEntityId: z.string().uuid(),
  type: z.string().min(1),
  strength: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string().uuid()).default([]),
  bidirectional: z.boolean().default(false),
  metadata: z.object({
    firstSeen: z.date(),
    lastSeen: z.date(),
    count: z.number().int().nonnegative(),
    context: z.string().optional(),
  }),
});

export const intelligenceEventStatusSchema = z.enum([
  'success',
  'partial',
  'failed',
]);

export const intelligenceEventSchema = z.object({
  id: z.string().uuid(),
  traceId: z.string().uuid(),
  investigationId: z.string().uuid().optional(),
  tool: z.string().min(1),
  target: z.string().min(1),
  timestamp: z.date(),
  status: intelligenceEventStatusSchema,
  entities: z.array(entityReferenceSchema),
  observations: z.array(observationSchema),
  relationships: z.array(relationshipSchema),
  metadata: z.object({
    executionTime: z.number().nonnegative(),
    cost: z.number().nonnegative().optional(),
    errors: z.array(z.string()).optional(),
    raw: z.unknown().optional(),
  }),
});

export type EntityReference = z.infer<typeof entityReferenceSchema>;
export type Observation = z.infer<typeof observationSchema>;
export type Relationship = z.infer<typeof relationshipSchema>;
export type IntelligenceEvent = z.infer<typeof intelligenceEventSchema>;

export const isEntityReference = (value: unknown): value is EntityReference =>
  entityReferenceSchema.safeParse(value).success;

export const isIntelligenceEvent = (value: unknown): value is IntelligenceEvent =>
  intelligenceEventSchema.safeParse(value).success;

import { z } from 'zod';
import { isoDateTimeSchema } from './primitives';

export const viewTypeSchema = z.enum([
  'landing',
  'explorer',
  'mission',
  'lens',
  'forge',
  'shield',
  'pipeline',
  'forge-monitor',
  'shield-monitor',
  'campaign-analysis',
  'agent-network',
  'projects',
]);

export const sectionTypeSchema = z.enum([
  'hero',
  'products',
  'strategy',
  'contact',
]);

export const productIconSchema = z.enum(['lens', 'forge', 'shield']);

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  icon: productIconSchema,
  features: z.array(z.string()),
});

export const navItemSchema = z.object({
  label: z.string(),
  id: z.string(),
});

export const entityTypeSchema = z.enum([
  'person',
  'organization',
  'domain',
  'ip_address',
  'infrastructure_asset',
  'social_handle',
  'document',
  'event',
  'location',
  'narrative_claim',
  'financial_artifact',
  'campaign_signal',
  'threat_indicator',
]);

export const relationshipTypeSchema = z.enum([
  'OWNS',
  'REGISTERED_TO',
  'HOSTS',
  'ASSOCIATED_WITH',
  'MENTIONS',
  'FUNDS',
  'COMMUNICATED_WITH',
  'PART_OF',
  'PROMOTES',
  'ATTACKED',
  'DERIVED_FROM',
]);

export const graphEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  type: relationshipTypeSchema,
  label: z.string().optional(),
  strength: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  evidenceCount: z.number().int().nonnegative(),
  firstObserved: isoDateTimeSchema.optional(),
  lastObserved: isoDateTimeSchema.optional(),
});

export const graphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: entityTypeSchema,
  x: z.number(),
  y: z.number(),
  r: z.number(),
  confidence: z.number().min(0).max(1),
  riskScore: z.number().min(0).max(100),
  sourceCount: z.number().int().nonnegative(),
  firstSeen: isoDateTimeSchema,
  lastSeen: isoDateTimeSchema,
  clusterId: z.string().optional(),
  expanded: z.boolean().optional(),
  details: z.object({
    role: z.string(),
    description: z.string(),
    sources: z.array(z.string()),
    attribution: z.string(),
    linkedEvidence: z.array(z.string()),
    linkedin: z
      .object({
        profileUrl: z.string().url(),
        headline: z.string().optional(),
        connections: z.number().int().nonnegative().optional(),
        lastPostDate: isoDateTimeSchema.optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
      .optional(),
  }),
});

export const clusterSchema = z.object({
  id: z.string(),
  label: z.string(),
  riskScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  insight: z.string(),
  members: z.array(z.string()),
});

export const campaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['disinformation', 'smear', 'legal', 'cyber']),
  threatLevel: z.enum(['low', 'medium', 'high', 'critical']),
  actors: z.array(z.string()),
});

export const dossierStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(['pending', 'active', 'complete']),
  detail: z.string().optional(),
});

export const dataSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['public', 'restricted', 'dark']),
  icon: z.string(),
  description: z.string(),
});

export const graphQuerySchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  focus: z.enum(['network', 'finance', 'infra']),
});

export const graphDataSchema = z.object({
  nodes: z.array(graphNodeSchema),
  edges: z.array(graphEdgeSchema),
  clusters: z.array(clusterSchema).optional(),
  adjacencyMatrix: z
    .record(z.string(), z.record(z.string(), graphEdgeSchema.nullable()))
    .optional(),
});

export const playbookStrategySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum([
    'defensive_comm',
    'operational_readiness',
    'partner_engagement',
    'competitor_counter',
  ]),
  description: z.string(),
  rationale: z.object({
    signalProvenance: z.string(),
    strategyLogic: z.string(),
    impactEstimate: z.string(),
  }),
  metrics: z.array(
    z.object({
      name: z.string(),
      target: z.string(),
    })
  ),
  nextSteps: z.array(z.string()),
  risks: z.array(z.string()),
  triggers: z.array(z.string()),
});

export const playbookSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sessionId: z.string(),
  createdAt: isoDateTimeSchema,
  scenarioDrivers: z.array(z.string()),
  strategies: z.array(playbookStrategySchema),
});

export const canonicalEventSchema = z.object({
  trace_id: z.string().uuid(),
  schema_version: z.string(),
  source_platform: z.string(),
  source_type: z.enum(['news', 'social', 'threat', 'vuln', 'open-data']),
  collected_at: isoDateTimeSchema,
  raw_data: z.record(z.string(), z.unknown()),
  normalized_event: z.object({
    event_id: z.string().uuid(),
    language: z.string(),
    geo_hint: z.string().optional(),
    confidence_score: z.number().min(0).max(1),
    content_hash: z.string(),
    derived_entities: z.array(z.string()),
    tags: z.array(z.string()),
  }),
});

export type ViewType = z.infer<typeof viewTypeSchema>;
export type SectionType = z.infer<typeof sectionTypeSchema>;
export type Product = z.infer<typeof productSchema>;
export type NavItem = z.infer<typeof navItemSchema>;
export type EntityType = z.infer<typeof entityTypeSchema>;
export type RelationshipType = z.infer<typeof relationshipTypeSchema>;
export type GraphNode = z.infer<typeof graphNodeSchema>;
export type GraphEdge = z.infer<typeof graphEdgeSchema>;
export type Cluster = z.infer<typeof clusterSchema>;
export type Campaign = z.infer<typeof campaignSchema>;
export type DossierStep = z.infer<typeof dossierStepSchema>;
export type DataSource = z.infer<typeof dataSourceSchema>;
export type GraphQuery = z.infer<typeof graphQuerySchema>;
export type GraphData = z.infer<typeof graphDataSchema>;
export type PlaybookStrategy = z.infer<typeof playbookStrategySchema>;
export type Playbook = z.infer<typeof playbookSchema>;
export type CanonicalEvent = z.infer<typeof canonicalEventSchema>;

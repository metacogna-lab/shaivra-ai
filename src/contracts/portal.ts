import { z } from 'zod';
import { isoDateTimeSchema } from './primitives';

// Shared portal response metadata
export const portalMetaSchema = z.object({
  trace_id: z.string(),
  schema_version: z.string(),
  timestamp: isoDateTimeSchema,
  validation_status: z.enum(['valid', 'invalid']),
  raw_hash: z.string().optional(),
});

export type PortalMeta = z.infer<typeof portalMetaSchema>;

export const createPortalApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    meta: portalMetaSchema,
  });

export type PortalApiResponse<T> = {
  data: T;
  meta: PortalMeta;
};

// Core portal objects
export const portalUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  role: z.enum(['analyst', 'admin', 'viewer']),
  permissions: z.array(z.string()),
  last_login: isoDateTimeSchema,
});

export const ingestionJobStatusSchema = z.enum([
  'pending',
  'processing',
  'normalizing',
  'complete',
  'failed',
]);

export const ingestionJobSchema = z.object({
  id: z.string(),
  source: z.string(),
  status: ingestionJobStatusSchema,
  progress: z.number().min(0).max(100),
  started_at: isoDateTimeSchema,
  completed_at: isoDateTimeSchema.optional(),
  items_processed: z.number().int().nonnegative(),
  errors: z.array(z.string()),
});

export const lensSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['rss', 'api', 'crawler']),
  endpoint: z.string().url(),
  frequency: z.string(),
  schema_version: z.string(),
  status: z.enum(['active', 'inactive', 'error']),
});

export const pipelineMetricSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.union([z.number(), z.string()]),
  status: z.enum(['active', 'idle', 'warning', 'error', 'success']),
  meta: z.object({
    trace_id: z.string(),
    timestamp: isoDateTimeSchema,
    schema_version: z.string(),
  }),
});

export const dashboardDataSchema = z.object({
  metrics: z.array(pipelineMetricSchema),
  system_health: z.string(),
  active_jobs: z.number().int().nonnegative(),
  alerts: z.number().int().nonnegative(),
});

export const lensIngestionResultSchema = z.object({
  raw_id: z.string(),
  raw_hash: z.string(),
  object_uri: z.string(),
  topic_published: isoDateTimeSchema,
  payload: z.unknown(),
  meta: z.object({
    trace_id: z.string(),
    timestamp: isoDateTimeSchema,
    schema_version: z.string(),
  }),
});

export const lensNormalizationResultSchema = z.object({
  event_id: z.string(),
  source_domain: z.string(),
  canonical_event: z.unknown(),
  meta: z.object({
    trace_id: z.string(),
    timestamp: isoDateTimeSchema,
    schema_version: z.string(),
    validation_status: z.enum(['valid', 'invalid']),
  }),
});

export const lensEnrichmentResultSchema = z.object({
  event_id: z.string(),
  embedding_vector: z.array(z.number()),
  extracted_entities: z.array(z.string()),
  topic_tags: z.array(z.string()),
  meta: z.object({
    trace_id: z.string(),
    timestamp: isoDateTimeSchema,
  }),
});

export const lensClusteringResultSchema = z.object({
  cluster_id: z.string(),
  velocity_score: z.number(),
  lifecycle_stage: z.enum(['emerging', 'active', 'peak', 'decay']),
  meta: z.object({
    trace_id: z.string(),
    timestamp: isoDateTimeSchema,
  }),
});

export const lensLLMReportSchema = z.object({
  escalation_probability: z.number().min(0).max(1),
  recommended_actions: z.array(z.string()),
  analysis_json: z.unknown(),
  meta: z.object({
    trace_id: z.string(),
    timestamp: isoDateTimeSchema,
    schema_validation: z.enum(['pass', 'fail']),
  }),
});

export const lensAuditEntrySchema = z.object({
  reviewer_id: z.string(),
  decision: z.enum(['approved', 'rejected']),
  timestamp: isoDateTimeSchema,
  immutable_hash: z.string(),
});

// Pipeline contracts
export const ingestionEventSchema = z.object({
  raw_id: z.string(),
  source_type: z.enum(['rss', 'api', 'crawler']),
  payload_size_bytes: z.number().int().nonnegative(),
  ingested_at: isoDateTimeSchema,
  raw_content: z.string(),
  checksum: z.string(),
  meta: z.object({
    trace_id: z.string(),
    ingestor_version: z.string(),
  }),
});

export const normalizedEventSchema = z.object({
  event_id: z.string(),
  canonical_type: z.enum(['article', 'social_post', 'forum_thread']),
  normalized_text: z.string(),
  language_code: z.string(),
  timestamp_utc: isoDateTimeSchema,
  source_ref: z.string(),
  meta: z.object({
    trace_id: z.string(),
    normalizer_version: z.string(),
    processing_time_ms: z.number().int().nonnegative(),
  }),
});

export const enrichedEventSchema = z.object({
  event_id: z.string(),
  entities: z.array(
    z.object({
      text: z.string(),
      type: z.enum(['PERSON', 'ORG', 'LOC', 'EVENT']),
      confidence: z.number().min(0).max(1),
    })
  ),
  sentiment: z.object({
    score: z.number().min(-1).max(1),
    magnitude: z.number().nonnegative(),
  }),
  risk_score: z.number().min(0).max(100),
  meta: z.object({
    trace_id: z.string(),
    enricher_version: z.string(),
    model_version: z.string(),
  }),
});

export const extractedDataSchema = z.object({
  event_id: z.string(),
  entities: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      type: z.enum([
        'PERSON',
        'ORG',
        'LOC',
        'CYBER_THREAT',
        'WEAPON',
        'CRYPTO_WALLET',
      ]),
      confidence: z.number().min(0).max(1),
      span: z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()]),
    })
  ),
  relations: z.array(
    z.object({
      source_entity_id: z.string(),
      target_entity_id: z.string(),
      type: z.enum(['AFFILIATED_WITH', 'LOCATED_AT', 'TARGETED', 'FUNDED']),
      confidence: z.number().min(0).max(1),
    })
  ),
  meta: z.object({
    trace_id: z.string(),
    model: z.string(),
    processing_time_ms: z.number().int().nonnegative(),
  }),
});

export const fingerprintDataSchema = z.object({
  stack: z.array(z.string()),
  architecture: z.string(),
  api_endpoints: z.array(z.string()),
  cloud_assets: z.array(z.string()),
  vulnerabilities: z.array(z.string()),
});

export const osintEnrichmentSchema = z.object({
  entity_id: z.string(),
  tool: z.enum([
    'Sherlock',
    'TheHarvester',
    'Shodan',
    'VirusTotal',
    'Fingerprinter',
    'OSINT',
    'AlienVault',
  ]),
  data: z.unknown(),
  status: z.enum(['success', 'failed']),
  timestamp: isoDateTimeSchema,
});

export const graphUpdateSchema = z.object({
  transaction_id: z.string(),
  nodes_created: z.number().int().nonnegative(),
  edges_created: z.number().int().nonnegative(),
  ontology_version: z.string(),
  graph_snapshot_hash: z.string(),
  meta: z.object({
    trace_id: z.string(),
    db_time_ms: z.number().int().nonnegative(),
  }),
});

export const strategicReportSchema = z.object({
  report_id: z.string(),
  title: z.string(),
  summary: z.string(),
  competition_context: z
    .object({
      main_competitors: z.array(z.string()),
      market_entrants: z.array(z.string()),
      competitive_threat_level: z.enum(['low', 'medium', 'high', 'critical']),
    })
    .optional(),
  conflict_analysis: z
    .object({
      probability: z.number().min(0).max(1),
      reasons: z.array(z.string()),
    })
    .optional(),
  key_findings: z.array(z.string()),
  risk_assessment: z.string().optional(),
  strategic_actions: z.array(z.string()).optional(),
  graph_context: z.object({
    nodes_referenced: z.number().int().nonnegative(),
    clusters_analyzed: z.number().int().nonnegative(),
  }),
  raw_json_store_path: z.string(),
  generated_at: isoDateTimeSchema,
  meta: z.object({
    agent_version: z.string(),
    trace_id: z.string(),
  }),
});

// Forge and Shield
export const forgeSimulationSchema = z.object({
  simulation_id: z.string(),
  campaign_name: z.string(),
  sector: z.string(),
  threat_vector: z.string(),
  status: z.enum(['initializing', 'simulating', 'analyzing', 'complete']),
  progress: z.number().min(0).max(1),
  outcome_probability: z.number().min(0).max(1),
  projected_impact: z.enum(['low', 'medium', 'high', 'critical']),
  meta: z.object({
    trace_id: z.string(),
    timestamp: isoDateTimeSchema,
    model_version: z.string(),
  }),
});

export const forgeReportSchema = z.object({
  report_id: z.string(),
  simulation_ref: z.string(),
  narrative_summary: z.string(),
  predicted_timeline: z.array(
    z.object({
      day: z.number().int().nonnegative(),
      event: z.string(),
      probability: z.number().min(0).max(1),
    })
  ),
  recommended_countermeasures: z.array(z.string()),
  raw_json_path: z.string(),
  generated_at: isoDateTimeSchema,
});

export const proprietaryAssetSchema = z.object({
  asset_id: z.string(),
  name: z.string(),
  type: z.enum(['infrastructure', 'personnel', 'intellectual_property']),
  criticality: z.enum(['low', 'medium', 'high', 'critical']),
});

export const shieldComparisonSchema = z.object({
  comparison_id: z.string(),
  threat_source_ref: z.string(),
  asset_ref: z.string(),
  match_score: z.number().min(0).max(100),
  vulnerability_detected: z.boolean(),
  mitigation_status: z.enum(['active', 'pending', 'resolved']),
  timestamp: isoDateTimeSchema,
});

// Campaign analysis
export const campaignUploadRequestSchema = z.object({
  fileName: z.string(),
  fileSize: z.number().int().nonnegative(),
  fileType: z.enum(['pdf', 'docx', 'markdown']),
});

export const campaignAnalysisResultSchema = z.object({
  analysis_id: z.string(),
  status: z.enum([
    'uploading',
    'chunking',
    'analyzing_osint',
    'predicting_impact',
    'complete',
    'failed',
  ]),
  progress: z.number().min(0).max(100),
  chunks_processed: z.number().int().nonnegative(),
  knowledge_graph_nodes_matched: z.number().int().nonnegative(),
  adversarial_alignment_score: z.number().min(0).max(100),
  competitive_impact_score: z.number().min(0).max(100),
  predictive_summation: z.object({
    summary: z.string(),
    key_risks: z.array(z.string()),
    adversarial_actors: z.array(z.string()),
    market_reaction_prediction: z.string(),
  }),
  meta: z.object({
    trace_id: z.string(),
    timestamp: isoDateTimeSchema,
    kg_version: z.string(),
  }),
});

// OSINT reporting
export const osintToolConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  required_api_key_env: z.string(),
  capabilities: z.array(z.string()),
});

export const osintReportSectionSchema = z.object({
  title: z.string(),
  content: z.union([z.string(), z.record(z.string(), z.unknown())]),
  confidence: z.number().min(0).max(1),
  source_tool: z.string(),
});

export const standardizedOsintReportSchema = z.object({
  report_id: z.string(),
  target: z.string(),
  timestamp: isoDateTimeSchema,
  summary: z.string(),
  threat_level: z.enum(['low', 'medium', 'high', 'critical']),
  sections: z.object({
    infrastructure: z.array(osintReportSectionSchema),
    personnel: z.array(osintReportSectionSchema),
    dark_web: z.array(osintReportSectionSchema),
    social_sentiment: z.array(osintReportSectionSchema),
  }),
  graph_correlation: z.object({
    nodes_mapped: z.number().int().nonnegative(),
    clusters_identified: z.number().int().nonnegative(),
    proprietary_overlap: z.boolean(),
  }),
  raw_json_uri: z.string(),
});

// Agent network
export const agentMessageSchema = z.object({
  role: z.enum(['user', 'ai', 'system', 'tool']),
  content: z.string(),
  name: z.string().optional(),
});

export const agentLogSchema = z.object({
  id: z.string(),
  timestamp: isoDateTimeSchema,
  node: z.string(),
  action: z.string(),
  details: z.union([z.string(), z.record(z.string(), z.unknown())]),
  status: z.enum(['success', 'error', 'pending']),
});

export const agentStateSchema = z.object({
  messages: z.array(agentMessageSchema),
  entities: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      classification: z.enum(['ally', 'adversary', 'neutral']),
    })
  ),
  investigation_depth: z.number().int().nonnegative(),
  db_stats: z.object({
    doc_records: z.number().int().nonnegative(),
    sql_rows: z.number().int().nonnegative(),
  }),
  current_active_node: z.string(),
});

export const agentRunSchema = z.object({
  run_id: z.string(),
  target: z.string(),
  status: z.enum(['initializing', 'running', 'consolidating', 'completed']),
  state: agentStateSchema,
  logs: z.array(agentLogSchema),
});

// Onboarding & auth
export const userStatusSchema = z.enum([
  'pending_verification',
  'active',
  'suspended',
]);

export const onboardingRequestSchema = z.object({
  email: z.string().email(),
  organization_name: z.string(),
  consent: z.boolean(),
  phone_number: z.string().optional(),
  referral_source: z.string().optional(),
  role_title: z.string().optional(),
  intended_use_case: z.string().optional(),
  market_segment: z.string().optional(),
  key_field: z.string().optional(),
});

export const onboardingResponseSchema = z.object({
  status: z.literal('registered'),
  user_id: z.string(),
  trace_id: z.string(),
  created_at: isoDateTimeSchema,
  demo_temp_password: z.string().optional(),
});

export const authResponseSchema = z.object({
  status: z.enum(['authenticated', 'requires_reset']),
  session_token: z.string().optional(),
  expires_at: isoDateTimeSchema.optional(),
  trace_id: z.string(),
  user_id: z.string().optional(),
  role: z.string().optional(),
});

export const auditLogEntrySchema = z.object({
  event_type: z.string(),
  trace_id: z.string(),
  user_id: z.string().optional(),
  timestamp: isoDateTimeSchema,
  ip_hash: z.string(),
  status: z.enum(['success', 'failure']),
  payload: z.unknown().optional(),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
  temp_password: z.string().optional(),
  new_password: z.string(),
});

export const threatDomainSchema = z.enum([
  'Organizational',
  'Disinformation',
  'Financial Obfuscation',
  'Cyber Infrastructure',
  'Geopolitical',
]);

export const intelligenceSummarySchema = z.object({
  target: z.string(),
  sector: z.string(),
  threat_domains: z.array(
    z.object({
      domain: threatDomainSchema,
      risk_level: z.enum(['low', 'medium', 'high', 'critical']),
      findings: z.array(z.string()),
    })
  ),
  overall_assessment: z.string(),
  data_sources: z.array(z.string()),
  last_updated: isoDateTimeSchema,
});

export const filteredSearchResultSchema = z.object({
  uuid: z.string(),
  title: z.string(),
  url: z.string().url(),
  relevance_score: z.number(),
  summary: z.string(),
  entities: z.array(z.string()),
});

export const botStateSchema = z.object({
  status: z.enum(['idle', 'searching', 'synthesizing', 'looping', 'completed']),
  current_sector: z.string(),
  intuition_level: z.number().min(0).max(100),
  knowledge_nodes: z.number().int().nonnegative(),
  resources_mapped: z.number().int().nonnegative(),
  logs: z.array(z.string()),
});

export const dailyIntelligenceReportSchema = z.object({
  report_id: z.string(),
  date: isoDateTimeSchema,
  summary: z.string(),
  top_threats: z.array(z.string()),
  sector_shifts: z.array(z.string()),
  graph_updates: z.object({
    nodes: z.array(z.unknown()),
    links: z.array(z.unknown()),
  }),
  ml_insights: z.object({
    clusters: z.array(z.string()),
    trends: z.array(z.string()),
  }),
});

export const weeklyIntelligenceReportSchema = z.object({
  report_id: z.string(),
  narrative_synthesis: z.string(),
  key_shifts: z.array(z.string()),
  recommended_actions: z.array(z.string()),
  data_transformations: z.array(
    z.object({
      type: z.string(),
      count: z.number().int().nonnegative(),
    })
  ),
  ml_model_updates: z.array(
    z.object({
      model: z.string(),
      status: z.string(),
      accuracy_gain: z.number(),
    })
  ),
  week_start: isoDateTimeSchema,
  week_end: isoDateTimeSchema,
});

export const trendSchema = z.object({
  trend: z.string(),
  probability: z.number().min(0).max(1),
  timeframe: z.string(),
  timestamp: isoDateTimeSchema,
});

export const globalGraphNodeSchema = z.object({
  uuid: z.string(),
  label: z.string(),
  type: z.string(),
  connections: z.number().int().nonnegative(),
  last_seen: isoDateTimeSchema,
});

export const strategicCorrelationSchema = z.object({
  correlation_id: z.string(),
  strategic_alignment: z.number().min(0).max(1),
  goal_overlap: z.array(z.string()),
  statistical_analysis: z.object({
    relevance_score: z.number(),
    impact_projection: z.string(),
    confidence_interval: z.tuple([z.number(), z.number()]),
  }),
  triaged_matters: z.array(
    z.object({
      id: z.string(),
      priority: z.enum(['critical', 'high', 'medium', 'low']),
      title: z.string(),
      action: z.string(),
    })
  ),
});

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  created_at: isoDateTimeSchema,
  settings: z.object({
    show_system_health: z.boolean(),
    threat_velocity_threshold: z.number(),
  }),
});

export const searchHistoryEntrySchema = z.object({
  id: z.string(),
  query: z.string(),
  timestamp: isoDateTimeSchema,
  project_id: z.string(),
  results_count: z.number().int().nonnegative(),
});

export const organisationProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  industry: z.string(),
  mission: z.string(),
  goals: z.array(z.string()),
  campaigns: z.array(z.string()),
  competitors: z.array(z.string()),
  political_info: z.array(z.string()),
  strategic_actions: z.array(z.string()),
  nature: z.string(),
  research_objective: z.string(),
  dynamic_system_prompt: z.string(),
  last_updated: isoDateTimeSchema,
});

export const orgProfilingJobSchema = z.object({
  id: z.string(),
  org_name: z.string(),
  status: z.enum([
    'recon',
    'extraction',
    'synthesis',
    'alignment',
    'complete',
    'failed',
  ]),
  progress: z.number().min(0).max(100),
  current_stage: z.string(),
  data: organisationProfileSchema.optional(),
});

// Type aliases
export type PortalUser = z.infer<typeof portalUserSchema>;
export type IngestionJob = z.infer<typeof ingestionJobSchema>;
export type LensSourceConfig = z.infer<typeof lensSourceSchema>;
export type PipelineMetric = z.infer<typeof pipelineMetricSchema>;
export type DashboardData = z.infer<typeof dashboardDataSchema>;
export type LensIngestionResult = z.infer<typeof lensIngestionResultSchema>;
export type LensNormalizationResult = z.infer<typeof lensNormalizationResultSchema>;
export type LensEnrichmentResult = z.infer<typeof lensEnrichmentResultSchema>;
export type LensClusteringResult = z.infer<typeof lensClusteringResultSchema>;
export type LensLLMReport = z.infer<typeof lensLLMReportSchema>;
export type LensAuditEntry = z.infer<typeof lensAuditEntrySchema>;
export type IngestionEvent = z.infer<typeof ingestionEventSchema>;
export type NormalizedEvent = z.infer<typeof normalizedEventSchema>;
export type EnrichedEvent = z.infer<typeof enrichedEventSchema>;
export type ExtractedData = z.infer<typeof extractedDataSchema>;
export type FingerprintData = z.infer<typeof fingerprintDataSchema>;
export type OsintEnrichment = z.infer<typeof osintEnrichmentSchema>;
export type GraphUpdate = z.infer<typeof graphUpdateSchema>;
export type StrategicReport = z.infer<typeof strategicReportSchema>;
export type ForgeSimulation = z.infer<typeof forgeSimulationSchema>;
export type ForgeReport = z.infer<typeof forgeReportSchema>;
export type ProprietaryAsset = z.infer<typeof proprietaryAssetSchema>;
export type ShieldComparison = z.infer<typeof shieldComparisonSchema>;
export type CampaignUploadRequest = z.infer<typeof campaignUploadRequestSchema>;
export type CampaignAnalysisResult = z.infer<typeof campaignAnalysisResultSchema>;
export type OsintToolConfig = z.infer<typeof osintToolConfigSchema>;
export type OsintReportSection = z.infer<typeof osintReportSectionSchema>;
export type StandardizedOsintReport = z.infer<typeof standardizedOsintReportSchema>;
export type AgentMessage = z.infer<typeof agentMessageSchema>;
export type AgentLog = z.infer<typeof agentLogSchema>;
export type AgentState = z.infer<typeof agentStateSchema>;
export type AgentRun = z.infer<typeof agentRunSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
export type OnboardingRequest = z.infer<typeof onboardingRequestSchema>;
export type OnboardingResponse = z.infer<typeof onboardingResponseSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type ThreatDomain = z.infer<typeof threatDomainSchema>;
export type IntelligenceSummary = z.infer<typeof intelligenceSummarySchema>;
export type FilteredSearchResult = z.infer<typeof filteredSearchResultSchema>;
export type BotState = z.infer<typeof botStateSchema>;
export type DailyIntelligenceReport = z.infer<typeof dailyIntelligenceReportSchema>;
export type WeeklyIntelligenceReport = z.infer<typeof weeklyIntelligenceReportSchema>;
export type Trend = z.infer<typeof trendSchema>;
export type GlobalGraphNode = z.infer<typeof globalGraphNodeSchema>;
export type StrategicCorrelation = z.infer<typeof strategicCorrelationSchema>;
export type Project = z.infer<typeof projectSchema>;
export type SearchHistoryEntry = z.infer<typeof searchHistoryEntrySchema>;
export type OrganisationProfile = z.infer<typeof organisationProfileSchema>;
export type OrgProfilingJob = z.infer<typeof orgProfilingJobSchema>;

/**
 * Dummy data conforming to portal Zod schemas for tests.
 * All timestamps are valid ISO 8601 strings.
 */

const ISO = '2025-01-15T12:00:00.000Z';

export const portalMeta = {
  trace_id: 'tr-001',
  schema_version: '1.0',
  timestamp: ISO,
  validation_status: 'valid' as const,
  raw_hash: 'abc123',
};

export const pipelineMetric = {
  id: 'm1',
  label: 'Active Jobs',
  value: 3,
  status: 'active' as const,
  meta: { trace_id: 'tr-001', timestamp: ISO, schema_version: '1.0' },
};

export const dashboardData = {
  metrics: [pipelineMetric],
  system_health: 'optimal',
  active_jobs: 2,
  alerts: 1,
};

export const ingestionJob = {
  id: 'job-001',
  source: 'RSS: CISA',
  status: 'complete' as const,
  progress: 100,
  started_at: ISO,
  completed_at: ISO,
  items_processed: 10,
  errors: [],
};

export const lensSource = {
  id: 'src-1',
  name: 'Twitter Stream',
  type: 'api' as const,
  endpoint: 'https://api.example.com/feed',
  frequency: '1h',
  schema_version: '1.0',
  status: 'active' as const,
};

export const lensIngestionResult = {
  raw_id: 'raw-001',
  raw_hash: 'h1',
  object_uri: 's3://bucket/key',
  topic_published: ISO,
  payload: { title: 'Item' },
  meta: { trace_id: 'tr-001', timestamp: ISO, schema_version: '1.0' },
};

export const lensNormalizationResult = {
  event_id: 'evt-001',
  source_domain: 'example.com',
  canonical_event: { type: 'article' },
  meta: {
    trace_id: 'tr-001',
    timestamp: ISO,
    schema_version: '1.0',
    validation_status: 'valid' as const,
  },
};

export const strategicReport = {
  report_id: 'rpt-001',
  title: 'Strategic Report',
  summary: 'Summary text',
  key_findings: ['Finding 1'],
  graph_context: { nodes_referenced: 5, clusters_analyzed: 2 },
  raw_json_store_path: '/reports/rpt-001.json',
  generated_at: ISO,
  meta: { agent_version: '1.0', trace_id: 'tr-001' },
};

export const forgeSimulation = {
  simulation_id: 'sim-001',
  campaign_name: 'Test',
  sector: 'Tech',
  threat_vector: 'Phishing',
  status: 'complete' as const,
  progress: 1,
  outcome_probability: 0.8,
  projected_impact: 'high' as const,
  meta: { trace_id: 'tr-001', timestamp: ISO, model_version: '1.0' },
};

export const forgeReport = {
  report_id: 'rep-001',
  simulation_ref: 'sim-001',
  narrative_summary: 'Summary',
  predicted_timeline: [{ day: 1, event: 'Phase 1', probability: 0.9 }],
  recommended_countermeasures: ['Action 1'],
  raw_json_path: '/reports/rep-001.json',
  generated_at: ISO,
};

export const proprietaryAsset = {
  asset_id: 'ast-001',
  name: 'Asset',
  type: 'infrastructure' as const,
  criticality: 'high' as const,
};

export const shieldComparison = {
  comparison_id: 'cmp-001',
  threat_source_ref: 'threat-1',
  asset_ref: 'ast-001',
  match_score: 45,
  vulnerability_detected: false,
  mitigation_status: 'resolved' as const,
  timestamp: ISO,
};

export interface PortalApiResponse<T> {
  data: T;
  meta: {
    trace_id: string;
    schema_version: string;
    timestamp: string;
    validation_status: 'valid' | 'invalid';
    raw_hash?: string;
  };
}

export interface PortalUser {
  id: string;
  username: string;
  role: 'analyst' | 'admin' | 'viewer';
  permissions: string[];
  last_login: string;
}

export interface IngestionJob {
  id: string;
  source: string;
  status: 'pending' | 'processing' | 'normalizing' | 'complete' | 'failed';
  progress: number;
  started_at: string;
  completed_at?: string;
  items_processed: number;
  errors: string[];
}

export interface LensSourceConfig {
  id: string;
  name: string;
  type: 'rss' | 'api' | 'crawler';
  endpoint: string;
  frequency: string;
  schema_version: string;
  status: 'active' | 'inactive' | 'error';
}

export interface PipelineMetric {
  id: string;
  label: string;
  value: number | string;
  status: 'active' | 'idle' | 'warning' | 'error' | 'success';
  meta: {
    trace_id: string;
    timestamp: string;
    schema_version: string;
  };
}

export interface DashboardData {
  metrics: PipelineMetric[];
  system_health: string;
  active_jobs: number;
  alerts: number;
}

export interface LensIngestionResult {
  raw_id: string;
  raw_hash: string;
  object_uri: string;
  topic_published: string;
  payload: any;
  meta: {
    trace_id: string;
    timestamp: string;
    schema_version: string;
  };
}

export interface LensNormalizationResult {
  event_id: string;
  source_domain: string;
  canonical_event: any;
  meta: {
    trace_id: string;
    timestamp: string;
    schema_version: string;
    validation_status: 'valid' | 'invalid';
  };
}

export interface LensEnrichmentResult {
  embedding_vector: number[];
  extracted_entities: string[];
  topic_tags: string[];
  meta: {
    trace_id: string;
    timestamp: string;
  };
}

export interface LensClusteringResult {
  cluster_id: string;
  velocity_score: number;
  lifecycle_stage: 'emerging' | 'active' | 'peak' | 'decay';
  meta: {
    trace_id: string;
    timestamp: string;
  };
}

export interface LensLLMReport {
  escalation_probability: number;
  recommended_actions: string[];
  analysis_json: any;
  meta: {
    trace_id: string;
    timestamp: string;
    schema_validation: 'pass' | 'fail';
  };
}

export interface LensAuditEntry {
  reviewer_id: string;
  decision: 'approved' | 'rejected';
  timestamp: string;
  immutable_hash: string;
}

// --- Pipeline Schemas (Rigid Contracts) ---

export interface IngestionEvent {
  raw_id: string;
  source_type: 'rss' | 'api' | 'crawler';
  payload_size_bytes: number;
  ingested_at: string;
  raw_content: string; // JSON stringified
  checksum: string;
  meta: {
    trace_id: string;
    ingestor_version: string; // e.g., "rust-ingestor-v0.4.2"
  };
}

export interface NormalizedEvent {
  event_id: string;
  canonical_type: 'article' | 'social_post' | 'forum_thread';
  normalized_text: string;
  language_code: string;
  timestamp_utc: string;
  source_ref: string; // Reference to raw_id
  meta: {
    trace_id: string;
    normalizer_version: string;
    processing_time_ms: number;
  };
}

export interface EnrichedEvent {
  event_id: string; // Same as NormalizedEvent
  entities: Array<{
    text: string;
    type: 'PERSON' | 'ORG' | 'LOC' | 'EVENT';
    confidence: number;
  }>;
  sentiment: {
    score: number; // -1 to 1
    magnitude: number;
  };
  risk_score: number; // 0-100
  meta: {
    trace_id: string;
    enricher_version: string;
    model_version: string;
  };
}

// --- Advanced Pipeline Schemas (DeepAgent / LangGraph) ---

export interface ExtractedData {
  event_id: string;
  entities: Array<{
    id: string;
    text: string;
    type: 'PERSON' | 'ORG' | 'LOC' | 'CYBER_THREAT' | 'WEAPON' | 'CRYPTO_WALLET';
    confidence: number;
    span: [number, number];
  }>;
  relations: Array<{
    source_entity_id: string;
    target_entity_id: string;
    type: 'AFFILIATED_WITH' | 'LOCATED_AT' | 'TARGETED' | 'FUNDED';
    confidence: number;
  }>;
  meta: {
    trace_id: string;
    model: string; // e.g., "ner-transformer-v4"
    processing_time_ms: number;
  };
}

export interface FingerprintData {
  stack: string[];
  architecture: string;
  api_endpoints: string[];
  cloud_assets: string[];
  vulnerabilities: string[];
}

export interface OsintEnrichment {
  entity_id: string;
  tool: 'Sherlock' | 'TheHarvester' | 'Shodan' | 'VirusTotal' | 'Fingerprinter' | 'OSINT' | 'AlienVault';
  data: any; // Tool specific JSON
  status: 'success' | 'failed';
  timestamp: string;
}

export interface GraphUpdate {
  transaction_id: string;
  nodes_created: number;
  edges_created: number;
  ontology_version: string; // e.g., "shaivra-onto-v2.1"
  graph_snapshot_hash: string;
  meta: {
    trace_id: string;
    db_time_ms: number;
  };
}

export interface StrategicReport {
  report_id: string;
  title: string;
  summary: string;
  competition_context?: {
    main_competitors: string[];
    market_entrants: string[];
    competitive_threat_level: 'low' | 'medium' | 'high' | 'critical';
  };
  conflict_analysis?: {
    probability: number;
    reasons: string[];
  };
  key_findings: string[];
  risk_assessment?: string;
  strategic_actions?: string[];
  graph_context: {
    nodes_referenced: number;
    clusters_analyzed: number;
  };
  raw_json_store_path: string; // "s3://..."
  generated_at: string;
  meta: {
    agent_version: string; // "DeepAgent-v3 (LangGraph)"
    trace_id: string;
  };
}

// --- Forge Types ---

export interface ForgeSimulation {
  simulation_id: string;
  campaign_name: string;
  sector: string;
  threat_vector: string;
  status: 'initializing' | 'simulating' | 'analyzing' | 'complete';
  progress: number;
  outcome_probability: number; // 0-1
  projected_impact: 'low' | 'medium' | 'high' | 'critical';
  meta: {
    trace_id: string;
    timestamp: string;
    model_version: string;
  };
}

export interface ForgeReport {
  report_id: string;
  simulation_ref: string;
  narrative_summary: string;
  predicted_timeline: Array<{ day: number; event: string; probability: number }>;
  recommended_countermeasures: string[];
  raw_json_path: string;
  generated_at: string;
}

// --- Shield Types ---

export interface ProprietaryAsset {
  asset_id: string;
  name: string;
  type: 'infrastructure' | 'personnel' | 'intellectual_property';
  criticality: 'low' | 'medium' | 'high' | 'critical';
}

export interface ShieldComparison {
  comparison_id: string;
  threat_source_ref: string; // Ref to Lens/Forge output
  asset_ref: string;
  match_score: number; // 0-100
  vulnerability_detected: boolean;
  mitigation_status: 'active' | 'pending' | 'resolved';
  timestamp: string;
}

// --- Campaign Analysis Types ---

export interface CampaignUploadRequest {
  fileName: string;
  fileSize: number;
  fileType: 'pdf' | 'docx' | 'markdown';
}

export interface CampaignAnalysisResult {
  analysis_id: string;
  status: 'uploading' | 'chunking' | 'analyzing_osint' | 'predicting_impact' | 'complete' | 'failed';
  progress: number;
  chunks_processed: number;
  knowledge_graph_nodes_matched: number;
  adversarial_alignment_score: number; // 0-100
  competitive_impact_score: number; // 0-100
  predictive_summation: {
    summary: string;
    key_risks: string[];
    adversarial_actors: string[]; // Potential threat actors identified
    market_reaction_prediction: string;
  };
  meta: {
    trace_id: string;
    timestamp: string;
    kg_version: string;
  };
}

// --- OSINT & Reporting Types ---

export interface OsintToolConfig {
  id: string;
  name: string;
  description: string;
  required_api_key_env: string; // e.g., "SHODAN_API_KEY"
  capabilities: string[];
}

export interface OsintReportSection {
  title: string;
  content: string | object;
  confidence: number;
  source_tool: string;
}

export interface StandardizedOsintReport {
  report_id: string;
  target: string;
  timestamp: string;
  summary: string;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  sections: {
    infrastructure: OsintReportSection[];
    personnel: OsintReportSection[];
    dark_web: OsintReportSection[];
    social_sentiment: OsintReportSection[];
  };
  graph_correlation: {
    nodes_mapped: number;
    clusters_identified: number;
    proprietary_overlap: boolean; // Admin only flag
  };
  raw_json_uri: string;
}

// --- Agent Network (LangGraph) Types ---

export interface AgentMessage {
  role: 'user' | 'ai' | 'system' | 'tool';
  content: string;
  name?: string; // e.g., "Supervisor", "OSINT_Worker"
}

export interface AgentLog {
  id: string;
  timestamp: string;
  node: string; // 'Supervisor' | 'OSINT' | 'Graph_Analyzer' | 'Relational_DB' | 'Doc_Store'
  action: string;
  details: string | object;
  status: 'success' | 'error' | 'pending';
}

export interface AgentState {
  messages: AgentMessage[];
  entities: {
    id: string;
    name: string;
    type: string;
    classification: 'ally' | 'adversary' | 'neutral';
  }[];
  investigation_depth: number;
  db_stats: {
    doc_records: number;
    sql_rows: number;
  };
  current_active_node: string;
}

export interface AgentRun {
  run_id: string;
  target: string;
  status: 'initializing' | 'running' | 'consolidating' | 'completed';
  state: AgentState;
  logs: AgentLog[];
}

// --- Onboarding & Auth Types ---

export type UserStatus = 'pending_verification' | 'active' | 'suspended';

export interface OnboardingRequest {
  email: string;
  organization_name: string;
  consent: boolean;
  phone_number?: string;
  referral_source?: string;
  role_title?: string;
  key_field?: string; // Added for secure key collection
}

export interface OnboardingResponse {
  status: 'registered';
  user_id: string;
  trace_id: string;
  created_at: string;
  // Included for demo purposes only to simulate email delivery
  demo_temp_password?: string; 
}

export interface AuthResponse {
  status: 'authenticated' | 'requires_reset';
  session_token?: string;
  expires_at?: string;
  trace_id: string;
  user_id?: string;
  role?: string;
}

export interface AuditLogEntry {
  event_type: string;
  trace_id: string;
  user_id?: string;
  timestamp: string;
  ip_hash: string;
  status: 'success' | 'failure';
  payload?: any;
}

export interface PasswordResetRequest {
  email: string;
  temp_password?: string;
  new_password: string;
}

export type ThreatDomain = 'Organizational' | 'Disinformation' | 'Financial Obfuscation' | 'Cyber Infrastructure' | 'Geopolitical';

export interface IntelligenceSummary {
  target: string;
  sector: string;
  threat_domains: Array<{
    domain: ThreatDomain;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    findings: string[];
  }>;
  overall_assessment: string;
  data_sources: string[];
  last_updated: string;
}

export interface FilteredSearchResult {
  uuid: string;
  title: string;
  url: string;
  relevance_score: number;
  summary: string;
  entities: string[];
}

export interface BotState {
  status: 'idle' | 'searching' | 'synthesizing' | 'looping' | 'completed';
  current_sector: string;
  intuition_level: number; // 0-100
  knowledge_nodes: number;
  resources_mapped: number;
  logs: string[];
}

export interface DailyIntelligenceReport {
  report_id: string;
  date: string;
  summary: string;
  top_threats: string[];
  sector_shifts: string[];
  graph_updates: {
    nodes: any[];
    links: any[];
  };
  ml_insights: {
    clusters: string[];
    trends: string[];
  };
}

export interface WeeklyIntelligenceReport {
  report_id: string;
  narrative_synthesis: string;
  key_shifts: string[];
  recommended_actions: string[];
  data_transformations: Array<{ type: string; count: number }>;
  ml_model_updates: Array<{ model: string; status: string; accuracy_gain: number }>;
  week_start: string;
  week_end: string;
}

export interface Trend {
  trend: string;
  probability: number;
  timeframe: string;
  timestamp: string;
}

export interface GlobalGraphNode {
  uuid: string;
  label: string;
  type: string;
  connections: number;
  last_seen: string;
}

export interface StrategicCorrelation {
  correlation_id: string;
  strategic_alignment: number;
  goal_overlap: string[];
  statistical_analysis: {
    relevance_score: number;
    impact_projection: string;
    confidence_interval: [number, number];
  };
  triaged_matters: {
    id: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    action: string;
  }[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  settings: {
    show_system_health: boolean;
    threat_velocity_threshold: number;
  };
}

export interface SearchHistoryEntry {
  id: string;
  query: string;
  timestamp: string;
  project_id: string;
  results_count: number;
}

export interface OrganisationProfile {
  id: string;
  name: string;
  industry: string;
  mission: string;
  goals: string[];
  campaigns: string[];
  competitors: string[];
  political_info: string[];
  strategic_actions: string[];
  nature: string;
  research_objective: string;
  dynamic_system_prompt: string;
  last_updated: string;
}

export interface OrgProfilingJob {
  id: string;
  org_name: string;
  status: 'recon' | 'extraction' | 'synthesis' | 'alignment' | 'complete' | 'failed';
  progress: number;
  current_stage: string;
  data?: OrganisationProfile;
}

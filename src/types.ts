
export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: 'lens' | 'forge' | 'shield';
  features: string[];
}

export interface NavItem {
  label: string;
  id: string; // Changed from href to id for internal routing
}

export type ViewType = 'landing' | 'explorer' | 'mission' | 'lens' | 'forge' | 'shield' | 'pipeline' | 'forge-monitor' | 'shield-monitor' | 'campaign-analysis' | 'agent-network' | 'projects';

export enum SectionType {
  HERO = 'hero',
  PRODUCTS = 'products',
  STRATEGY = 'strategy',
  CONTACT = 'contact',
}

// Knowledge Graph Types
export type EntityType = 
  | 'person' 
  | 'organization' 
  | 'domain' 
  | 'ip_address' 
  | 'infrastructure_asset' 
  | 'social_handle' 
  | 'document' 
  | 'event' 
  | 'location' 
  | 'narrative_claim' 
  | 'financial_artifact' 
  | 'campaign_signal' 
  | 'threat_indicator';

export type RelationshipType = 
  | 'OWNS' 
  | 'REGISTERED_TO' 
  | 'HOSTS' 
  | 'ASSOCIATED_WITH' 
  | 'MENTIONS' 
  | 'FUNDS' 
  | 'COMMUNICATED_WITH' 
  | 'PART_OF' 
  | 'PROMOTES' 
  | 'ATTACKED' 
  | 'DERIVED_FROM';

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  x: number;
  y: number;
  r: number; // radius (influence score)
  
  // Core Metadata
  confidence: number; // 0-1
  riskScore: number; // 0-100
  sourceCount: number;
  firstSeen: string; // ISO date
  lastSeen: string; // ISO date
  
  // Cluster Info
  clusterId?: string;
  
  // Visual State
  expanded?: boolean; // Has this node been explored?
  
  details: {
    role: string;
    description: string;
    sources: string[];
    attribution: string; // e.g., "Confirmed via WHOIS"
    linkedEvidence: string[]; // IDs of evidence documents
    linkedin?: {
      profileUrl: string;
      headline?: string;
      connections?: number;
      lastPostDate?: string;
      metadata?: Record<string, any>;
    };
  };
}

export interface GraphEdge {
  source: string;
  target: string;
  type: RelationshipType;
  label?: string;
  
  // Metrics
  strength: number; // 0-1 line opacity/width
  confidence: number; // 0-1
  evidenceCount: number;
  
  // Temporal
  firstObserved?: string;
  lastObserved?: string;
}

export interface Cluster {
  id: string;
  label: string;
  riskScore: number; // Aggregated
  confidence: number; // Aggregated
  insight: string; // Summary insight text
  members: string[]; // Node IDs
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  type: 'disinformation' | 'smear' | 'legal' | 'cyber';
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  actors: string[]; // IDs of threat actors involved
}

export interface DossierStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete';
  detail?: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'public' | 'restricted' | 'dark';
  icon: string;
  description: string;
}

export interface GraphQuery {
  id: string;
  label: string;
  description: string;
  focus: 'network' | 'finance' | 'infra';
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters?: Cluster[];
  adjacencyMatrix?: Record<string, Record<string, GraphEdge | null>>;
}

export interface PlaybookStrategy {
  id: string;
  name: string;
  type: 'defensive_comm' | 'operational_readiness' | 'partner_engagement' | 'competitor_counter';
  description: string;
  rationale: {
    signalProvenance: string;
    strategyLogic: string;
    impactEstimate: string;
  };
  metrics: {
    name: string;
    target: string;
  }[];
  nextSteps: string[];
  risks: string[];
  triggers: string[];
}

export interface Playbook {
  id: string;
  userId: string;
  sessionId: string;
  createdAt: string;
  scenarioDrivers: string[];
  strategies: PlaybookStrategy[];
}

export interface CanonicalEvent {
  trace_id: string;
  schema_version: string;
  source_platform: string;
  source_type: 'news' | 'social' | 'threat' | 'vuln' | 'open-data';
  collected_at: string;
  raw_data: Record<string, any>;
  normalized_event: {
    event_id: string;
    language: string;
    geo_hint?: string;
    confidence_score: number;
    content_hash: string;
    derived_entities: string[];
    tags: string[];
  };
}

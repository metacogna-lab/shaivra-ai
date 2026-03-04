import { StandardizedOsintReport } from '../portalTypes';

export const DEMO_TRACE_ID = "trc-8829-441a-992b";
export const SCHEMA_VERSION = "v1.2.0";

export interface DemoEvent {
  id: string;
  source: 'RSS' | 'Reddit';
  title: string;
  timestamp: string;
  clusterId: 'A' | 'B';
}

export interface DemoEntity {
  id: string;
  name: string;
  type: 'Organization' | 'Person' | 'Document' | 'Location' | 'Infrastructure' | 'Financial';
  x: number; // Relative position for graph
  y: number;
}

export interface DemoEdge {
  source: string;
  target: string;
  type: 'MENTIONS' | 'FUNDED_BY' | 'REGULATED_BY' | 'REPRESENTS' | 'BELONGS_TO' | 'TARGETS' | 'AMPLIFIED_BY' | 'CITED_BY';
  evidenceCount: number;
}

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  nodes: DemoEntity[];
  edges: DemoEdge[];
  events: DemoEvent[];
  report: any;
}

export const SCENARIOS: DemoScenario[] = [
  {
    id: 'housing_accountability',
    name: 'Housing Alliance Accountability',
    description: 'Monitoring administrative overhead and grant compliance for urban housing NGOs.',
    nodes: [
      { id: "org_hbha", name: "HarborBridge Housing Alliance", type: "Organization", x: 0, y: 0 },
      { id: "org_citywell", name: "CityWell Foundation", type: "Organization", x: -150, y: -100 },
      { id: "org_northline", name: "Northline Construction", type: "Organization", x: -150, y: 100 },
      { id: "org_dcs", name: "Dept. Community Services", type: "Organization", x: 0, y: -180 },
      { id: "org_safenight", name: "SafeNight Coalition", type: "Organization", x: 150, y: 100 },
      { id: "org_watch", name: "Community Watch Network", type: "Organization", x: 180, y: -50 },
      { id: "per_mara", name: "Mara Kline", type: "Person", x: 80, y: 80 },
      { id: "per_aidan", name: "Aidan Roe", type: "Person", x: 200, y: -120 },
      { id: "doc_report", name: "HBHA Annual Report 2025", type: "Document", x: -80, y: 150 },
      { id: "doc_guidelines", name: "DCS Funding Guidelines", type: "Document", x: -80, y: -150 },
    ],
    edges: [
      { source: "org_hbha", target: "org_dcs", type: "REGULATED_BY", evidenceCount: 4 },
      { source: "org_hbha", target: "org_citywell", type: "FUNDED_BY", evidenceCount: 3 },
      { source: "org_hbha", target: "org_northline", type: "FUNDED_BY", evidenceCount: 2 },
      { source: "per_mara", target: "org_hbha", type: "REPRESENTS", evidenceCount: 12 },
    ],
    events: [
      { id: "evt_01", source: "RSS", title: "SectorWatch Op-Ed: Nonprofit Accountability in Housing", timestamp: "2026-02-22T09:15:00Z", clusterId: 'A' },
      { id: "evt_02", source: "Reddit", title: "Anyone else dealing with HBHA admin delays?", timestamp: "2026-02-22T14:30:00Z", clusterId: 'A' },
      { id: "evt_08", source: "RSS", title: "HBHA Annual Report 2025: 400 Youth Housed", timestamp: "2026-02-20T09:00:00Z", clusterId: 'B' },
    ],
    report: {
      report_id: "rpt-housing-01",
      executive_summary: "Administrative overhead concerns are emerging but balanced by strong impact reporting. Strategic focus should be on contract transparency.",
      recommended_actions: ["Publish audit results", "Engage community stakeholders"]
    }
  },
  {
    id: 'disaster_relief',
    name: 'Disaster Relief Coordination',
    description: 'Mapping resource allocation and supply chain integrity during emergency response.',
    nodes: [
      { id: "org_redcross", name: "Global Relief Network", type: "Organization", x: 0, y: 0 },
      { id: "org_wfp", name: "World Food Program", type: "Organization", x: -180, y: -50 },
      { id: "org_local_gov", name: "Regional Emergency Mgmt", type: "Organization", x: 150, y: -120 },
      { id: "org_logistics", name: "SwiftLogistics NGO", type: "Organization", x: -120, y: 150 },
      { id: "per_director", name: "Dr. Elena Vance", type: "Person", x: 100, y: 100 },
      { id: "doc_manifest", name: "Supply Chain Manifest", type: "Document", x: 0, y: -200 },
    ],
    edges: [
      { source: "org_redcross", target: "org_wfp", type: "REPRESENTS", evidenceCount: 8 },
      { source: "org_logistics", target: "org_redcross", type: "FUNDED_BY", evidenceCount: 5 },
      { source: "org_local_gov", target: "org_redcross", type: "REGULATED_BY", evidenceCount: 3 },
    ],
    events: [
      { id: "evt_dr_01", source: "RSS", title: "Relief supplies delayed at border crossing", timestamp: "2026-03-01T10:00:00Z", clusterId: 'A' },
      { id: "evt_dr_02", source: "Reddit", title: "Local volunteers reporting missing medical kits", timestamp: "2026-03-01T12:00:00Z", clusterId: 'A' },
      { id: "evt_dr_03", source: "RSS", title: "Global Relief Network deploys mobile clinics", timestamp: "2026-03-02T08:00:00Z", clusterId: 'B' },
    ],
    report: {
      report_id: "rpt-disaster-01",
      executive_summary: "Logistics bottleneck identified at border. Diversion risk for medical supplies is moderate. Immediate coordination with local authorities required.",
      recommended_actions: ["Reroute supply line B", "Deploy independent monitors"]
    }
  },
  {
    id: 'global_health',
    name: 'Global Health Initiative',
    description: 'Tracking vaccine distribution equity and research collaboration networks.',
    nodes: [
      { id: "org_who", name: "World Health Org", type: "Organization", x: 0, y: 0 },
      { id: "org_gates", name: "Gates Foundation", type: "Organization", x: -200, y: 50 },
      { id: "org_pharma", name: "BioGen Research", type: "Organization", x: 150, y: 150 },
      { id: "org_ministry", name: "Ministry of Health", type: "Organization", x: -50, y: -180 },
      { id: "per_scientist", name: "Prof. Sarah Chen", type: "Person", x: 180, y: -80 },
      { id: "doc_study", name: "Efficacy Study v4", type: "Document", x: -150, y: 120 },
    ],
    edges: [
      { source: "org_gates", target: "org_who", type: "FUNDED_BY", evidenceCount: 15 },
      { source: "org_pharma", target: "org_who", type: "REGULATED_BY", evidenceCount: 6 },
      { source: "per_scientist", target: "org_pharma", type: "REPRESENTS", evidenceCount: 4 },
    ],
    events: [
      { id: "evt_gh_01", source: "RSS", title: "New variant detected in southern region", timestamp: "2026-03-03T09:00:00Z", clusterId: 'A' },
      { id: "evt_gh_02", source: "Reddit", title: "Rumors of vaccine hoarding in urban centers", timestamp: "2026-03-03T15:00:00Z", clusterId: 'A' },
      { id: "evt_gh_03", source: "RSS", title: "BioGen Research releases open-source data", timestamp: "2026-03-04T11:00:00Z", clusterId: 'B' },
    ],
    report: {
      report_id: "rpt-health-01",
      executive_summary: "Equity gap widening in rural districts. Open-source data release by BioGen is accelerating local research. Variant monitoring is critical.",
      recommended_actions: ["Audit distribution logs", "Increase rural outreach"]
    }
  }
];

// Keep existing exports for backward compatibility if needed, but they should point to default scenario
export const RAW_EVENTS = SCENARIOS[0].events;
export const GRAPH_NODES = SCENARIOS[0].nodes;
export const GRAPH_EDGES = SCENARIOS[0].edges;
export const FINAL_REPORT_JSON = SCENARIOS[0].report;
export const GOVERNANCE_REVIEW_JSON = {
  decision: "approved",
  reviewer_id: "demo-analyst-01",
  timestamp: new Date().toISOString(),
  notes: "Language validated. No PII exposure. Claims bounded to evidence.",
  immutable_hash: "sha256_88a92b..."
};

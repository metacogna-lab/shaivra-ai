import { Product, NavItem, GraphData, GraphNode, GraphEdge, EntityType, Campaign } from './types';

// ... (existing exports)

export const APP_NAME = "SHAIVRA";
export const GRAPH_VERSION = "2.0"; // Increment to force reset of local storage

export const NAVIGATION_ITEMS: NavItem[] = [
  { id: 'mission', label: 'Mission' },
  { id: 'lens', label: 'Lens' },
  { id: 'forge', label: 'Forge' },
  { id: 'shield', label: 'Shield' },
  { id: 'explorer', label: 'Graph' },
  { id: 'projects', label: 'Projects' }
];

export const PRODUCTS: Product[] = [
  {
    id: 'lens',
    name: 'LENS',
    tagline: 'Total Information Awareness',
    description: 'Ingest and correlate data from open, deep, and dark web sources to build a comprehensive threat landscape.',
    icon: 'lens',
    features: ['Real-time OSINT', 'Entity Resolution', 'Sentiment Analysis']
  },
  {
    id: 'forge',
    name: 'FORGE',
    tagline: 'Strategic Simulation',
    description: 'Model potential threat vectors and simulate outcomes to develop proactive defense strategies.',
    icon: 'forge',
    features: ['Scenario Modeling', 'Impact Assessment', 'Counter-Narrative Gen']
  },
  {
    id: 'shield',
    name: 'SHIELD',
    tagline: 'Active Defense',
    description: 'Deploy automated countermeasures and monitoring to protect organizational assets and reputation.',
    icon: 'shield',
    features: ['Automated Takedowns', 'Botnet Disruption', 'Reputation Management']
  }
];

export const STRATEGIC_PILLARS = [
  {
    title: "Total Visibility",
    description: "Eliminate blind spots. Our multi-spectral ingestion engine correlates signals across physical, digital, and social domains to reveal hidden causality.",
    icon: "lens"
  },
  {
    title: "Predictive Dominance",
    description: "Don't just react. Anticipate. Our probabilistic modeling engine simulates thousands of potential threat vectors to identify the most likely outcomes.",
    icon: "forge"
  },
  {
    title: "Automated Resilience",
    description: "Defense at machine speed. Deploy autonomous countermeasures that adapt to evolving threats in real-time, protecting your assets 24/7.",
    icon: "shield"
  }
];

export const DATA_SOURCES: import('./types').DataSource[] = [
  { id: 'src_1', name: 'Global News Feed', type: 'public', icon: 'globe', description: 'Real-time aggregation of 50,000+ news outlets.' },
  { id: 'src_2', name: 'Dark Web Leak', type: 'dark', icon: 'lock', description: 'Indexed credentials and documents from Tor hidden services.' },
  { id: 'src_3', name: 'Corporate Registry', type: 'public', icon: 'building', description: 'Global business ownership and filing records.' },
  { id: 'src_4', name: 'Social Firehose', type: 'public', icon: 'users', description: 'Full-take stream from major social platforms.' },
  { id: 'src_5', name: 'Blockchain Ledger', type: 'public', icon: 'link', description: 'Transaction history for BTC, ETH, and USDT.' },
  { id: 'src_6', name: 'Threat Intel Feeds', type: 'restricted', icon: 'shield', description: 'Proprietary IOCs and malware signatures.' }
];

export const GRAPH_QUERIES: import('./types').GraphQuery[] = [
  { id: 'q_1', label: 'Map Disinformation Networks', description: 'Identify coordinated inauthentic behavior and narrative propagation.', focus: 'network' },
  { id: 'q_2', label: 'Trace Financial Flows', description: 'Follow the money through shell companies and crypto mixers.', focus: 'finance' },
  { id: 'q_3', label: 'Infrastructure Analysis', description: 'Correlate domains, IPs, and SSL certs to find C2 servers.', focus: 'infra' }
];

export const IN_MEMORY_ENTITIES: GraphNode[] = [
  {
    id: 'mem_1',
    label: 'DarkWeb Forum "Hydra"',
    type: 'event',
    x: 0, y: 0, r: 8,
    firstSeen: '2023-11-05',
    lastSeen: '2024-02-15',
    confidence: 0.85,
    riskScore: 75,
    sourceCount: 12,
    details: {
      role: 'Illicit Marketplace',
      description: 'Known hub for trading leaked NGO credentials and strategy documents.',
      sources: ['Tor Node Analysis', 'Undercover Asset'],
      attribution: 'High Confidence (HUMINT)',
      linkedEvidence: ['ev_1', 'ev_2']
    }
  },
  {
    id: 'mem_2',
    label: 'Apex Strategy Group',
    type: 'organization',
    x: 0, y: 0, r: 10,
    firstSeen: '2023-09-12',
    lastSeen: '2024-01-20',
    confidence: 0.9,
    riskScore: 60,
    sourceCount: 8,
    details: {
      role: 'Crisis Management Firm',
      description: 'Specializes in "reputation defense" for extractive industries. Often employs botnets.',
      sources: ['Corporate Registry', 'Whistleblower Affidavit'],
      attribution: 'Confirmed (Registry)',
      linkedEvidence: ['ev_3']
    }
  },
  {
    id: 'mem_3',
    label: 'Op: "Silent Spring"',
    type: 'campaign_signal',
    x: 0, y: 0, r: 7,
    firstSeen: '2024-02-01',
    lastSeen: '2024-02-28',
    confidence: 0.75,
    riskScore: 85,
    sourceCount: 45,
    details: {
      role: 'Coordinated Smear Campaign',
      description: 'Targeted harassment of environmental activists via sockpuppet accounts.',
      sources: ['Social Graph Analysis', 'IP Correlation'],
      attribution: 'Medium Confidence (Pattern Analysis)',
      linkedEvidence: ['ev_4', 'ev_5']
    }
  },
  {
    id: 'mem_4',
    label: 'Senator J. Doe (Shadow Account)',
    type: 'social_handle',
    x: 0, y: 0, r: 6,
    firstSeen: '2023-12-20',
    lastSeen: '2024-01-10',
    confidence: 0.6,
    riskScore: 90,
    sourceCount: 3,
    details: {
      role: 'Unverified Alias',
      description: 'Linked to offshore accounts funding anti-climate legislation.',
      sources: ['FinCEN Leak', 'Signal Intercept'],
      attribution: 'Low Confidence (Signal Intercept)',
      linkedEvidence: ['ev_6']
    }
  }
];

export const PRESET_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp_1',
    name: 'Operation: Glass House',
    description: 'Analyze vulnerability to coordinated doxxing and physical intimidation tactics used by state-aligned actors.',
    type: 'smear',
    threatLevel: 'high',
    actors: ['n2', 'n5'] // PetroCore, Marcus Thorne
  },
  {
    id: 'camp_2',
    name: 'Vector: Deepfake Delegitimization',
    description: 'Assess impact of synthetic media attacks on organization credibility during key legislative windows.',
    type: 'disinformation',
    threatLevel: 'critical',
    actors: ['n5', 'mem_2'] // Marcus Thorne, Apex Strategy
  },
  {
    id: 'camp_3',
    name: 'Protocol: Legal Stranglehold',
    description: 'Map potential SLAPP suit vectors and financial attrition strategies from corporate opponents.',
    type: 'legal',
    threatLevel: 'medium',
    actors: ['n2', 'n1'] // PetroCore, Senator Vance
  }
];

export const generateAdjacencyMatrix = (nodes: GraphNode[], edges: GraphEdge[]): Record<string, Record<string, GraphEdge | null>> => {
  const matrix: Record<string, Record<string, GraphEdge | null>> = {};
  
  // Initialize matrix with nulls
  nodes.forEach(source => {
    matrix[source.id] = {};
    nodes.forEach(target => {
      matrix[source.id][target.id] = null;
    });
  });

  // Fill in edges
  edges.forEach(edge => {
    if (matrix[edge.source] && matrix[edge.source][edge.target] !== undefined) {
      matrix[edge.source][edge.target] = edge;
    }
    // Assuming directed graph, but if undirected, we'd add the reverse too.
    // For now, we'll stick to directed as per edges definition.
  });

  return matrix;
};

export const MOCK_GRAPH_DATA: GraphData = {
  clusters: [
    {
      id: 'c1',
      label: 'Disinformation Nexus',
      riskScore: 85,
      confidence: 0.92,
      insight: 'Coordinated inauthentic behavior targeting climate policy.',
      members: ['n1', 'n2', 'n3', 'n4', 'n5', 'n6']
    },
    {
      id: 'c2',
      label: 'Financial Obfuscation',
      riskScore: 70,
      confidence: 0.88,
      insight: 'Offshore layering used to fund "grassroots" opposition.',
      members: ['n7', 'n8', 'n9', 'n10']
    },
    {
      id: 'c3',
      label: 'Infrastructure Backbone',
      riskScore: 65,
      confidence: 0.95,
      insight: 'Hosting assets linked to known threat actor group APT-29.',
      members: ['n11', 'n12', 'n13', 'n14']
    }
  ],
  nodes: [
    // --- CLUSTER 1: Disinformation Nexus ---
    {
      id: 'n1',
      label: '@PatriotVoice_US',
      type: 'social_handle',
      x: 0, y: 0, r: 12,
      firstSeen: '2023-01-15',
      lastSeen: '2024-02-20',
      confidence: 0.95,
      riskScore: 80,
      sourceCount: 150,
      clusterId: 'c1',
      details: {
        role: 'Amplification Node',
        description: 'Primary disseminator of "Blue Horizon" opposition narratives. High bot probability.',
        sources: ['Twitter API', 'Botometer'],
        attribution: 'High Confidence (Algorithmic)',
        linkedEvidence: ['ev_101']
      }
    },
    {
      id: 'n2',
      label: 'freedom-watch-daily.com',
      type: 'domain',
      x: 60, y: -50, r: 14,
      firstSeen: '2023-02-10',
      lastSeen: '2024-02-25',
      confidence: 0.98,
      riskScore: 75,
      sourceCount: 42,
      clusterId: 'c1',
      details: {
        role: 'Fake News Outlet',
        description: 'Hosts fabricated articles cited by @PatriotVoice_US.',
        sources: ['DomainTools', 'Wayback Machine'],
        attribution: 'Confirmed (DNS)',
        linkedEvidence: ['ev_102']
      }
    },
    {
      id: 'n3',
      label: 'Narrative: "Climate Hoax"',
      type: 'narrative_claim',
      x: -50, y: 60, r: 16,
      firstSeen: '2023-01-01',
      lastSeen: '2024-02-28',
      confidence: 0.9,
      riskScore: 60,
      sourceCount: 5000,
      clusterId: 'c1',
      details: {
        role: 'Core Narrative',
        description: 'The central claim being pushed by the network.',
        sources: ['Social Listening', 'NLP Analysis'],
        attribution: 'N/A',
        linkedEvidence: ['ev_103']
      }
    },
    {
      id: 'n4',
      label: 'Campaign: "Blue Horizon"',
      type: 'campaign_signal',
      x: 80, y: 80, r: 18,
      firstSeen: '2023-08-05',
      lastSeen: '2024-02-28',
      confidence: 0.85,
      riskScore: 90,
      sourceCount: 120,
      clusterId: 'c1',
      details: {
        role: 'Targeted Campaign',
        description: 'Coordinated effort to derail the Blue Horizon bill.',
        sources: ['Analyst Assessment'],
        attribution: 'Medium Confidence',
        linkedEvidence: ['ev_104']
      }
    },
    {
      id: 'n5',
      label: 'Marcus Thorne',
      type: 'person',
      x: 120, y: 0, r: 10,
      firstSeen: '2023-03-12',
      lastSeen: '2024-01-15',
      confidence: 0.7,
      riskScore: 50,
      sourceCount: 5,
      clusterId: 'c1',
      details: {
        role: 'Key Influencer',
        description: 'Registered owner of freedom-watch-daily.com (via historical WHOIS).',
        sources: ['Historical WHOIS', 'LinkedIn'],
        attribution: 'Medium Confidence',
        linkedEvidence: ['ev_105']
      }
    },
    {
      id: 'n6',
      label: '192.168.1.105',
      type: 'ip_address',
      x: 20, y: -100, r: 8,
      firstSeen: '2023-02-10',
      lastSeen: '2024-02-25',
      confidence: 0.99,
      riskScore: 40,
      sourceCount: 20,
      clusterId: 'c1',
      details: {
        role: 'Hosting Server',
        description: 'Shared hosting for multiple fake news domains.',
        sources: ['Shodan', 'Censys'],
        attribution: 'Confirmed (Technical)',
        linkedEvidence: ['ev_106']
      }
    },

    // --- CLUSTER 2: Financial Obfuscation ---
    {
      id: 'n7',
      label: 'Cerberus Holdings Ltd.',
      type: 'organization',
      x: 300, y: -150, r: 14,
      firstSeen: '2022-05-10',
      lastSeen: '2023-12-01',
      confidence: 0.9,
      riskScore: 85,
      sourceCount: 3,
      clusterId: 'c2',
      details: {
        role: 'Shell Company',
        description: 'Registered in Cayman Islands. No physical office.',
        sources: ['Offshore Leaks', 'Corporate Registry'],
        attribution: 'Confirmed (Registry)',
        linkedEvidence: ['ev_201']
      }
    },
    {
      id: 'n8',
      label: 'Wallet 0x7a...3f9',
      type: 'financial_artifact',
      x: 350, y: -80, r: 10,
      firstSeen: '2023-06-15',
      lastSeen: '2024-01-20',
      confidence: 1.0,
      riskScore: 95,
      sourceCount: 15,
      clusterId: 'c2',
      details: {
        role: 'Crypto Wallet',
        description: 'Received $500k USDT from Tornado Cash mixer.',
        sources: ['Etherscan', 'Chainalysis'],
        attribution: 'Confirmed (Blockchain)',
        linkedEvidence: ['ev_202']
      }
    },
    {
      id: 'n9',
      label: 'Apex Strategy Group',
      type: 'organization',
      x: 250, y: -50, r: 12,
      firstSeen: '2023-01-01',
      lastSeen: '2024-02-28',
      confidence: 0.95,
      riskScore: 60,
      sourceCount: 10,
      clusterId: 'c2',
      details: {
        role: 'Consultancy',
        description: 'Received payments from Cerberus Holdings.',
        sources: ['Bank Records (Leaked)'],
        attribution: 'High Confidence',
        linkedEvidence: ['ev_203']
      }
    },
    {
      id: 'n10',
      label: 'Invoice #9921',
      type: 'document',
      x: 280, y: -100, r: 6,
      firstSeen: '2023-08-12',
      lastSeen: '2023-08-12',
      confidence: 0.8,
      riskScore: 20,
      sourceCount: 1,
      clusterId: 'c2',
      details: {
        role: 'Payment Proof',
        description: 'Invoice for "Digital Marketing Services" from Apex to Cerberus.',
        sources: ['Internal Leak'],
        attribution: 'Medium Confidence',
        linkedEvidence: ['ev_204']
      }
    },

    // --- CLUSTER 3: Infrastructure Backbone ---
    {
      id: 'n11',
      label: 'AS1337 (HostCo)',
      type: 'infrastructure_asset',
      x: -200, y: 150, r: 14,
      firstSeen: '2020-01-01',
      lastSeen: '2024-02-28',
      confidence: 1.0,
      riskScore: 30,
      sourceCount: 1000,
      clusterId: 'c3',
      details: {
        role: 'Autonomous System',
        description: 'Bulletproof hosting provider often used by threat actors.',
        sources: ['BGP Data'],
        attribution: 'Confirmed (Technical)',
        linkedEvidence: ['ev_301']
      }
    },
    {
      id: 'n12',
      label: 'ns1.bad-actor.net',
      type: 'domain',
      x: -150, y: 200, r: 10,
      firstSeen: '2023-05-01',
      lastSeen: '2024-02-28',
      confidence: 0.95,
      riskScore: 70,
      sourceCount: 25,
      clusterId: 'c3',
      details: {
        role: 'Nameserver',
        description: 'Resolves domains for freedom-watch-daily.com and others.',
        sources: ['Passive DNS'],
        attribution: 'Confirmed (Technical)',
        linkedEvidence: ['ev_302']
      }
    },
    {
      id: 'n13',
      label: 'SSL Cert: Let\'s Encrypt',
      type: 'infrastructure_asset',
      x: -250, y: 180, r: 8,
      firstSeen: '2023-09-10',
      lastSeen: '2023-12-10',
      confidence: 1.0,
      riskScore: 10,
      sourceCount: 50,
      clusterId: 'c3',
      details: {
        role: 'Certificate',
        description: 'Shared SSL certificate across 50+ suspicious domains.',
        sources: ['Censys', 'Crt.sh'],
        attribution: 'Confirmed (Technical)',
        linkedEvidence: ['ev_303']
      }
    },
    {
      id: 'n14',
      label: 'Threat Indicator: Cobalt Strike',
      type: 'threat_indicator',
      x: -180, y: 100, r: 12,
      firstSeen: '2024-01-15',
      lastSeen: '2024-01-20',
      confidence: 0.8,
      riskScore: 95,
      sourceCount: 5,
      clusterId: 'c3',
      details: {
        role: 'C2 Beacon',
        description: 'Detected beaconing from 192.168.1.105 (n6) to AS1337.',
        sources: ['IDS Logs', 'Threat Intel Feed'],
        attribution: 'High Confidence',
        linkedEvidence: ['ev_304']
      }
    }
  ],
  edges: [
    // Cluster 1 Internal
    { source: 'n1', target: 'n3', strength: 0.9, confidence: 0.9, evidenceCount: 50, type: 'PROMOTES', label: 'Amplifies' },
    { source: 'n2', target: 'n3', strength: 0.8, confidence: 0.95, evidenceCount: 12, type: 'PROMOTES', label: 'Publishes' },
    { source: 'n1', target: 'n2', strength: 0.7, confidence: 0.8, evidenceCount: 5, type: 'MENTIONS', label: 'Links To' },
    { source: 'n5', target: 'n2', strength: 1.0, confidence: 1.0, evidenceCount: 1, type: 'REGISTERED_TO', label: 'Owner' },
    { source: 'n2', target: 'n6', strength: 1.0, confidence: 1.0, evidenceCount: 1, type: 'HOSTS', label: 'Hosted On' },
    { source: 'n4', target: 'n3', strength: 0.6, confidence: 0.7, evidenceCount: 3, type: 'DERIVED_FROM', label: 'Target' },

    // Cluster 2 Internal
    { source: 'n7', target: 'n9', strength: 0.9, confidence: 0.9, evidenceCount: 2, type: 'FUNDS', label: 'Transfers' },
    { source: 'n8', target: 'n7', strength: 0.8, confidence: 0.85, evidenceCount: 4, type: 'FUNDS', label: 'Deposits' },
    { source: 'n10', target: 'n7', strength: 1.0, confidence: 1.0, evidenceCount: 1, type: 'ASSOCIATED_WITH', label: 'Bills' },
    { source: 'n10', target: 'n9', strength: 1.0, confidence: 1.0, evidenceCount: 1, type: 'ASSOCIATED_WITH', label: 'Issues' },

    // Cluster 3 Internal
    { source: 'n12', target: 'n11', strength: 1.0, confidence: 1.0, evidenceCount: 10, type: 'PART_OF', label: 'Routed Via' },
    { source: 'n13', target: 'n12', strength: 1.0, confidence: 1.0, evidenceCount: 5, type: 'ASSOCIATED_WITH', label: 'Secures' },
    
    // Cross-Cluster Connections
    { source: 'n9', target: 'n5', strength: 0.5, confidence: 0.6, evidenceCount: 1, type: 'COMMUNICATED_WITH', label: 'Email Contact' }, // Financial -> Disinfo
    { source: 'n6', target: 'n12', strength: 1.0, confidence: 1.0, evidenceCount: 1, type: 'REGISTERED_TO', label: 'Nameserver' }, // Disinfo -> Infra
    { source: 'n14', target: 'n6', strength: 0.9, confidence: 0.8, evidenceCount: 3, type: 'ATTACKED', label: 'Infected' } // Infra -> Disinfo (Compromise)
  ]
};

// Populate the matrix
MOCK_GRAPH_DATA.adjacencyMatrix = generateAdjacencyMatrix(MOCK_GRAPH_DATA.nodes, MOCK_GRAPH_DATA.edges);

// --- Mock Generator for Progressive Disclosure ---
const FIRST_NAMES = ["James", "Elena", "Robert", "Sarah", "Michael", "Wei", "Aisha", "Dmitri"];
const LAST_NAMES = ["Sterling", "Vargas", "Chen", "Kovacs", "Moreau", "Al-Fayed", "Rossi"];
const SOURCES = ["Wikileaks Dump 2024", "Panama Papers", "Public Ledger", "Intercepted Comms", "Court Filing NY-224"];

export const generateMockNeighbors = (sourceNode: GraphNode, count: number = 3): { nodes: GraphNode[], edges: GraphEdge[] } => {
  const newNodes: GraphNode[] = [];
  const newEdges: GraphEdge[] = [];

  for (let i = 0; i < count; i++) {
    const type: EntityType = Math.random() > 0.5 ? 'person' : 'organization';
    
    let label = "";
    if (type === 'person') {
        label = `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
    } else {
        label = `Shell Co ${Math.floor(Math.random() * 1000)}`;
    }

    const id = `gen_${sourceNode.id}_${Date.now()}_${i}`;
    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 50;
    
    newNodes.push({
      id,
      label,
      type,
      x: sourceNode.x + Math.cos(angle) * dist, 
      y: sourceNode.y + Math.sin(angle) * dist,
      r: 6,
      firstSeen: '2024-01-01',
      lastSeen: '2024-02-01',
      confidence: 0.5,
      riskScore: 30,
      sourceCount: 1,
      details: {
        role: 'Associate',
        description: 'Entity identified through recursive link analysis.',
        sources: [SOURCES[Math.floor(Math.random() * SOURCES.length)]],
        attribution: 'Low Confidence',
        linkedEvidence: []
      }
    });

    newEdges.push({
      source: sourceNode.id,
      target: id,
      strength: 0.5,
      confidence: 0.4,
      evidenceCount: 1,
      type: 'ASSOCIATED_WITH',
      label: 'Linked'
    });
  }

  return { nodes: newNodes, edges: newEdges };
};
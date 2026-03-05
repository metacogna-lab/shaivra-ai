import type {
  AgentRun,
  CampaignAnalysisResult,
  ForgeReport,
  ForgeSimulation,
  IngestionJob,
  OsintEnrichment,
  PortalApiResponse,
  PortalMeta,
  ProprietaryAsset,
  ShieldComparison,
} from '../contracts';

const buildMeta = (overrides: Partial<PortalMeta> = {}): PortalMeta => ({
  trace_id: `mock-${Math.random().toString(36).substr(2, 9)}`,
  schema_version: 'v1.0.0',
  timestamp: new Date().toISOString(),
  validation_status: 'valid',
  ...overrides,
});

// Mock Portal API service
export const portalApi = {
  // Helper for simple hashing (simulating secure hashing for demo)
  hashData: async (data: string) => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  login: async (email: string, password: string, turnstileToken?: string) => {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, turnstileToken }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error((data as any).message || 'Login failed');
    }

    if ((data as any).token) {
      localStorage.setItem('auth_token', (data as any).token);
    }

    return data;
  },
  
  logout: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  },
  
  checkAuth: async () => {
    // Always return true for demo purposes
    return true;
  },

  getMetrics: async () => {
    return {
      activeAgents: 12,
      threatLevel: 'low',
      systemHealth: 98
    };
  },

  // --- Dashboard Methods ---

  getDashboardStats: async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      data: {
        metrics: [
          {
            id: 'm1',
            label: 'Active Ingestion Jobs',
            value: 3,
            status: 'active',
            meta: { trace_id: 'tr_123', timestamp: new Date().toISOString(), schema_version: '1.0' }
          },
          {
            id: 'm2',
            label: 'Threat Velocity',
            value: 'HIGH',
            status: 'warning',
            meta: { trace_id: 'tr_124', timestamp: new Date().toISOString(), schema_version: '1.0' }
          },
          {
            id: 'm3',
            label: 'System Health',
            value: '99.9%',
            status: 'success',
            meta: { trace_id: 'tr_125', timestamp: new Date().toISOString(), schema_version: '1.0' }
          }
        ],
        system_health: 'optimal',
        active_jobs: 3,
        alerts: 5
      }
    };
  },

  getLensJobs: async (): Promise<{ data: IngestionJob[] }> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return {
      data: [
        {
          id: 'job_101',
          source: 'Twitter Stream (Politics)',
          status: 'processing',
          progress: 45,
          started_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          items_processed: 1500,
          errors: []
        },
        {
          id: 'job_102',
          source: 'RSS: CISA Alerts',
          status: 'complete',
          progress: 100,
          started_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          completed_at: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
          items_processed: 12,
          errors: []
        },
        {
          id: 'job_103',
          source: 'Reddit: r/netsec',
          status: 'failed',
          progress: 12,
          started_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          items_processed: 50,
          errors: ['Rate limit exceeded']
        }
      ]
    };
  },

  triggerIngestion: async (source: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { status: 'started', job_id: `job_${Math.floor(Math.random() * 1000)}` };
  },

  triggerVelocitySpike: async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { status: 'triggered' };
  },

  replayLastRun: async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { status: 'replaying' };
  },

  // --- Lens Pipeline Methods ---

  simulateIngestion: async (platform: string, target: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      data: {
        raw_id: `raw_${Math.random().toString(36).substr(2, 9)}`,
        raw_hash: `sha256_${Math.random().toString(36).substr(2, 9)}`,
        object_uri: `s3://ingest/${platform.toLowerCase()}/${target.replace(/\s+/g, '_')}.json`,
        topic_published: new Date().toISOString(),
        payload: {
          source: platform,
          query: target,
          content_snippet: `Detected discussion regarding ${target} on ${platform}...`,
          author_count: 42
        },
        meta: {
          trace_id: `tr_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          schema_version: 'v1.2'
        }
      }
    };
  },

  simulateNormalization: async (rawId: string) => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    return {
      data: {
        event_id: `evt_${Math.random().toString(36).substr(2, 9)}`,
        source_domain: 'social_media',
        canonical_event: {
          type: 'social_post',
          normalized_text: 'Normalized content text...',
          lang: 'en'
        },
        meta: {
          trace_id: `tr_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          schema_version: 'v1.2',
          validation_status: 'valid'
        }
      }
    };
  },

  simulateEnrichment: async (eventId: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      data: {
        event_id: eventId,
        embedding_vector: Array(5).fill(0).map(() => Math.random()),
        extracted_entities: ['Entity1', 'Entity2', 'LocationX'],
        topic_tags: ['security', 'threat', 'urgent'],
        meta: {
          trace_id: `tr_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString()
        }
      }
    };
  },

  simulateClustering: async (eventId: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      data: {
        cluster_id: `cls_${Math.random().toString(36).substr(2, 9)}`,
        velocity_score: 0.85,
        lifecycle_stage: 'emerging',
        meta: {
          trace_id: `tr_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString()
        }
      }
    };
  },

  simulateLLMAnalysis: async (clusterId: string) => {
    await new Promise(resolve => setTimeout(resolve, 2500));
    return {
      data: {
        escalation_probability: 0.92,
        recommended_actions: ['Monitor closely', 'Prepare statement', 'Verify source'],
        analysis_json: {
          sentiment: 'negative',
          urgency: 'high',
          key_actors: ['UserA', 'UserB']
        },
        meta: {
          trace_id: `tr_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          schema_validation: 'pass'
        }
      }
    };
  },

  submitAuditDecision: async (decision: 'approved' | 'rejected') => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      data: {
        reviewer_id: 'admin_user',
        decision: decision,
        timestamp: new Date().toISOString(),
        immutable_hash: `hash_${Math.random().toString(36).substr(2, 16)}`
      }
    };
  },

  // --- Auth & Onboarding Methods ---

  resetPassword: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  },

  register: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Hash PII before "storing"
    const hashedEmail = await portalApi.hashData(data.email);
    const hashedOrg = await portalApi.hashData(data.organization_name);
    
    console.log(`[SECURITY] Registering entity with hashed PII: ${hashedEmail}`);

    return {
      data: {
        status: 'registered',
        user_id: `usr_${Math.random().toString(36).substr(2, 9)}`,
        trace_id: `tr_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        demo_temp_password: 'Password123!',
        pii_hashes: {
          email: hashedEmail,
          org: hashedOrg
        }
      }
    };
  },

  pollAgentRun: async (runId: string): Promise<PortalApiResponse<AgentRun>> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const nodes = ['Supervisor', 'OSINT', 'Sherlock', 'Harvester', 'Spiderfoot', 'Maltego', 'Graph_Analyzer', 'Doc_Store', 'Relational_DB'];
    const activeNode = nodes[Math.floor(Date.now() / 2000) % nodes.length];
    
    return {
      data: {
        run_id: runId,
        target: 'Project Blue Horizon',
        status: 'running',
        state: {
          messages: [{ role: 'ai', content: `Agent ${activeNode} is processing target signals...`, name: activeNode }],
          entities: [
            { id: 'e1', name: 'Blue Horizon Holdings', type: 'ORG', classification: 'neutral' },
            { id: 'e2', name: 'Dr. Aris Thorne', type: 'PERSON', classification: 'adversary' },
            { id: 'e3', name: 'Cayman Node 04', type: 'CRYPTO_WALLET', classification: 'neutral' },
            { id: 'e4', name: 'Singapore Data Center', type: 'LOC', classification: 'neutral' },
            { id: 'e5', name: 'Encrypted C2 Server', type: 'CYBER_THREAT', classification: 'adversary' }
          ],
          investigation_depth: 3,
          db_stats: { doc_records: 256, sql_rows: 1240 },
          current_active_node: activeNode
        },
        logs: [
          {
            id: `log_${Date.now()}`,
            timestamp: new Date().toISOString(),
            node: activeNode,
            action: activeNode === 'Sherlock' ? 'Username Search' : activeNode === 'Harvester' ? 'Email Harvesting' : 'Data Correlation',
            details: `Running specialized OSINT routines via ${activeNode} for deep link discovery.`,
            status: 'success'
          }
        ]
      },
      meta: buildMeta(),
    };
  },

  uploadCampaignFile: async (file: File): Promise<PortalApiResponse<CampaignAnalysisResult>> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      data: {
        analysis_id: `anl_${Math.random().toString(36).substr(2, 9)}`,
        status: 'uploading',
        progress: 0,
        chunks_processed: 0,
        knowledge_graph_nodes_matched: 0,
        adversarial_alignment_score: 0,
        competitive_impact_score: 0,
        predictive_summation: {
          summary: '',
          key_risks: [],
          adversarial_actors: [],
          market_reaction_prediction: ''
        },
        meta: {
          trace_id: `tr_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          kg_version: 'v1'
        }
      },
      meta: buildMeta(),
    };
  },

  processCampaignAnalysis: async (analysisId: string): Promise<PortalApiResponse<CampaignAnalysisResult>> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      data: {
        analysis_id: analysisId,
        status: 'complete',
        progress: 100,
        chunks_processed: 50,
        knowledge_graph_nodes_matched: 12,
        adversarial_alignment_score: 75,
        competitive_impact_score: 60,
        predictive_summation: {
          summary: 'Campaign analysis complete. High risk detected.',
          key_risks: ['Reputational damage', 'Legal action'],
          adversarial_actors: ['CompetitorX'],
          market_reaction_prediction: 'Negative'
        },
        meta: {
          trace_id: `tr_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          kg_version: 'v1'
        }
      },
      meta: buildMeta(),
    };
  },

  // --- Forge Methods ---

  initiateForgeSimulation: async (params: Pick<ForgeSimulation, 'campaign_name' | 'sector' | 'threat_vector'>): Promise<PortalApiResponse<ForgeSimulation>> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      data: {
        simulation_id: `sim_${Math.random().toString(36).substr(2, 9)}`,
        campaign_name: params.campaign_name,
        sector: params.sector,
        threat_vector: params.threat_vector,
        status: 'initializing',
        progress: 0,
        outcome_probability: 0,
        projected_impact: 'low',
        meta: {
          trace_id: `tr_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          model_version: 'v1'
        }
      },
      meta: buildMeta(),
    };
  },

  runForgeStep: async (currentSimulation: ForgeSimulation): Promise<PortalApiResponse<ForgeSimulation>> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const progress = Math.min(100, currentSimulation.progress + 25);
    return {
      data: {
        ...currentSimulation,
        status: progress >= 100 ? 'analyzing' : 'simulating',
        progress,
        outcome_probability: Math.min(1, currentSimulation.outcome_probability + 0.1),
        projected_impact: progress >= 100 ? 'high' : currentSimulation.projected_impact,
        meta: {
          ...currentSimulation.meta,
          timestamp: new Date().toISOString()
        }
      },
      meta: buildMeta(),
    };
  },

  generateForgeReport: async (simulationId: string): Promise<PortalApiResponse<ForgeReport>> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      data: {
        report_id: `rpt_${Math.random().toString(36).substr(2, 9)}`,
        simulation_ref: simulationId,
        narrative_summary: 'Simulation concluded. Moderate impact predicted.',
        predicted_timeline: [
          { day: 1, event: 'Initial Leak', probability: 0.8 },
          { day: 3, event: 'Media Pickup', probability: 0.6 }
        ],
        recommended_countermeasures: ['Pre-emptive statement', 'Monitor social channels'],
        raw_json_path: 's3://forge/reports/123.json',
        generated_at: new Date().toISOString()
      },
      meta: buildMeta(),
    };
  },

  // --- Shield Methods ---

  uploadProprietaryAsset: async (asset: { name: string; type: ProprietaryAsset['type'] }): Promise<PortalApiResponse<ProprietaryAsset>> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      data: {
        asset_id: `ast_${Math.random().toString(36).substr(2, 9)}`,
        name: asset.name,
        type: asset.type,
        criticality: 'high'
      },
      meta: buildMeta(),
    };
  },

  runShieldComparison: async (assetId: string, threatRef: string): Promise<PortalApiResponse<ShieldComparison>> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      data: {
        comparison_id: `cmp_${Math.random().toString(36).substr(2, 9)}`,
        threat_source_ref: threatRef,
        asset_ref: assetId,
        match_score: 85,
        vulnerability_detected: true,
        mitigation_status: 'pending',
        timestamp: new Date().toISOString()
      },
      meta: buildMeta(),
    };
  },

  // --- Real API Methods ---

  realSearch: async (query: string) => {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Search failed');
    }
    return response.json();
  },

  shodanSearch: async (query: string) => {
    const response = await fetch(`/api/osint/shodan?query=${encodeURIComponent(query)}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Shodan search failed');
    }
    return response.json();
  },

  alienvaultSearch: async (query: string, type: string = 'domain') => {
    const response = await fetch(`/api/osint/alienvault?query=${encodeURIComponent(query)}&type=${type}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'AlienVault search failed');
    }
    return response.json();
  },

  virustotalSearch: async (query: string, type: string = 'domain') => {
    const response = await fetch(`/api/osint/virustotal?query=${encodeURIComponent(query)}&type=${type}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'VirusTotal search failed');
    }
    return response.json();
  },

  summarizeIntelligence: async (data: any, target: string) => {
    const response = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, target })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Summarization failed');
    }
    return response.json();
  },

  fingerprintWebsite: async (url: string) => {
    const response = await fetch(`/api/osint/fingerprint?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Fingerprinting failed');
    }
    return response.json();
  },

  // --- Pipeline Simulation Methods ---

  simulatePublicSource: async (sourceId: string, target: string) => {
    // If it's a real search, use the backend
    if (sourceId === 'api_google_search' || sourceId === 'api_web_search') {
      try {
        const searchRes = await portalApi.realSearch(`Latest security advisories and public information for ${target}`);
        // Get a rich summary
        const summaryRes = await portalApi.summarizeIntelligence(searchRes.text, target);
        
        return {
          data: {
            source_id: sourceId,
            target_query: target,
            raw_payload: {
              title: `Web Search Results for ${target}`,
              published_date: new Date().toISOString(),
              content: summaryRes.summary,
              sources: searchRes.sources,
              author: "Gemini-WebSearch-Agent",
              link: searchRes.sources[0]?.uri || "#"
            }
          }
        };
      } catch (e) {
        console.warn("Real search failed, falling back to mock.", e);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      data: {
        source_id: sourceId,
        target_query: target,
        raw_payload: {
          title: `Security Advisory: Potential Vulnerability in ${target}`,
          published_date: new Date().toISOString(),
          content: `Recent analysis indicates a potential buffer overflow vulnerability in ${target}'s legacy systems. Threat actors may exploit this via port 8080.`,
          author: "CISA-Automated-Feed",
          link: "https://cisa.gov/advisories/12345"
        }
      }
    };
  },

  ingestEvent: async (rawData: any, sourceType: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      data: {
        raw_id: `raw-${Math.random().toString(36).substr(2, 9)}`,
        source_type: sourceType,
        payload_size_bytes: 1024,
        ingested_at: new Date().toISOString(),
        raw_content: JSON.stringify(rawData),
        checksum: "sha256-mock-hash",
        meta: {
          trace_id: `trace-${Math.random().toString(36).substr(2, 9)}`,
          ingestor_version: "rust-ingestor-v0.4.2"
        }
      }
    };
  },

  normalizeEvent: async (ingestedData: any) => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    return {
      data: {
        event_id: `evt-${Math.random().toString(36).substr(2, 9)}`,
        canonical_type: 'article',
        normalized_text: JSON.parse(ingestedData.raw_content).raw_payload.content,
        language_code: 'en',
        timestamp_utc: new Date().toISOString(),
        source_ref: ingestedData.raw_id,
        meta: {
          trace_id: ingestedData.meta.trace_id,
          normalizer_version: "nlp-service-v2.1",
          processing_time_ms: 120
        }
      }
    };
  },

  enrichEvent: async (normalizedData: any, target: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      data: {
        event_id: normalizedData.event_id,
        entities: [
          { text: target, type: 'ORG', confidence: 0.98 },
          { text: "buffer overflow", type: 'EVENT', confidence: 0.85 },
          { text: "port 8080", type: 'LOC', confidence: 0.92 }
        ],
        sentiment: {
          score: -0.8,
          magnitude: 0.9
        },
        risk_score: 85,
        meta: {
          trace_id: normalizedData.meta.trace_id,
          enricher_version: "ml-enricher-v3.0",
          model_version: "bert-large-security"
        }
      }
    };
  },

  extractEntities: async (enrichedData: any, target: string) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      data: {
        event_id: enrichedData.event_id,
        entities: [
          { id: "ent-1", text: target, type: 'ORG', confidence: 0.99, span: [0, target.length] },
          { id: "ent-2", text: "buffer overflow", type: 'CYBER_THREAT', confidence: 0.95, span: [10, 25] },
          { id: "ent-3", text: "legacy systems", type: 'LOC', confidence: 0.88, span: [30, 45] }
        ],
        relations: [
          { source_entity_id: "ent-2", target_entity_id: "ent-1", type: 'TARGETED', confidence: 0.9 },
          { source_entity_id: "ent-2", target_entity_id: "ent-3", type: 'AFFILIATED_WITH', confidence: 0.85 }
        ],
        meta: {
          trace_id: enrichedData.meta.trace_id,
          model: "deep-agent-ner-v4",
          processing_time_ms: 450
        }
      }
    };
  },

  runOsintEnrichment: async (entityId: string, target: string, toolId?: string): Promise<PortalApiResponse<OsintEnrichment>> => {
    try {
      let osintData;
      let toolName: OsintEnrichment['tool'] = 'OSINT';

      if (toolId === 'api_shodan') {
        osintData = await portalApi.shodanSearch(target);
        toolName = 'Shodan';
      } else if (toolId === 'api_alienvault') {
        osintData = await portalApi.alienvaultSearch(target);
        toolName = 'AlienVault';
      } else if (toolId === 'api_virustotal') {
        osintData = await portalApi.virustotalSearch(target);
        toolName = 'VirusTotal';
      } else if (toolId === 'api_web_search') {
        osintData = await portalApi.shodanSearch(target);
        toolName = 'Sherlock';
      } else if (toolId === 'api_google_search') {
        osintData = await portalApi.shodanSearch(target);
        toolName = 'TheHarvester';
      } else {
        osintData = await portalApi.shodanSearch(target);
        toolName = 'OSINT';
      }

      const summary = await portalApi.summarizeIntelligence(osintData, target);
      
      return {
        data: {
          entity_id: entityId,
          tool: toolName,
          data: {
            ip: osintData.matches?.[0]?.ip_str || osintData.ip || "Unknown",
            ports: osintData.matches?.[0]?.port ? [osintData.matches[0].port] : (osintData.ports || []),
            vulns: osintData.matches?.[0]?.vulns || osintData.vulns || [],
            hostnames: osintData.matches?.[0]?.hostnames || osintData.hostnames || [],
            insight: summary.summary,
            raw: osintData
          },
          status: 'success',
          timestamp: new Date().toISOString()
        },
        meta: buildMeta(),
      };
    } catch (e) {
      console.warn("OSINT Enrichment failed, using mock fallback.", e);
      await new Promise(resolve => setTimeout(resolve, 2500));
      return {
        data: {
          entity_id: entityId,
          tool: 'OSINT',
          data: {
            ip: "192.168.1.100",
            ports: [80, 443, 8080],
            vulns: ["CVE-2023-1234", "CVE-2023-5678"],
            hostnames: [`api.${target.toLowerCase()}.com`],
            insight: "Mock data provided due to API unavailability or missing configuration."
          },
          status: 'success',
          timestamp: new Date().toISOString()
        },
        meta: buildMeta(),
      };
    }
  },

  updateKnowledgeGraph: async (extractedData: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      data: {
        transaction_id: `tx-${Math.random().toString(36).substr(2, 9)}`,
        nodes_created: 3,
        edges_created: 2,
        ontology_version: "shaivra-onto-v2.1",
        graph_snapshot_hash: "hash-xyz-123",
        meta: {
          trace_id: extractedData.meta.trace_id,
          db_time_ms: 45
        }
      }
    };
  },

  generateStrategicReport: async (pipelineData: any, target: string) => {
    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineData, target })
      });
      if (!response.ok) {
        throw new Error('Report generation failed');
      }
      const report = await response.json();
      return {
        data: {
          report_id: `rpt-${Math.random().toString(36).substr(2, 9)}`,
          title: report.title,
          summary: report.summary,
          competition_context: report.competition_context,
          conflict_analysis: report.conflict_analysis,
          key_findings: report.key_findings,
          risk_assessment: report.risk_assessment,
          strategic_actions: report.strategic_actions,
          graph_context: {
            nodes_referenced: 15,
            clusters_analyzed: 2
          },
          raw_json_store_path: "s3://reports/real-time-synthesis.json",
          generated_at: new Date().toISOString(),
          meta: {
            agent_version: "DeepAgent-v3 (LangGraph)",
            trace_id: `tr_${Math.random().toString(36).substr(2, 9)}`
          }
        }
      };
    } catch (e) {
      console.warn("Report generation failed, using mock fallback.", e);
      await new Promise(resolve => setTimeout(resolve, 3000));
      return {
        data: {
          report_id: `rpt-${Math.random().toString(36).substr(2, 9)}`,
          title: `Strategic Threat Assessment: ${target}`,
          summary: `DeepAgent analysis has identified a critical vulnerability affecting ${target}. Correlated intelligence suggests active exploitation attempts targeting legacy infrastructure.`,
          key_findings: [
            "High-confidence identification of buffer overflow vulnerability.",
            "Confirmed exposure of port 8080 via OSINT reconnaissance.",
            "Threat actor TTPs align with known APT groups."
          ],
          graph_context: {
            nodes_referenced: 15,
            clusters_analyzed: 2
          },
          raw_json_store_path: "s3://reports/2023/10/rpt-123.json",
          generated_at: new Date().toISOString(),
          meta: {
            agent_version: "DeepAgent-v3 (LangGraph)",
            trace_id: `tr_${Math.random().toString(36).substr(2, 9)}`
          }
        }
      };
    }
  },

  getIntelligenceSummary: async (target: string, sector: string) => {
    const response = await fetch('/api/analytics/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, sector })
    });
    if (!response.ok) {
      throw new Error('Analytics summary failed');
    }
    return response.json();
  },

  startAutonomousBot: async (sector: string, focus: string) => {
    const response = await fetch('/api/bot/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sector, focus })
    });
    if (!response.ok) throw new Error('Bot failed to start');
    return response.json();
  },

  getDailyIntelligence: async () => {
    const response = await fetch('/api/admin/reports/daily');
    if (!response.ok) throw new Error('Daily report failed');
    return response.json();
  },

  getWeeklyIntelligence: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      report_id: `WSR-${new Date().getFullYear()}-W09`,
      narrative_synthesis: "ML analysis indicates a significant shift in adversarial TTPs, moving from direct infrastructure attacks to narrative-driven influence operations. The convergence of NGO-led policy shifts and corporate lobbying suggests a coordinated effort to destabilize current sector regulations.",
      key_shifts: [
        "24% increase in narrative velocity across NGO-linked social channels.",
        "Emergence of 'Deep-Fake' as a primary vector for disinformation in the financial sector.",
        "Consolidation of activist nodes around the 'Green-Tech' policy framework."
      ],
      recommended_actions: [
        "Initiate advanced reconnaissance on identified activist nodes.",
        "Deploy Shield-class monitoring on all financial sector master graph nodes.",
        "Prepare strategic counter-narrative brief for governmental stakeholders."
      ],
      data_transformations: [
        { type: "Raw Ingestion", count: 124500 },
        { type: "Normalization", count: 98200 },
        { type: "Enrichment", count: 45600 },
        { type: "Graph Commits", count: 1240 }
      ],
      ml_model_updates: [
        { model: "NLP-Clustering-v4", status: "Converged", accuracy_gain: 4.2 },
        { model: "Trend-Predictor-v2", status: "Stable", accuracy_gain: 1.8 },
        { model: "Adversarial-NER-v3", status: "Training", accuracy_gain: 0.5 }
      ],
      week_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      week_end: new Date().toISOString()
    };
  },

  getTrends: async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return [
      {
        trend: "Decentralized Governance Proliferation",
        probability: 0.85,
        timeframe: "Q2 2026",
        timestamp: new Date().toISOString()
      },
      {
        trend: "AI-Driven Narrative Destabilization",
        probability: 0.92,
        timeframe: "Immediate",
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        trend: "Quantum-Resistant Infrastructure Shift",
        probability: 0.64,
        timeframe: "2027",
        timestamp: new Date(Date.now() - 7200000).toISOString()
      }
    ];
  },

  getMasterGraph: async () => {
    const response = await fetch('/api/graph/master');
    if (!response.ok) throw new Error('Master graph failed');
    return response.json();
  },

  searchGlobalGraph: async (query: string) => {
    const response = await fetch(`/api/graph/global-search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Global search failed');
    return response.json();
  },

  runFilteredSearch: async (organization: string, targets: string[]) => {
    const response = await fetch('/api/search/filtered', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organization, targets })
    });
    if (!response.ok) throw new Error('Filtered search failed');
    return response.json();
  },

  analyzeForgeScenario: async (target: string, scenario: string, lensData: any, globalGraphData: any) => {
    const response = await fetch('/api/forge/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, scenario, lensData, globalGraphData })
    });
    if (!response.ok) throw new Error('Forge analysis failed');
    return response.json();
  },

  getProjects: async () => {
    const response = await fetch('/api/projects');
    return response.json();
  },

  createProject: async (project: { name: string, description: string }) => {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
    return response.json();
  },

  updateProjectSettings: async (projectId: string, settings: any) => {
    const response = await fetch(`/api/projects/${projectId}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings })
    });
    return response.json();
  },

  correlateIntelligence: async (extractedData: any, target: string) => {
    // Simulate correlation with organizational goals
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      data: {
        correlation_id: `corr_${Math.random().toString(36).substr(2, 9)}`,
        strategic_alignment: 0.85,
        goal_overlap: ['Market Expansion', 'Competitor Neutralization'],
        statistical_analysis: {
          relevance_score: 0.92,
          impact_projection: 'High',
          confidence_interval: [0.88, 0.96]
        },
        triaged_matters: [
          { id: 'm1', priority: 'critical', title: 'Infrastructure Vulnerability in TargetCorp', action: 'Immediate Forge Analysis' },
          { id: 'm2', priority: 'high', title: 'Strategic Alignment with Goal: Market Expansion', action: 'Update Weekly Report' }
        ]
      }
    };
  },

  getSearchHistory: async () => {
    const response = await fetch('/api/history');
    return response.json();
  },

  runAdvancedIngestion: async (projectId: string, options: { query: string, sources: string[], filters?: any }) => {
    const response = await fetch('/api/ingestion/advanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        projectId, 
        ...options
      })
    });
    return response.json();
  },

  correlateJobs: async (jobIds: string[]) => {
    const response = await fetch('/api/jobs/correlate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobIds })
    });
    return response.json();
  },

  runMaltegoTransform: async (target: string, transform: string) => {
    const response = await fetch('/api/osint/maltego', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, transform })
    });
    return response.json();
  },

  getAnalyticsLinks: async (projectId: string) => {
    const response = await fetch(`/api/analytics/links?projectId=${projectId}`);
    return response.json();
  },

  getKnowledgeBaseStats: async () => {
    const response = await fetch('/api/stats');
    return response.json();
  },

  runCombinatorialAnalysis: async (target: string, entities: any[]) => {
    const response = await fetch('/api/analysis/combinatorial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, entities })
    });
    return response.json();
  },

  saveClip: async (clip: { title: string, content: string, source: string }) => {
    const response = await fetch('/api/clips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clip)
    });
    return response.json();
  },

  getClips: async () => {
    const response = await fetch('/api/clips');
    return response.json();
  },

  profileOrganisation: async (orgName: string, objective: string) => {
    const response = await fetch('/api/org/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgName, objective })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Organisation profiling failed');
    }
    return response.json();
  },

  pollOrgProfiling: async (jobId: string) => {
    const response = await fetch(`/api/org/profile/${jobId}`);
    if (!response.ok) throw new Error('Failed to poll profiling job');
    return response.json();
  },

  updateOrgProfile: async (profile: any) => {
    const response = await fetch('/api/org/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  },

  startAgentInvestigation: async (target: string, sector: string, focus: string, entityTypes?: string[]) => {
    const response = await fetch('/api/agent/investigate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, sector, focus, entityTypes })
    });
    if (!response.ok) throw new Error('Failed to start investigation');
    return response.json();
  },

  pollAgentInvestigation: async (runId: string) => {
    const response = await fetch(`/api/agent/investigate/${runId}`);
    if (!response.ok) throw new Error('Failed to poll investigation');
    return response.json();
  },
};

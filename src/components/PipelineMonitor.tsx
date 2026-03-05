import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Database, FileCode, ArrowRight, CheckCircle, Loader2, Server, Shield, Terminal, Network, Search, FileText, BrainCircuit, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { portalApi } from '../services/portalApi';
import {
  IngestionEvent,
  NormalizedEvent,
  EnrichedEvent,
  ExtractedData,
  OsintEnrichment,
  GraphUpdate,
  StrategicReport,
  FingerprintData,
  StrategicCorrelation,
} from '../contracts';

// --- Types ---

type PipelineStage = 'idle' | 'fetching' | 'ingesting' | 'normalizing' | 'enriching' | 'extracting' | 'correlating' | 'osint' | 'graph_update' | 'reporting' | 'complete' | 'error';

interface PipelineState {
  stage: PipelineStage;
  sourceType: 'rss' | 'api' | 'crawler';
  rawData: any | null;
  ingested: IngestionEvent | null;
  normalized: NormalizedEvent | null;
  enriched: EnrichedEvent | null;
  extracted: ExtractedData | null;
  correlation: StrategicCorrelation | null;
  osint: OsintEnrichment | null;
  fingerprint: FingerprintData | null;
  graphUpdate: GraphUpdate | null;
  report: StrategicReport | null;
  error: string | null;
}

// --- Components ---

const IntelligenceDepth: React.FC<{ level: number }> = ({ level }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <div 
        key={i} 
        className={`w-1 h-3 rounded-full ${i <= level ? 'bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.5)]' : 'bg-white/5'}`}
      />
    ))}
  </div>
);

const HumanReadableCard: React.FC<{ title: string; data: any; color: string; icon?: React.ReactNode; depth?: number }> = ({ title, data, color, icon, depth }) => {
    // Helper to render key-value pairs nicely
    const renderContent = (obj: any) => {
        if (!obj) return null;
        return Object.entries(obj).map(([key, value]) => {
            if (key === 'meta' || key === 'raw_payload') return null; // Skip meta/raw in human view
            if (typeof value === 'object' && value !== null) {
                return (
                    <div key={key} className="mb-2">
                        <div className={`text-[10px] uppercase font-bold text-${color}-400 mb-1`}>{key.replace(/_/g, ' ')}</div>
                        <div className="pl-2 border-l border-white/10">{renderContent(value)}</div>
                    </div>
                );
            }
            return (
                <div key={key} className="flex justify-between py-1 border-b border-white/5 last:border-0">
                    <span className="text-gray-500 text-xs capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-gray-300 text-xs font-mono text-right max-w-[60%] break-words">{String(value)}</span>
                </div>
            );
        });
    };

    return (
        <div className={`bg-neutral-900 border border-${color}-500/30 rounded-xl overflow-hidden shadow-lg`}>
            <div className={`px-4 py-3 bg-${color}-500/10 border-b border-${color}-500/20 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded bg-${color}-500/20 text-${color}-400`}>
                        {icon}
                    </div>
                    <h3 className={`text-sm font-bold text-${color}-100 uppercase tracking-wide`}>{title}</h3>
                </div>
                {depth && <IntelligenceDepth level={depth} />}
            </div>
            <div className="p-4 space-y-1">
                {renderContent(data)}
            </div>
        </div>
    );
};

const CodeBlock: React.FC<{ title: string; data: any; color: string; icon?: React.ReactNode }> = ({ title, data, color, icon }) => (
  <div className={`border border-${color}-500/30 bg-neutral-900/50 rounded-lg overflow-hidden`}>
    <div className={`px-4 py-2 border-b border-${color}-500/30 bg-${color}-500/10 flex justify-between items-center`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className={`text-xs font-mono uppercase tracking-widest text-${color}-400 font-bold`}>{title}</span>
      </div>
      <div className="flex gap-1.5">
        <div className={`w-2 h-2 rounded-full bg-${color}-500`}></div>
      </div>
    </div>
    <div className="p-4 overflow-x-auto custom-scrollbar">
      <pre className="text-[10px] font-mono text-gray-300 leading-relaxed">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  </div>
);

const StageIndicator: React.FC<{ 
  label: string; 
  status: 'pending' | 'active' | 'complete'; 
  icon: React.ReactNode 
}> = ({ label, status, icon }) => {
  const color = status === 'complete' ? 'text-emerald-500' : status === 'active' ? 'text-purpose-gold' : 'text-gray-600';
  const borderColor = status === 'complete' ? 'border-emerald-500' : status === 'active' ? 'border-purpose-gold' : 'border-gray-700';
  const bgColor = status === 'complete' ? 'bg-emerald-500/10' : status === 'active' ? 'bg-purpose-gold/10' : 'bg-transparent';

  return (
    <div className={`flex flex-col items-center gap-3 transition-all duration-500 min-w-[80px] ${status === 'pending' ? 'opacity-50' : 'opacity-100'}`}>
      <div className={`w-10 h-10 rounded-full border-2 ${borderColor} ${bgColor} flex items-center justify-center transition-all duration-500 shadow-lg`}>
        <div className={`${color} transition-colors duration-300 transform scale-75`}>
          {status === 'active' ? <Loader2 className="w-6 h-6 animate-spin" /> : icon}
        </div>
      </div>
      <span className={`text-[10px] font-mono uppercase tracking-widest font-bold text-center ${color}`}>{label}</span>
    </div>
  );
};

const EntityExtractionCard: React.FC<{ data: ExtractedData }> = ({ data }) => {
  // Simulate cluster grouping
  const clusters = [
    { name: 'Infrastructure Cluster', entities: data.entities.filter(e => e.type === 'LOC' || e.type === 'CYBER_THREAT').slice(0, 2) },
    { name: 'Corporate Network', entities: data.entities.filter(e => e.type === 'ORG' || e.type === 'PERSON').slice(0, 2) }
  ].filter(c => c.entities.length > 0);

  return (
    <div className="bg-neutral-900 border border-cyan-500/30 rounded-xl overflow-hidden shadow-lg">
      <div className="px-4 py-3 bg-cyan-500/10 border-b border-cyan-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-cyan-500/20 text-cyan-400">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-cyan-100 uppercase tracking-wide">DeepAgent NLP Extraction</h3>
        </div>
        <IntelligenceDepth level={3} />
      </div>
      <div className="p-4 space-y-6">
        <div>
          <h4 className="text-xs font-mono uppercase text-cyan-500 mb-2">Identified Nodes</h4>
          <div className="flex flex-wrap gap-2">
            {data.entities.map((entity) => (
              <div key={entity.id} className="flex items-center gap-2 px-2 py-1 bg-neutral-800 rounded border border-white/10">
                <span className={`text-[10px] font-bold uppercase ${
                  entity.type === 'CYBER_THREAT' ? 'text-red-400' :
                  entity.type === 'ORG' ? 'text-blue-400' :
                  'text-gray-400'
                }`}>{entity.type}</span>
                <span className="text-xs text-gray-200">{entity.text}</span>
                <span className="text-[9px] text-gray-500 font-mono">{(entity.confidence * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        {clusters.length > 0 && (
          <div>
            <h4 className="text-xs font-mono uppercase text-cyan-500 mb-2">Identified Clusters</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {clusters.map((cluster, idx) => (
                <div key={idx} className="p-3 bg-neutral-950 border border-white/5 rounded-lg">
                  <div className="text-[10px] font-bold text-cyan-400 uppercase mb-2">{cluster.name}</div>
                  <div className="flex flex-wrap gap-1">
                    {cluster.entities.map(e => (
                      <span key={e.id} className="text-[9px] px-1.5 py-0.5 bg-neutral-800 rounded text-gray-400">{e.text}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {data.relations.length > 0 && (
          <div>
            <h4 className="text-xs font-mono uppercase text-cyan-500 mb-2">Relational Mappings</h4>
            <div className="space-y-2">
              {data.relations.map((rel, idx) => {
                const source = data.entities.find(e => e.id === rel.source_entity_id);
                const target = data.entities.find(e => e.id === rel.target_entity_id);
                return (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="text-gray-200">{source?.text}</span>
                    <ArrowRight className="w-3 h-3 text-cyan-600" />
                    <span className="text-cyan-400 font-mono uppercase text-[10px]">{rel.type}</span>
                    <ArrowRight className="w-3 h-3 text-cyan-600" />
                    <span className="text-gray-200">{target?.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StrategicCorrelationCard: React.FC<{ data: StrategicCorrelation }> = ({ data }) => {
  return (
    <div className="bg-neutral-900 border border-amber-500/30 rounded-xl overflow-hidden shadow-lg">
      <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-amber-500/20 text-amber-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-amber-100 uppercase tracking-wide">Strategic Correlation Step</h3>
        </div>
        <IntelligenceDepth level={4} />
      </div>
      <div className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-center">
            <div className="text-2xl font-bold text-amber-500">{(data.strategic_alignment * 100).toFixed(0)}%</div>
            <div className="text-[10px] text-neutral-500 uppercase font-mono">Strategic Alignment</div>
          </div>
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-center">
            <div className="text-2xl font-bold text-cyan-400">{data.statistical_analysis.relevance_score.toFixed(2)}</div>
            <div className="text-[10px] text-neutral-500 uppercase font-mono">Relevance Score</div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-mono uppercase text-amber-500 mb-2">Goal Overlap Analysis</h4>
          <div className="flex flex-wrap gap-2">
            {data.goal_overlap.map((goal, idx) => (
              <span key={idx} className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] rounded uppercase font-bold">{goal}</span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-mono uppercase text-amber-500 mb-2">Triaged Strategic Matters</h4>
          <div className="space-y-2">
            {data.triaged_matters.map((matter) => (
              <div key={matter.id} className="flex items-center justify-between p-3 bg-neutral-950 border border-white/5 rounded-lg group hover:border-amber-500/30 transition-all">
                <div className="flex flex-col">
                  <span className="text-xs text-white font-medium">{matter.title}</span>
                  <span className="text-[9px] text-gray-500 font-mono uppercase">{matter.action}</span>
                </div>
                <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                  matter.priority === 'critical' ? 'bg-red-500/20 text-red-400' : 
                  matter.priority === 'high' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-500/20 text-gray-400'
                }`}>{matter.priority}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const OsintCard: React.FC<{ data: OsintEnrichment }> = ({ data }) => {
  const payload = data.data as {
    ip?: string;
    ports?: Array<string | number>;
    hostnames?: string[];
    vulns?: string[];
    insight?: string;
  };
  return (
    <div className="bg-neutral-900 border border-pink-500/30 rounded-xl overflow-hidden shadow-lg">
      <div className="px-4 py-3 bg-pink-500/10 border-b border-pink-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-pink-500/20 text-pink-400">
            <Search className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-pink-100 uppercase tracking-wide">OSINT Intelligence: {data.tool}</h3>
        </div>
        <IntelligenceDepth level={4} />
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
           <div>
             <div className="text-[10px] uppercase font-bold text-pink-400 mb-1">Target IP</div>
             <div className="text-xs font-mono text-gray-300">{payload.ip || 'n/a'}</div>
           </div>
           <div>
             <div className="text-[10px] uppercase font-bold text-pink-400 mb-1">Open Ports</div>
             <div className="flex flex-wrap gap-1">
               {(payload.ports || []).map((p) => (
                 <span key={p} className="px-1.5 py-0.5 bg-neutral-800 rounded text-[10px] text-pink-300 border border-pink-500/20">{p}</span>
               ))}
             </div>
           </div>
        </div>
        <div className="space-y-3">
           <div>
             <div className="text-[10px] uppercase font-bold text-pink-400 mb-1">Identified Hostnames</div>
             <div className="space-y-1">
               {(payload.hostnames || []).map(h => (
                 <div key={h} className="text-[10px] font-mono text-gray-400 truncate">{h}</div>
               ))}
             </div>
           </div>
           <div>
             <div className="text-[10px] uppercase font-bold text-pink-400 mb-1">Vulnerabilities</div>
             <div className="flex flex-wrap gap-1">
               {(payload.vulns || []).map(v => (
                 <span key={v} className="px-1.5 py-0.5 bg-red-900/20 rounded text-[9px] text-red-400 border border-red-500/20">{v}</span>
               ))}
             </div>
           </div>
        </div>
      </div>
      {payload.insight && (
        <div className="px-4 pb-4">
          <div className="text-[10px] uppercase font-bold text-pink-400 mb-2">Intelligence Insight</div>
          <div className="p-3 bg-pink-500/5 border border-pink-500/20 rounded text-xs text-gray-300 italic leading-relaxed">
            {payload.insight}
          </div>
        </div>
      )}
    </div>
  );
};

const GraphUpdateCard: React.FC<{ data: GraphUpdate }> = ({ data }) => {
  return (
    <div className="bg-neutral-900 border border-indigo-500/30 rounded-xl overflow-hidden shadow-lg">
      <div className="px-4 py-3 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center gap-3">
        <div className="p-1.5 rounded bg-indigo-500/20 text-indigo-400">
          <Network className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-bold text-indigo-100 uppercase tracking-wide">Knowledge Graph Persistence</h3>
      </div>
      <div className="p-4 flex items-center justify-around">
        <div className="text-center">
          <div className="text-2xl font-display text-indigo-400">{data.nodes_created}</div>
          <div className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Nodes Created</div>
        </div>
        <div className="w-[1px] h-8 bg-white/10"></div>
        <div className="text-center">
          <div className="text-2xl font-display text-indigo-400">{data.edges_created}</div>
          <div className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Edges Created</div>
        </div>
        <div className="w-[1px] h-8 bg-white/10"></div>
        <div className="text-center">
          <div className="text-[10px] font-mono text-gray-400 mb-1">{data.ontology_version}</div>
          <div className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Ontology</div>
        </div>
      </div>
      <div className="px-4 py-2 bg-indigo-500/5 border-t border-indigo-500/10 flex justify-between items-center">
        <span className="text-[9px] font-mono text-gray-600">TX_ID: {data.transaction_id}</span>
        <span className="text-[9px] font-mono text-emerald-500">COMMIT SUCCESSFUL</span>
      </div>
    </div>
  );
};

const StrategicReportCard: React.FC<{ data: StrategicReport }> = ({ data }) => {
  return (
    <div className="bg-neutral-900 border border-purpose-gold/30 rounded-xl overflow-hidden shadow-2xl">
      <div className="px-6 py-4 bg-purpose-gold/10 border-b border-purpose-gold/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-purpose-gold/20 text-purpose-gold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-purpose-gold uppercase tracking-wider">{data.title}</h3>
            <p className="text-[10px] text-gray-500 font-mono">ID: {data.report_id} • {new Date(data.generated_at).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <IntelligenceDepth level={5} />
           <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-500 uppercase">
             Final Synthesis
           </div>
        </div>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <h4 className="text-xs font-mono uppercase text-purpose-gold mb-3 flex items-center gap-2">
            <Activity className="w-3 h-3" /> Executive Summary
          </h4>
          <p className="text-sm text-gray-300 leading-relaxed italic border-l-2 border-purpose-gold/30 pl-4">
            "{data.summary}"
          </p>
        </div>

        {data.competition_context && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
              <h5 className="text-[10px] font-mono text-neutral-500 uppercase mb-3 flex items-center gap-2">
                <Users className="w-3 h-3" /> Competitors
              </h5>
              <div className="flex flex-wrap gap-2">
                {data.competition_context.main_competitors.map((c, i) => (
                  <span key={i} className="px-2 py-1 bg-neutral-800 text-white text-[10px] rounded">{c}</span>
                ))}
              </div>
            </div>
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
              <h5 className="text-[10px] font-mono text-neutral-500 uppercase mb-3 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" /> Market Entrants
              </h5>
              <div className="flex flex-wrap gap-2">
                {data.competition_context.market_entrants.map((c, i) => (
                  <span key={i} className="px-2 py-1 bg-cyan-900/20 text-cyan-400 text-[10px] rounded border border-cyan-500/20">{c}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {data.conflict_analysis && (
          <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-mono uppercase text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" /> Conflict Probability
              </h4>
              <span className="text-2xl font-bold text-white">{data.conflict_analysis.probability}%</span>
            </div>
            <div className="space-y-2">
              {data.conflict_analysis.reasons.map((r, i) => (
                <div key={i} className="text-[10px] text-neutral-400 flex gap-2">
                  <span className="text-red-500">•</span> {r}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.risk_assessment && (
          <div>
            <h4 className="text-xs font-mono uppercase text-red-400 mb-3 flex items-center gap-2">
              <Shield className="w-3 h-3" /> Risk Assessment
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed bg-red-500/5 p-3 rounded border border-red-500/10">
              {data.risk_assessment}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-mono uppercase text-purpose-gold mb-3">Key Intelligence Findings</h4>
            <ul className="space-y-2">
              {data.key_findings.map((finding, idx) => (
                <li key={idx} className="flex gap-3 text-xs text-gray-400">
                  <span className="text-purpose-gold font-bold">{idx + 1}.</span>
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {data.strategic_actions && (
            <div>
              <h4 className="text-xs font-mono uppercase text-emerald-400 mb-3">Recommended Strategic Actions</h4>
              <ul className="space-y-2">
                {data.strategic_actions.map((action, idx) => (
                  <li key={idx} className="flex gap-3 text-xs text-gray-400">
                    <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-neutral-800/50 rounded-lg p-4 border border-white/5">
            <h4 className="text-xs font-mono uppercase text-gray-500 mb-3">Graph Contextualization</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-neutral-900 rounded border border-white/5 text-center">
                <div className="text-xl font-display text-white">{data.graph_context.nodes_referenced}</div>
                <div className="text-[9px] uppercase text-gray-500">Nodes Referenced</div>
              </div>
              <div className="p-3 bg-neutral-900 rounded border border-white/5 text-center">
                <div className="text-xl font-display text-white">{data.graph_context.clusters_analyzed}</div>
                <div className="text-[9px] uppercase text-gray-500">Clusters Analyzed</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
               <span className="text-[10px] font-mono text-gray-500">Agent Version</span>
               <span className="text-[10px] font-mono text-cyan-400">{data.meta.agent_version}</span>
            </div>
          </div>
      </div>
    </div>
  );
};

const PipelineMonitor: React.FC<{ onBack: () => void; onNavigate?: (view: string) => void }> = ({ onBack, onNavigate }) => {
  const [targetInput, setTargetInput] = useState('');
  const [state, setState] = useState<PipelineState>({
    stage: 'idle',
    sourceType: 'api',
    rawData: null,
    ingested: null,
    normalized: null,
    enriched: null,
    extracted: null,
    correlation: null,
    osint: null,
    fingerprint: null,
    graphUpdate: null,
    report: null,
    error: null
  });

  const [selectedSpecificSource, setSelectedSpecificSource] = useState<string>('');
  const [viewMode, setViewMode] = useState<'human' | 'raw'>('human');
  const [fastTrack, setFastTrack] = useState(false);

  const sourceOptions = {
    rss: [
      { id: 'rss_cisa', name: 'CISA National Cyber Awareness', description: 'US-CERT Alerts & Advisories' },
      { id: 'rss_krebs', name: 'Krebs on Security', description: 'In-depth investigative security news' }
    ],
    api: [
      { id: 'api_web_search', name: 'Gemini Web Search', description: 'Real-time public source intelligence' },
      { id: 'api_shodan', name: 'Shodan OSINT', description: 'Internet-connected device search' },
      { id: 'api_alienvault', name: 'AlienVault OTX', description: 'Open Threat Exchange Pulse Data' },
      { id: 'api_virustotal', name: 'VirusTotal Intelligence', description: 'Malware & URL Reputation' }
    ],
    crawler: [
      { id: 'crawl_competitor', name: 'Competitor Site Scan', description: 'Deep web crawl of identified target' }
    ]
  };

  const runPipeline = async () => {
    if (!targetInput.trim()) {
        setState(prev => ({ ...prev, error: "Please identify a target for DeepAgent analysis." }));
        return;
    }
    if (!selectedSpecificSource) {
        setState(prev => ({ ...prev, error: "Please select a specific data source." }));
        return;
    }

    setState(prev => ({ 
      ...prev, 
      stage: 'fetching', 
      error: null, 
      rawData: null, 
      ingested: null, 
      normalized: null, 
      enriched: null,
      extracted: null,
      correlation: null,
      osint: null,
      graphUpdate: null,
      report: null
    }));

    try {
      // 1. Fetch Source
      const rawRes = await portalApi.simulatePublicSource(selectedSpecificSource, targetInput);
      setState(prev => ({ ...prev, stage: 'ingesting', rawData: rawRes.data }));

      // 2. Ingest (Rust Service)
      const ingestRes = await portalApi.ingestEvent(rawRes.data, state.sourceType);
      const ingested = ingestRes.data as IngestionEvent;
      setState(prev => ({ ...prev, stage: 'normalizing', ingested }));

      // 3. Normalize (NLP Service)
      const normRes = await portalApi.normalizeEvent(ingested);
      const normalized = normRes.data as NormalizedEvent;
      setState(prev => ({ ...prev, stage: 'enriching', normalized }));

      // 4. Enrich (ML Service)
      const enrichRes = await portalApi.enrichEvent(normalized, targetInput);
      const enriched = enrichRes.data as EnrichedEvent;
      setState(prev => ({ ...prev, stage: 'extracting', enriched }));

      // 5. Extract Entities (DeepAgent NER)
      const extractRes = await portalApi.extractEntities(enriched, targetInput);
      const extracted = extractRes.data as ExtractedData;
      setState(prev => ({ ...prev, stage: 'correlating', extracted }));

      // 6. Strategic Correlation (Goal Alignment)
      const correlationRes = await portalApi.correlateIntelligence(extracted, targetInput);
      const correlation = correlationRes.data as StrategicCorrelation;
      setState(prev => ({ ...prev, stage: 'osint', correlation }));

      // 7. OSINT Enrichment (Tool Execution)
      const targetEntityId = extracted.entities[0]?.id || 'unknown';
      const osintRes = await portalApi.runOsintEnrichment(targetEntityId, targetInput, selectedSpecificSource);
      const osint = osintRes.data as OsintEnrichment;
      setState(prev => ({ ...prev, stage: 'graph_update', osint }));

      // 8. Graph Update (Ontology Mapping)
      const graphRes = await portalApi.updateKnowledgeGraph(extracted);
      const graphUpdate = graphRes.data as GraphUpdate;
      setState(prev => ({ ...prev, stage: 'reporting', graphUpdate }));

      // 8. Website Fingerprinting (Final Recon)
      let fpData = null;
      try {
        fpData = (await portalApi.fingerprintWebsite(`https://${targetInput.toLowerCase().replace(/\s+/g, '')}.com`)) as FingerprintData;
        setState(prev => ({ ...prev, fingerprint: fpData }));
      } catch (e) {
        console.warn("Fingerprinting failed, skipping...");
      }

      // 9. Strategic Report (LLM Synthesis)
      setState(prev => ({ ...prev, stage: 'reporting' }));
      const pipelineData = {
        target: targetInput,
        source: selectedSpecificSource,
        raw: rawRes.data,
        normalized,
        enriched,
        extracted,
        osint,
        fingerprint: fpData,
        graph: graphUpdate
      };
      const reportRes = await portalApi.generateStrategicReport(pipelineData, targetInput);
      const report = reportRes.data as StrategicReport;
      setState(prev => ({ ...prev, stage: 'complete', report }));

    } catch (err) {
      console.error("Pipeline Error:", err);
      setState(prev => ({ ...prev, stage: 'error', error: "Pipeline execution failed. Check audit logs." }));
    }
  };

  const isStageVisible = (stage: PipelineStage) => {
    if (!fastTrack) return true;
    // In Fast Track, only show Source, Extract, and Report
    return ['idle', 'fetching', 'extracting', 'reporting', 'complete'].includes(stage);
  };

  return (
    <div className="min-h-screen bg-charcoal text-white font-sans flex flex-col">
      
      {/* Header */}
      <div className="h-16 border-b border-white/10 bg-neutral-900/90 backdrop-blur flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <ArrowRight className="w-5 h-5 rotate-180" />
          </button>
          <div className="h-6 w-[1px] bg-white/10"></div>
          <h1 className="font-display text-lg tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-purpose-gold" />
            DeepAgent Ingestion Pipeline
          </h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
           <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <BrainCircuit className="w-3 h-3 text-cyan-400" />
              <span className="text-cyan-400">LANGGRAPH ACTIVE</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              SYSTEM ONLINE
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Controls Sidebar */}
        <div className="w-full md:w-80 border-r border-white/10 bg-neutral-900 p-6 flex flex-col gap-8 z-20 shadow-xl">
          
          {/* Target Input */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">Target Definition</h3>
            <div className="relative">
                <input 
                    type="text" 
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    placeholder="e.g. TargetCorp, 192.168.1.1"
                    className="w-full bg-neutral-800 border border-white/10 rounded-md p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purpose-gold focus:ring-1 focus:ring-purpose-gold font-mono transition-all"
                />
                <div className="absolute right-3 top-3 text-gray-500">
                    <Search className="w-4 h-4" />
                </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                Identify the primary subject for DeepAgent extraction. This will drive NER focus and OSINT tool selection.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">Source Configuration</h3>
            <div className="space-y-3">
              {(['rss', 'api', 'crawler'] as const).map(type => (
                <div key={type} className="space-y-2">
                  <button
                    onClick={() => {
                        setState(prev => ({ ...prev, sourceType: type }));
                        setSelectedSpecificSource(''); // Reset specific selection when changing type
                    }}
                    disabled={state.stage !== 'idle' && state.stage !== 'complete' && state.stage !== 'error'}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      state.sourceType === type 
                        ? 'bg-purpose-gold/10 border-purpose-gold text-white' 
                        : 'bg-neutral-800 border-white/5 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold uppercase">{type} Source</span>
                      {state.sourceType === type && <CheckCircle className="w-4 h-4 text-purpose-gold" />}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      {type === 'rss' ? 'Standard XML Feed Adapter' : type === 'api' ? 'REST/Stream JSON Adapter' : 'Unstructured HTML Crawler'}
                    </div>
                  </button>

                  {/* Sub-options for selected type */}
                  <AnimatePresence>
                    {state.sourceType === type && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="pl-4 space-y-2 overflow-hidden"
                        >
                            {sourceOptions[type].map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => setSelectedSpecificSource(option.id)}
                                    className={`w-full p-2 rounded border text-left text-xs font-mono transition-colors ${
                                        selectedSpecificSource === option.id
                                            ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                                            : 'bg-neutral-900 border-white/5 text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    <div className="font-bold">{option.name}</div>
                                    <div className="text-[9px] opacity-70">{option.description}</div>
                                </button>
                            ))}
                        </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">Knowledge Base Stats</h3>
            <div className="bg-neutral-800/50 border border-white/5 rounded-lg p-4 space-y-4">
               <div className="flex justify-between items-end">
                  <div className="text-[10px] uppercase font-bold text-gray-500">Total Entities</div>
                  <div className="text-xl font-display text-white">12,402</div>
               </div>
               <div className="flex justify-between items-end">
                  <div className="text-[10px] uppercase font-bold text-gray-500">Cross-Links</div>
                  <div className="text-xl font-display text-white">84,192</div>
               </div>
               <div className="pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-mono">
                     <Activity className="w-3 h-3" />
                     <span>GRAPH EXPANDING (+{state.graphUpdate?.nodes_created || 0} nodes)</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="mt-auto space-y-4">
             {state.error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-xs text-red-400 font-mono">
                    {state.error}
                </div>
             )}
            <button
              onClick={runPipeline}
              disabled={state.stage !== 'idle' && state.stage !== 'complete' && state.stage !== 'error'}
              className="w-full py-4 bg-purpose-gold text-black font-mono font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {state.stage === 'idle' || state.stage === 'complete' || state.stage === 'error' ? (
                <>
                  <Terminal className="w-4 h-4" /> Initialize Agent
                </>
              ) : (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </>
              )}
            </button>
            
            {onNavigate && (
              <button
                onClick={() => onNavigate('agent-network')}
                className="w-full py-3 bg-neutral-800 text-gray-300 font-mono text-xs uppercase tracking-widest hover:bg-neutral-700 transition-colors border border-white/10 flex items-center justify-center gap-2"
              >
                <BrainCircuit className="w-4 h-4" /> Open Supervisor Network
              </button>
            )}
          </div>
        </div>

        {/* Visualization Area */}
        <div className="flex-1 bg-neutral-950 relative overflow-y-auto custom-scrollbar">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
          
          <div className="max-w-6xl mx-auto p-12">
            
            {/* View Toggle */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setFastTrack(!fastTrack)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${fastTrack ? 'bg-cyan-500' : 'bg-neutral-800'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${fastTrack ? 'left-6' : 'left-1'}`}></div>
                      </button>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Fast Track Mode</span>
                   </div>
                </div>
                <div className="flex bg-neutral-900 rounded-lg p-1 border border-white/10">
                    <button 
                        onClick={() => setViewMode('human')}
                        className={`px-3 py-1 text-xs font-mono rounded transition-colors ${viewMode === 'human' ? 'bg-neutral-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        HUMAN READABLE
                    </button>
                    <button 
                        onClick={() => setViewMode('raw')}
                        className={`px-3 py-1 text-xs font-mono rounded transition-colors ${viewMode === 'raw' ? 'bg-neutral-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        RAW JSON
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="flex justify-between items-start mb-16 relative overflow-x-auto pb-4 gap-4">
               {/* Line */}
              <div className="absolute top-5 left-0 w-full h-[2px] bg-neutral-800 -z-10 min-w-[800px]"></div>
              
              <StageIndicator label="Source" icon={<Database className="w-5 h-5" />} status={state.stage === 'idle' ? 'pending' : 'complete'} />
              <StageIndicator label="Ingest" icon={<Server className="w-5 h-5" />} status={state.stage === 'ingesting' ? 'active' : state.stage === 'idle' || state.stage === 'fetching' ? 'pending' : 'complete'} />
              <StageIndicator label="Normalize" icon={<FileCode className="w-5 h-5" />} status={state.stage === 'normalizing' ? 'active' : ['idle', 'fetching', 'ingesting'].includes(state.stage) ? 'pending' : 'complete'} />
              <StageIndicator label="Enrich" icon={<Shield className="w-5 h-5" />} status={state.stage === 'enriching' ? 'active' : ['idle', 'fetching', 'ingesting', 'normalizing'].includes(state.stage) ? 'pending' : 'complete'} />
              <StageIndicator label="Extract" icon={<BrainCircuit className="w-5 h-5" />} status={state.stage === 'extracting' ? 'active' : ['idle', 'fetching', 'ingesting', 'normalizing', 'enriching'].includes(state.stage) ? 'pending' : 'complete'} />
              <StageIndicator label="Correlate" icon={<TrendingUp className="w-5 h-5" />} status={state.stage === 'correlating' ? 'active' : ['idle', 'fetching', 'ingesting', 'normalizing', 'enriching', 'extracting'].includes(state.stage) ? 'pending' : 'complete'} />
              <StageIndicator label="OSINT" icon={<Search className="w-5 h-5" />} status={state.stage === 'osint' ? 'active' : ['idle', 'fetching', 'ingesting', 'normalizing', 'enriching', 'extracting', 'correlating'].includes(state.stage) ? 'pending' : 'complete'} />
              <StageIndicator label="Graph" icon={<Network className="w-5 h-5" />} status={state.stage === 'graph_update' ? 'active' : ['idle', 'fetching', 'ingesting', 'normalizing', 'enriching', 'extracting', 'correlating', 'osint'].includes(state.stage) ? 'pending' : 'complete'} />
              <StageIndicator label="Report" icon={<FileText className="w-5 h-5" />} status={state.stage === 'reporting' ? 'active' : state.stage === 'complete' ? 'complete' : 'pending'} />
            </div>

            {/* Data Flow Visualization */}
            <div className="space-y-8">
              
              <AnimatePresence mode="popLayout">
                {state.rawData && isStageVisible('fetching') && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-[1fr_auto] gap-4">
                    {viewMode === 'human' ? (
                        <HumanReadableCard title="Raw Source Payload" data={state.rawData} color="blue" icon={<Database className="w-4 h-4"/>} depth={1} />
                    ) : (
                        <CodeBlock title="Raw Source Payload" data={state.rawData} color="blue" icon={<Database className="w-4 h-4 text-blue-400"/>} />
                    )}
                    <div className="flex flex-col items-center justify-center text-gray-600"><ArrowRight className="w-6 h-6 rotate-90 md:rotate-0" /></div>
                  </motion.div>
                )}

                {state.ingested && isStageVisible('ingesting') && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-[1fr_auto] gap-4">
                    {viewMode === 'human' ? (
                        <HumanReadableCard title="Ingestion Event" data={state.ingested} color="orange" icon={<Server className="w-4 h-4"/>} depth={1} />
                    ) : (
                        <CodeBlock title="Ingestion Event (Rust Service)" data={state.ingested} color="orange" icon={<Server className="w-4 h-4 text-orange-400"/>} />
                    )}
                    <div className="flex flex-col items-center justify-center text-gray-600"><ArrowRight className="w-6 h-6 rotate-90 md:rotate-0" /></div>
                  </motion.div>
                )}

                {state.normalized && isStageVisible('normalizing') && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-[1fr_auto] gap-4">
                    {viewMode === 'human' ? (
                        <HumanReadableCard title="Canonical Event" data={state.normalized} color="purple" icon={<FileCode className="w-4 h-4"/>} depth={2} />
                    ) : (
                        <CodeBlock title="Canonical Event (NLP Service)" data={state.normalized} color="purple" icon={<FileCode className="w-4 h-4 text-purple-400"/>} />
                    )}
                    <div className="flex flex-col items-center justify-center text-gray-600"><ArrowRight className="w-6 h-6 rotate-90 md:rotate-0" /></div>
                  </motion.div>
                )}

                {state.enriched && isStageVisible('enriching') && (
                   <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-[1fr_auto] gap-4">
                    {viewMode === 'human' ? (
                        <HumanReadableCard title="Enriched Intelligence" data={state.enriched} color="emerald" icon={<Shield className="w-4 h-4"/>} depth={2} />
                    ) : (
                        <CodeBlock title="Enriched Intelligence (ML Service)" data={state.enriched} color="emerald" icon={<Shield className="w-4 h-4 text-emerald-400"/>} />
                    )}
                    <div className="flex flex-col items-center justify-center text-gray-600"><ArrowRight className="w-6 h-6 rotate-90 md:rotate-0" /></div>
                  </motion.div>
                )}

                {state.extracted && isStageVisible('extracting') && (
                   <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-[1fr_auto] gap-4">
                    {viewMode === 'human' ? (
                        <EntityExtractionCard data={state.extracted} />
                    ) : (
                        <CodeBlock title="DeepAgent Extraction (NLP)" data={state.extracted} color="cyan" icon={<BrainCircuit className="w-4 h-4 text-cyan-400"/>} />
                    )}
                    <div className="flex flex-col items-center justify-center text-gray-600"><ArrowRight className="w-6 h-6 rotate-90 md:rotate-0" /></div>
                  </motion.div>
                )}

                {state.correlation && isStageVisible('correlating') && (
                   <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-[1fr_auto] gap-4">
                    {viewMode === 'human' ? (
                        <StrategicCorrelationCard data={state.correlation} />
                    ) : (
                        <CodeBlock title="Strategic Correlation Analysis" data={state.correlation} color="amber" icon={<TrendingUp className="w-4 h-4 text-amber-400"/>} />
                    )}
                    <div className="flex flex-col items-center justify-center text-gray-600"><ArrowRight className="w-6 h-6 rotate-90 md:rotate-0" /></div>
                  </motion.div>
                )}

                {state.osint && isStageVisible('osint') && (
                   <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-[1fr_auto] gap-4">
                    {viewMode === 'human' ? (
                        <OsintCard data={state.osint} />
                    ) : (
                        <CodeBlock title="OSINT Tool Output (TheHarvester)" data={state.osint} color="pink" icon={<Search className="w-4 h-4 text-pink-400"/>} />
                    )}
                    <div className="flex flex-col items-center justify-center text-gray-600"><ArrowRight className="w-6 h-6 rotate-90 md:rotate-0" /></div>
                  </motion.div>
                )}

                {state.graphUpdate && isStageVisible('graph_update') && (
                   <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-[1fr_auto] gap-4">
                    {viewMode === 'human' ? (
                        <GraphUpdateCard data={state.graphUpdate} />
                    ) : (
                        <CodeBlock title="Knowledge Graph Transaction" data={state.graphUpdate} color="indigo" icon={<Network className="w-4 h-4 text-indigo-400"/>} />
                    )}
                    <div className="flex flex-col items-center justify-center text-gray-600"><ArrowRight className="w-6 h-6 rotate-90 md:rotate-0" /></div>
                  </motion.div>
                )}

                {state.report && isStageVisible('reporting') && (
                   <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    {viewMode === 'human' ? (
                        <StrategicReportCard data={state.report} />
                    ) : (
                        <CodeBlock title="Strategic Report (Final Output)" data={state.report} color="yellow" icon={<FileText className="w-4 h-4 text-yellow-400"/>} />
                    )}
                  </motion.div>
                )}

              </AnimatePresence>

              {state.stage === 'idle' && !state.rawData && (
                <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-lg">
                  <p className="text-gray-500 font-mono text-sm">System Ready. Select source and initialize DeepAgent pipeline.</p>
                </div>
              )}

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineMonitor;

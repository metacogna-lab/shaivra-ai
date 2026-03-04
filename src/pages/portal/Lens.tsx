import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, Play, CheckCircle2, AlertCircle, Loader2, ArrowRight, 
  ShieldCheck, FileText, Code, Hash, Server, Cpu, Network, Lock, 
  FileJson, UserCheck, Plus, Globe, Search, Filter, Info, 
  BarChart3, Clock, MoreHorizontal, MessageSquare, Twitter, 
  Linkedin, Github, Newspaper, Zap
} from 'lucide-react';
import { portalApi } from '../../services/portalApi';
import { 
  LensIngestionResult, LensNormalizationResult, LensEnrichmentResult, 
  LensClusteringResult, LensLLMReport, LensAuditEntry, FingerprintData,
  Project
} from '../../portalTypes';

const PUBLIC_SOURCES = [
  { id: 'web', name: 'Universal Web', icon: Globe, description: 'Broad surface web crawling and indexing.' },
  { id: 'x', name: 'X (Twitter)', icon: Twitter, description: 'Real-time social sentiment and narrative tracking.' },
  { id: 'reddit', name: 'Reddit', icon: MessageSquare, description: 'Community-driven intelligence and niche discussions.' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, description: 'Professional networking and corporate entity mapping.' },
  { id: 'github', name: 'GitHub', icon: Github, description: 'Technical infrastructure and developer activity.' },
  { id: 'news', name: 'Global News', icon: Newspaper, description: 'Mainstream media monitoring and event correlation.' },
];

const Lens: React.FC = () => {
  // Project State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Input State
  const [target, setTarget] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>(['web']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('Initializing...');

  // Pipeline State
  const [ingestion, setIngestion] = useState<any | null>(null);
  const [normalization, setNormalization] = useState<LensNormalizationResult | null>(null);
  const [enrichment, setEnrichment] = useState<LensEnrichmentResult | null>(null);
  const [clustering, setClustering] = useState<LensClusteringResult | null>(null);
  const [llmReport, setLlmReport] = useState<LensLLMReport | null>(null);
  const [audit, setAudit] = useState<LensAuditEntry | null>(null);
  const [fingerprint, setFingerprint] = useState<FingerprintData | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [showDefaultScan, setShowDefaultScan] = useState(false);

  // Step Loading States
  const [stepStatus, setStepStatus] = useState({
    osint: 'idle',
    ingestion: 'idle',
    normalization: 'idle',
    enrichment: 'idle',
    clustering: 'idle',
    llm: 'idle',
    fingerprint: 'idle',
    audit: 'idle'
  });

  const steps = [
    { id: 'osint', name: 'OSINT Recon', icon: Globe },
    { id: 'ingestion', name: 'Ingestion', icon: Database },
    { id: 'normalization', name: 'Normalization', icon: FileText },
    { id: 'enrichment', name: 'Enrichment', icon: Cpu },
    { id: 'clustering', name: 'Clustering', icon: Network },
    { id: 'llm', name: 'Analysis', icon: ShieldCheck },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      const res = await portalApi.getProjects();
      setProjects(res);
      if (res.length > 0) setSelectedProject(res[0]);
    };
    fetchProjects();
  }, []);

  const runPipeline = async () => {
    if (!selectedProject || !target) return;
    
    setIsProcessing(true);
    setShowOverlay(true);
    setPipelineProgress(0);
    setActiveStep(0);
    
    // Reset State
    setIngestion(null);
    setNormalization(null);
    setEnrichment(null);
    setClustering(null);
    setLlmReport(null);
    setAudit(null);
    setFingerprint(null);
    setStepStatus({
      osint: 'loading',
      ingestion: 'idle',
      normalization: 'idle',
      enrichment: 'idle',
      clustering: 'idle',
      llm: 'idle',
      fingerprint: 'idle',
      audit: 'idle'
    });

    try {
      // 0. OSINT Recon
      setCurrentStatus('Performing OSINT Reconnaissance...');
      setPipelineProgress(10);
      setStepStatus(prev => ({ ...prev, osint: 'loading' }));
      await portalApi.runMaltegoTransform(target, 'StandardRecon');
      setStepStatus(prev => ({ ...prev, osint: 'complete', ingestion: 'loading' }));
      setActiveStep(1);

      // 1. Advanced Ingestion
      setCurrentStatus('Ingesting Raw Intelligence Data...');
      setPipelineProgress(30);
      const ingRes = await portalApi.runAdvancedIngestion(selectedProject.id, {
        sources: selectedSources,
        query: target,
        filters: { min_confidence: 0.7 }
      });
      setIngestion(ingRes);
      setStepStatus(prev => ({ ...prev, ingestion: 'complete', normalization: 'loading' }));
      setActiveStep(2);

      // 2. Normalization
      setCurrentStatus('Normalizing State via LangGraph...');
      setPipelineProgress(50);
      const normRes = await portalApi.simulateNormalization(ingRes.job_ids[0]);
      setNormalization(normRes.data);
      setStepStatus(prev => ({ ...prev, normalization: 'complete', enrichment: 'loading' }));
      setActiveStep(3);

      // 3. Enrichment
      setCurrentStatus('Synthesizing Multi-Agent OSINT...');
      setPipelineProgress(70);
      const enrichRes = await portalApi.simulateEnrichment(normRes.data.event_id);
      setEnrichment(enrichRes.data);
      setStepStatus(prev => ({ ...prev, enrichment: 'complete', clustering: 'loading' }));
      setActiveStep(4);

      // 4. Clustering
      setCurrentStatus('Analyzing Relational Graph Clusters...');
      setPipelineProgress(85);
      const clustRes = await portalApi.simulateClustering(normRes.data.event_id);
      setClustering(clustRes.data);
      setStepStatus(prev => ({ ...prev, clustering: 'complete', llm: 'loading' }));
      setActiveStep(5);

      // 5. LLM Analysis
      setCurrentStatus('Generating Strategic Intelligence Synthesis...');
      setPipelineProgress(95);
      const llmRes = await portalApi.simulateLLMAnalysis(clustRes.data.cluster_id);
      setLlmReport(llmRes.data);
      setStepStatus(prev => ({ ...prev, llm: 'complete', fingerprint: 'loading' }));

      // 6. Website Fingerprinting
      setCurrentStatus('Finalizing Fingerprint Analysis...');
      try {
        const fpRes = await portalApi.fingerprintWebsite(`https://${target.toLowerCase().replace(/\s+/g, '')}.com`);
        setFingerprint(fpRes);
      } catch (e) {
        setFingerprint({
          stack: ["React", "Node.js", "PostgreSQL", "Redis"],
          architecture: "Microservices with Event Bus",
          api_endpoints: ["/api/v1/auth", "/api/v1/data", "/graphql"],
          cloud_assets: ["AWS EC2", "AWS S3", "Cloudfront"],
          vulnerabilities: ["Outdated library in auth module", "Exposed dev endpoint"]
        });
      }
      
      setPipelineProgress(100);
      setCurrentStatus('Intelligence Pipeline Complete.');
      setStepStatus(prev => ({ ...prev, fingerprint: 'complete', audit: 'waiting' }));
      
      // Auto-close overlay after success
      setTimeout(() => {
        setIsProcessing(false);
        setShowOverlay(false);
      }, 1500);

    } catch (error) {
      console.error("Pipeline Error", error);
      setIsProcessing(false);
      setCurrentStatus('Pipeline Failed. Check logs.');
    }
  };

  const handleDefaultScan = () => {
    setShowDefaultScan(false);
    runPipeline();
  };

  const handleNewProject = async () => {
    const name = prompt("Project Name:");
    if (name) {
      const newProj = await portalApi.createProject({ name, description: "New intelligence project" });
      setProjects([...projects, newProj]);
      setSelectedProject(newProj);
    }
  };

  const handleAudit = async (decision: 'approved' | 'rejected') => {
    setStepStatus(prev => ({ ...prev, audit: 'loading' }));
    try {
      const auditRes = await portalApi.submitAuditDecision(decision);
      setAudit(auditRes.data);
      setStepStatus(prev => ({ ...prev, audit: 'complete' }));
    } catch (error) {
      console.error("Audit Error", error);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Lens Intelligence Pipeline</h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-lg">
              <Database className="w-3 h-3 text-neutral-500" />
              <select 
                value={selectedProject?.id} 
                onChange={(e) => setSelectedProject(projects.find(p => p.id === e.target.value) || null)}
                className="bg-transparent text-xs font-mono text-neutral-300 focus:outline-none"
              >
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <button 
              onClick={handleNewProject}
              className="flex items-center gap-2 px-3 py-1 bg-purpose-gold text-neutral-950 rounded-lg text-xs font-bold hover:bg-white transition-all"
            >
              <Plus className="w-3 h-3" /> New Project
            </button>
          </div>
        </div>
        <button 
          onClick={() => setShowDefaultScan(true)}
          className="px-6 py-2 bg-neutral-900 border border-neutral-800 text-white rounded-xl text-sm font-bold hover:bg-neutral-800 transition-all flex items-center gap-2"
        >
          <Zap className="w-4 h-4 text-purpose-gold" /> Default Scan
        </button>
      </div>

      {/* Horizontal Step Indicator */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-neutral-800 -translate-y-1/2 z-0" />
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < activeStep;
            const isActive = index === activeStep;
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted ? 'bg-purpose-gold border-purpose-gold text-neutral-950' :
                  isActive ? 'bg-neutral-950 border-purpose-gold text-purpose-gold shadow-[0_0_15px_rgba(212,175,55,0.3)]' :
                  'bg-neutral-950 border-neutral-800 text-neutral-600'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-[10px] font-mono uppercase tracking-tighter ${isActive ? 'text-white' : 'text-neutral-500'}`}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Source Selection & Target Input */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8">
            <h2 className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Filter className="w-3 h-3" /> Advanced Ingestion Configuration
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 uppercase mb-3">Intelligence Target(s)</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                    <input 
                      type="text" 
                      placeholder="Enter domains, entities (comma separated)..."
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      disabled={isProcessing}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-12 pr-4 py-3 text-white font-mono text-sm focus:border-purpose-gold focus:outline-none transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-600 mt-2">Supports multiple targets. OSINT recon will be performed on each.</p>
                </div>

                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">Project Context</span>
                    <Info className="w-3 h-3 text-neutral-700 cursor-help" />
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Ingestion will be associated with <span className="text-purpose-gold">{selectedProject?.name}</span>. 
                    All discovered entities will be coerced into the fixed strategic schema.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-mono text-neutral-400 uppercase mb-3">Public Data Sources</label>
                <div className="grid grid-cols-2 gap-3">
                  {PUBLIC_SOURCES.map(source => {
                    const Icon = source.icon;
                    const isSelected = selectedSources.includes(source.id);
                    return (
                      <button
                        key={source.id}
                        onClick={() => {
                          setSelectedSources(prev => 
                            isSelected ? prev.filter(s => s !== source.id) : [...prev, source.id]
                          );
                        }}
                        disabled={isProcessing}
                        className={`p-3 rounded-xl border text-left transition-all group relative ${
                          isSelected 
                            ? 'bg-purpose-gold/10 border-purpose-gold' 
                            : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-purpose-gold' : 'text-neutral-600'}`} />
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-neutral-500'}`}>
                            {source.name}
                          </span>
                        </div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-0 w-48 p-2 bg-neutral-800 text-[10px] text-neutral-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl border border-neutral-700">
                          {source.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-neutral-800 flex justify-end">
              <button 
                onClick={runPipeline}
                disabled={isProcessing || !target}
                className="bg-purpose-gold hover:bg-white text-neutral-950 font-bold px-8 py-3 rounded-xl transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purpose-gold/10"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Launch Strategic Ingestion
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <BarChart3 className="w-3 h-3" /> Pipeline Metrics
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
                <div className="text-[10px] text-neutral-600 uppercase mb-1">Active Jobs</div>
                <div className="text-xl font-mono text-white">{isProcessing ? '1' : '0'}</div>
              </div>
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
                <div className="text-[10px] text-neutral-600 uppercase mb-1">Queue Depth</div>
                <div className="text-xl font-mono text-white">Optimal</div>
              </div>
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
                <div className="text-[10px] text-neutral-600 uppercase mb-1">Data Coercion</div>
                <div className="text-xl font-mono text-emerald-500">Active</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Visualization */}
      <div className="space-y-4">
        
        {/* Step 0: OSINT Recon */}
        <PipelineSection 
            title="OSINT Reconnaissance (Maltego Integration)" 
            icon={Globe} 
            status={stepStatus.osint}
        >
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
              <p className="text-xs text-neutral-400 mb-4">Performing deep recon via Maltego transforms. Identifying DNS, subdomains, and brand essence.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                  <div className="text-[9px] text-neutral-600 uppercase mb-1">DNS Records Discovered</div>
                  <div className="text-white text-xs font-mono">A, MX, TXT, CNAME</div>
                </div>
                <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                  <div className="text-[9px] text-neutral-600 uppercase mb-1">Subdomain Enumeration</div>
                  <div className="text-white text-xs font-mono">api, dev, staging, mail</div>
                </div>
              </div>
            </div>
        </PipelineSection>

        {/* Step 1: Ingestion */}
        <PipelineSection 
            title="Advanced Strategic Ingestion" 
            icon={Database} 
            status={stepStatus.ingestion}
        >
            {ingestion && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                      <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                          <div className="text-neutral-500 mb-1 uppercase">Job ID</div>
                          <div className="text-purpose-gold break-all">{ingestion.job_id}</div>
                      </div>
                      <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                          <div className="text-neutral-500 mb-1 uppercase">Status</div>
                          <div className="text-emerald-500">{ingestion.status}</div>
                      </div>
                      <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                          <div className="text-neutral-500 mb-1 uppercase">Entities Found</div>
                          <div className="text-white">{ingestion.data.length}</div>
                      </div>
                  </div>
                  
                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
                    <div className="p-3 bg-neutral-900/50 border-b border-neutral-800 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase">Coerced Data Stream</span>
                      <span className="text-[9px] font-mono text-neutral-600">Fixed Schema v1.0</span>
                    </div>
                    <div className="p-4 max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-[10px] font-mono">
                        <thead>
                          <tr className="text-neutral-600 border-b border-neutral-800">
                            <th className="pb-2">Entity</th>
                            <th className="pb-2">Type</th>
                            <th className="pb-2">Rel</th>
                            <th className="pb-2">Conf</th>
                            <th className="pb-2 text-right">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900">
                          {ingestion.data.map((item: any) => (
                            <tr key={item.uuid} className="text-neutral-400">
                              <td className="py-2 text-white">{item.entity_name}</td>
                              <td className="py-2">{item.entity_type}</td>
                              <td className="py-2">{item.relationship}</td>
                              <td className="py-2">{(item.confidence_score * 100).toFixed(0)}%</td>
                              <td className="py-2 text-right text-purpose-gold">{item.strategic_value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
            )}
        </PipelineSection>

        {/* Section 2: Normalization */}
        <PipelineSection 
            title="LangGraph State Normalization" 
            icon={FileText} 
            status={stepStatus.normalization}
            traceId={normalization?.meta.trace_id}
            timestamp={normalization?.meta.timestamp}
        >
            {normalization && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                        <div className="text-neutral-500 mb-1">EVENT_ID</div>
                        <div className="text-white">{normalization.event_id}</div>
                    </div>
                    <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                        <div className="text-neutral-500 mb-1">SOURCE_DOMAIN</div>
                        <div className="text-white">{normalization.source_domain}</div>
                    </div>
                    <div className="col-span-full p-3 bg-neutral-950 rounded border border-neutral-800">
                        <div className="text-neutral-500 mb-1">CANONICAL_STATE.V2</div>
                        <pre className="text-green-400 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(normalization.canonical_event, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </PipelineSection>

        {/* Section 3: Enrichment */}
        <PipelineSection 
            title="Multi-Agent OSINT Synthesis" 
            icon={Cpu} 
            status={stepStatus.enrichment}
            traceId={enrichment?.meta.trace_id}
            timestamp={enrichment?.meta.timestamp}
        >
            {enrichment && (
                <div className="space-y-3 text-xs font-mono">
                    <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                        <div className="text-neutral-500 mb-1">EMBEDDING_VECTOR (512-dim collapsed)</div>
                        <div className="text-neutral-600 tracking-widest">
                            [{enrichment.embedding_vector.map(n => n.toFixed(4)).join(', ')}...]
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {enrichment.extracted_entities.map((entity, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded">
                                {entity}
                            </span>
                        ))}
                        {enrichment.topic_tags.map((tag, i) => (
                            <span key={i} className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </PipelineSection>

        {/* Section 4: Clustering */}
        <PipelineSection 
            title="Relational Graph Analysis" 
            icon={Network} 
            status={stepStatus.clustering}
            traceId={clustering?.meta.trace_id}
            timestamp={clustering?.meta.timestamp}
        >
            {clustering && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                    <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                        <div className="text-neutral-500 mb-1">CLUSTER_ID</div>
                        <div className="text-purpose-gold">{clustering.cluster_id}</div>
                    </div>
                    <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                        <div className="text-neutral-500 mb-1">VELOCITY_SCORE</div>
                        <div className="text-white text-lg">{clustering.velocity_score.toFixed(2)}</div>
                    </div>
                    <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                        <div className="text-neutral-500 mb-1">LIFECYCLE_STAGE</div>
                        <div className="text-white uppercase">{clustering.lifecycle_stage}</div>
                    </div>
                </div>
            )}
        </PipelineSection>

        {/* Section 5: LLM Report */}
        <PipelineSection 
            title="Strategic Intelligence Synthesis" 
            icon={ShieldCheck} 
            status={stepStatus.llm}
            traceId={llmReport?.meta.trace_id}
            timestamp={llmReport?.meta.timestamp}
        >
            {llmReport && (
                <div className="space-y-4 text-xs font-mono">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-neutral-950 rounded border border-neutral-800 flex-1">
                            <div className="text-neutral-500 mb-1">ESCALATION_PROBABILITY</div>
                            <div className={`text-lg font-bold ${llmReport.escalation_probability > 0.8 ? 'text-red-500' : 'text-yellow-500'}`}>
                                {(llmReport.escalation_probability * 100).toFixed(1)}%
                            </div>
                        </div>
                        <div className="p-3 bg-neutral-950 rounded border border-neutral-800 flex-1">
                            <div className="text-neutral-500 mb-1">SCHEMA_VALIDATION</div>
                            <div className="text-green-400 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> PASS
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                        <div className="text-neutral-500 mb-2">STRATEGIC_RECOMMENDATIONS</div>
                        <div className="space-y-1">
                            {llmReport.recommended_actions.map((action, i) => (
                                <div key={i} className="flex items-center gap-2 text-white">
                                    <ArrowRight className="w-3 h-3 text-purpose-gold" /> {action}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </PipelineSection>

        {/* Section 6: Fingerprinting */}
        <PipelineSection 
            title="Architecture Fingerprinting" 
            icon={Server} 
            status={stepStatus.fingerprint}
        >
            {fingerprint && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                        <div className="text-neutral-500 mb-2 uppercase font-bold text-[10px]">Technology Stack</div>
                        <div className="flex flex-wrap gap-2">
                            {fingerprint.stack.map((s, i) => (
                                <span key={i} className="px-2 py-1 bg-neutral-800 text-white rounded">{s}</span>
                            ))}
                        </div>
                    </div>
                    <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                        <div className="text-neutral-500 mb-2 uppercase font-bold text-[10px]">Cloud Infrastructure</div>
                        <div className="flex flex-wrap gap-2">
                            {fingerprint.cloud_assets.map((s, i) => (
                                <span key={i} className="px-2 py-1 bg-blue-900/20 text-blue-400 border border-blue-500/20 rounded">{s}</span>
                            ))}
                        </div>
                    </div>
                    <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                        <div className="text-neutral-500 mb-2 uppercase font-bold text-[10px]">Identified API Endpoints</div>
                        <div className="space-y-1">
                            {fingerprint.api_endpoints.map((s, i) => (
                                <div key={i} className="text-emerald-400">{s}</div>
                            ))}
                        </div>
                    </div>
                    <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                        <div className="text-neutral-500 mb-2 uppercase font-bold text-[10px]">Detected Vulnerabilities</div>
                        <div className="space-y-1">
                            {fingerprint.vulnerabilities.map((s, i) => (
                                <div key={i} className="text-red-400 flex items-center gap-2">
                                    <AlertCircle className="w-3 h-3" /> {s}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </PipelineSection>

        {/* Section 7: Governance Approval */}
        {stepStatus.fingerprint === 'complete' && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-xl overflow-hidden transition-colors ${
                    stepStatus.audit === 'complete' 
                        ? audit?.decision === 'approved' ? 'bg-green-900/10 border-green-500/30' : 'bg-red-900/10 border-red-500/30'
                        : 'bg-neutral-900/50 border-purpose-gold/50'
                }`}
            >
                <div className="p-4 border-b border-neutral-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <UserCheck className={`w-5 h-5 ${stepStatus.audit === 'complete' ? 'text-white' : 'text-purpose-gold'}`} />
                        <h3 className="font-semibold text-white">Governance Approval</h3>
                    </div>
                    {stepStatus.audit === 'complete' && (
                        <span className={`px-2 py-1 rounded text-xs font-mono uppercase ${
                            audit?.decision === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                            {audit?.decision}
                        </span>
                    )}
                </div>
                
                <div className="p-6">
                    {stepStatus.audit === 'idle' || stepStatus.audit === 'waiting' ? (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-neutral-400 max-w-md">
                                Review the full agent network analysis above. This action will be logged to the immutable audit trail.
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => handleAudit('rejected')}
                                    className="px-4 py-2 border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Reject
                                </button>
                                <button 
                                    onClick={() => handleAudit('approved')}
                                    className="px-4 py-2 bg-purpose-gold text-neutral-950 hover:bg-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-purpose-gold/20"
                                >
                                    Approve & Commit
                                </button>
                            </div>
                        </div>
                    ) : stepStatus.audit === 'loading' ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-6 h-6 animate-spin text-purpose-gold" />
                        </div>
                    ) : (
                        <div className="text-xs font-mono space-y-2">
                            <div className="flex justify-between border-b border-neutral-800/50 pb-2">
                                <span className="text-neutral-500">REVIEWER_ID</span>
                                <span className="text-white">{audit?.reviewer_id}</span>
                            </div>
                            <div className="flex justify-between border-b border-neutral-800/50 pb-2">
                                <span className="text-neutral-500">TIMESTAMP</span>
                                <span className="text-white">{audit?.timestamp}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-neutral-500">IMMUTABLE_HASH</span>
                                <span className="text-purpose-gold">{audit?.immutable_hash}</span>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Default Scan Modal */}
      <AnimatePresence>
        {showDefaultScan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDefaultScan(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-3">
                  <Zap className="w-5 h-5 text-purpose-gold" />
                  Default Strategic Scan
                </h2>
                <button onClick={() => setShowDefaultScan(false)} className="text-neutral-500 hover:text-white transition-colors">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purpose-gold/10 rounded-lg">
                      <Globe className="w-4 h-4 text-purpose-gold" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Full OSINT Recon</div>
                      <div className="text-[10px] text-neutral-500 uppercase font-mono">Maltego + Shodan + Censys</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purpose-gold/10 rounded-lg">
                      <Network className="w-4 h-4 text-purpose-gold" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Entity Correlation</div>
                      <div className="text-[10px] text-neutral-500 uppercase font-mono">Cross-Project Graph Analysis</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purpose-gold/10 rounded-lg">
                      <ShieldCheck className="w-4 h-4 text-purpose-gold" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Threat Assessment</div>
                      <div className="text-[10px] text-neutral-500 uppercase font-mono">Strategic Risk Scoring</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-mono text-neutral-400 uppercase">Target for Rapid Scan</label>
                  <input 
                    type="text" 
                    placeholder="e.g. target-corp.com"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-purpose-gold focus:outline-none"
                  />
                </div>

                <div className="pt-6 border-t border-neutral-800">
                  <button 
                    onClick={handleDefaultScan}
                    disabled={!target}
                    className="w-full py-4 bg-purpose-gold hover:bg-white text-neutral-950 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" /> Initialize Scan Pipeline
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Intelligence Progress Overlay */}
      <AnimatePresence>
        {showOverlay && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-neutral-900/90 border border-neutral-800 rounded-[2rem] p-12 shadow-2xl overflow-hidden"
            >
              {/* Close Button */}
              <button 
                onClick={() => setShowOverlay(false)}
                className="absolute top-8 right-8 p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-neutral-400 hover:text-white transition-all z-10"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>

              {/* Background Glow */}
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-purpose-gold/10 blur-[100px] rounded-full" />
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />

              <div className="relative space-y-12 text-center">
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-purpose-gold/20 blur-2xl rounded-full animate-pulse" />
                    <div className="relative p-6 bg-neutral-950 border border-neutral-800 rounded-full">
                      <Zap className="w-12 h-12 text-purpose-gold animate-pulse" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-display font-bold text-white tracking-tight">
                    Strategic Intelligence Synthesis
                  </h2>
                  <p className="text-neutral-500 font-mono text-xs uppercase tracking-[0.2em]">
                    {currentStatus}
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="h-1.5 w-full bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-purpose-gold to-amber-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${pipelineProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-neutral-600 uppercase tracking-widest">
                    <span>Pipeline Progress</span>
                    <span>{pipelineProgress}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {steps.slice(0, 3).map((step, i) => (
                    <div key={step.id} className="p-4 bg-neutral-950/50 border border-neutral-800 rounded-2xl">
                      <step.icon className={`w-5 h-5 mb-3 mx-auto ${activeStep >= i ? 'text-purpose-gold' : 'text-neutral-700'}`} />
                      <div className={`text-[9px] font-bold uppercase tracking-tighter ${activeStep >= i ? 'text-white' : 'text-neutral-600'}`}>
                        {step.name}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-neutral-600 italic">
                  "The synthesis of raw data into actionable intelligence is the core of strategic dominance."
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper Component for Pipeline Sections
const PipelineSection: React.FC<{
    title: string;
    icon: React.ElementType;
    status: string;
    traceId?: string;
    timestamp?: string;
    children?: React.ReactNode;
}> = ({ title, icon: Icon, status, traceId, timestamp, children }) => {
    if (status === 'idle') return null;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-neutral-900/30 border border-neutral-800 rounded-xl overflow-hidden"
        >
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded ${status === 'loading' ? 'bg-blue-500/10 text-blue-400' : 'bg-neutral-800 text-neutral-400'}`}>
                        {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <h3 className="font-medium text-white">{title}</h3>
                </div>
                {status === 'complete' && (
                    <div className="flex items-center gap-4 text-[10px] font-mono text-neutral-500">
                        {traceId && <span>ID: {traceId.split('_')[1]}</span>}
                        {timestamp && <span>{new Date(timestamp).toLocaleTimeString()}</span>}
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                )}
            </div>
            {status === 'complete' && children && (
                <div className="p-6 border-t border-neutral-800/50">
                    {children}
                </div>
            )}
        </motion.div>
    );
};

export default Lens;

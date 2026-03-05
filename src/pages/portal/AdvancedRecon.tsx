import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, Play, CheckCircle2, AlertCircle, 
  Loader2, ArrowRight, ShieldCheck, FileText, 
  Code, Hash, Server, Cpu, Network, Lock, 
  FileJson, UserCheck, Search, Globe, 
  Terminal, Activity, Zap, HardDrive, 
  Eye, EyeOff, RefreshCw, Layers
} from 'lucide-react';
import { portalApi } from '../../services/portalApi';
import {
  LensIngestionResult,
  LensNormalizationResult,
  LensEnrichmentResult,
  LensClusteringResult,
  LensLLMReport,
  LensAuditEntry,
  FingerprintData,
  OsintEnrichment,
} from '../../contracts';

const OSINT_TOOLS = [
  { id: 'api_shodan', name: 'Shodan', icon: Globe, description: 'Internet-connected device reconnaissance.' },
  { id: 'api_alienvault', name: 'AlienVault OTX', icon: ShieldCheck, description: 'Open threat exchange indicator analysis.' },
  { id: 'api_virustotal', name: 'VirusTotal', icon: Activity, description: 'Malware and domain reputation scanning.' },
  { id: 'api_google_search', name: 'Google Search', icon: Search, description: 'Publicly available information retrieval.' },
  { id: 'api_web_search', name: 'Web Crawler', icon: Globe, description: 'Deep web content extraction.' }
];

const AdvancedRecon: React.FC = () => {
  const [target, setTarget] = useState('globalresources.com');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>(['api_shodan', 'api_google_search']);
  const [logs, setLogs] = useState<Array<{ id: string; time: string; tool: string; msg: string; status: 'info' | 'success' | 'error' }>>([]);
  
  // Pipeline State
  const [ingestion, setIngestion] = useState<LensIngestionResult | null>(null);
  const [osintResults, setOsintResults] = useState<Record<string, OsintEnrichment>>({});
  const [fingerprint, setFingerprint] = useState<FingerprintData | null>(null);
  const [report, setReport] = useState<any>(null);

  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (tool: string, msg: string, status: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [...prev, { 
      id: Math.random().toString(36).substr(2, 9), 
      time: new Date().toLocaleTimeString(), 
      tool, 
      msg, 
      status 
    }]);
  };

  const runAdvancedRecon = async () => {
    setIsProcessing(true);
    setIngestion(null);
    setOsintResults({});
    setFingerprint(null);
    setReport(null);
    setLogs([]);

    addLog('System', `Initializing Advanced Reconnaissance for ${target}...`, 'info');

    try {
      // 1. Initial Ingestion
      addLog('DeepAgent', 'Starting initial reconnaissance and ingestion...', 'info');
      const ingRes = await portalApi.simulateIngestion('Web', target);
      setIngestion(ingRes.data);
      addLog('DeepAgent', `Ingestion complete. Trace ID: ${ingRes.data.meta.trace_id}`, 'success');

      // 2. Parallel OSINT Tools
      addLog('System', `Orchestrating ${activeTools.length} OSINT tools...`, 'info');
      const toolPromises = activeTools.map(async (toolId) => {
        const tool = OSINT_TOOLS.find(t => t.id === toolId);
        addLog(tool?.name || 'OSINT', `Running ${tool?.name} scan...`, 'info');
        try {
          const res = await portalApi.runOsintEnrichment('target_node', target, toolId);
          setOsintResults(prev => ({ ...prev, [toolId]: res.data }));
          addLog(tool?.name || 'OSINT', `${tool?.name} scan complete.`, 'success');
          return res.data;
        } catch (e) {
          addLog(tool?.name || 'OSINT', `${tool?.name} scan failed.`, 'error');
          return null;
        }
      });

      await Promise.all(toolPromises);

      // 3. Fingerprinting
      addLog('Fingerprinter', 'Analyzing architecture and technology stack...', 'info');
      const fpRes = await portalApi.fingerprintWebsite(`https://${target}`);
      setFingerprint(fpRes as FingerprintData);
      addLog('Fingerprinter', 'Architecture fingerprinting complete.', 'success');

      // 4. Strategic Synthesis
      addLog('LangGraph', 'Synthesizing multi-agent intelligence results...', 'info');
      const reportRes = await portalApi.generateStrategicReport({ ingestion, osintResults, fingerprint }, target);
      setReport(reportRes.data);
      addLog('LangGraph', 'Strategic intelligence report generated.', 'success');

      addLog('System', 'Advanced Reconnaissance sequence completed.', 'success');
    } catch (error) {
      addLog('System', 'Critical failure during reconnaissance sequence.', 'error');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleTool = (id: string) => {
    if (isProcessing) return;
    setActiveTools(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Advanced OSINT Recon</h1>
          <p className="text-neutral-400 font-mono text-sm mt-1">High-Spec Reconnaissance & Multi-Tool Orchestration</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-full">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">Live Agent Network</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Control Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-xs font-mono text-neutral-500 uppercase mb-6 flex items-center gap-2">
              <Terminal className="w-3 h-3" /> Recon Configuration
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-2">Target Domain / IP</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                  <input 
                    type="text" 
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    disabled={isProcessing}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-white font-mono text-sm focus:border-purpose-gold focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-3">Orchestration Tools</label>
                <div className="space-y-2">
                  {OSINT_TOOLS.map((tool) => (
                    <button 
                      key={tool.id}
                      onClick={() => toggleTool(tool.id)}
                      disabled={isProcessing}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        activeTools.includes(tool.id) 
                          ? 'bg-purpose-gold/10 border-purpose-gold text-white' 
                          : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                      }`}
                    >
                      <tool.icon className={`w-4 h-4 ${activeTools.includes(tool.id) ? 'text-purpose-gold' : 'text-neutral-600'}`} />
                      <div className="text-left">
                        <div className="text-xs font-bold">{tool.name}</div>
                        <div className="text-[9px] opacity-60">{tool.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={runAdvancedRecon}
                disabled={isProcessing || activeTools.length === 0}
                className="w-full bg-purpose-gold hover:bg-white text-neutral-950 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Initiate Recon Sequence
              </button>
            </div>
          </div>

          {/* Live Logs */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col h-[400px]">
            <div className="p-4 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Agent Logs</span>
              <Activity className="w-3 h-3 text-purpose-gold" />
            </div>
            <div ref={logRef} className="flex-1 p-4 overflow-y-auto font-mono text-[10px] space-y-2 scrollbar-hide">
              {logs.length === 0 && (
                <div className="text-neutral-700 italic">Waiting for sequence initiation...</div>
              )}
              {logs.map((log) => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-neutral-600">[{log.time}]</span>
                  <span className="text-cyan-500">[{log.tool}]</span>
                  <span className={
                    log.status === 'success' ? 'text-emerald-500' : 
                    log.status === 'error' ? 'text-red-500' : 'text-neutral-400'
                  }>
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence mode="wait">
            {!isProcessing && !report && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center p-12 bg-neutral-900/20 border border-dashed border-neutral-800 rounded-3xl"
              >
                <div className="p-6 bg-neutral-900 rounded-full mb-6">
                  <Layers className="w-12 h-12 text-neutral-700" />
                </div>
                <h3 className="text-xl font-display font-medium text-neutral-500">Awaiting Recon Sequence</h3>
                <p className="text-neutral-600 max-w-sm mt-2">
                  Configure your target and tools to begin high-spec intelligence synthesis.
                </p>
              </motion.div>
            )}

            {(isProcessing || report) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Tool Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeTools.map((toolId) => {
                    const tool = OSINT_TOOLS.find(t => t.id === toolId);
                    const result = osintResults[toolId];
                    const payload = (result?.data || {}) as {
                      insight?: string;
                      vulns?: string[];
                      ports?: Array<string | number>;
                    };
                    return (
                      <div key={toolId} className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <tool.icon className="w-4 h-4 text-purpose-gold" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">{tool.name}</span>
                          </div>
                          {result ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
                          )}
                        </div>
                        {result ? (
                          <div className="space-y-3">
                            <div className="text-[10px] font-mono text-neutral-400 line-clamp-3 leading-relaxed">
                              {payload.insight}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {payload.vulns?.slice(0, 2).map((v, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[8px] font-mono rounded uppercase">
                                  {v}
                                </span>
                              ))}
                              {payload.ports?.slice(0, 3).map((p, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-mono rounded">
                                  PORT:{p}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="h-20 flex items-center justify-center">
                            <div className="w-full h-1 bg-neutral-950 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-purpose-gold"
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Fingerprint Result */}
                {fingerprint && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <Server className="w-5 h-5 text-cyan-500" />
                      <h3 className="font-bold text-white">Architecture Fingerprint</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono text-neutral-500 uppercase">Stack</span>
                        <div className="flex flex-wrap gap-1.5">
                          {fingerprint.stack.map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-neutral-950 border border-neutral-800 text-neutral-300 text-[10px] rounded">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono text-neutral-500 uppercase">Cloud Assets</span>
                        <div className="flex flex-wrap gap-1.5">
                          {fingerprint.cloud_assets.map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-blue-900/20 border border-blue-500/20 text-blue-400 text-[10px] rounded">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono text-neutral-500 uppercase">Vulnerabilities</span>
                        <div className="space-y-1">
                          {fingerprint.vulnerabilities.map((s, i) => (
                            <div key={i} className="text-red-400 text-[10px] flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {s}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Final Report */}
                {report && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-neutral-900 border border-purpose-gold/30 rounded-2xl p-8 shadow-2xl shadow-purpose-gold/5"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-purpose-gold text-neutral-950 rounded-xl">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-display font-bold text-white">{report.title}</h2>
                          <p className="text-neutral-500 font-mono text-xs">Strategic Intelligence Synthesis // v3.0</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] font-mono text-neutral-500 uppercase">Conflict Probability</span>
                        <span className="text-2xl font-bold text-red-500">{report.conflict_analysis?.probability}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3">Executive Summary</h4>
                          <p className="text-sm text-neutral-300 leading-relaxed border-l-2 border-purpose-gold pl-4 italic">
                            {report.summary}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3">Key Intelligence Findings</h4>
                          <ul className="space-y-2">
                            {report.key_findings.map((f: string, i: number) => (
                              <li key={i} className="text-xs text-neutral-400 flex gap-3">
                                <span className="text-purpose-gold font-mono">0{i+1}</span>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-xl">
                          <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4">Strategic Actions</h4>
                          <div className="space-y-3">
                            {report.strategic_actions?.map((a: string, i: number) => (
                              <div key={i} className="flex items-center gap-3 text-xs text-white">
                                <ArrowRight className="w-3 h-3 text-purpose-gold" />
                                {a}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-xl">
                          <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4">Competitive Context</h4>
                          <div className="flex flex-wrap gap-2">
                            {report.competition_context?.main_competitors.map((c: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-neutral-900 border border-neutral-800 text-neutral-400 text-[10px] rounded">{c}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdvancedRecon;

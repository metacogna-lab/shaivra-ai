import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Hammer, Lock, ArrowRight, GitBranch, Terminal, 
  Database, Cpu, FileJson, Search, Globe, 
  ShieldCheck, AlertTriangle, CheckCircle2, Loader2,
  Info, TrendingUp, Layers, Zap
} from 'lucide-react';
import { portalApi } from '../../services/portalApi';

const Forge: React.FC = () => {
  const [target, setTarget] = useState('Global Resources Corp');
  const [scenario, setScenario] = useState('Market Monopolization & Resource Obfuscation');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [activeView, setActiveView] = useState<'standard' | 'governance'>('standard');

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      // Simulate fetching Lens and Global Graph data
      const lensData = {
        recent_ingestion: ["Anomalous financial transfer detected", "New subsidiary registered in offshore jurisdiction"],
        source_reliability: 0.85
      };
      const globalGraphData = {
        historical_nodes: ["Competitor Alpha", "Entity X"],
        previous_correlations: ["High overlap in board members between Target and Entity X"]
      };

      const result = await portalApi.analyzeForgeScenario(target, scenario, lensData, globalGraphData);
      setAnalysisResult(result);
    } catch (error) {
      console.error("Forge Analysis Error", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Forge Analysis Engine</h1>
          <p className="text-neutral-400 font-mono text-sm mt-1">Strategic consensus synthesis and probability assessment.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            <button 
              onClick={() => setActiveView('standard')}
              className={`px-3 py-1 text-[10px] font-mono uppercase rounded ${activeView === 'standard' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
            >
              Standard View
            </button>
            <button 
              onClick={() => setActiveView('governance')}
              className={`px-3 py-1 text-[10px] font-mono uppercase rounded ${activeView === 'governance' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
            >
              Governance View
            </button>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-full">
            <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
              {isAnalyzing ? 'Synthesizing Consensus' : 'Engine Ready'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-xs font-mono text-neutral-500 uppercase mb-6 flex items-center gap-2">
              <Terminal className="w-3 h-3" /> Analysis Parameters
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-2">Target Entity</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                  <input 
                    type="text" 
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    disabled={isAnalyzing}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-white font-mono text-sm focus:border-purpose-gold focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-2">Strategic Scenario (Optional)</label>
                <textarea 
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  disabled={isAnalyzing}
                  placeholder="Leave blank for auto-generation based on investigation area..."
                  rows={3}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-purpose-gold focus:outline-none transition-colors resize-none"
                />
              </div>

              {analysisResult?.generated_scenarios && (
                <div className="space-y-3">
                  <label className="block text-[10px] font-mono text-neutral-500 uppercase">Evolved Scenarios</label>
                  <div className="space-y-2">
                    {analysisResult.generated_scenarios.map((s: any) => (
                      <button 
                        key={s.id}
                        onClick={() => setScenario(s.title)}
                        className="w-full text-left p-3 bg-neutral-950 border border-neutral-800 rounded-xl hover:border-purpose-gold transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-white group-hover:text-purpose-gold">{s.title}</span>
                          <span className="text-[8px] font-mono text-red-500 uppercase">{s.risk_level}</span>
                        </div>
                        <p className="text-[9px] text-neutral-500 leading-tight">{s.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 uppercase">
                  <Database className="w-3 h-3" /> Data Sources Linked
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] rounded uppercase font-bold">Lens (Live)</span>
                  <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] rounded uppercase font-bold">Global Graph</span>
                  <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] rounded uppercase font-bold">Agent Network</span>
                </div>
              </div>

              <button 
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="w-full bg-purpose-gold hover:bg-white text-neutral-950 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Import & Analyze Consensus
              </button>
            </div>
          </div>

          {/* Heuristics Description */}
          <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-xs font-mono text-neutral-500 uppercase mb-4 flex items-center gap-2">
              <Info className="w-3 h-3" /> Intelligence Heuristics
            </h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-white uppercase">Source Reliability</div>
                <p className="text-[10px] text-neutral-500 leading-relaxed">Weighing Lens (primary/raw) vs Global Graph (historical/correlated).</p>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-white uppercase">Corroboration</div>
                <p className="text-[10px] text-neutral-500 leading-relaxed">Increasing probability when independent sources align.</p>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-white uppercase">De-duplication</div>
                <p className="text-[10px] text-neutral-500 leading-relaxed">Normalizing entities to prevent artificial weighting of repeated reports.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence mode="wait">
            {!isAnalyzing && !analysisResult && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center p-12 bg-neutral-900/20 border border-dashed border-neutral-800 rounded-3xl"
              >
                <div className="p-6 bg-neutral-900 rounded-full mb-6">
                  <Hammer className="w-12 h-12 text-neutral-700" />
                </div>
                <h3 className="text-xl font-display font-medium text-neutral-500">Awaiting Consensus Synthesis</h3>
                <p className="text-neutral-600 max-w-sm mt-2">
                  Configure your target and scenario to trigger the Forge consensus engine.
                </p>
              </motion.div>
            )}

            {(isAnalyzing || analysisResult) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Probability & Weighting Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase mb-2">Probability Assessment</span>
                    {isAnalyzing ? (
                      <Loader2 className="w-12 h-12 animate-spin text-purpose-gold" />
                    ) : (
                      <div className="text-5xl font-bold text-white">
                        {Math.round(analysisResult.probability_assessment * 100)}%
                      </div>
                    )}
                    <span className="text-[10px] font-mono text-emerald-500 mt-2 uppercase tracking-widest">High Confidence</span>
                  </div>
                  
                  <div className="md:col-span-2 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                    <h3 className="text-xs font-mono text-neutral-500 uppercase mb-6 flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" /> Source Weighting Heuristics
                    </h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-neutral-400">LENS (LIVE INGESTION)</span>
                          <span className="text-white">{analysisResult?.source_weighting?.lens * 100 || 0}%</span>
                        </div>
                        <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-emerald-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${analysisResult?.source_weighting?.lens * 100 || 0}%` }}
                            transition={{ duration: 1 }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-neutral-400">GLOBAL GRAPH (HISTORICAL)</span>
                          <span className="text-white">{analysisResult?.source_weighting?.global_graph * 100 || 0}%</span>
                        </div>
                        <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${analysisResult?.source_weighting?.global_graph * 100 || 0}%` }}
                            transition={{ duration: 1 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Consensus Summary */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <ShieldCheck className="w-5 h-5 text-purpose-gold" />
                    <h2 className="text-xl font-display font-bold text-white">Consensus Intelligence Summary</h2>
                  </div>
                  {isAnalyzing ? (
                    <div className="space-y-4">
                      <div className="h-4 bg-neutral-800 rounded animate-pulse w-full"></div>
                      <div className="h-4 bg-neutral-800 rounded animate-pulse w-5/6"></div>
                      <div className="h-4 bg-neutral-800 rounded animate-pulse w-4/6"></div>
                    </div>
                  ) : (
                    <p className="text-neutral-300 leading-relaxed italic border-l-2 border-purpose-gold pl-4">
                      "{analysisResult.consensus_summary}"
                    </p>
                  )}
                </div>

                {/* Corroboration & Contradictions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6">
                    <h3 className="text-xs font-mono text-neutral-500 uppercase mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Corroborated Findings
                    </h3>
                    <ul className="space-y-3">
                      {analysisResult?.corroborated_findings.map((f: string, i: number) => (
                        <li key={i} className="text-xs text-neutral-400 flex gap-3">
                          <span className="text-emerald-500">•</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6">
                    <h3 className="text-xs font-mono text-neutral-500 uppercase mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Contradictions Flagged
                    </h3>
                    <ul className="space-y-3">
                      {analysisResult?.contradictions_flagged.map((f: string, i: number) => (
                        <li key={i} className="text-xs text-neutral-400 flex gap-3">
                          <span className="text-amber-500">•</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Strategic Recommendation */}
                {analysisResult && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-neutral-900 border border-purpose-gold/30 rounded-2xl p-8 shadow-2xl shadow-purpose-gold/5"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-purpose-gold text-neutral-950 rounded-xl">
                        <GitBranch className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-display font-bold text-white">Strategic Recommendation</h3>
                        <p className="text-neutral-500 font-mono text-xs">Consensus-Based Action Plan</p>
                      </div>
                    </div>
                    <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-xl">
                      <p className="text-neutral-200 leading-relaxed">
                        {analysisResult.strategic_recommendation}
                      </p>
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">
                        Verified by Multi-Agent Consensus Network
                      </div>
                      <button className="text-xs font-mono text-purpose-gold hover:text-white transition-colors flex items-center gap-2">
                        Export to Strategic Layer <ArrowRight className="w-3 h-3" />
                      </button>
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

export default Forge;

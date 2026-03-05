import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, ArrowRight, Activity, Terminal, FileJson, Loader2, Play, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { portalApi } from '../services/portalApi';
import { ForgeSimulation, ForgeReport } from '../contracts';

const CodeBlock: React.FC<{ title: string; data: any; color?: string }> = ({ title, data, color = "text-gray-300" }) => (
  <div className="bg-neutral-950 rounded-lg border border-white/10 overflow-hidden font-mono text-xs my-2">
    <div className="px-3 py-2 border-b border-white/10 bg-white/5 flex justify-between items-center">
      <span className="text-gray-400 uppercase tracking-wider text-[10px]">{title}</span>
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
        <div className="w-2 h-2 rounded-full bg-yellow-500/20"></div>
        <div className="w-2 h-2 rounded-full bg-green-500/20"></div>
      </div>
    </div>
    <div className={`p-3 overflow-x-auto ${color}`}>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  </div>
);

const ForgeMonitor: React.FC<{ onBack: () => void; onNavigate?: (view: string) => void }> = ({ onBack, onNavigate }) => {
  const [inputs, setInputs] = useState({
    campaignName: '',
    sector: 'Financial',
    threatVector: 'Disinformation'
  });
  const [simulation, setSimulation] = useState<ForgeSimulation | null>(null);
  const [report, setReport] = useState<ForgeReport | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async () => {
    if (!inputs.campaignName) {
      setError("Campaign Name is required.");
      return;
    }
    setError(null);
    setIsSimulating(true);
    setSimulation(null);
    setReport(null);

    try {
      // 1. Initialize
      const initRes = await portalApi.initiateForgeSimulation({
        campaign_name: inputs.campaignName,
        sector: inputs.sector,
        threat_vector: inputs.threatVector
      });
      setSimulation(initRes.data);

      // 2. Simulate Steps (0 -> 100)
      let currentSim = initRes.data;
      while (currentSim.progress < 100) {
        const stepRes = await portalApi.runForgeStep(currentSim);
        currentSim = { ...currentSim, ...stepRes.data };
        setSimulation(currentSim);
      }

      // 3. Generate Report
      const reportRes = await portalApi.generateForgeReport(currentSim.simulation_id);
      setReport(reportRes.data);

    } catch (err) {
      console.error("Forge Error:", err);
      setError("Simulation failed. See console.");
    } finally {
      setIsSimulating(false);
    }
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
            <Hammer className="w-5 h-5 text-purpose-gold" />
            Forge Predictive Engine
          </h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
           <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <Activity className="w-3 h-3 text-amber-500" />
              <span className="text-amber-500">MONTE CARLO ACTIVE</span>
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Controls */}
        <div className="w-full md:w-80 border-r border-white/10 bg-neutral-900 p-6 flex flex-col gap-6 z-20 shadow-xl">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">Simulation Parameters</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-400 uppercase block mb-1">Campaign Name</label>
                <input 
                  type="text" 
                  value={inputs.campaignName}
                  onChange={(e) => setInputs({...inputs, campaignName: e.target.value})}
                  placeholder="e.g. Operation DeepDive"
                  className="w-full bg-neutral-800 border border-white/10 rounded p-2 text-sm text-white focus:border-purpose-gold outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase block mb-1">Target Sector</label>
                <select 
                  value={inputs.sector}
                  onChange={(e) => setInputs({...inputs, sector: e.target.value})}
                  className="w-full bg-neutral-800 border border-white/10 rounded p-2 text-sm text-white focus:border-purpose-gold outline-none"
                >
                  <option>Financial</option>
                  <option>Energy</option>
                  <option>Healthcare</option>
                  <option>Defense</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase block mb-1">Threat Vector</label>
                <select 
                  value={inputs.threatVector}
                  onChange={(e) => setInputs({...inputs, threatVector: e.target.value})}
                  className="w-full bg-neutral-800 border border-white/10 rounded p-2 text-sm text-white focus:border-purpose-gold outline-none"
                >
                  <option>Disinformation</option>
                  <option>Cyber Espionage</option>
                  <option>Insider Threat</option>
                  <option>Supply Chain</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400 font-mono">
              {error}
            </div>
          )}

          <div className="mt-auto space-y-3">
            <button
              onClick={runSimulation}
              disabled={isSimulating}
              className="w-full py-4 bg-purpose-gold text-black font-mono font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSimulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isSimulating ? "Simulating..." : "Run Simulation"}
            </button>
            
            {onNavigate && (
              <button
                onClick={() => onNavigate('campaign-analysis')}
                className="w-full py-3 bg-neutral-800 text-gray-300 font-mono text-xs uppercase tracking-widest hover:bg-neutral-700 transition-colors border border-white/10 flex items-center justify-center gap-2"
              >
                <FileJson className="w-4 h-4" /> Upload Campaign Docs
              </button>
            )}
          </div>
        </div>

        {/* Main Visualization Area */}
        <div className="flex-1 bg-neutral-950 p-8 overflow-y-auto relative">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
          
          <div className="max-w-5xl mx-auto space-y-8 relative z-10">
            
            {/* Simulation Status */}
            {simulation && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div className="bg-neutral-900 border border-white/10 p-4 rounded-xl">
                  <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Progress</div>
                  <div className="text-2xl font-mono text-white flex items-center gap-2">
                    {simulation.progress}%
                    {simulation.status === 'simulating' && <Loader2 className="w-4 h-4 animate-spin text-purpose-gold" />}
                  </div>
                  <div className="w-full bg-white/5 h-1 mt-3 rounded-full overflow-hidden">
                    <div className="h-full bg-purpose-gold transition-all duration-500" style={{ width: `${simulation.progress}%` }}></div>
                  </div>
                </div>
                <div className="bg-neutral-900 border border-white/10 p-4 rounded-xl">
                  <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Outcome Probability</div>
                  <div className="text-2xl font-mono text-cyan-400">
                    {(simulation.outcome_probability * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-gray-600 mt-1">Confidence Interval: 95%</div>
                </div>
                <div className="bg-neutral-900 border border-white/10 p-4 rounded-xl">
                  <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Projected Impact</div>
                  <div className={`text-2xl font-mono uppercase ${
                    simulation.projected_impact === 'high' ? 'text-red-500' : 
                    simulation.projected_impact === 'medium' ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    {simulation.projected_impact}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Live Data Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {simulation && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-sm font-mono text-purpose-gold">
                    <Terminal className="w-4 h-4" /> Live Simulation Stream
                  </div>
                  <CodeBlock title="SIMULATION_STATE" data={simulation} color="text-cyan-300" />
                </motion.div>
              )}

              {report && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-sm font-mono text-green-400">
                    <FileJson className="w-4 h-4" /> Strategic Output
                  </div>
                  <CodeBlock title="FINAL_REPORT" data={report} color="text-green-300" />
                </motion.div>
              )}
            </div>

            {/* Human Readable Report */}
            {report && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-900 border border-white/10 rounded-xl p-8 space-y-6"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h2 className="text-xl font-display text-white">Strategic Narrative Assessment</h2>
                  <div className="text-xs font-mono text-gray-500">ID: {report.report_id}</div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-purpose-gold uppercase tracking-widest mb-2">Executive Summary</h3>
                    <p className="text-gray-300 leading-relaxed">{report.narrative_summary}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-purpose-gold uppercase tracking-widest mb-2">Projected Timeline</h3>
                    <div className="space-y-3">
                      {report.predicted_timeline.map((item, i) => (
                        <div key={i} className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/5">
                          <div className="w-12 text-center font-mono text-xs text-gray-500">Day {item.day}</div>
                          <div className="flex-1 text-sm text-white">{item.event}</div>
                          <div className="text-xs font-mono text-cyan-400">{(item.probability * 100).toFixed(0)}% Prob</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-purpose-gold uppercase tracking-widest mb-2">Recommended Countermeasures</h3>
                    <ul className="space-y-2">
                      {report.recommended_countermeasures.map((cm, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          {cm}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgeMonitor;

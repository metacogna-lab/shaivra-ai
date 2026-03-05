import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, ArrowRight, Database, Globe, Network, Server, Shield, Terminal, User, FileText, Activity, Layers, Building2, Search } from 'lucide-react';
import { portalApi } from '../services/portalApi';
import { AgentRun, AgentLog } from '../contracts';

const AgentNetworkMonitor: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [target, setTarget] = useState('Project Blue Horizon');
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<string[]>(['PERSON', 'ORG']);
  const [runId, setRunId] = useState<string | null>(null);
  const [agentRun, setAgentRun] = useState<AgentRun | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [step, setStep] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const startInvestigation = async () => {
    setIsRunning(true);
    setStep(0);
    setAgentRun(null);
    try {
      const res = await portalApi.startAgentInvestigation(target, 'General', 'OSINT', selectedEntityTypes);
      setRunId(res.data.run_id);
    } catch (err) {
      console.error(err);
      setIsRunning(false);
    }
  };

  // Polling Effect
  useEffect(() => {
    if (!isRunning || !runId) return;

    const interval = setInterval(async () => {
      try {
        const res = await portalApi.pollAgentRun(runId);
        setAgentRun(res.data);
        
        if (res.data.status === 'completed') {
          setIsRunning(false);
          clearInterval(interval);
        } else {
          setStep(prev => prev + 1);
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 1500); // Poll every 1.5s

    return () => clearInterval(interval);
  }, [isRunning, runId, step]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentRun?.logs]);

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
            <BrainCircuit className="w-5 h-5 text-purpose-gold" />
            Deep Agent Supervisor Network
          </h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
           <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <Layers className="w-3 h-3 text-purple-400" />
              <span className="text-purple-400">LANGGRAPH ORCHESTRATION</span>
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Panel: Graph Visualization */}
        <div className="flex-1 bg-neutral-950 relative overflow-hidden flex flex-col">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
            
            {/* Control Bar */}
            <div className="p-6 z-10 flex flex-col gap-4 bg-neutral-900/50 border-b border-white/5">
                <div className="flex gap-4 items-center">
                    <input 
                        type="text" 
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="bg-neutral-950 border border-white/10 rounded px-4 py-2 text-sm font-mono text-white w-64 focus:border-purpose-gold outline-none"
                        placeholder="Enter Target Entity..."
                    />
                    <button 
                        onClick={startInvestigation}
                        disabled={isRunning}
                        className="px-6 py-2 bg-purpose-gold text-black font-mono text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50"
                    >
                        {isRunning ? 'Orchestrating...' : 'Initialize Swarm'}
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mr-2">Entity Focus:</span>
                    {[
                        { id: 'PERSON', label: 'People of Interest', icon: User },
                        { id: 'ORG', label: 'Organizations', icon: Building2 },
                        { id: 'LOC', label: 'Locations', icon: Globe },
                        { id: 'CYBER_THREAT', label: 'Cyber Infrastructure', icon: Shield },
                        { id: 'CRYPTO_WALLET', label: 'Financial Nodes', icon: Database },
                    ].map((type) => (
                        <button
                            key={type.id}
                            onClick={() => {
                                setSelectedEntityTypes(prev => 
                                    prev.includes(type.id) 
                                        ? prev.filter(t => t !== type.id) 
                                        : [...prev, type.id]
                                );
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-mono transition-all ${
                                selectedEntityTypes.includes(type.id)
                                    ? 'bg-purpose-gold/20 border-purpose-gold text-purpose-gold shadow-[0_0_10px_rgba(212,175,55,0.2)]'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                            }`}
                        >
                            <type.icon className="w-3 h-3" />
                            {type.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Network Graph (Simulated Visuals) */}
            <div className="flex-1 relative flex items-center justify-center">
                {/* Central Supervisor */}
                <AgentNode 
                    label="SUPERVISOR" 
                    type="supervisor" 
                    isActive={agentRun?.state.current_active_node === 'Supervisor'} 
                    x={0} y={0} 
                />

                {/* Satellite Nodes */}
                <AgentNode 
                    label="OSINT WORKER" 
                    type="worker" 
                    icon={Globe}
                    isActive={agentRun?.state.current_active_node === 'OSINT'} 
                    x={-250} y={-150} 
                />
                <AgentNode 
                    label="SHERLOCK" 
                    type="worker" 
                    icon={Search}
                    isActive={agentRun?.state.current_active_node === 'Sherlock'} 
                    x={-350} y={-50} 
                />
                <AgentNode 
                    label="HARVESTER" 
                    type="worker" 
                    icon={Activity}
                    isActive={agentRun?.state.current_active_node === 'Harvester'} 
                    x={-350} y={50} 
                />
                <AgentNode 
                    label="SPIDERFOOT" 
                    type="worker" 
                    icon={Network}
                    isActive={agentRun?.state.current_active_node === 'Spiderfoot'} 
                    x={350} y={-50} 
                />
                <AgentNode 
                    label="MALTEGO CE" 
                    type="worker" 
                    icon={Layers}
                    isActive={agentRun?.state.current_active_node === 'Maltego'} 
                    x={350} y={50} 
                />
                <AgentNode 
                    label="GRAPH ANALYZER" 
                    type="worker" 
                    icon={Network}
                    isActive={agentRun?.state.current_active_node === 'Graph_Analyzer'} 
                    x={250} y={-150} 
                />
                <AgentNode 
                    label="DOC STORE (MONGO)" 
                    type="db" 
                    icon={FileText}
                    isActive={agentRun?.state.current_active_node === 'Doc_Store'} 
                    x={-150} y={180} 
                />
                <AgentNode 
                    label="RELATIONAL DB (SQL)" 
                    type="db" 
                    icon={Database}
                    isActive={agentRun?.state.current_active_node === 'Relational_DB'} 
                    x={150} y={180} 
                />

                {/* Connecting Lines (SVG) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <line x1="50%" y1="50%" x2="calc(50% - 250px)" y2="calc(50% - 150px)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                    <line x1="50%" y1="50%" x2="calc(50% - 350px)" y2="calc(50% - 50px)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                    <line x1="50%" y1="50%" x2="calc(50% - 350px)" y2="calc(50% + 50px)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                    <line x1="50%" y1="50%" x2="calc(50% + 350px)" y2="calc(50% - 50px)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                    <line x1="50%" y1="50%" x2="calc(50% + 350px)" y2="calc(50% + 50px)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                    <line x1="50%" y1="50%" x2="calc(50% + 250px)" y2="calc(50% - 150px)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                    <line x1="50%" y1="50%" x2="calc(50% - 150px)" y2="calc(50% + 180px)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                    <line x1="50%" y1="50%" x2="calc(50% + 150px)" y2="calc(50% + 180px)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                    
                    {/* Active Data Flow Animation */}
                    {isRunning && (
                        <motion.circle 
                            r="4" 
                            fill="#F2A900"
                            animate={{
                                cx: [
                                    "50%", 
                                    "calc(50% - 250px)", 
                                    "calc(50% - 350px)", 
                                    "calc(50% - 350px)", 
                                    "50%", 
                                    "calc(50% + 350px)", 
                                    "calc(50% + 350px)", 
                                    "calc(50% + 250px)", 
                                    "50%"
                                ],
                                cy: [
                                    "50%", 
                                    "calc(50% - 150px)", 
                                    "calc(50% - 50px)", 
                                    "calc(50% + 50px)", 
                                    "50%", 
                                    "calc(50% - 50px)", 
                                    "calc(50% + 50px)", 
                                    "calc(50% - 150px)", 
                                    "50%"
                                ]
                            }}
                            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                        />
                    )}
                </svg>
            </div>

            {/* State Inspector */}
            <div className="h-64 border-t border-white/10 bg-neutral-900 p-6 grid grid-cols-3 gap-6 overflow-y-auto">
                <div>
                    <h4 className="text-xs font-mono text-gray-500 uppercase mb-3">Identified Entities</h4>
                    <div className="space-y-2">
                        {agentRun?.state.entities.map(e => (
                            <div key={e.id} className="flex items-center justify-between bg-neutral-950 p-2 rounded border border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-xs text-white">{e.name}</span>
                                    <span className="text-[8px] text-gray-500 uppercase font-mono">{e.type}</span>
                                </div>
                                <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${
                                    e.classification === 'adversary' ? 'bg-red-500/20 text-red-400' : 
                                    e.classification === 'ally' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                                }`}>{e.classification}</span>
                            </div>
                        ))}
                        {!agentRun && <div className="text-xs text-gray-600 italic">No entities resolved.</div>}
                    </div>
                </div>
                <div>
                    <h4 className="text-xs font-mono text-gray-500 uppercase mb-3">Database Commits</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-neutral-950 p-3 rounded border border-white/5 text-center">
                            <div className="text-2xl font-mono text-white mb-1">{agentRun?.state.db_stats.doc_records || 0}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Doc Store Records</div>
                        </div>
                        <div className="bg-neutral-950 p-3 rounded border border-white/5 text-center">
                            <div className="text-2xl font-mono text-white mb-1">{agentRun?.state.db_stats.sql_rows || 0}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Relational Rows</div>
                        </div>
                    </div>
                </div>
                <div>
                    <h4 className="text-xs font-mono text-gray-500 uppercase mb-3">Agent Messages</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {agentRun?.state.messages.map((m, i) => (
                            <div key={i} className="text-[10px] font-mono border-l-2 border-white/10 pl-2 py-1">
                                <span className="text-purpose-gold uppercase">{m.role}</span>: <span className="text-gray-400">{m.content.substring(0, 60)}...</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Right Panel: Execution Log */}
        <div className="w-full lg:w-96 border-l border-white/10 bg-neutral-900 flex flex-col shadow-xl z-20">
            <div className="p-4 border-b border-white/10 bg-neutral-950">
                <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <Terminal className="w-4 h-4" /> Execution Stream
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
                {agentRun?.logs.map((log) => (
                    <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="text-gray-600 shrink-0">{new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}</div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`uppercase font-bold ${
                                    log.node === 'Supervisor' ? 'text-purpose-gold' : 
                                    log.node === 'OSINT' ? 'text-cyan-400' : 
                                    log.node.includes('DB') ? 'text-purple-400' : 'text-white'
                                }`}>{log.node}</span>
                                <span className="text-gray-500">::</span>
                                <span className="text-white">{log.action}</span>
                            </div>
                            <div className="text-gray-500 break-all">
                                {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={logsEndRef} />
                {!agentRun && (
                    <div className="text-center text-gray-600 mt-10 italic">
                        System Idle. Awaiting instructions.
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

// Helper Node Component
const AgentNode: React.FC<{ label: string; type: string; icon?: any; isActive: boolean; x: number; y: number }> = ({ label, type, icon: Icon, isActive, x, y }) => {
    return (
        <motion.div 
            className={`absolute flex flex-col items-center justify-center w-32 h-32 rounded-full border-2 transition-all duration-300 z-10 bg-neutral-900 ${
                isActive 
                    ? 'border-purpose-gold shadow-[0_0_30px_rgba(242,169,0,0.3)] scale-110' 
                    : 'border-white/10 opacity-70'
            }`}
            style={{ 
                left: `calc(50% + ${x}px - 64px)`, 
                top: `calc(50% + ${y}px - 64px)` 
            }}
        >
            {Icon ? <Icon className={`w-8 h-8 mb-2 ${isActive ? 'text-white' : 'text-gray-500'}`} /> : <BrainCircuit className={`w-8 h-8 mb-2 ${isActive ? 'text-white' : 'text-gray-500'}`} />}
            <div className={`text-[10px] font-mono font-bold text-center px-2 ${isActive ? 'text-purpose-gold' : 'text-gray-500'}`}>
                {label}
            </div>
            {isActive && (
                <div className="absolute -bottom-8 text-[10px] text-purpose-gold animate-pulse uppercase tracking-widest">
                    Processing
                </div>
            )}
        </motion.div>
    );
};

export default AgentNetworkMonitor;

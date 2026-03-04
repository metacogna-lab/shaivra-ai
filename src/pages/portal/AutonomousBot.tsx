import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Play, Pause, RefreshCw, 
  Terminal, Activity, Zap, Layers,
  Search, Globe, Database, Cpu,
  AlertCircle, CheckCircle2, Loader2
} from 'lucide-react';
import { portalApi } from '../../services/portalApi';
import { BotState } from '../../portalTypes';

const AutonomousBot: React.FC = () => {
  const [sector, setSector] = useState('Semiconductors');
  const [focus, setFocus] = useState('Supply Chain Resilience');
  const [botState, setBotState] = useState<BotState | null>(null);
  const [isLooping, setIsLooping] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [botState?.logs]);

  const startBot = async () => {
    setLoading(true);
    setIsLooping(true);
    try {
      const state = await portalApi.startAutonomousBot(sector, focus);
      setBotState(state);
    } catch (error) {
      console.error("Bot Error", error);
      setIsLooping(false);
    } finally {
      setLoading(false);
    }
  };

  const stopBot = () => {
    setIsLooping(false);
    if (botState) {
      setBotState({ ...botState, status: 'idle' });
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Autonomous Search Bot</h1>
          <p className="text-neutral-400 font-mono text-sm mt-1">Sector Intuition & Knowledge Synthesis Engine</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-full">
          <div className={`w-2 h-2 rounded-full ${isLooping ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-600'}`} />
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
            {isLooping ? 'Active Loop' : 'System Idle'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-xs font-mono text-neutral-500 uppercase mb-6 flex items-center gap-2">
              <Bot className="w-3 h-3" /> Bot Parameters
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-2">Target Sector</label>
                <input 
                  type="text" 
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  disabled={isLooping}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-purpose-gold focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-2">Intelligence Focus</label>
                <textarea 
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  disabled={isLooping}
                  rows={3}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-purpose-gold focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="pt-4">
                {isLooping ? (
                  <button 
                    onClick={stopBot}
                    className="w-full bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Pause className="w-4 h-4" /> Stop Autonomous Loop
                  </button>
                ) : (
                  <button 
                    onClick={startBot}
                    disabled={loading}
                    className="w-full bg-purpose-gold hover:bg-white text-neutral-950 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Launch Autonomous Bot
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-xs font-mono text-neutral-500 uppercase flex items-center gap-2">
              <Activity className="w-3 h-3" /> Real-time Metrics
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Intuition</span>
                <span className="text-xl font-bold text-white">{botState?.intuition_level || 0}%</span>
              </div>
              <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Knowledge</span>
                <span className="text-xl font-bold text-white">{botState?.knowledge_nodes || 0}</span>
              </div>
              <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Resources</span>
                <span className="text-xl font-bold text-white">{botState?.resources_mapped || 0}</span>
              </div>
              <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Status</span>
                <span className={`text-xs font-bold uppercase ${isLooping ? 'text-emerald-500' : 'text-neutral-500'}`}>
                  {isLooping ? 'Looping' : 'Idle'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Console & Results */}
        <div className="lg:col-span-2 space-y-8">
          {/* Console */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purpose-gold" />
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Autonomous Console</span>
              </div>
              {isLooping && <RefreshCw className="w-3 h-3 text-neutral-600 animate-spin" />}
            </div>
            <div ref={logRef} className="flex-1 p-6 overflow-y-auto font-mono text-xs space-y-3 scrollbar-hide">
              {!botState && (
                <div className="text-neutral-700 italic">Awaiting bot initialization...</div>
              )}
              {botState?.logs.map((log, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-3"
                >
                  <span className="text-neutral-600 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                  <span className="text-cyan-500 shrink-0">BOT_CORE:</span>
                  <span className="text-neutral-300">{log}</span>
                </motion.div>
              ))}
              {isLooping && (
                <div className="flex gap-3 animate-pulse">
                  <span className="text-neutral-600 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                  <span className="text-purpose-gold shrink-0">BOT_CORE:</span>
                  <span className="text-neutral-500">Scanning disparate information nodes...</span>
                </div>
              )}
            </div>
          </div>

          {/* Synthesis Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Layers className="w-5 h-5 text-purpose-gold" />
                <h3 className="font-bold text-white">Sector Intuition</h3>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed">
                The bot is autonomously building a mental model of the {sector} sector. 
                It identifies key players, regulatory shifts, and emerging technology trends.
              </p>
            </div>
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-5 h-5 text-cyan-500" />
                <h3 className="font-bold text-white">Knowledge Detail</h3>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Deep-dive into technical specifications and resource availability. 
                Mapping the global supply chain for {sector} components.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutonomousBot;

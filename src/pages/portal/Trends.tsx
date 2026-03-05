import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Clock, Calendar, ArrowRight, 
  BarChart3, Filter, Search, Info, Loader2,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { portalApi } from '../../services/portalApi';
import { Trend } from '../../contracts';

const Trends: React.FC = () => {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeIndex, setTimeIndex] = useState(0);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const data = await portalApi.getTrends();
        setTrends(data);
        setTimeIndex(data.length - 1);
      } catch (error) {
        console.error("Trends Error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, []);

  const currentTrend = trends[timeIndex];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Strategic Trend Analysis</h1>
          <p className="text-neutral-400 font-mono text-sm mt-1">Predictive ML Insights & Temporal Intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center gap-3">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono text-white">Live Temporal Sync</span>
          </div>
        </div>
      </div>

      {/* Time Slider */}
      <div className="cyber-card p-8 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2">
            <Calendar className="w-3 h-3" /> Temporal Navigation
          </h3>
          <div className="text-xs font-mono text-cyan-400">
            {currentTrend ? new Date(currentTrend.timestamp).toLocaleString() : 'No Data'}
          </div>
        </div>
        
        <div className="relative h-12 flex items-center">
          <input 
            type="range" 
            min="0" 
            max={Math.max(0, trends.length - 1)} 
            value={timeIndex}
            onChange={(e) => setTimeIndex(parseInt(e.target.value))}
            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="absolute top-8 left-0 w-full flex justify-between px-1">
            {trends.map((_, i) => (
              <div key={i} className={`w-0.5 h-2 rounded-full ${i === timeIndex ? 'bg-cyan-400' : 'bg-neutral-800'}`} />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-8 mt-8">
          <button 
            disabled={timeIndex === 0}
            onClick={() => setTimeIndex(prev => prev - 1)}
            className="p-3 bg-neutral-950 border border-neutral-800 rounded-full text-neutral-400 hover:text-white disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <div className="text-[10px] font-mono text-neutral-600 uppercase mb-1">Snapshot Index</div>
            <div className="text-2xl font-bold text-white font-mono">T-{trends.length - 1 - timeIndex}</div>
          </div>
          <button 
            disabled={timeIndex === trends.length - 1}
            onClick={() => setTimeIndex(prev => prev + 1)}
            className="p-3 bg-neutral-950 border border-neutral-800 rounded-full text-neutral-400 hover:text-white disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Detail */}
        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence mode="wait">
            {currentTrend ? (
              <motion.div 
                key={timeIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="cyber-card p-8 space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-cyan-500/10 text-cyan-500 rounded-2xl border border-cyan-500/20">
                      <TrendingUp className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-bold text-white">{currentTrend.trend}</h2>
                      <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest mt-1">Strategic Prediction</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-neutral-500 uppercase mb-1">Probability</div>
                    <div className={`text-3xl font-bold font-mono ${currentTrend.probability > 0.7 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {(currentTrend.probability * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-4">
                    <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Predicted Timeframe
                    </h4>
                    <div className="text-xl font-bold text-white">{currentTrend.timeframe}</div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      ML analysis of time-series data suggests this trend will reach peak saturation within the specified window.
                    </p>
                  </div>
                  <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-4">
                    <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                      <Info className="w-3 h-3" /> Confidence Metric
                    </h4>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2 bg-neutral-900 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400" style={{ width: `${currentTrend.probability * 100}%` }} />
                      </div>
                      <span className="text-xs font-mono text-cyan-400">{(currentTrend.probability * 100).toFixed(1)}%</span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Based on linear regression of core idea progression across NGO and Governmental sources.
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl">
                  <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4">Strategic Implications</h4>
                  <p className="text-sm text-neutral-300 leading-relaxed italic">
                    "The convergence of this trend with existing master graph nodes indicates a high likelihood of sector-wide disruption. Defensive positioning in the {currentTrend.trend.split(' ')[0]} domain is recommended."
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center text-center p-12 bg-neutral-900/20 border border-dashed border-neutral-800 rounded-3xl">
                <TrendingUp className="w-12 h-12 text-neutral-700 mb-4" />
                <h3 className="text-xl font-display font-medium text-neutral-500">No trend data available for this period</h3>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-8">
          <div className="cyber-card p-6 space-y-6">
            <h3 className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="w-3 h-3 text-cyan-400" /> ML Model Status
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">Isolation Trees</span>
                <span className="text-[10px] font-mono text-emerald-500 uppercase">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">NLP Clustering</span>
                <span className="text-[10px] font-mono text-emerald-500 uppercase">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">Linear Regression</span>
                <span className="text-[10px] font-mono text-emerald-500 uppercase">Active</span>
              </div>
            </div>
          </div>

          <div className="cyber-card p-6 space-y-4">
            <h3 className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2">
              <Filter className="w-3 h-3 text-cyan-400" /> Sector Focus
            </h3>
            <div className="flex flex-wrap gap-2">
              {['NGO', 'Government', 'Activist', 'Corporate'].map(s => (
                <span key={s} className="px-2 py-1 bg-neutral-950 border border-neutral-800 text-neutral-500 rounded text-[10px] font-mono">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="p-6 bg-cyan-400/5 border border-cyan-400/20 rounded-2xl">
            <h4 className="text-xs font-bold text-white mb-2">Predictive Alert</h4>
            <p className="text-[10px] text-neutral-400 leading-relaxed">
              Trend velocity has increased by 24% in the last 6 hours. Consider manual trigger of Advanced Ingestion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trends;

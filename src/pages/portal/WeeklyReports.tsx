import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Calendar, AlertTriangle, 
  TrendingUp, CheckCircle2, Loader2,
  Download, Share2, Search, Filter,
  ArrowRight, ShieldCheck, Database,
  Layers, Target, Zap
} from 'lucide-react';
import { portalApi } from '../../services/portalApi';
import { WeeklyIntelligenceReport } from '../../contracts';

const WeeklyReports: React.FC = () => {
  const [reports, setReports] = useState<WeeklyIntelligenceReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<WeeklyIntelligenceReport | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const report = await portalApi.getWeeklyIntelligence();
      setReports([report]);
      setSelectedReport(report);
    } catch (error) {
      console.error("Weekly Reports Error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Weekly Strategic Reviews</h1>
          <p className="text-neutral-400 font-mono text-sm mt-1">High-Level Narrative Synthesis & Long-Term Trajectory Analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all">
            <Download className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Report List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
              <input 
                type="text" 
                placeholder="Search weekly reviews..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-white font-mono text-xs focus:border-purpose-gold focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-purpose-gold" />
              </div>
            ) : reports.map((report) => (
              <button 
                key={report.report_id}
                onClick={() => setSelectedReport(report)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedReport?.report_id === report.report_id 
                    ? 'bg-purpose-gold/10 border-purpose-gold text-white' 
                    : 'bg-neutral-900/30 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-bold">Week of {new Date(report.week_start).toLocaleDateString()}</span>
                </div>
                <div className="text-[10px] font-mono opacity-60 truncate">{report.report_id}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Report Detail */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {selectedReport ? (
              <motion.div 
                key={selectedReport.report_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Header Card */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purpose-gold text-neutral-950 rounded-xl">
                        <Target className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-display font-bold text-white">Weekly Strategic Review</h2>
                        <p className="text-neutral-500 font-mono text-xs italic">{selectedReport.report_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] font-mono text-neutral-500 uppercase">Review Period</span>
                      <span className="text-white font-bold text-xs">
                        {new Date(selectedReport.week_start).toLocaleDateString()} - {new Date(selectedReport.week_end).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3">Strategic Narrative Synthesis</h4>
                      <p className="text-neutral-300 leading-relaxed text-lg italic border-l-2 border-purpose-gold pl-6">
                        "{selectedReport.narrative_synthesis}"
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-cyan-500" /> Key Strategic Shifts
                        </h4>
                        <div className="space-y-3">
                          {selectedReport.key_shifts.map((s, i) => (
                            <div key={i} className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-300">
                              {s}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Recommended Countermeasures
                        </h4>
                        <div className="space-y-3">
                          {selectedReport.recommended_actions.map((a, i) => (
                            <div key={i} className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-300 flex gap-3">
                              <span className="text-purpose-gold font-mono">0{i+1}</span>
                              {a}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Transformations & Model Updates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-neutral-400">
                        <Zap className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-display font-bold text-white">Data Transformations</h3>
                        <p className="text-neutral-500 font-mono text-xs">ETL Pipeline Weekly Summary</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {selectedReport.data_transformations.map((t, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
                          <span className="text-xs text-neutral-400">{t.type}</span>
                          <span className="text-sm font-mono text-white">{t.count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-neutral-400">
                        <Database className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-display font-bold text-white">ML Model Updates</h3>
                        <p className="text-neutral-500 font-mono text-xs">Weights & Biases Recalibration</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {selectedReport.ml_model_updates.map((m, i) => (
                        <div key={i} className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-white">{m.model}</span>
                            <span className="text-[10px] font-mono text-emerald-500">+{m.accuracy_gain}%</span>
                          </div>
                          <div className="text-[10px] text-neutral-500 font-mono">Status: {m.status}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="flex items-center justify-between p-6 bg-neutral-900/30 border border-neutral-800 rounded-xl">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      Governance Verified
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Database className="w-4 h-4 text-cyan-500" />
                      Master Graph Synced
                    </div>
                  </div>
                  <button className="text-xs font-mono text-neutral-500 hover:text-white transition-colors flex items-center gap-2">
                    Print Strategic Brief <Download className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center text-center p-12 bg-neutral-900/20 border border-dashed border-neutral-800 rounded-3xl">
                <FileText className="w-12 h-12 text-neutral-700 mb-4" />
                <h3 className="text-xl font-display font-medium text-neutral-500">Select a weekly review to begin analysis</h3>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default WeeklyReports;

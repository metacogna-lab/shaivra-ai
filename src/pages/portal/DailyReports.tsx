import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FileText, Calendar, AlertTriangle, 
  TrendingUp, CheckCircle2, Loader2,
  Download, Share2, Search, Filter,
  ArrowRight, ShieldCheck, Database, Clock
} from 'lucide-react';
import { portalApi } from '../../services/portalApi';
import { DailyIntelligenceReport } from '../../portalTypes';

const DailyReports: React.FC = () => {
  const [reports, setReports] = useState<DailyIntelligenceReport[]>([]);
  const [rssFeeds, setRssFeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DailyIntelligenceReport | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [report, feeds] = await Promise.all([
        portalApi.getDailyIntelligence(),
        fetch('/api/rss').then(res => res.json())
      ]);
      setReports([report]);
      setSelectedReport(report);
      setRssFeeds(feeds);
    } catch (error) {
      console.error("Reports Error", error);
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
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Daily Intelligence Summaries</h1>
          <p className="text-neutral-400 font-mono text-sm mt-1">Batched Strategic Reports & Agent Network Decisions</p>
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

      {/* RSS Feed Ticker */}
      <div className="bg-neutral-900/50 border-y border-neutral-800 py-3 overflow-hidden">
        <div className="flex gap-12 animate-marquee whitespace-nowrap">
          {rssFeeds.map(feed => (
            <div key={feed.id} className="flex items-center gap-3">
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                feed.type === 'Security' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                feed.type === 'Economic' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                'bg-blue-500/10 text-blue-500 border border-blue-500/20'
              }`}>
                {feed.type}
              </span>
              <span className="text-xs text-neutral-300 font-medium">{feed.title}</span>
              <span className="text-[10px] text-neutral-600 font-mono">[{feed.source}]</span>
            </div>
          ))}
          {/* Duplicate for seamless loop */}
          {rssFeeds.map(feed => (
            <div key={`${feed.id}-dup`} className="flex items-center gap-3">
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                feed.type === 'Security' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                feed.type === 'Economic' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                'bg-blue-500/10 text-blue-500 border border-blue-500/20'
              }`}>
                {feed.type}
              </span>
              <span className="text-xs text-neutral-300 font-medium">{feed.title}</span>
              <span className="text-[10px] text-neutral-600 font-mono">[{feed.source}]</span>
            </div>
          ))}
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
                placeholder="Search reports..."
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
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-bold">{new Date(report.date).toLocaleDateString()}</span>
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
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-display font-bold text-white">Daily Intelligence Report</h2>
                        <p className="text-neutral-500 font-mono text-xs italic">{selectedReport.report_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] font-mono text-neutral-500 uppercase">Status</span>
                      <span className="text-emerald-500 font-bold uppercase">Finalized</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3">Executive Summary</h4>
                      <p className="text-neutral-300 leading-relaxed italic border-l-2 border-purpose-gold pl-4">
                        "{selectedReport.summary}"
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3">Top Identified Threats</h4>
                        <ul className="space-y-2">
                          {selectedReport.top_threats.map((t, i) => (
                            <li key={i} className="text-sm text-neutral-400 flex gap-3">
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3">Sector Shifts</h4>
                        <ul className="space-y-2">
                          {selectedReport.sector_shifts.map((s, i) => (
                            <li key={i} className="text-sm text-neutral-400 flex gap-3">
                              <TrendingUp className="w-4 h-4 text-cyan-500 shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ML Insights & Graph Updates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-neutral-900 border border-cyan-500/30 rounded-2xl p-8 shadow-2xl shadow-cyan-500/5">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-cyan-500/10 text-cyan-500 rounded-xl border border-cyan-500/20">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-display font-bold text-white">ML Insights</h3>
                        <p className="text-neutral-500 font-mono text-xs">Automated Trend & Cluster Identification</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
                        <h5 className="text-[10px] font-mono text-neutral-500 uppercase mb-2">Identified Clusters</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedReport.ml_insights.clusters.map((c, i) => (
                            <span key={i} className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded text-[10px] font-mono">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
                        <h5 className="text-[10px] font-mono text-neutral-500 uppercase mb-2">Emerging Trends</h5>
                        <ul className="space-y-1">
                          {selectedReport.ml_insights.trends.map((t, i) => (
                            <li key={i} className="text-xs text-neutral-300 flex items-center gap-2">
                              <ArrowRight className="w-3 h-3 text-cyan-500" /> {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-900 border border-emerald-500/30 rounded-2xl p-8 shadow-2xl shadow-emerald-500/5">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
                        <Database className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-display font-bold text-white">Graph Contributions</h3>
                        <p className="text-neutral-500 font-mono text-xs">Master Graph Sync Status</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
                        <span className="text-xs text-neutral-400">Nodes Added</span>
                        <span className="text-lg font-mono text-white">{selectedReport.graph_updates.nodes.length}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
                        <span className="text-xs text-neutral-400">Links Established</span>
                        <span className="text-lg font-mono text-white">{selectedReport.graph_updates.links.length}</span>
                      </div>
                      <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-mono text-emerald-500 uppercase">Synchronized with Master Graph</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metadata & Actions */}
                <div className="flex items-center justify-between p-6 bg-neutral-900/30 border border-neutral-800 rounded-xl">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Clock className="w-4 h-4" />
                      Generated: {new Date(selectedReport.date).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      Verified by Agent Network
                    </div>
                  </div>
                  <Link to="/portal/graph" className="text-xs font-mono text-purpose-gold hover:text-white transition-colors flex items-center gap-2">
                    Explore in Master Graph <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center text-center p-12 bg-neutral-900/20 border border-dashed border-neutral-800 rounded-3xl">
                <FileText className="w-12 h-12 text-neutral-700 mb-4" />
                <h3 className="text-xl font-display font-medium text-neutral-500">Select a report to view details</h3>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default DailyReports;

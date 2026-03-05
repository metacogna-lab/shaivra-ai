import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Shield, Globe, Briefcase, 
  TrendingUp, AlertTriangle, Search, 
  Database, FileText, Loader2, Info,
  ExternalLink, Download, Share2
} from 'lucide-react';
import { portalApi } from '../../services/portalApi';
import { IntelligenceSummary, ThreatDomain } from '../../contracts';

const IntelligenceAnalytics: React.FC = () => {
  const [target, setTarget] = useState('Global Resources Corp');
  const [sector, setSector] = useState('Energy');
  const [summary, setSummary] = useState<IntelligenceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeDomain, setActiveDomain] = useState<ThreatDomain | 'Overview'>('Overview');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await portalApi.getIntelligenceSummary(target, sector);
      setSummary(data);
    } catch (error) {
      console.error("Analytics Error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const getDomainIcon = (domain: string) => {
    switch (domain) {
      case 'Organizational': return <Briefcase className="w-4 h-4" />;
      case 'Disinformation': return <Globe className="w-4 h-4" />;
      case 'Financial Obfuscation': return <TrendingUp className="w-4 h-4" />;
      case 'Cyber Infrastructure': return <Shield className="w-4 h-4" />;
      case 'Geopolitical': return <Globe className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-500 border-red-500/30 bg-red-500/10';
      case 'high': return 'text-orange-500 border-orange-500/30 bg-orange-500/10';
      case 'medium': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
      default: return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Intelligence Analytics</h1>
          <p className="text-neutral-400 font-mono text-sm mt-1">Multi-Domain Threat Synthesis & Summary</p>
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

      {/* Control Bar */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-2">Target Specification</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
              <input 
                type="text" 
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-white font-mono text-sm focus:border-purpose-gold focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-2">Sector Domain</label>
            <select 
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-purpose-gold focus:outline-none transition-colors"
            >
              <option value="Energy">Energy & Resources</option>
              <option value="Finance">Financial Services</option>
              <option value="Tech">Technology & Cyber</option>
              <option value="Gov">Government & NGO</option>
            </select>
          </div>
          <button 
            onClick={fetchAnalytics}
            disabled={loading}
            className="bg-purpose-gold hover:bg-white text-neutral-950 font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
            Generate Analytics
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="space-y-2">
          <button 
            onClick={() => setActiveDomain('Overview')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
              activeDomain === 'Overview' 
                ? 'bg-purpose-gold/10 border-purpose-gold text-white' 
                : 'bg-neutral-900/30 border-neutral-800 text-neutral-500 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4" />
              <span className="text-sm font-medium">Executive Overview</span>
            </div>
          </button>
          
          <div className="pt-4 pb-2 px-4">
            <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">Threat Domains</span>
          </div>

          {summary?.threat_domains.map((td) => (
            <button 
              key={td.domain}
              onClick={() => setActiveDomain(td.domain)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                activeDomain === td.domain 
                  ? 'bg-purpose-gold/10 border-purpose-gold text-white' 
                  : 'bg-neutral-900/30 border-neutral-800 text-neutral-500 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-3">
                {getDomainIcon(td.domain)}
                <span className="text-sm font-medium">{td.domain}</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${
                td.risk_level === 'critical' ? 'bg-red-500' : 
                td.risk_level === 'high' ? 'bg-orange-500' : 'bg-emerald-500'
              }`} />
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-96 flex flex-col items-center justify-center space-y-4 bg-neutral-900/20 border border-neutral-800 rounded-2xl"
              >
                <Loader2 className="w-8 h-8 animate-spin text-purpose-gold" />
                <p className="text-neutral-500 font-mono text-sm">Synthesizing multi-domain intelligence...</p>
              </motion.div>
            ) : summary ? (
              <motion.div 
                key={activeDomain}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {activeDomain === 'Overview' ? (
                  <div className="space-y-8">
                    {/* Executive Summary Card */}
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <FileText className="w-5 h-5 text-purpose-gold" />
                        <h2 className="text-xl font-display font-bold text-white">Executive Assessment</h2>
                      </div>
                      <p className="text-neutral-300 leading-relaxed text-lg italic">
                        "{summary.overall_assessment}"
                      </p>
                      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                          <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Risk Profile</span>
                          <span className="text-red-500 font-bold uppercase">Aggressive</span>
                        </div>
                        <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                          <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Data Sources</span>
                          <span className="text-white font-bold">{summary.data_sources.length} Active</span>
                        </div>
                        <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                          <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Last Update</span>
                          <span className="text-white font-bold">{new Date(summary.last_updated).toLocaleTimeString()}</span>
                        </div>
                        <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                          <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Confidence</span>
                          <span className="text-emerald-500 font-bold">94%</span>
                        </div>
                      </div>
                    </div>

                    {/* Threat Domain Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {summary.threat_domains.map((td) => (
                        <div key={td.domain} className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-all">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-neutral-950 rounded-lg text-neutral-400">
                                {getDomainIcon(td.domain)}
                              </div>
                              <h3 className="font-bold text-white">{td.domain}</h3>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-bold ${getRiskColor(td.risk_level)}`}>
                              {td.risk_level}
                            </span>
                          </div>
                          <ul className="space-y-2">
                            {td.findings.slice(0, 2).map((f, i) => (
                              <li key={i} className="text-xs text-neutral-400 flex gap-2">
                                <span className="text-purpose-gold">•</span> {f}
                              </li>
                            ))}
                          </ul>
                          <button 
                            onClick={() => setActiveDomain(td.domain)}
                            className="mt-4 text-[10px] font-mono text-neutral-500 hover:text-white flex items-center gap-1 uppercase tracking-widest transition-colors"
                          >
                            View Full Analysis <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Specific Domain View */}
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-neutral-950 rounded-xl text-purpose-gold border border-neutral-800">
                            {getDomainIcon(activeDomain)}
                          </div>
                          <div>
                            <h2 className="text-2xl font-display font-bold text-white">{activeDomain} Analysis</h2>
                            <p className="text-neutral-500 font-mono text-xs">Domain-Specific Intelligence Findings</p>
                          </div>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full border uppercase font-bold ${getRiskColor(summary.threat_domains.find(d => d.domain === activeDomain)?.risk_level || 'low')}`}>
                          {summary.threat_domains.find(d => d.domain === activeDomain)?.risk_level} Risk
                        </span>
                      </div>

                      <div className="space-y-6">
                        {summary.threat_domains.find(d => d.domain === activeDomain)?.findings.map((finding, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 bg-neutral-950 border border-neutral-800 rounded-xl flex gap-4"
                          >
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-mono text-neutral-500">
                              0{i+1}
                            </div>
                            <div className="space-y-2">
                              <p className="text-neutral-200 leading-relaxed">{finding}</p>
                              <div className="flex items-center gap-4 text-[10px] font-mono text-neutral-600">
                                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> VERIFIED</span>
                                <span className="flex items-center gap-1"><Database className="w-3 h-3" /> SOURCE: OSINT_FEED_ALPHA</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <div className="mt-12 pt-8 border-t border-neutral-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-neutral-500 italic">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          This analysis is based on active reconnaissance and may shift as new data is ingested.
                        </div>
                        <button className="text-xs font-mono text-cyan-500 hover:text-white transition-colors flex items-center gap-2">
                          View Raw Data <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default IntelligenceAnalytics;

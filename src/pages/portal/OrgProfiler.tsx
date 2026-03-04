import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Search, Zap, Target, Users, Globe, 
  Shield, TrendingUp, MessageSquare, Save, 
  RefreshCw, Loader2, CheckCircle2, AlertCircle,
  ChevronRight, Info, Briefcase, Flag
} from 'lucide-react';
import { portalApi } from '../../services/portalApi';
import { OrganisationProfile, OrgProfilingJob } from '../../portalTypes';

const OrgProfiler: React.FC = () => {
  const [orgName, setOrgName] = useState('');
  const [objective, setObjective] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<OrgProfilingJob | null>(null);
  const [profile, setProfile] = useState<OrganisationProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'strategy' | 'alignment'>('overview');

  useEffect(() => {
    let interval: any;
    if (jobId && isProcessing) {
      interval = setInterval(async () => {
        try {
          const updatedJob = await portalApi.pollOrgProfiling(jobId);
          setJob(updatedJob);
          if (updatedJob.status === 'complete') {
            setProfile(updatedJob.data);
            setIsProcessing(false);
            clearInterval(interval);
          } else if (updatedJob.status === 'failed') {
            setIsProcessing(false);
            clearInterval(interval);
          }
        } catch (error) {
          console.error("Polling error:", error);
          setIsProcessing(false);
          clearInterval(interval);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [jobId, isProcessing]);

  const handleStartProfiling = async () => {
    if (!orgName || !objective) return;
    setIsProcessing(true);
    setProfile(null);
    setJob(null);
    try {
      const { jobId } = await portalApi.profileOrganisation(orgName, objective);
      setJobId(jobId);
    } catch (error) {
      console.error("Profiling start error:", error);
      setIsProcessing(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;
    try {
      const updated = await portalApi.updateOrgProfile(profile);
      setProfile(updated);
      alert("Profile updated successfully");
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-purpose-gold" />
            Organisation Profiler
          </h1>
          <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest mt-2">
            Multi-stage strategic evolution & alignment
          </p>
        </div>
        {profile && (
          <button 
            onClick={handleUpdateProfile}
            className="flex items-center gap-2 px-6 py-2 bg-purpose-gold text-neutral-950 rounded-xl font-bold hover:bg-white transition-all shadow-lg shadow-purpose-gold/20"
          >
            <Save className="w-4 h-4" /> Save Evolution
          </button>
        )}
      </div>

      {!profile && !isProcessing && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto cyber-card p-12 space-y-8"
        >
          <div className="text-center space-y-4">
            <div className="inline-block p-4 bg-purpose-gold/10 rounded-full border border-purpose-gold/20">
              <Search className="w-8 h-8 text-purpose-gold" />
            </div>
            <h2 className="text-2xl font-bold text-white">Initiate New Profile</h2>
            <p className="text-neutral-500 text-sm">
              Enter the target organisation and your research objective to begin the multi-stage extraction and synthesis process.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Organisation Name</label>
              <input 
                type="text" 
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Global Dynamics Corp"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-purpose-gold outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Research Objective</label>
              <textarea 
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="What is the goal of this intelligence gathering?"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-purpose-gold outline-none transition-all h-32 resize-none"
              />
            </div>
            <button 
              onClick={handleStartProfiling}
              disabled={!orgName || !objective}
              className="w-full py-4 bg-purpose-gold text-neutral-950 rounded-xl font-bold hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <Zap className="w-5 h-5" /> Begin Intelligence Pipeline
            </button>
          </div>
        </motion.div>
      )}

      {isProcessing && job && (
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="cyber-card p-12 text-center space-y-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-purpose-gold/20 blur-2xl rounded-full animate-pulse" />
              <Loader2 className="w-16 h-16 text-purpose-gold animate-spin relative" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">{job.current_stage}</h2>
              <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">
                Stage {job.status === 'recon' ? 1 : job.status === 'extraction' ? 2 : job.status === 'synthesis' ? 3 : 4} of 4
              </p>
            </div>
            <div className="space-y-4">
              <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                <motion.div 
                  className="h-full bg-purpose-gold"
                  initial={{ width: 0 }}
                  animate={{ width: `${job.progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-neutral-600 uppercase tracking-widest">
                <span>Pipeline Active</span>
                <span>{job.progress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {profile && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-3 space-y-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${activeTab === 'overview' ? 'bg-purpose-gold/10 border-purpose-gold text-purpose-gold' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-bold">Organisation Overview</span>
            </button>
            <button 
              onClick={() => setActiveTab('strategy')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${activeTab === 'strategy' ? 'bg-purpose-gold/10 border-purpose-gold text-purpose-gold' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-bold">Strategic Intelligence</span>
            </button>
            <button 
              onClick={() => setActiveTab('alignment')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${activeTab === 'alignment' ? 'bg-purpose-gold/10 border-purpose-gold text-purpose-gold' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
            >
              <Target className="w-4 h-4" />
              <span className="text-sm font-bold">System Alignment</span>
            </button>

            <div className="mt-8 p-6 bg-neutral-900 border border-neutral-800 rounded-2xl">
              <h4 className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-4">Profile Metadata</h4>
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-neutral-600">Last Updated</span>
                  <span className="text-neutral-400">{new Date(profile.last_updated).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-neutral-600">Confidence</span>
                  <span className="text-emerald-500">94.2%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div 
                  key="overview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="cyber-card p-8 space-y-6">
                      <div className="flex items-center gap-3 text-purpose-gold">
                        <Briefcase className="w-5 h-5" />
                        <h3 className="font-bold uppercase tracking-widest text-xs">Core Identity</h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest block mb-1">Industry</label>
                          <p className="text-white font-medium">{profile.industry}</p>
                        </div>
                        <div>
                          <label className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest block mb-1">Mission</label>
                          <p className="text-neutral-300 text-sm leading-relaxed italic">"{profile.mission}"</p>
                        </div>
                        <div>
                          <label className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest block mb-1">Nature</label>
                          <p className="text-neutral-300 text-sm">{profile.nature}</p>
                        </div>
                      </div>
                    </div>

                    <div className="cyber-card p-8 space-y-6">
                      <div className="flex items-center gap-3 text-purpose-gold">
                        <Flag className="w-5 h-5" />
                        <h3 className="font-bold uppercase tracking-widest text-xs">Strategic Goals</h3>
                      </div>
                      <div className="space-y-3">
                        {profile.goals.map((goal, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-purpose-gold" />
                            <p className="text-xs text-neutral-300">{goal}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="cyber-card p-8 space-y-6">
                    <div className="flex items-center gap-3 text-purpose-gold">
                      <Zap className="w-5 h-5" />
                      <h3 className="font-bold uppercase tracking-widest text-xs">Active Campaigns</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.campaigns.map((campaign, i) => (
                        <div key={i} className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between group hover:border-purpose-gold/50 transition-all">
                          <span className="text-sm text-neutral-300">{campaign}</span>
                          <ChevronRight className="w-4 h-4 text-neutral-700 group-hover:text-purpose-gold transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'strategy' && (
                <motion.div 
                  key="strategy"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="cyber-card p-8 space-y-6">
                      <div className="flex items-center gap-3 text-red-500">
                        <Users className="w-5 h-5" />
                        <h3 className="font-bold uppercase tracking-widest text-xs">Competitor Landscape</h3>
                      </div>
                      <div className="space-y-3">
                        {profile.competitors.map((comp, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                            <span className="text-xs text-neutral-300 font-bold">{comp}</span>
                            <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[8px] font-bold rounded uppercase">Adversarial Potential</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="cyber-card p-8 space-y-6">
                      <div className="flex items-center gap-3 text-blue-500">
                        <Shield className="w-5 h-5" />
                        <h3 className="font-bold uppercase tracking-widest text-xs">Political Intelligence</h3>
                      </div>
                      <div className="space-y-3">
                        {profile.political_info.map((info, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                            <Info className="w-3 h-3 text-blue-500 mt-0.5" />
                            <p className="text-xs text-neutral-400">{info}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="cyber-card p-8 space-y-6 border-emerald-500/20 bg-emerald-500/5">
                    <div className="flex items-center gap-3 text-emerald-500">
                      <TrendingUp className="w-5 h-5" />
                      <h3 className="font-bold uppercase tracking-widest text-xs">Strategically Sound Actions</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {profile.strategic_actions.map((action, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 bg-neutral-950/50 border border-emerald-500/20 rounded-2xl">
                          <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 font-bold text-xs">
                            {i + 1}
                          </div>
                          <p className="text-xs text-neutral-300 leading-relaxed">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'alignment' && (
                <motion.div 
                  key="alignment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="cyber-card p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-purpose-gold">
                        <MessageSquare className="w-5 h-5" />
                        <h3 className="font-bold uppercase tracking-widest text-xs">Dynamic System Prompt</h3>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-[9px] font-mono text-neutral-500">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> PROMPT CACHED
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute top-4 left-4 text-neutral-800 font-mono text-[10px] uppercase">System Context</div>
                      <textarea 
                        value={profile.dynamic_system_prompt}
                        onChange={(e) => setProfile({ ...profile, dynamic_system_prompt: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-12 text-xs font-mono text-neutral-400 leading-relaxed min-h-[400px] focus:border-purpose-gold outline-none transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-neutral-600 italic text-center">
                      This prompt is dynamically generated to orient all AI agents towards the organization's strategic goals.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgProfiler;

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Database, AlertCircle, CheckCircle2, Loader2, 
  RefreshCw, Play, Zap, RotateCcw, HardDrive, 
  ArrowUpRight, Plus, ChevronRight, ChevronLeft,
  Settings, Info, Network, Search, Globe, Filter,
  ShieldAlert, BarChart3, Clock, MoreHorizontal,
  Bot, Paperclip
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { portalApi } from '../../services/portalApi';
import { IngestionJob, DashboardData, Project, SearchHistoryEntry } from '../../portalTypes';
import * as d3 from 'd3';
import { PortalLogo } from '../../components/portal/Logo';
import { CriticalAlertSystem } from '../../components/portal/dashboard/CriticalAlertSystem';
import { RiskPulse } from '../../components/portal/dashboard/RiskPulse';
import { ActivityInsights } from '../../components/portal/dashboard/ActivityInsights';
import { ClippedIntelligence } from '../../components/portal/dashboard/ClippedIntelligence';

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [threatThreshold, setThreatThreshold] = useState(0.5);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [metricIndex, setMetricIndex] = useState(0);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [correlationGraph, setCorrelationGraph] = useState<any>(null);
  const [analyticsLinks, setAnalyticsLinks] = useState<any[]>([]);
  const graphRef = useRef<SVGSVGElement>(null);

  const [stats, setStats] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [projRes, histRes, jobsRes, statsRes] = await Promise.all([
        portalApi.getProjects(),
        portalApi.getSearchHistory(),
        portalApi.getLensJobs(),
        portalApi.getKnowledgeBaseStats()
      ]);
      setProjects(projRes);
      setHistory(histRes);
      setJobs(jobsRes.data);
      setStats(statsRes);
      if (projRes.length > 0 && !selectedProject) {
        const firstProj = projRes[0];
        setSelectedProject(firstProj);
        setThreatThreshold(firstProj.settings?.threat_velocity_threshold ?? 0.5);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      portalApi.getAnalyticsLinks(selectedProject.id).then(setAnalyticsLinks);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedJobs.length > 1) {
      portalApi.correlateJobs(selectedJobs).then(setCorrelationGraph);
    } else {
      setCorrelationGraph(null);
    }
  }, [selectedJobs]);

  useEffect(() => {
    if (correlationGraph && graphRef.current) {
      renderGraph();
    }
  }, [correlationGraph]);

  const renderGraph = () => {
    const svg = d3.select(graphRef.current);
    svg.selectAll("*").remove();
    const width = 600;
    const height = 400;

    // Enhanced realistic example with clusters
    const nodes = [
      { id: 'target-center', label: 'GLOBAL_RESOURCES_CORP', type: 'target', group: 0 },
      // Cluster 1: Infrastructure
      { id: 'dns-1', label: 'NS1.GRC-TECH.COM', type: 'info', group: 1 },
      { id: 'dns-2', label: 'NS2.GRC-TECH.COM', type: 'info', group: 1 },
      { id: 'sub-1', label: 'API.GRC-TECH.COM', type: 'info', group: 1 },
      { id: 'sub-2', label: 'PORTAL.GRC-TECH.COM', type: 'info', group: 1 },
      // Cluster 2: Corporate
      { id: 'brand-1', label: 'GRC_RENEWABLES', type: 'info', group: 2 },
      { id: 'brand-2', label: 'GRC_LOGISTICS', type: 'info', group: 2 },
      { id: 'exec-1', label: 'CEO_IDENTIFIED', type: 'info', group: 2 },
      // Cluster 3: Threats/Risks
      { id: 'threat-1', label: 'DATA_EXFIL_VECTOR', type: 'threat', group: 3 },
      { id: 'threat-2', label: 'SUPPLY_CHAIN_WEAKNESS', type: 'threat', group: 3 },
      { id: 'threat-3', label: 'COMPETITOR_INFILTRATION', type: 'threat', group: 3 },
    ];

    const links = [
      { source: 'target-center', target: 'dns-1', label: 'INFRA' },
      { source: 'target-center', target: 'dns-2', label: 'INFRA' },
      { source: 'dns-1', target: 'dns-2', label: 'SYNC' },
      { source: 'target-center', target: 'sub-1', label: 'ASSET' },
      { source: 'target-center', target: 'sub-2', label: 'ASSET' },
      { source: 'sub-1', target: 'sub-2', label: 'LINK' },
      { source: 'target-center', target: 'brand-1', label: 'SUBSIDIARY' },
      { source: 'target-center', target: 'brand-2', label: 'SUBSIDIARY' },
      { source: 'target-center', target: 'exec-1', label: 'LEADERSHIP' },
      { source: 'target-center', target: 'threat-1', label: 'RISK' },
      { source: 'target-center', target: 'threat-2', label: 'RISK' },
      { source: 'target-center', target: 'threat-3', label: 'RISK' },
      { source: 'threat-1', target: 'sub-1', label: 'EXPLOIT_PATH' },
    ];

    // Add selected jobs
    selectedJobs.forEach((id, i) => {
      const jobId = `job-${id}`;
      nodes.push({ id: jobId, label: `RECON_RUN_${id.slice(-4)}`, type: 'job', group: 4 });
      links.push({ source: 'target-center', target: jobId, label: 'DATA_SOURCE' });
    });

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", (d: any) => d.label === 'RISK' || d.label === 'EXPLOIT_PATH' ? '#ef4444' : '#404040')
      .attr("stroke-width", (d: any) => d.label === 'RISK' ? 2 : 1)
      .attr("stroke-dasharray", (d: any) => d.label === 'RISK' ? '4,4' : '0')
      .attr("opacity", 0.6);

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .call(d3.drag<any, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    node.append("circle")
      .attr("r", (d: any) => d.type === 'target' ? 14 : d.type === 'job' ? 10 : 7)
      .attr("fill", (d: any) => {
        if (d.type === 'target') return '#F59E0B';
        if (d.type === 'threat') return '#ef4444';
        if (d.type === 'job') return '#0EA5E9';
        return '#262626';
      })
      .attr("stroke", (d: any) => d.type === 'target' ? '#fff' : '#404040')
      .attr("stroke-width", 2)
      .attr("class", "cursor-pointer transition-all hover:stroke-white");

    node.append("text")
      .text((d: any) => d.label)
      .attr("font-size", "8px")
      .attr("font-family", "JetBrains Mono")
      .attr("fill", "#737373")
      .attr("dx", 12)
      .attr("dy", 4);

    simulation.on("tick", () => {
      link.attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });
  };

  const handleNewProject = async () => {
    const name = prompt("Project Name:");
    if (name) {
      const newProj = await portalApi.createProject({ name, description: "New intelligence project" });
      setProjects([...projects, newProj]);
      setSelectedProject(newProj);
    }
  };

  const toggleJobSelection = (id: string) => {
    setSelectedJobs(prev => 
      prev.includes(id) ? prev.filter(jid => jid !== id) : [...prev, id]
    );
  };

  const handleSaveSettings = async () => {
    if (!selectedProject) return;
    setIsSavingSettings(true);
    try {
      const updatedProject = await portalApi.updateProjectSettings(selectedProject.id, {
        ...selectedProject.settings,
        threat_velocity_threshold: threatThreshold
      });
      // Update local state
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, settings: { ...p.settings, threat_velocity_threshold: threatThreshold } } : p));
      setSelectedProject(prev => prev ? { ...prev, settings: { ...prev.settings, threat_velocity_threshold: threatThreshold } } : null);
      setShowSettings(false);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-8">
      <header className="flex items-center justify-between mb-8">
        <PortalLogo />
        <div className="flex items-center gap-4">
          <button 
            aria-label="Toggle project settings"
            onClick={() => setShowSettings(!showSettings)} 
            className="text-neutral-400 hover:text-white"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <CriticalAlertSystem />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <RiskPulse />
          <ClippedIntelligence />
        </div>
        <div className="space-y-8">
          <ActivityInsights />
        </div>
      </div>

      {/* Settings Submenu (Modal) */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-3">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  Project Settings
                </h2>
                <button onClick={() => setShowSettings(false)} className="text-neutral-500 hover:text-white transition-colors">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Threat Velocity Threshold</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-neutral-400">
                      <span>Sensitivity</span>
                      <span className="text-cyan-400 font-mono">{threatThreshold.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.01"
                      value={threatThreshold}
                      onChange={(e) => setThreatThreshold(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400" 
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-neutral-800">
                  <button 
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings}
                    className="w-full py-3 bg-cyan-400 hover:bg-white text-neutral-950 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;

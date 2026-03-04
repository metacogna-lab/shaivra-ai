import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, MotionValue } from 'framer-motion';
import { 
  Rss, MessageCircle, Building2, User, FileText, 
  ShieldCheck, Activity, Database, Network, 
  FileJson, CheckCircle2, Play, RefreshCw, X,
  Maximize2, Globe
} from 'lucide-react';
import { portalApi } from '../services/portalApi';
import { 
  SCENARIOS, DemoScenario, DemoEntity, DemoEvent,
  DEMO_TRACE_ID, SCHEMA_VERSION, GOVERNANCE_REVIEW_JSON
} from '../data/demoSimulationData';

type SimulationState = 
  | 'S0_IDLE' 
  | 'S1_TARGET_SELECTED' 
  | 'S2_INGESTION_ACCEPTED' 
  | 'S3_NORMALIZED' 
  | 'S4_ENRICHED' 
  | 'S5_CLUSTER_FORMING' 
  | 'S6_GRAPH_HYDRATED' 
  | 'S7_ANALYSIS_GENERATED' 
  | 'S8_GOVERNANCE_APPROVED';

interface HomepageGraphSimulationProps {
  onClose: () => void;
  seed?: { target: string; sectors: string[]; focus?: string };
  runId?: string | null;
  entityTypes?: string[];
}

// Helper to calculate initial positions including events
const getInitialPositions = (scenario: DemoScenario) => {
  const positions: Record<string, { x: number, y: number }> = {};
  
  // Entities
  scenario.nodes.forEach(node => {
    positions[node.id] = { x: node.x, y: node.y };
  });

  // Events (Cluster A left, Cluster B right)
  scenario.events.forEach((evt, i) => {
    const isClusterA = evt.clusterId === 'A';
    const angle = (i / scenario.events.length) * Math.PI * 2;
    // Spread them out a bit
    const radius = 220 + Math.random() * 40;
    const baseX = isClusterA ? -250 : 250;
    const baseY = (Math.random() - 0.5) * 300;
    
    positions[evt.id] = { 
      x: baseX + (Math.random() * 100 - 50), 
      y: baseY 
    };
  });

  return positions;
};

const HomepageGraphSimulation: React.FC<HomepageGraphSimulationProps> = ({ onClose, seed, runId, entityTypes }) => {
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario>(SCENARIOS[0]);
  const [agentInvestigation, setAgentInvestigation] = useState<any>(null);

  const typeMapping: Record<string, string> = {
    'PERSON': 'Person',
    'ORG': 'Organization',
    'LOC': 'Location',
    'CYBER_THREAT': 'Infrastructure',
    'CRYPTO_WALLET': 'Financial'
  };

  const activeSimulationTypes = useMemo(() => {
    if (!entityTypes || entityTypes.length === 0) return ['Person', 'Organization', 'Document', 'Location', 'Infrastructure', 'Financial'];
    return entityTypes.map(t => typeMapping[t]).filter(Boolean);
  }, [entityTypes]);
  
  // Override scenario name if seed is provided
  useEffect(() => {
    if (seed?.target) {
      const primarySector = seed.sectors[0] || 'Global';
      const baseScenario = SCENARIOS.find(s => s.name.toLowerCase().includes(primarySector.toLowerCase())) || SCENARIOS[0];
      const customScenario = {
        ...baseScenario,
        nodes: baseScenario.nodes.map((n, i) => i === 0 ? { ...n, name: seed.target } : n),
        report: {
          ...baseScenario.report,
          title: `Strategic Assessment: ${seed.target}`,
          executive_summary: `Live intelligence synthesis for ${seed.target} across ${seed.sectors.length > 0 ? seed.sectors.join(', ') : 'Global'} sectors. Initial reconnaissance indicates high-velocity narrative shifts and emerging relational clusters.`
        }
      };
      setSelectedScenario(customScenario);
    }
  }, [seed]);

  // Poll for Agent Investigation
  useEffect(() => {
    if (!runId) return;

    const poll = async () => {
      try {
        const data = await portalApi.pollAgentInvestigation(runId);
        setAgentInvestigation(data);
        if (data.status === 'completed' || data.status === 'failed') {
          return;
        }
        setTimeout(poll, 3000);
      } catch (error) {
        console.error("Polling Error", error);
      }
    };
    poll();
  }, [runId]);

  const [state, setState] = useState<SimulationState>('S0_IDLE');
  const [showEvidence, setShowEvidence] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  
  // Motion Values for interactivity
  const initialPositions = useMemo(() => getInitialPositions(selectedScenario), [selectedScenario]);
  const nodeMotionValues = useRef<Record<string, { x: MotionValue<number>, y: MotionValue<number> }>>({}).current;

  // Initialize or reset motion values when scenario changes
  useEffect(() => {
    // Clear old values
    Object.keys(nodeMotionValues).forEach(key => delete nodeMotionValues[key]);
    
    [...selectedScenario.nodes, ...selectedScenario.events].forEach(item => {
      const id = (item as any).id; 
      const pos = initialPositions[id] || { x: 0, y: 0 };
      nodeMotionValues[id] = {
        x: new MotionValue(400 + pos.x),
        y: new MotionValue(300 + pos.y)
      };
    });
    
    // Reset simulation state when scenario changes
    setState('S0_IDLE');
  }, [selectedScenario, initialPositions]);

  // State Machine Driver
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const runSimulation = () => {
      // S0 -> S1 (3s)
      if (state === 'S0_IDLE') {
        timeout = setTimeout(() => setState('S1_TARGET_SELECTED'), 3000);
      }
      // S1 -> S2 (2s)
      else if (state === 'S1_TARGET_SELECTED') {
        timeout = setTimeout(() => setState('S2_INGESTION_ACCEPTED'), 2000);
      }
      // S2 -> S3 (4s)
      else if (state === 'S2_INGESTION_ACCEPTED') {
        timeout = setTimeout(() => setState('S3_NORMALIZED'), 4000);
      }
      // S3 -> S4 (4s)
      else if (state === 'S3_NORMALIZED') {
        timeout = setTimeout(() => setState('S4_ENRICHED'), 4000);
      }
      // S4 -> S5 (5s)
      else if (state === 'S4_ENRICHED') {
        timeout = setTimeout(() => setState('S5_CLUSTER_FORMING'), 5000);
      }
      // S5 -> S6 (6s)
      else if (state === 'S5_CLUSTER_FORMING') {
        timeout = setTimeout(() => setState('S6_GRAPH_HYDRATED'), 6000);
      }
      // S6 -> S7 (6s)
      else if (state === 'S6_GRAPH_HYDRATED') {
        timeout = setTimeout(() => setState('S7_ANALYSIS_GENERATED'), 6000);
      }
      // S7 -> S8 (5s)
      else if (state === 'S7_ANALYSIS_GENERATED') {
        timeout = setTimeout(() => setState('S8_GOVERNANCE_APPROVED'), 5000);
      }
    };

    runSimulation();
    return () => clearTimeout(timeout);
  }, [state]);

  const handleReplay = () => {
    setState('S0_IDLE');
    handleRecenter();
  };

  const handleRecenter = () => {
    const values = nodeMotionValues as Record<string, { x: MotionValue<number>, y: MotionValue<number> }>;
    const positions = initialPositions as Record<string, { x: number, y: number }>;
    
    Object.keys(values).forEach((id) => {
      const mvs = values[id];
      const pos = positions[id] || { x: 0, y: 0 };
      mvs.x.set(400 + pos.x);
      mvs.y.set(300 + pos.y);
    });
  };

  // --- Render Helpers ---

  const renderStateBadge = () => {
    const labels: Record<SimulationState, string> = {
      'S0_IDLE': 'SYSTEM IDLE',
      'S1_TARGET_SELECTED': 'TARGET ACQUISITION',
      'S2_INGESTION_ACCEPTED': 'INGESTING RAW EVENTS',
      'S3_NORMALIZED': 'NORMALIZING DATA',
      'S4_ENRICHED': 'ENTITY EXTRACTION',
      'S5_CLUSTER_FORMING': 'NARRATIVE CLUSTERING',
      'S6_GRAPH_HYDRATED': 'GRAPH HYDRATION',
      'S7_ANALYSIS_GENERATED': 'GENERATING INTEL',
      'S8_GOVERNANCE_APPROVED': 'GOVERNANCE REVIEW'
    };

    return (
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50">
        <motion.div 
          key={state}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 flex items-center gap-2"
        >
          <div className={`w-2 h-2 rounded-full ${state === 'S8_GOVERNANCE_APPROVED' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
          <span className="text-xs font-mono text-neutral-400 tracking-widest uppercase">
            {labels[state]}
          </span>
        </motion.div>
        
        {agentInvestigation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-4 px-3 py-1 bg-neutral-900/50 border border-neutral-800 rounded-full"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] font-mono text-neutral-500 uppercase">Agent Certainty:</span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold">{agentInvestigation.certainty}%</span>
            </div>
            <div className="w-[1px] h-3 bg-neutral-800" />
            <div className="text-[10px] font-mono text-emerald-500 uppercase">
              {agentInvestigation.status}
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-neutral-950 flex flex-col overflow-hidden">
      {/* Header / Controls */}
      <div className="absolute top-0 left-0 right-0 h-20 px-8 flex items-center justify-between z-50 pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">Trace ID</span>
            <span className="text-sm font-mono text-cyan-500">{runId || DEMO_TRACE_ID}</span>
          </div>
          <div className="h-8 w-[1px] bg-neutral-800" />
          <div className="flex flex-col">
            <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">Schema</span>
            <span className="text-sm font-mono text-neutral-300">{SCHEMA_VERSION}</span>
          </div>
        </div>

        {renderStateBadge()}

        <div className="flex items-center gap-4 pointer-events-auto">
           <button 
            onClick={handleRecenter}
            className="p-2 rounded-full border border-neutral-800 text-neutral-500 hover:text-white hover:bg-neutral-900 transition-colors"
            title="Recenter Graph"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
           <button 
            onClick={() => setShowEvidence(!showEvidence)}
            className={`px-3 py-1.5 rounded border text-xs font-mono uppercase tracking-wider transition-colors ${showEvidence ? 'bg-neutral-800 border-neutral-700 text-white' : 'border-neutral-800 text-neutral-500 hover:text-white'}`}
          >
            Evidence ({selectedScenario.events.length})
          </button>
          <button 
            onClick={handleReplay}
            className="p-2 rounded-full border border-neutral-800 text-neutral-500 hover:text-white hover:bg-neutral-900 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={onClose}
            className="p-2 rounded-full border border-neutral-800 text-neutral-500 hover:text-red-400 hover:bg-neutral-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Visualization Area */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'radial-gradient(circle at center, #1a1a1a 1px, transparent 1px)', 
          backgroundSize: '40px 40px', 
          opacity: 0.2 
        }} />

        {/* Agent Logs Overlay (Left) */}
        {agentInvestigation && agentInvestigation.logs.length > 0 && (
          <div className="absolute left-8 top-32 w-64 space-y-2 z-40">
            <h4 className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest mb-4">Agent Network Logs</h4>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {agentInvestigation.logs.map((log: string, i: number) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-2 bg-neutral-900/50 border border-neutral-800 rounded text-[9px] font-mono text-neutral-400 leading-tight"
                >
                  <span className="text-cyan-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                  {log}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* S0: Idle State */}
        {state === 'S0_IDLE' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="text-center space-y-4"
          >
            <h2 className="text-4xl font-display font-light text-neutral-700">Nonprofit Narrative Risk</h2>
            <p className="text-neutral-600 font-mono text-sm">Waiting for target acquisition...</p>
          </motion.div>
        )}

        {/* S1: Target Selected */}
        {state !== 'S0_IDLE' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-32 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-neutral-900/80 backdrop-blur border border-cyan-900/30 rounded-full z-40"
          >
            <Building2 className="w-4 h-4 text-cyan-500" />
            <span className="text-sm font-medium text-cyan-100">Target: {selectedScenario.nodes[0].name}</span>
          </motion.div>
        )}

        {/* S2: Ingestion Stream */}
        <AnimatePresence>
          {(state === 'S2_INGESTION_ACCEPTED' || state === 'S3_NORMALIZED') && (
            <div className="absolute inset-0 pointer-events-none">
              {selectedScenario.events.map((evt, i) => (
                <motion.div
                  key={evt.id}
                  initial={{ x: '100vw', y: Math.random() * 400 - 200, opacity: 0 }}
                  animate={{ 
                    x: state === 'S3_NORMALIZED' ? 0 : '10vw', 
                    y: state === 'S3_NORMALIZED' ? (evt.clusterId === 'A' ? -100 : 100) + (Math.random() * 50) : Math.random() * 200 - 100,
                    opacity: 1 
                  }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 1.5, delay: i * 0.1, ease: "easeOut" }}
                  className="absolute left-1/2 top-1/2 flex items-center gap-2"
                >
                  <div className={`p-2 rounded-full ${evt.source === 'RSS' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {evt.source === 'RSS' ? <Rss className="w-3 h-3" /> : <MessageCircle className="w-3 h-3" />}
                  </div>
                  {state === 'S3_NORMALIZED' && (
                    <motion.div 
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      className="px-2 py-1 bg-neutral-800 rounded text-[10px] font-mono text-neutral-400 whitespace-nowrap"
                    >
                      NORM_OK
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* S5: Clusters */}
        {['S5_CLUSTER_FORMING', 'S6_GRAPH_HYDRATED', 'S7_ANALYSIS_GENERATED', 'S8_GOVERNANCE_APPROVED'].includes(state) && (
          <>
            {/* Cluster A (Risk) */}
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-32 -ml-40 w-64 h-64 rounded-full border border-red-500/20 bg-red-500/5 flex items-center justify-center pointer-events-none"
            >
              <div className="absolute -top-8 text-center w-full">
                <span className="text-xs font-mono text-red-400 uppercase tracking-wider block">Risk Cluster</span>
                <span className="text-sm font-medium text-red-200">Adverse Narratives</span>
              </div>
            </motion.div>

            {/* Cluster B (Positive) */}
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-32 ml-40 w-64 h-64 rounded-full border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center pointer-events-none"
            >
              <div className="absolute -bottom-8 text-center w-full">
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider block">Impact Cluster</span>
                <span className="text-sm font-medium text-emerald-200">Operational Success</span>
              </div>
            </motion.div>
          </>
        )}

        {/* S6: Graph Nodes & Edges */}
        {['S6_GRAPH_HYDRATED', 'S7_ANALYSIS_GENERATED', 'S8_GOVERNANCE_APPROVED'].includes(state) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-[800px] h-[600px]">
              {/* Edges */}
              <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                {selectedScenario.edges.map((edge, i) => {
                  const sourceMv = nodeMotionValues[edge.source];
                  const targetMv = nodeMotionValues[edge.target];
                  
                  if (!sourceMv || !targetMv) return null;

                  const edgeId = `${edge.source}-${edge.target}`;
                  const isHovered = hoveredEdge === edgeId;

                  return (
                    <g key={edgeId}>
                      <motion.line
                        x1={sourceMv.x}
                        y1={sourceMv.y}
                        x2={targetMv.x}
                        y2={targetMv.y}
                        stroke={isHovered ? '#22d3ee' : activeSimulationTypes.includes(selectedScenario.nodes.find(n => n.id === edge.source)?.type || '') && activeSimulationTypes.includes(selectedScenario.nodes.find(n => n.id === edge.target)?.type || '') ? '#d4af37' : '#525252'}
                        strokeWidth={isHovered ? 3 : Math.max(1, edge.evidenceCount / 2)}
                        strokeOpacity={isHovered ? 0.8 : activeSimulationTypes.includes(selectedScenario.nodes.find(n => n.id === edge.source)?.type || '') && activeSimulationTypes.includes(selectedScenario.nodes.find(n => n.id === edge.target)?.type || '') ? 0.6 : 0.2}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: isHovered ? 0.8 : activeSimulationTypes.includes(selectedScenario.nodes.find(n => n.id === edge.source)?.type || '') && activeSimulationTypes.includes(selectedScenario.nodes.find(n => n.id === edge.target)?.type || '') ? 0.6 : 0.2 }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                      />
                      {isHovered && (
                        <foreignObject
                          x={400 + (initialPositions[edge.source].x + initialPositions[edge.target].x) / 2 - 50}
                          y={300 + (initialPositions[edge.source].y + initialPositions[edge.target].y) / 2 - 20}
                          width="100"
                          height="40"
                        >
                          <div className="bg-neutral-900 border border-cyan-500/50 rounded px-2 py-1 text-[8px] font-mono text-cyan-400 text-center shadow-lg">
                            NLP: {edge.type}<br/>
                            CONF: 0.94
                          </div>
                        </foreignObject>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Entity Nodes */}
              {selectedScenario.nodes.map((node, i) => (
                <motion.div
                  key={node.id}
                  drag
                  dragMomentum={false}
                  onDragStart={() => {
                    // Highlight edges connected to this node
                    const connectedEdges = selectedScenario.edges.filter(e => e.source === node.id || e.target === node.id);
                    if (connectedEdges.length > 0) setHoveredEdge(`${connectedEdges[0].source}-${connectedEdges[0].target}`);
                  }}
                  onDragEnd={() => setHoveredEdge(null)}
                  style={{ 
                    x: nodeMotionValues[node.id].x, 
                    y: nodeMotionValues[node.id].y,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    translateX: '-50%',
                    translateY: '-50%'
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className={`absolute flex flex-col items-center gap-2 cursor-grab active:cursor-grabbing group transition-opacity duration-500 ${
                    activeSimulationTypes.includes(node.type) ? 'opacity-100' : 'opacity-20'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full border flex items-center justify-center bg-neutral-900 z-10 transition-all duration-300 group-hover:scale-110
                    ${node.id === selectedScenario.nodes[0].id ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 
                      activeSimulationTypes.includes(node.type) ? 'border-purpose-gold shadow-[0_0_10px_rgba(212,175,55,0.2)]' : 'border-neutral-700'}
                  `}>
                    {node.type === 'Organization' && <Building2 className={`w-5 h-5 ${activeSimulationTypes.includes(node.type) ? 'text-purpose-gold' : 'text-neutral-400'}`} />}
                    {node.type === 'Person' && <User className={`w-5 h-5 ${activeSimulationTypes.includes(node.type) ? 'text-purpose-gold' : 'text-neutral-400'}`} />}
                    {node.type === 'Document' && <FileText className="w-5 h-5 text-neutral-400" />}
                    {node.type === 'Location' && <Globe className={`w-5 h-5 ${activeSimulationTypes.includes(node.type) ? 'text-purpose-gold' : 'text-neutral-400'}`} />}
                    {node.type === 'Infrastructure' && <ShieldCheck className={`w-5 h-5 ${activeSimulationTypes.includes(node.type) ? 'text-purpose-gold' : 'text-neutral-400'}`} />}
                    {node.type === 'Financial' && <Database className={`w-5 h-5 ${activeSimulationTypes.includes(node.type) ? 'text-purpose-gold' : 'text-neutral-400'}`} />}
                  </div>
                  <span className={`text-[10px] font-medium bg-neutral-900/80 px-2 py-0.5 rounded whitespace-nowrap pointer-events-none group-hover:text-white ${
                    activeSimulationTypes.includes(node.type) ? 'text-neutral-200' : 'text-neutral-600'
                  }`}>
                    {node.name}
                  </span>
                </motion.div>
              ))}

              {/* Event Nodes (Smaller) */}
              {selectedScenario.events.map((evt, i) => (
                 <motion.div
                  key={evt.id}
                  drag
                  dragMomentum={false}
                  style={{ 
                    x: nodeMotionValues[evt.id].x, 
                    y: nodeMotionValues[evt.id].y,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    translateX: '-50%',
                    translateY: '-50%'
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.05 }}
                  className="absolute flex items-center justify-center cursor-grab active:cursor-grabbing"
                >
                  <div className={`w-3 h-3 rounded-full ${evt.clusterId === 'A' ? 'bg-red-500/50' : 'bg-emerald-500/50'}`} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* S7: Report Drawer */}
        <AnimatePresence>
          {['S7_ANALYSIS_GENERATED', 'S8_GOVERNANCE_APPROVED'].includes(state) && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-20 bottom-0 w-[400px] bg-neutral-900 border-l border-neutral-800 p-6 shadow-2xl overflow-y-auto z-50"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-medium text-white">Intelligence Report</h3>
                <span className="text-xs font-mono text-cyan-500">{selectedScenario.report.report_id}</span>
              </div>

              <div className="space-y-6">
                {/* Executive Summary */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-wider">Executive Summary</h4>
                  <p className="text-sm text-neutral-300 leading-relaxed border-l-2 border-amber-500 pl-3">
                    {selectedScenario.report.executive_summary}
                  </p>
                </div>

                {/* Recommended Actions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-wider">Recommended Actions</h4>
                  <ul className="space-y-2">
                    {selectedScenario.report.recommended_actions.map((action: string, i: number) => (
                      <li key={i} className="flex gap-3 text-xs text-neutral-300">
                        <span className="text-cyan-500 font-mono">0{i+1}</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* S8: Governance Stamp */}
                {state === 'S8_GOVERNANCE_APPROVED' && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-8 p-4 border border-emerald-500/30 bg-emerald-500/10 rounded-lg flex items-center gap-4"
                  >
                    <div className="p-2 bg-emerald-500/20 rounded-full text-emerald-400">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-emerald-400 uppercase tracking-wider">Governance Approved</span>
                      <span className="block text-[10px] font-mono text-emerald-500/70 mt-1">
                        Hash: {GOVERNANCE_REVIEW_JSON.immutable_hash.substr(0, 12)}...
                      </span>
                    </div>
                  </motion.div>
                )}
                
                {/* JSON Toggle */}
                <div className="pt-8 border-t border-neutral-800">
                  <button 
                    onClick={() => setShowJson(!showJson)}
                    className="flex items-center gap-2 text-xs text-neutral-500 hover:text-white transition-colors"
                  >
                    <FileJson className="w-3 h-3" />
                    {showJson ? 'Hide Raw JSON' : 'View Raw JSON'}
                  </button>
                  
                  {showJson && (
                    <pre className="mt-4 p-3 bg-black rounded text-[10px] font-mono text-neutral-400 overflow-x-auto">
                      {JSON.stringify(selectedScenario.report, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Evidence Drawer (Left) */}
        <AnimatePresence>
          {showEvidence && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="absolute left-0 top-20 bottom-0 w-80 bg-neutral-900/95 backdrop-blur border-r border-neutral-800 p-6 z-40 overflow-y-auto"
            >
              <h3 className="text-sm font-mono text-neutral-500 uppercase tracking-wider mb-4">Raw Evidence</h3>
              <div className="space-y-3">
                {selectedScenario.events.map(evt => (
                  <div key={evt.id} className="p-3 bg-neutral-800/50 rounded border border-neutral-800 hover:border-neutral-700 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      {evt.source === 'RSS' ? <Rss className="w-3 h-3 text-orange-400" /> : <MessageCircle className="w-3 h-3 text-blue-400" />}
                      <span className="text-[10px] font-mono text-neutral-500">{evt.timestamp.split('T')[0]}</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-snug">{evt.title}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scenario Selector (Bottom) */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-neutral-900/90 backdrop-blur border border-neutral-800 rounded-full z-50">
           <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Scenario:</span>
           <select 
            value={selectedScenario.id}
            onChange={(e) => {
              const scenario = SCENARIOS.find(s => s.id === e.target.value);
              if (scenario) setSelectedScenario(scenario);
            }}
            className="bg-transparent text-xs font-mono text-cyan-400 focus:outline-none cursor-pointer"
           >
             {SCENARIOS.map(s => (
               <option key={s.id} value={s.id} className="bg-neutral-900 text-white">{s.name}</option>
             ))}
           </select>
           <div className="h-4 w-[1px] bg-neutral-800" />
           <p className="text-[10px] text-neutral-500 italic max-w-[200px] truncate">{selectedScenario.description}</p>
        </div>

      </div>
    </div>
  );
};

export default HomepageGraphSimulation;

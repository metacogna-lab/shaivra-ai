import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";
import { MOCK_GRAPH_DATA, generateMockNeighbors, IN_MEMORY_ENTITIES, PRESET_CAMPAIGNS, GRAPH_VERSION } from '../constants';
import { GraphNode, GraphEdge, EntityType, GraphData, DossierStep, Campaign, DataSource, GraphQuery } from '../types';
import { Search, ZoomIn, ZoomOut, Maximize, RefreshCw, Loader2, FileText, X, Plus, ShieldAlert, Target, Activity, CheckCircle2, ChevronDown, ChevronUp, Play, RotateCcw, Network, ArrowRight, Globe, Shield, Folder } from 'lucide-react';
import { PersonIcon, OrgIcon, EventIcon, PolicyIcon, FilterIcon, ClockIcon, BackIcon, SignalIcon, LensIcon, ZapIcon } from './ui/Icons';
import { generatePlaybook } from '../services/playbookService';
import { PlaybookModal } from './portal/PlaybookModal';
import { GraphSetupWizard } from './GraphSetupWizard';
import { Playbook } from '../types';

interface KnowledgeGraphExplorerProps {
  onBack: () => void;
}

// Physics & Viewport Constants
const DRAG_THRESHOLD = 3;
const ZOOM_SENSITIVITY = 0.001;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;

// --- Components ---

const GraphEducationPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(true);
    
    return (
        <div className={`absolute top-24 right-4 z-10 transition-all duration-300 ${isOpen ? 'w-80' : 'w-auto'}`}>
            <div className="bg-neutral-900/95 backdrop-blur border border-spacegray rounded-lg shadow-2xl overflow-hidden">
                <div 
                    className="flex items-center justify-between p-4 bg-neutral-850 border-b border-spacegray cursor-pointer hover:bg-neutral-800 transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-purpose-gold" />
                        {isOpen && <span className="text-sm font-display font-medium text-white tracking-wide">Graph Mechanics</span>}
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </div>
                
                <AnimatePresence>
                    {isOpen && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="p-5 space-y-6"
                        >
                            <div>
                                <h4 className="flex items-center gap-2 text-xs font-mono text-purpose-gold uppercase mb-2">
                                    <div className="w-2 h-2 rounded-full bg-purpose-gold"></div>
                                    01. Entity Types
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 font-mono">
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Person</div>
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm bg-amber-500"></div>Organization</div>
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm bg-indigo-500"></div>Infrastructure</div>
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-pink-500"></div>Campaign</div>
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Financial</div>
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-violet-500"></div>Narrative</div>
                                </div>
                            </div>
                            <div>
                                <h4 className="flex items-center gap-2 text-xs font-mono text-purpose-gold uppercase mb-2">
                                    <div className="w-2 h-2 rounded-full bg-purpose-gold"></div>
                                    02. Risk Indicators
                                </h4>
                                <p className="text-sm text-gray-300 leading-relaxed pl-4 border-l border-white/10">
                                    Nodes with <span className="text-red-500 font-medium">Red Halos</span> indicate Risk Score &gt; 75.
                                    <br/>
                                    <span className="text-emerald-500 font-medium">Green Edges</span> denote financial flows.
                                    <br/>
                                    <span className="text-red-500 font-medium">Red Edges</span> denote attacks or threats.
                                </p>
                            </div>
                            <div>
                                <h4 className="flex items-center gap-2 text-xs font-mono text-purpose-gold uppercase mb-2">
                                    <div className="w-2 h-2 rounded-full bg-purpose-gold"></div>
                                    03. Clusters
                                </h4>
                                <p className="text-sm text-gray-300 leading-relaxed pl-4 border-l border-white/10">
                                    Entities are algorithmically grouped into <span className="text-white font-medium">Strategic Clusters</span> based on shared attributes and interaction density.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const DataSidebar: React.FC<{ 
    nodes: GraphNode[], 
    edges: import('../types').GraphEdge[],
    onAdd: (node: GraphNode) => void,
    existingIds: string[],
    onFocusNode: (node: GraphNode) => void
}> = ({ nodes, edges, onAdd, existingIds, onFocusNode }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'targets' | 'links' | 'signals'>('targets');
    const availableEntities = IN_MEMORY_ENTITIES.filter(e => !existingIds.includes(e.id));

    // Group nodes by category for better organization
    const groupedNodes: Record<string, GraphNode[]> = useMemo(() => {
        const groups: Record<string, GraphNode[]> = {
            'Primary Targets': [],
            'Infrastructure': [],
            'Narrative': [],
            'Financial': [],
            'Other': []
        };

        nodes.forEach(node => {
            if (['person', 'organization'].includes(node.type)) groups['Primary Targets'].push(node);
            else if (['domain', 'ip_address', 'infrastructure_asset'].includes(node.type)) groups['Infrastructure'].push(node);
            else if (['campaign_signal', 'narrative_claim', 'social_handle'].includes(node.type)) groups['Narrative'].push(node);
            else if (['financial_artifact'].includes(node.type)) groups['Financial'].push(node);
            else groups['Other'].push(node);
        });

        return groups;
    }, [nodes]);

    return (
        <div className={`absolute top-24 left-4 bottom-8 z-20 transition-all duration-300 flex flex-col ${isOpen ? 'w-80' : 'w-12'}`}>
            <div className="flex-1 bg-neutral-950/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                
                {/* Header / Toggle */}
                <div 
                    className="flex items-center justify-between p-5 bg-white/5 border-b border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-purpose-gold/20 flex items-center justify-center border border-purpose-gold/30">
                            <Target className="w-3.5 h-3.5 text-purpose-gold" />
                        </div>
                        {isOpen && <span className="text-sm font-display font-bold text-white tracking-tight uppercase">Intelligence Pane</span>}
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-neutral-500 rotate-[-90deg]" /> : <ChevronDown className="w-4 h-4 text-neutral-500 rotate-[-90deg]" />}
                </div>

                {isOpen && (
                    <>
                        {/* Tabs */}
                        <div className="flex border-b border-white/5 bg-neutral-950">
                            <button 
                                onClick={() => setActiveTab('targets')}
                                className={`flex-1 py-3 text-[10px] font-mono uppercase tracking-widest transition-all ${activeTab === 'targets' ? 'text-purpose-gold border-b-2 border-purpose-gold bg-white/5' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                Targets
                            </button>
                            <button 
                                onClick={() => setActiveTab('links')}
                                className={`flex-1 py-3 text-[10px] font-mono uppercase tracking-widest transition-all ${activeTab === 'links' ? 'text-purpose-gold border-b-2 border-purpose-gold bg-white/5' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                Relational
                            </button>
                            <button 
                                onClick={() => setActiveTab('signals')}
                                className={`flex-1 py-3 text-[10px] font-mono uppercase tracking-widest transition-all ${activeTab === 'signals' ? 'text-purpose-gold border-b-2 border-purpose-gold bg-white/5' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                Signals
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-neutral-950/50">
                            {activeTab === 'targets' ? (
                                <div className="p-3 space-y-6">
                                    {(Object.entries(groupedNodes) as [string, GraphNode[]][]).map(([category, categoryNodes]) => (
                                        categoryNodes.length > 0 && (
                                            <div key={category}>
                                                <h5 className="px-2 mb-3 text-[9px] font-mono uppercase text-neutral-500 tracking-[0.2em] flex justify-between items-center">
                                                    {category}
                                                    <span className="px-1.5 py-0.5 bg-white/5 rounded text-neutral-600">{categoryNodes.length}</span>
                                                </h5>
                                                <div className="space-y-1.5">
                                                    {categoryNodes.map(node => (
                                                        <div 
                                                            key={node.id}
                                                            onClick={() => onFocusNode(node)}
                                                            className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl cursor-pointer group border border-transparent hover:border-white/10 transition-all"
                                                        >
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className={`w-2 h-2 rounded-full ${
                                                                    node.riskScore > 75 ? 'bg-red-500' : 
                                                                    node.riskScore > 50 ? 'bg-orange-500' :
                                                                    'bg-cyan-500'
                                                                }`}></div>
                                                                <span className="text-xs text-neutral-300 group-hover:text-white font-medium truncate">{node.label}</span>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className={`text-[10px] font-mono ${
                                                                    node.riskScore > 75 ? 'text-red-400' : 'text-neutral-600'
                                                                }`}>
                                                                    {node.riskScore}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            ) : activeTab === 'links' ? (
                                <div className="p-3 space-y-6">
                                    {(() => {
                                        const edgeGroups: Record<string, import('../types').GraphEdge[]> = {
                                            'Financial': [],
                                            'Infrastructure': [],
                                            'Narrative': [],
                                            'Other': []
                                        };
                                        
                                        edges.forEach(edge => {
                                            if (['FUNDS'].includes(edge.type)) edgeGroups['Financial'].push(edge);
                                            else if (['HOSTS', 'REGISTERED_TO', 'PART_OF'].includes(edge.type)) edgeGroups['Infrastructure'].push(edge);
                                            else if (['PROMOTES', 'MENTIONS', 'DERIVED_FROM'].includes(edge.type)) edgeGroups['Narrative'].push(edge);
                                            else edgeGroups['Other'].push(edge);
                                        });

                                        return (
                                            <div className="space-y-6">
                                                {(Object.entries(edgeGroups) as [string, import('../types').GraphEdge[]][]).map(([category, categoryEdges]) => (
                                                    categoryEdges.length > 0 && (
                                                        <div key={category}>
                                                            <h5 className="px-2 mb-3 text-[9px] font-mono uppercase text-neutral-500 tracking-[0.2em] flex justify-between items-center">
                                                                {category} Links
                                                                <span className="px-1.5 py-0.5 bg-white/5 rounded text-neutral-600">{categoryEdges.length}</span>
                                                            </h5>
                                                            <div className="space-y-2">
                                                                {categoryEdges.map((edge, i) => {
                                                                    const sourceNode = nodes.find(n => n.id === edge.source);
                                                                    const targetNode = nodes.find(n => n.id === edge.target);
                                                                    if (!sourceNode || !targetNode) return null;
                                                                    
                                                                    return (
                                                                        <div 
                                                                            key={i}
                                                                            className="p-3 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 transition-all"
                                                                        >
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <span className="text-[9px] font-mono text-purpose-gold uppercase tracking-widest">{edge.type}</span>
                                                                                <span className="text-[9px] text-neutral-600 font-mono">{(edge.confidence * 100).toFixed(0)}%</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 text-[11px]">
                                                                                <span className="text-neutral-300 truncate max-w-[80px]">{sourceNode.label}</span>
                                                                                <ArrowRight className="w-3 h-3 text-neutral-600 shrink-0" />
                                                                                <span className="text-neutral-300 truncate max-w-[80px]">{targetNode.label}</span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )
                                                ))}
                                                {edges.length === 0 && (
                                                    <div className="p-8 text-center">
                                                        <Network className="w-10 h-10 text-neutral-800 mx-auto mb-4" />
                                                        <p className="text-xs text-neutral-500 font-mono uppercase tracking-widest">No Links Resolved</p>
                                                        <p className="text-[10px] text-neutral-600 mt-2 leading-relaxed">Expand nodes to discover relational intelligence.</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            ) : (
                                <div className="p-3 space-y-3">
                                    {availableEntities.length === 0 ? (
                                        <div className="p-12 text-sm text-neutral-500 text-center italic flex flex-col items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-2">
                                                <CheckCircle2 className="w-6 h-6 text-neutral-700" />
                                            </div>
                                            Buffer empty.<br/>No new signals detected.
                                        </div>
                                    ) : (
                                        availableEntities.map(entity => (
                                            <div 
                                                key={entity.id}
                                                className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purpose-gold/30 rounded-2xl cursor-pointer group transition-all relative overflow-hidden"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm text-neutral-200 group-hover:text-white font-medium truncate pr-8">{entity.label}</span>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onAdd(entity); }}
                                                        className="absolute top-3 right-3 p-2 bg-purpose-gold text-black rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110 active:scale-95"
                                                        title="Inject Signal"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-neutral-500 line-clamp-2 mb-4 leading-relaxed">{entity.details.description}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-neutral-400 border border-white/10">
                                                        {entity.type.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const CampaignAnalysisModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onRun: (campaign: Campaign) => void;
}> = ({ isOpen, onClose, onRun }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-neutral-900 border border-purpose-gold/50 w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl"
            >
                <div className="flex justify-between items-center p-6 border-b border-spacegray bg-neutral-850">
                    <div className="flex items-center gap-3">
                        <ShieldAlert className="text-purpose-gold w-6 h-6" />
                        <h2 className="font-display text-xl text-white">Threat Campaign Simulation</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                
                <div className="p-8 grid grid-cols-1 gap-6 overflow-y-auto">
                    <p className="text-sm text-gray-400 font-mono">Select a threat vector to simulate against the current entity graph.</p>
                    {PRESET_CAMPAIGNS.map(campaign => (
                        <div key={campaign.id} className="border border-spacegray bg-neutral-850/50 p-5 hover:border-purpose-gold transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg text-white font-medium group-hover:text-purpose-gold transition-colors">{campaign.name}</h3>
                                <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded-sm ${
                                    campaign.threatLevel === 'critical' ? 'bg-alert-crimson text-black' : 
                                    campaign.threatLevel === 'high' ? 'bg-orange-500 text-black' : 'bg-yellow-500 text-black'
                                }`}>
                                    {campaign.threatLevel}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 mb-4">{campaign.description}</p>
                            <button 
                                onClick={() => onRun(campaign)}
                                className="flex items-center gap-2 text-xs font-mono uppercase text-purpose-gold hover:text-white transition-colors"
                            >
                                <Play className="w-3 h-3" /> Initialize Simulation
                            </button>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

// --- AI Dossier Modal Component ---
const DossierModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    steps: DossierStep[];
    content: string; 
    nodeLabel: string;
    shallowSummary?: string;
    onSave?: () => void;
}> = ({ isOpen, onClose, steps, content, nodeLabel, shallowSummary, onSave }) => {
    if (!isOpen) return null;

    const isComplete = steps.every(s => s.status === 'complete');
    const [activeView, setActiveView] = useState<'deep' | 'shallow'>('deep');

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-neutral-950 border border-white/10 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl rounded-3xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex justify-between items-center p-8 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purpose-gold/20 rounded-2xl">
                            <FileText className="text-purpose-gold w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="font-display text-2xl text-white font-bold">Intelligence Dossier</h2>
                            <p className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest">Target: <span className="text-purpose-gold">{nodeLabel}</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {isComplete && (
                            <div className="flex bg-neutral-900 p-1 rounded-xl border border-white/5">
                                <button 
                                    onClick={() => setActiveView('deep')}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${activeView === 'deep' ? 'bg-purpose-gold text-black font-bold' : 'text-neutral-500 hover:text-white'}`}
                                >
                                    Deep Report
                                </button>
                                <button 
                                    onClick={() => setActiveView('shallow')}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${activeView === 'shallow' ? 'bg-purpose-gold text-black font-bold' : 'text-neutral-500 hover:text-white'}`}
                                >
                                    Web Search
                                </button>
                            </div>
                        )}
                        <button onClick={onClose} className="p-2 text-neutral-500 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-10 font-sans text-neutral-300">
                    {!isComplete ? (
                        <div className="space-y-8 max-w-md mx-auto py-20">
                            {steps.map((step, i) => (
                                <motion.div 
                                    key={step.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.15 }}
                                    className={`flex items-start gap-6 ${step.status === 'pending' ? 'opacity-20' : 'opacity-100'}`}
                                >
                                    <div className="mt-1">
                                        {step.status === 'complete' ? (
                                            <div className="w-6 h-6 bg-purpose-gold rounded-full flex items-center justify-center">
                                                <CheckCircle2 className="w-4 h-4 text-black" />
                                            </div>
                                        ) : step.status === 'active' ? (
                                            <Loader2 className="w-6 h-6 text-purpose-gold animate-spin" />
                                        ) : (
                                            <div className="w-6 h-6 border-2 border-neutral-800 rounded-full"></div>
                                        )}
                                    </div>
                                    <div>
                                        <div className={`text-xs font-mono font-bold uppercase tracking-[0.2em] ${step.status === 'active' ? 'text-purpose-gold' : 'text-neutral-300'}`}>
                                            {step.label}
                                        </div>
                                        {step.detail && <div className="text-[10px] text-neutral-500 mt-2 font-mono uppercase tracking-widest">{step.detail}</div>}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-none"
                        >
                            {activeView === 'deep' ? (
                                <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap font-sans leading-relaxed text-neutral-300">
                                    {content}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                        <h3 className="text-xs font-mono text-purpose-gold uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Globe className="w-4 h-4" /> Real-time OSINT Summary
                                        </h3>
                                        <p className="text-sm leading-relaxed text-neutral-400 font-sans">
                                            {shallowSummary || "Scanning indexed web data for recent mentions and public records..."}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-neutral-900 border border-white/5 rounded-xl">
                                            <span className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest block mb-2">Social Footprint</span>
                                            <div className="text-xs text-neutral-400">Detected activity across LinkedIn, Twitter, and specialized forums.</div>
                                        </div>
                                        <div className="p-4 bg-neutral-900 border border-white/5 rounded-xl">
                                            <span className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest block mb-2">Public Filings</span>
                                            <div className="text-xs text-neutral-400">3 recent corporate filings detected in regional registries.</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-4 text-[10px] text-neutral-600 font-mono uppercase tracking-widest">
                        <Shield className="w-4 h-4" />
                        <span>Shaivra Neural Core v4.2</span>
                        <span className="h-3 w-[1px] bg-neutral-800"></span>
                        <span>TLP:AMBER</span>
                    </div>
                    {isComplete && (
                        <button 
                            onClick={onSave}
                            className="px-6 py-3 bg-white text-black font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-purpose-gold transition-all rounded-xl shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <Folder className="w-4 h-4" /> Save to Profile
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const KnowledgeGraphExplorer: React.FC<KnowledgeGraphExplorerProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Session State ---
  const [isSetupComplete, setIsSetupComplete] = useState(() => !!sessionStorage.getItem('shaivra_setup_complete'));

  // --- Graph State ---
  const [data, setData] = useState<GraphData>(() => {
      // If setup is not complete, start with empty graph for the "build" animation
      if (!sessionStorage.getItem('shaivra_setup_complete')) {
          return { nodes: [], edges: [], clusters: [] };
      }

      try {
          const savedVersion = localStorage.getItem('shaivra_graph_version');
          if (savedVersion !== GRAPH_VERSION) {
              console.log("Graph version mismatch. Resetting to default.");
              return MOCK_GRAPH_DATA;
          }
          
          const saved = localStorage.getItem('shaivra_graph_data');
          if (saved) {
              const parsed = JSON.parse(saved);
              // Double check for clusters even if version matches (safety)
              if (!parsed.clusters || !Array.isArray(parsed.clusters)) {
                  return MOCK_GRAPH_DATA;
              }
              return parsed;
          }
          return MOCK_GRAPH_DATA;
      } catch (e) {
          console.warn('Failed to load graph data from storage', e);
          return MOCK_GRAPH_DATA;
      }
  });
  
  const [viewport, setViewport] = useState(() => {
      try {
          const savedVersion = localStorage.getItem('shaivra_graph_version');
          if (savedVersion !== GRAPH_VERSION) {
              return { x: 0, y: 0, zoom: 1 };
          }

          const saved = localStorage.getItem('shaivra_graph_viewport');
          return saved ? JSON.parse(saved) : { x: 0, y: 0, zoom: 1 };
      } catch (e) {
          return { x: 0, y: 0, zoom: 1 };
      }
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // --- Persistence Effects ---
  useEffect(() => {
      localStorage.setItem('shaivra_graph_data', JSON.stringify(data));
      localStorage.setItem('shaivra_graph_version', GRAPH_VERSION);
  }, [data]);

  useEffect(() => {
      localStorage.setItem('shaivra_graph_viewport', JSON.stringify(viewport));
  }, [viewport]);
  
  // --- Interaction State ---
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  
  // --- Filter State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<number>(100); 
  const [activeFilters, setActiveFilters] = useState<EntityType[]>([
      'person', 'organization', 'event', 'campaign_signal', 'narrative_claim', 
      'social_handle', 'domain', 'ip_address', 'financial_artifact'
  ]); 
  const [activeRelFilters, setActiveRelFilters] = useState<string[]>([
      'FUNDS', 'OWNS', 'ATTACKED', 'THREAT_INDICATOR', 'COMMUNICATES_WITH'
  ]);
  const [showFilters, setShowFilters] = useState(false);

  // --- AI State ---
  const [isGeneratingDossier, setIsGeneratingDossier] = useState(false);
  const [dossierContent, setDossierContent] = useState("");
  const [shallowSummary, setShallowSummary] = useState("");
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierSteps, setDossierSteps] = useState<DossierStep[]>([]);

  // --- Campaign State ---
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [activePlaybook, setActivePlaybook] = useState<Playbook | null>(null);

  const handleGeneratePlaybook = async () => {
      const playbook = await generatePlaybook(['Risk threshold exceeded'], 'user1', 'session1');
      setActivePlaybook(playbook);
  };

  // --- Initial Center ---
  useEffect(() => {
    // Only center if no viewport was saved OR if we just reset due to version mismatch
    const savedVersion = localStorage.getItem('shaivra_graph_version');
    const shouldCenter = !localStorage.getItem('shaivra_graph_viewport') || savedVersion !== GRAPH_VERSION;

    if (data.nodes && data.nodes.length > 0 && containerRef.current && shouldCenter) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        
        // Calculate Bounding Box
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        data.nodes.forEach(n => {
            minX = Math.min(minX, n.x);
            minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x);
            maxY = Math.max(maxY, n.y);
        });

        const graphWidth = maxX - minX;
        const graphHeight = maxY - minY;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // Calculate Zoom to Fit
        const padding = 100; // px padding around the graph
        const availableWidth = width - padding * 2;
        const availableHeight = height - padding * 2;

        const scaleX = availableWidth / graphWidth;
        const scaleY = availableHeight / graphHeight;
        
        // Use the smaller scale to ensure everything fits, but clamp it
        let zoom = Math.min(scaleX, scaleY);
        zoom = Math.min(Math.max(zoom, MIN_ZOOM), 1.5); // Cap max zoom at 1.5 so small graphs don't look huge

        setViewport({
            x: width / 2 - centerX * zoom,
            y: height / 2 - centerY * zoom,
            zoom: zoom
        });
    }
  }, []);

  // --- Actions ---
  const handleAddEntity = (node: GraphNode) => {
      // Position new node in center of current view
      const canvas = canvasRef.current;
      if (canvas) {
          const center = toWorld(canvas.width / 2, canvas.height / 2);
          node.x = center.x + (Math.random() - 0.5) * 50;
          node.y = center.y + (Math.random() - 0.5) * 50;
      }

      setData(prev => ({
          nodes: [...prev.nodes, node],
          edges: [...prev.edges] // In a real app, we'd calculate edges here
      }));
      
      // Auto-select
      setSelectedNode(node);
      setViewport(prev => ({ ...prev, zoom: 1.5 })); // Zoom in slightly
  };

  const handleFocusNode = (node: GraphNode) => {
      setSelectedNode(node);
      if (containerRef.current) {
          const { width, height } = containerRef.current.getBoundingClientRect();
          setViewport({
              x: width / 2 - node.x * 1.5, // Target zoom 1.5
              y: height / 2 - node.y * 1.5,
              zoom: 1.5
          });
      }
  };

  const handleSetupComplete = (sources: DataSource[], query: GraphQuery) => {
      setIsSetupComplete(true);
      sessionStorage.setItem('shaivra_setup_complete', 'true');

      // Animated Build Sequence
      const fullData = MOCK_GRAPH_DATA;
      
      // Step 1: Initialize Viewport
      if (containerRef.current) {
          const { width, height } = containerRef.current.getBoundingClientRect();
          setViewport({ x: width/2, y: height/2, zoom: 0.5 }); // Start zoomed out
      }

      // Step 2: Reveal Cluster 1 (Disinformation)
      setTimeout(() => {
          setData(prev => ({
              ...prev,
              clusters: [fullData.clusters![0]],
              nodes: fullData.nodes.filter(n => n.clusterId === 'c1')
          }));
      }, 500);

      // Step 3: Reveal Cluster 2 (Financial)
      setTimeout(() => {
          setData(prev => ({
              ...prev,
              clusters: [...(prev.clusters || []), fullData.clusters![1]],
              nodes: [...prev.nodes, ...fullData.nodes.filter(n => n.clusterId === 'c2')]
          }));
      }, 1500);

      // Step 4: Reveal Cluster 3 (Infra) & Edges
      setTimeout(() => {
          setData(prev => ({
              ...prev,
              clusters: fullData.clusters,
              nodes: fullData.nodes,
              edges: fullData.edges
          }));
          
          // Zoom to fit
          if (containerRef.current) {
             // Re-run the centering logic (simplified here, the useEffect will catch it if we trigger it right)
             // Actually, let's just manually set a good viewport
             const { width, height } = containerRef.current.getBoundingClientRect();
             setViewport({ x: width/2, y: height/2, zoom: 1.2 });
          }
      }, 2500);
  };

  const handleResetSession = () => {
      sessionStorage.removeItem('shaivra_setup_complete');
      setIsSetupComplete(false);
      setData({ nodes: [], edges: [], clusters: [] });
  };

  const handleRunCampaign = (campaign: Campaign) => {
      setShowCampaignModal(false);
      
      // 1. Add Campaign Node
      const campaignNode: GraphNode = {
          id: campaign.id,
          label: campaign.name,
          type: 'event', // Using event type for campaign
          x: 0, y: -150, // Top center
          r: 20,
          confidence: 0.95,
          riskScore: 90,
          sourceCount: 5,
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          details: {
              role: 'Active Threat Campaign',
              description: campaign.description,
              sources: ['Threat Intel Feed', 'Heuristic Analysis'],
              attribution: 'Automated Threat Detection',
              linkedEvidence: ['CAMPAIGN-SIG-001', 'INTEL-REP-2024']
          }
      };

      // 2. Link to actors
      const newEdges: GraphEdge[] = campaign.actors.map(actorId => ({
          source: campaign.id,
          target: actorId,
          strength: 1,
          label: 'Threat Vector',
          type: 'ATTACKED',
          confidence: 0.9,
          evidenceCount: 3
      }));

      setData(prev => ({
          nodes: [...prev.nodes, campaignNode],
          edges: [...prev.edges, ...newEdges]
      }));

      // 3. Focus on campaign
      setSelectedNode(campaignNode);
  };

  // --- Filter Logic ---
  const { filteredNodes, filteredEdges, currentDateStr } = useMemo(() => {
    const dates = data.nodes.map(n => new Date(n.firstSeen).getTime());
    const min = Math.min(...dates);
    const max = Math.max(...dates);
    const span = max - min || 1; 

    const cutoffTime = min + (span * (timeRange / 100));

    const nodes = data.nodes.filter(n => {
        const matchesSearch = searchQuery === '' || n.label.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = activeFilters.includes(n.type);
        // Use firstSeen as the primary date for filtering
        const nodeTime = new Date(n.firstSeen).getTime();
        const matchesTime = nodeTime <= cutoffTime;
        return matchesSearch && matchesType && matchesTime;
    });

    const edges = data.edges.filter(e => {
        const matchesNodes = nodes.find(n => n.id === e.source) && nodes.find(n => n.id === e.target);
        const matchesRel = activeRelFilters.includes(e.type);
        return matchesNodes && matchesRel;
    });

    return { 
        filteredNodes: nodes, 
        filteredEdges: edges,
        currentDateStr: new Date(cutoffTime).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    };
  }, [data, timeRange, activeFilters, activeRelFilters, searchQuery]);


  // --- Helper: Screen/World Coordinates ---
  const toWorld = useCallback((screenX: number, screenY: number) => {
    return {
        x: (screenX - viewport.x) / viewport.zoom,
        y: (screenY - viewport.y) / viewport.zoom
    };
  }, [viewport]);

  // --- Progressive Expansion ---
  const handleNodeClick = (node: GraphNode) => {
      setSelectedNode(node);

      if (!node.expanded) {
          const { nodes: newNodes, edges: newEdges } = generateMockNeighbors(node);
          setData(prev => ({
              nodes: prev.nodes.map(n => n.id === node.id ? { ...n, expanded: true } : n).concat(newNodes),
              edges: prev.edges.concat(newEdges)
          }));
      }
  };

  // --- AI Generation Logic ---
  const handleGenerateDossier = async () => {
    if (!selectedNode) return;
    
    setShowDossierModal(true);
    setIsGeneratingDossier(true);
    setDossierContent("");
    
    // Initialize Steps
    const initialSteps: DossierStep[] = [
        { id: '1', label: 'Acquiring Target Signal', status: 'active', detail: `Locking onto entity ID: ${selectedNode.id.slice(0,8)}...` },
        { id: '2', label: 'Cross-referencing Indices', status: 'pending', detail: 'Scanning 40,000+ open sources...' },
        { id: '3', label: 'Synthesizing Narrative', status: 'pending', detail: 'Constructing causality chains...' },
        { id: '4', label: 'Finalizing Dossier', status: 'pending', detail: 'Formatting for executive review.' }
    ];
    setDossierSteps(initialSteps);

    // Simulation of Progress
    const updateStep = (index: number, status: 'active' | 'complete') => {
        setDossierSteps(prev => prev.map((s, i) => i === index ? { ...s, status } : s));
    };

    try {
        // Step 1 -> 2
        await new Promise(r => setTimeout(r, 1500));
        updateStep(0, 'complete');
        updateStep(1, 'active');

        // Step 2 -> 3
        await new Promise(r => setTimeout(r, 1500));
        updateStep(1, 'complete');
        updateStep(2, 'active');

        // Collect context from graph
        const connections = data.edges
            .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
            .map(e => {
                const otherId = e.source === selectedNode.id ? e.target : e.source;
                const otherNode = data.nodes.find(n => n.id === otherId);
                return `${e.label || 'connected to'} ${otherNode?.label} (${otherNode?.type})`;
            })
            .join('; ');

        const prompt = `
            You are an intelligence analyst for Shaivra, a private intelligence firm.
            Generate a concise, actionable intelligence dossier for the following entity based on the provided OSINT data.
            
            Target Entity: ${selectedNode.label}
            Type: ${selectedNode.type}
            Role: ${selectedNode.details.role}
            Known Intelligence: ${selectedNode.details.description}
            Known Connections: ${connections}
            Credibility Score: ${selectedNode.details.credibility}
            
            Format the report with the following sections:
            1. EXECUTIVE SUMMARY (1 sentence)
            2. KEY FINDINGS (Bullet points)
            3. NETWORK IMPLICATIONS (Analysis of connections)
            4. RECOMMENDED ACTIONS (Strategic next steps)
            
            Tone: Professional, detached, military-grade precision. No fluff.
        `;

        let generatedText = "";

        if (process.env.API_KEY) {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });
            generatedText = response.text || "Analysis complete. No actionable intelligence found.";
        } else {
            // Fallback
            generatedText = `[SIMULATION MODE - API KEY MISSING]\n\n1. EXECUTIVE SUMMARY\nSubject ${selectedNode.label} exhibits high centrality within the current dataset, indicating a pivotal role in the observed network.\n\n2. KEY FINDINGS\n- Direct link established with ${connections.split(';')[0] || "unknown entities"}.\n- Credibility score of ${selectedNode.details.credibility} suggests high reliability of source data.\n- Temporal analysis indicates recent surge in activity.\n\n3. RECOMMENDED ACTIONS\n- Initiate deep-dive surveillance on financial vectors.\n- Correlate travel logs with known associates.\n- Monitor for further expansion of network nodes.`;
        }

        // Step 3 -> 4
        updateStep(2, 'complete');
        updateStep(3, 'active');
        await new Promise(r => setTimeout(r, 1000));

        setDossierContent(generatedText);
        updateStep(3, 'complete');

    } catch (error) {
        console.error("AI Generation Error", error);
        setDossierContent("Error: Intelligence Synthesis Failed. Connection to Neural Core interrupted.");
    } finally {
        setIsGeneratingDossier(false);
    }
  };


  // --- Canvas Rendering Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
        if (containerRef.current) {
            canvas.width = containerRef.current.clientWidth;
            canvas.height = containerRef.current.clientHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(viewport.x, viewport.y);
        ctx.scale(viewport.zoom, viewport.zoom);

        // --- Cluster Rendering ---
        if (data.clusters && viewport.zoom < 1.5) {
            data.clusters.forEach(cluster => {
                const members = filteredNodes.filter(n => cluster.members.includes(n.id));
                if (members.length < 2) return;

                // Calculate bounding box
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                members.forEach(n => {
                    minX = Math.min(minX, n.x);
                    minY = Math.min(minY, n.y);
                    maxX = Math.max(maxX, n.x);
                    maxY = Math.max(maxY, n.y);
                });

                // Draw Cluster Blob
                const padding = 60;
                const width = maxX - minX + padding * 2;
                const height = maxY - minY + padding * 2;
                const cx = (minX + maxX) / 2;
                const cy = (minY + maxY) / 2;

                ctx.beginPath();
                ctx.ellipse(cx, cy, width / 2, height / 2, 0, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.setLineDash([10, 10]);
                ctx.stroke();
                ctx.setLineDash([]);

                // Cluster Label
                ctx.font = `${12 / viewport.zoom}px 'Space Grotesk'`;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.textAlign = 'center';
                ctx.fillText(cluster.label.toUpperCase(), cx, minY - padding + 20);
            });
        }

        // Edges
        filteredEdges.forEach(edge => {
            const s = filteredNodes.find(n => n.id === edge.source);
            const t = filteredNodes.find(n => n.id === edge.target);
            if (!s || !t) return;

            const isHighlighted = hoveredNodeId === s.id || hoveredNodeId === t.id || selectedNode?.id === s.id || selectedNode?.id === t.id;

            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(t.x, t.y);
            
            // Style based on relationship type
            if (edge.type === 'FUNDS' || edge.type === 'OWNS') {
                ctx.strokeStyle = isHighlighted ? '#10B981' : '#059669'; // Emerald for financial
            } else if (edge.type === 'ATTACKED' || edge.type === 'THREAT_INDICATOR') {
                ctx.strokeStyle = isHighlighted ? '#EF4444' : '#B91C1C'; // Red for threat
            } else {
                ctx.strokeStyle = isHighlighted ? '#F59E0B' : '#3F3F46'; // Default
            }

            ctx.lineWidth = (isHighlighted ? 3 : 1) * (edge.strength || 0.5) / viewport.zoom;
            ctx.globalAlpha = isHighlighted ? 1 : 0.4;
            
            if (edge.confidence < 0.7) ctx.setLineDash([5, 5]); // Dashed for low confidence
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;

            if (isHighlighted && edge.label && viewport.zoom > 0.8) {
                const midX = (s.x + t.x) / 2;
                const midY = (s.y + t.y) / 2;
                ctx.font = `${10/viewport.zoom}px JetBrains Mono`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#F59E0B';
                ctx.fillText(edge.label, midX, midY - (10/viewport.zoom));
            }
        });

        // Nodes
        filteredNodes.forEach(node => {
            const isHovered = hoveredNodeId === node.id;
            const isSelected = selectedNode?.id === node.id;
            
            // Color Mapping
            let color = '#94A3B8';
            switch (node.type) {
                case 'person': color = '#3B82F6'; break; // Blue
                case 'organization': color = '#F59E0B'; break; // Orange
                case 'event': color = '#EF4444'; break; // Red
                case 'campaign_signal': color = '#EC4899'; break; // Pink
                case 'narrative_claim': color = '#8B5CF6'; break; // Violet
                case 'financial_artifact': color = '#10B981'; break; // Emerald
                case 'infrastructure_asset': 
                case 'ip_address':
                case 'domain': color = '#6366F1'; break; // Indigo
                default: color = '#94A3B8';
            }
            
            // Risk Halo
            if (node.riskScore > 75) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.r * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; // Red glow
                ctx.fill();
            }

            // Dynamic size based on importance
            const importanceFactor = (node.confidence * 0.5) + (Math.min(node.sourceCount, 20) / 20 * 0.5);
            const radius = (isSelected ? node.r * 1.5 : node.r) * (0.7 + importanceFactor);
            
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            
            // Node border for selected
            if (isSelected) {
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2 / viewport.zoom;
                ctx.stroke();
            }

            // Selection Glow
            if (isSelected) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius * 1.5, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.2;
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            // Node Body
            ctx.beginPath();
            if (node.type === 'organization' || node.type === 'infrastructure_asset') {
                // Square-ish for orgs/infra
                ctx.rect(node.x - radius, node.y - radius, radius * 2, radius * 2);
            } else {
                // Circle for others
                ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            }
            
            ctx.fillStyle = '#0C0D0F';
            ctx.fill();
            ctx.lineWidth = isHovered || isSelected ? 2 / viewport.zoom : 1 / viewport.zoom;
            ctx.strokeStyle = color;
            ctx.stroke();

            // Inner Fill (Confidence opacity)
            ctx.beginPath();
            if (node.type === 'organization' || node.type === 'infrastructure_asset') {
                ctx.rect(node.x - radius * 0.4, node.y - radius * 0.4, radius * 0.8, radius * 0.8);
            } else {
                ctx.arc(node.x, node.y, radius * 0.4, 0, Math.PI * 2);
            }
            ctx.fillStyle = color;
            ctx.globalAlpha = node.confidence || 1;
            ctx.fill();
            ctx.globalAlpha = 1;

            if (viewport.zoom > 0.6 || isHovered || isSelected) {
                ctx.font = `${(isSelected ? 14 : 10) / viewport.zoom}px Inter`;
                ctx.fillStyle = isSelected ? '#FFFFFF' : '#94A3B8';
                ctx.textAlign = 'center';
                ctx.fillText(node.label, node.x, node.y + radius + (12 / viewport.zoom));
            }
        });

        ctx.restore();
        animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [viewport, filteredNodes, filteredEdges, hoveredNodeId, selectedNode]);


  // --- Event Handlers (Wheel, Mouse) ---
  const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      const zoomFactor = -e.deltaY * ZOOM_SENSITIVITY;
      const newZoom = Math.min(Math.max(viewport.zoom * (1 + zoomFactor), MIN_ZOOM), MAX_ZOOM);
      
      const rect = canvasRef.current!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldBefore = toWorld(mouseX, mouseY);

      const newX = mouseX - worldBefore.x * newZoom;
      const newY = mouseY - worldBefore.y * newZoom;

      setViewport({ x: newX, y: newY, zoom: newZoom });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldPos = toWorld(mouseX, mouseY);

      const hitNode = filteredNodes.find(n => {
          const dx = n.x - worldPos.x;
          const dy = n.y - worldPos.y;
          return Math.sqrt(dx*dx + dy*dy) < n.r * 2;
      });

      if (hitNode) {
          setDraggedNodeId(hitNode.id);
      } else {
          setIsDragging(true);
      }
      setDragStart({ x: mouseX, y: mouseY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldPos = toWorld(mouseX, mouseY);

      if (!isDragging && !draggedNodeId) {
          const hitNode = filteredNodes.find(n => {
            const dx = n.x - worldPos.x;
            const dy = n.y - worldPos.y;
            return Math.sqrt(dx*dx + dy*dy) < n.r * 2;
          });
          setHoveredNodeId(hitNode ? hitNode.id : null);
          if (canvasRef.current) canvasRef.current.style.cursor = hitNode ? 'pointer' : 'default';
      }

      if (draggedNodeId) {
          setData(prev => ({
              ...prev,
              nodes: prev.nodes.map(n => n.id === draggedNodeId ? { ...n, x: worldPos.x, y: worldPos.y } : n)
          }));
          return;
      }

      if (isDragging) {
          const dx = mouseX - dragStart.x;
          const dy = mouseY - dragStart.y;
          setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
          setDragStart({ x: mouseX, y: mouseY });
      }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const dist = Math.sqrt(Math.pow(mouseX - dragStart.x, 2) + Math.pow(mouseY - dragStart.y, 2));
      
      if (dist < DRAG_THRESHOLD && draggedNodeId) {
          const node = data.nodes.find(n => n.id === draggedNodeId);
          if (node) handleNodeClick(node);
      }
      setIsDragging(false);
      setDraggedNodeId(null);
  };

  const resetView = () => setViewport({ x: 0, y: 0, zoom: 1 });

  return (
    <div className="relative w-full h-screen bg-charcoal overflow-hidden font-sans flex flex-col md:flex-row" ref={containerRef}>
      
      <GraphEducationPanel />
      
      <GraphSetupWizard 
        isOpen={!isSetupComplete}
        onComplete={handleSetupComplete}
      />
      
      <DataSidebar 
        nodes={data.nodes}  
        edges={data.edges}
        onAdd={handleAddEntity} 
        existingIds={data.nodes.map(n => n.id)}
        onFocusNode={handleFocusNode}
      />

      <CampaignAnalysisModal 
        isOpen={showCampaignModal}
        onClose={() => setShowCampaignModal(false)}
        onRun={handleRunCampaign}
      />

      {/* Dossier Modal */}
      <AnimatePresence>
          {showDossierModal && selectedNode && (
              <DossierModal 
                  isOpen={showDossierModal} 
                  onClose={() => setShowDossierModal(false)}
                  steps={dossierSteps}
                  content={dossierContent}
                  nodeLabel={selectedNode.label}
                  shallowSummary={shallowSummary}
                  onSave={() => {
                      console.log("Saving dossier to profile database...");
                      setShowDossierModal(false);
                  }}
              />
          )}
      </AnimatePresence>

      {/* Top Bar - Integrated Header */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-neutral-900/90 backdrop-blur-md border-b border-spacegray z-30 flex items-center justify-between px-6 shadow-lg pointer-events-auto">
          <div className="flex items-center gap-6">
              <button 
                onClick={onBack} 
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group px-3 py-1.5 rounded-md hover:bg-white/5"
              >
                  <BackIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-xs font-mono uppercase tracking-widest font-medium">Exit</span>
              </button>
              <div className="h-6 w-[1px] bg-spacegray"></div>
              <div>
                  <h2 className="text-white font-display text-lg tracking-tight font-medium flex items-center gap-2">
                    <div className="w-2 h-2 bg-purpose-gold rounded-full animate-pulse"></div>
                    Active Intelligence Network
                  </h2>
              </div>
          </div>

          <div className="flex items-center gap-4">
              <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-500 group-focus-within:text-purpose-gold transition-colors" />
                  </div>
                  <input
                      type="text"
                      className="block w-64 pl-10 pr-3 py-2 border border-spacegray rounded-md leading-5 bg-neutral-850 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purpose-gold focus:ring-1 focus:ring-purpose-gold sm:text-sm font-mono transition-all"
                      placeholder="Search entities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
          </div>
      </div>

      {/* Bottom Right Controls */}
      <div className="absolute bottom-8 right-8 z-20 flex flex-col gap-2 pointer-events-auto">
          <div className="bg-neutral-900/90 backdrop-blur border border-spacegray p-1.5 rounded-lg shadow-xl flex flex-col gap-1">
             <button onClick={() => setViewport(v => ({...v, zoom: v.zoom * 1.2}))} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors" title="Zoom In"><ZoomIn className="w-5 h-5"/></button>
             <button onClick={() => setViewport(v => ({...v, zoom: v.zoom / 1.2}))} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors" title="Zoom Out"><ZoomOut className="w-5 h-5"/></button>
             <div className="h-[1px] w-full bg-spacegray my-0.5"></div>
             <button onClick={resetView} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors" title="Fit to Screen"><Maximize className="w-5 h-5"/></button>
             <button onClick={handleResetSession} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors" title="Reset Session"><RotateCcw className="w-5 h-5"/></button>
          </div>

          <div className="bg-neutral-900/90 backdrop-blur border border-spacegray p-1.5 rounded-lg shadow-xl flex flex-col gap-1 mt-2">
             <button 
                onClick={() => setShowCampaignModal(true)}
                className="p-2 text-purpose-gold hover:text-white hover:bg-purpose-gold/20 rounded-md transition-colors"
                title="Run Simulation"
             >
                 <ShieldAlert className="w-5 h-5" />
             </button>
             <button 
                onClick={() => setShowFilters(!showFilters)} 
                className={`p-2 rounded-md transition-colors ${showFilters ? 'bg-purpose-gold text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                title="Filters"
             >
                 <FilterIcon className="w-5 h-5" />
             </button>
          </div>
      </div>

      {/* Playbook Modal */}
      <PlaybookModal playbook={activePlaybook} onClose={() => setActivePlaybook(null)} />

      {/* Filter Panel */}
      <AnimatePresence>
          {showFilters && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute bottom-8 right-24 z-30 w-64 bg-neutral-900/95 border border-spacegray shadow-2xl p-5 rounded-lg pointer-events-auto backdrop-blur"
              >
                  <h4 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">Entity Visibility</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                      {(['person', 'organization', 'domain', 'ip_address', 'infrastructure_asset', 'social_handle', 'event', 'narrative_claim', 'financial_artifact', 'campaign_signal'] as EntityType[]).map(type => (
                          <label key={type} className="flex items-center gap-3 cursor-pointer group">
                              <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${activeFilters.includes(type) ? 'bg-purpose-gold border-purpose-gold' : 'border-gray-600'}`}>
                                  {activeFilters.includes(type) && <div className="w-2 h-2 bg-black"></div>}
                              </div>
                              <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={activeFilters.includes(type)}
                                onChange={() => {
                                    setActiveFilters(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])
                                }}
                              />
                              <span className="text-sm text-gray-300 group-hover:text-white capitalize">{type.replace('_', ' ')}</span>
                          </label>
                      ))}
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* Canvas */}
      <div className="flex-1 relative cursor-crosshair">
         <canvas 
            ref={canvasRef}
            className="absolute inset-0"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsDragging(false)}
         />
         <div className="absolute bottom-6 left-6 pointer-events-none text-text-secondary text-xs font-mono opacity-60">
             <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 bg-gray-500 rounded-full"></div> Scroll to Zoom</div>
             <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 bg-gray-500 rounded-full"></div> Drag to Pan</div>
             <div className="flex items-center gap-2"><div className="w-2 h-2 bg-gray-500 rounded-full"></div> Click to Expand</div>
         </div>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
          {selectedNode && (
              <motion.div 
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full md:w-96 bg-neutral-900 border-l border-spacegray flex flex-col z-20 shadow-2xl absolute md:relative right-0 h-full"
              >
                  {/* Header */}
                  <div className="p-6 border-b border-spacegray bg-neutral-850">
                      <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-2 text-purpose-gold text-[10px] font-mono uppercase tracking-[0.2em]">
                               <SignalIcon className="w-3 h-3" />
                               <span>Live Signal</span>
                           </div>
                           <button onClick={() => setSelectedNode(null)} className="text-gray-500 hover:text-white transition-colors">
                               <span className="text-[10px] font-mono">[CLOSE]</span>
                           </button>
                      </div>
                      
                      <h2 className="font-display text-2xl text-white font-medium leading-tight mb-1">
                          {selectedNode.label}
                      </h2>
                      <p className="text-sm text-purpose-gold font-mono mb-4">{selectedNode.details.role}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-1 bg-spacegray/50 rounded-sm text-[10px] text-gray-300 font-mono uppercase">
                              {selectedNode.type}
                          </span>
                          <span className="px-2 py-1 bg-spacegray/50 rounded-sm text-[10px] text-gray-300 font-mono uppercase">
                              ID: {selectedNode.id.slice(0, 8)}
                          </span>
                      </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                      {/* Intelligence Summary */}
                      <div className="bg-neutral-850/50 p-4 border border-spacegray rounded-sm">
                          <h4 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-2">
                              Intelligence Brief
                          </h4>
                          <p className="text-sm text-gray-300 leading-relaxed">
                              {selectedNode.details.description}
                          </p>
                      </div>

                      {/* Risk Indicators & Alerts */}
                      <div className="bg-red-900/10 p-4 border border-red-900/30 rounded-sm">
                          <h4 className="flex items-center gap-2 text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest mb-3">
                              <ShieldAlert className="w-3 h-3" /> Risk Assessment
                          </h4>
                          <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-red-200">Risk Score</span>
                              <span className={`text-sm font-bold ${selectedNode.riskScore > 75 ? 'text-red-500' : 'text-orange-500'}`}>
                                  {selectedNode.riskScore}/100
                              </span>
                          </div>
                          <div className="w-full h-1 bg-red-900/20 rounded-full overflow-hidden">
                              <div className={`h-full ${selectedNode.riskScore > 75 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${selectedNode.riskScore}%` }}></div>
                          </div>
                      </div>

                      {/* Linked Entity Actions */}
                      <div className="space-y-2">
                          <h4 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-2">
                              Quick Actions
                          </h4>
                          <button className="w-full text-left px-3 py-2 bg-neutral-850 border border-spacegray rounded-sm text-xs text-gray-300 hover:border-purpose-gold hover:text-white transition-colors">
                              Expand Similar Entities
                          </button>
                          <button className="w-full text-left px-3 py-2 bg-neutral-850 border border-spacegray rounded-sm text-xs text-gray-300 hover:border-purpose-gold hover:text-white transition-colors">
                              Trace Provenance Chain
                          </button>
                      </div>

                      <div>
                          <h4 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-3">
                              Direct Connections
                          </h4>
                          <div className="space-y-2">
                              {filteredEdges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).map((edge, i) => {
                                  const otherId = edge.source === selectedNode.id ? edge.target : edge.source;
                                  const otherNode = data.nodes.find(n => n.id === otherId);
                                  if (!otherNode) return null;
                                  return (
                                      <div key={i} className="flex items-center justify-between p-2 bg-neutral-850 border border-spacegray rounded-sm hover:border-gray-500 transition-colors cursor-pointer" onClick={() => handleNodeClick(otherNode)}>
                                          <span className="text-xs text-white truncate max-w-[140px]">{otherNode.label}</span>
                                          <span className="text-[10px] text-gray-500 font-mono">{edge.label || 'Linked'}</span>
                                      </div>
                                  )
                              })}
                          </div>
                          <button className="w-full mt-3 py-2 border border-dashed border-spacegray text-xs text-gray-500 hover:text-purpose-gold hover:border-purpose-gold transition-colors font-mono uppercase" onClick={() => handleNodeClick(selectedNode)}>
                              <span className="flex items-center justify-center gap-2">
                                  <RefreshCw className="w-3 h-3" /> Expand Network
                              </span>
                          </button>
                      </div>

                      <div className="bg-neutral-850 p-4 border border-spacegray rounded-sm">
                          <h4 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-3">
                              Source Attribution
                          </h4>
                          <ul className="space-y-2">
                              {selectedNode.details.sources.map((source, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                                      <div className="w-1 h-1 bg-purpose-gold mt-1.5 rounded-full"></div>
                                      {source}
                                  </li>
                              ))}
                          </ul>
                      </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 border-t border-spacegray bg-neutral-850">
                      <button 
                        onClick={handleGenerateDossier}
                        className="w-full py-3 bg-purpose-gold text-black font-mono text-xs uppercase font-bold tracking-widest hover:bg-white transition-colors flex items-center justify-center gap-2"
                      >
                          <ZapIcon className="w-4 h-4" /> Generate Dossier
                      </button>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>



    </div>
  );
};

export default KnowledgeGraphExplorer;
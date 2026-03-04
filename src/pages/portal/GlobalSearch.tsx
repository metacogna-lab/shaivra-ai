import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Globe, Database, Network, 
  Hash, ExternalLink, ArrowRight,
  Loader2, Filter, Info, Shield,
  Lock, Eye, EyeOff, Paperclip
} from 'lucide-react';
import { portalApi } from '../../services/portalApi';
import { GlobalGraphNode } from '../../portalTypes';

const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalGraphNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOntology, setShowOntology] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const data = await portalApi.searchGlobalGraph(query);
      setResults(data);
    } catch (error) {
      console.error("Search Error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query.length > 2) {
      const timer = setTimeout(handleSearch, 500);
      return () => clearTimeout(timer);
    }
  }, [query]);

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Global Graph Search</h1>
          <p className="text-neutral-400 font-mono text-sm mt-1">UUID-Based Intelligence Retrieval & Entity Correlation</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowOntology(!showOntology)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all text-xs font-mono"
          >
            {showOntology ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showOntology ? 'Hide Ontologies' : 'Reveal Ontologies (Admin)'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8">
        <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by UUID, Entity Name, or Domain..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-12 pr-4 py-4 text-white font-mono text-lg focus:border-purpose-gold focus:outline-none transition-all shadow-2xl shadow-black/50"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="w-5 h-5 animate-spin text-purpose-gold" />
            </div>
          )}
        </form>
        <div className="mt-4 flex justify-center gap-6 text-[10px] font-mono text-neutral-600 uppercase tracking-widest">
          <span className="flex items-center gap-2"><Database className="w-3 h-3" /> 1.2M Nodes</span>
          <span className="flex items-center gap-2"><Network className="w-3 h-3" /> 4.5M Edges</span>
          <span className="flex items-center gap-2"><Lock className="w-3 h-3" /> Encrypted Storage</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-xs font-mono text-neutral-500 uppercase mb-4 flex items-center gap-2">
              <Filter className="w-3 h-3" /> Search Filters
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-neutral-600 uppercase mb-2">Entity Type</label>
                <select className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-400 focus:outline-none">
                  <option>All Types</option>
                  <option>Organization</option>
                  <option>Person</option>
                  <option>Cyber Asset</option>
                  <option>Financial Entity</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-neutral-600 uppercase mb-2">Min Connections</label>
                <input type="range" className="w-full accent-purpose-gold" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="verified" className="accent-purpose-gold" />
                <label htmlFor="verified" className="text-xs text-neutral-500">Verified Nodes Only</label>
              </div>
            </div>
          </div>

          <div className="p-6 bg-neutral-900/20 border border-neutral-800 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
              <Info className="w-4 h-4 text-cyan-500" />
              Search Logic
            </div>
            <p className="text-[10px] text-neutral-600 leading-relaxed">
              Subsequent searches by other groups leverage the global graph UUIDs to maintain intelligence continuity.
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          <AnimatePresence mode="popLayout">
            {results.length > 0 ? (
              results.map((node, i) => (
                <motion.div 
                  key={node.uuid}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 text-neutral-500 group-hover:text-purpose-gold transition-colors">
                        <Hash className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{node.label}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-mono text-neutral-500 uppercase">{node.type}</span>
                          <span className="w-1 h-1 rounded-full bg-neutral-800" />
                          <span className="text-[10px] font-mono text-neutral-500 uppercase">{node.connections} Connections</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-neutral-600 mb-1">UUID Reference</div>
                      <div className="text-xs font-mono text-cyan-500 bg-cyan-500/5 px-2 py-1 rounded border border-cyan-500/20">
                        {node.uuid}
                      </div>
                    </div>
                  </div>

                  {showOntology && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-6 pt-6 border-t border-neutral-800 grid grid-cols-2 gap-8"
                    >
                      <div>
                        <h4 className="text-[10px] font-mono text-neutral-500 uppercase mb-3">Ontology Mapping</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-neutral-600">Class:</span>
                            <span className="text-white">Strategic_Entity</span>
                          </div>
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-neutral-600">Subclass:</span>
                            <span className="text-white">Competitor_Primary</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-mono text-neutral-500 uppercase mb-3">Entity Relations</h4>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-0.5 bg-neutral-950 border border-neutral-800 text-neutral-500 text-[9px] rounded">AFFILIATED_WITH</span>
                          <span className="px-2 py-0.5 bg-neutral-950 border border-neutral-800 text-neutral-500 text-[9px] rounded">COMPETES_IN</span>
                          <span className="px-2 py-0.5 bg-neutral-950 border border-neutral-800 text-neutral-500 text-[9px] rounded">TARGETED_BY</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-[10px] font-mono text-neutral-600">
                      Last seen in ingestion stream: {new Date(node.last_seen).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={async () => {
                          await portalApi.saveClip({
                            title: node.label,
                            content: `UUID: ${node.uuid}\nType: ${node.type}\nConnections: ${node.connections}`,
                            source: 'Global Graph'
                          });
                          alert('Clipped to Intelligence Board');
                        }}
                        className="text-xs font-mono text-neutral-500 hover:text-purpose-gold flex items-center gap-2 transition-colors"
                      >
                        <Paperclip className="w-3 h-3" /> Clip to Board
                      </button>
                      <button className="text-xs font-mono text-neutral-500 hover:text-white flex items-center gap-2 transition-colors">
                        Explore in Graph <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : query.length > 2 && !loading ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-12 bg-neutral-900/20 border border-dashed border-neutral-800 rounded-3xl">
                <Search className="w-12 h-12 text-neutral-700 mb-4" />
                <h3 className="text-xl font-display font-medium text-neutral-500">No results found for "{query}"</h3>
                <p className="text-neutral-600 mt-2">Try searching by UUID or a broader entity name.</p>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-12 bg-neutral-900/20 border border-dashed border-neutral-800 rounded-3xl">
                <Globe className="w-12 h-12 text-neutral-700 mb-4" />
                <h3 className="text-xl font-display font-medium text-neutral-500">Global Graph Search Ready</h3>
                <p className="text-neutral-600 mt-2">Enter a query to retrieve intelligence from the global graph.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;

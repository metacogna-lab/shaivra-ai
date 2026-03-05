import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DataSource, GraphQuery } from '../contracts';
import { DATA_SOURCES, GRAPH_QUERIES } from '../constants';
import { CheckCircle2, Globe, Lock, Building, Users, Link, Shield, ArrowRight, Loader2, Database, Search } from 'lucide-react';

interface GraphSetupWizardProps {
  onComplete: (sources: DataSource[], query: GraphQuery) => void;
  isOpen: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  globe: Globe,
  lock: Lock,
  building: Building,
  users: Users,
  link: Link,
  shield: Shield
};

export const GraphSetupWizard: React.FC<GraphSetupWizardProps> = ({ onComplete, isOpen }) => {
  const [step, setStep] = useState<'sources' | 'query' | 'building'>('sources');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);

  const handleSourceSelect = (id: string) => {
    if (selectedSources.includes(id)) {
      setSelectedSources(prev => prev.filter(s => s !== id));
    } else {
      if (selectedSources.length < 2) {
        setSelectedSources(prev => [...prev, id]);
      }
    }
  };

  const handleNext = () => {
    if (step === 'sources' && selectedSources.length === 2) {
      setStep('query');
    } else if (step === 'query' && selectedQuery) {
      setStep('building');
      // Simulate build delay before completing
      setTimeout(() => {
        const sources = DATA_SOURCES.filter(s => selectedSources.includes(s.id));
        const query = GRAPH_QUERIES.find(q => q.id === selectedQuery)!;
        onComplete(sources, query);
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl bg-neutral-900 border border-spacegray rounded-xl shadow-2xl overflow-hidden flex flex-col h-[600px]"
      >
        {/* Header */}
        <div className="p-6 border-b border-spacegray bg-neutral-850 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-display text-white tracking-tight">
              {step === 'sources' && "Select Intelligence Sources"}
              {step === 'query' && "Define Analytical Vector"}
              {step === 'building' && "Constructing Knowledge Graph"}
            </h2>
            <p className="text-sm text-gray-400 font-mono mt-1">
              {step === 'sources' && "Choose 2 primary data streams for ingestion."}
              {step === 'query' && "Select the query pattern to apply to the dataset."}
              {step === 'building' && "Processing streams and resolving entities..."}
            </p>
          </div>
          <div className="flex gap-2">
            <div className={`w-2 h-2 rounded-full ${step === 'sources' ? 'bg-purpose-gold' : 'bg-gray-700'}`}></div>
            <div className={`w-2 h-2 rounded-full ${step === 'query' ? 'bg-purpose-gold' : 'bg-gray-700'}`}></div>
            <div className={`w-2 h-2 rounded-full ${step === 'building' ? 'bg-purpose-gold' : 'bg-gray-700'}`}></div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto bg-neutral-900/50">
          <AnimatePresence mode="wait">
            {step === 'sources' && (
              <motion.div 
                key="sources"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {DATA_SOURCES.map(source => {
                  const Icon = iconMap[source.icon] || Globe;
                  const isSelected = selectedSources.includes(source.id);
                  const isDisabled = !isSelected && selectedSources.length >= 2;

                  return (
                    <div 
                      key={source.id}
                      onClick={() => !isDisabled && handleSourceSelect(source.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all relative group ${
                        isSelected 
                          ? 'bg-purpose-gold/10 border-purpose-gold' 
                          : isDisabled 
                            ? 'opacity-50 cursor-not-allowed border-spacegray' 
                            : 'bg-neutral-850 border-spacegray hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-md ${isSelected ? 'bg-purpose-gold text-black' : 'bg-neutral-800 text-gray-400'}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className={`font-medium ${isSelected ? 'text-purpose-gold' : 'text-white'}`}>{source.name}</h3>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{source.description}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                              source.type === 'public' ? 'bg-blue-500/20 text-blue-400' :
                              source.type === 'dark' ? 'bg-red-500/20 text-red-400' :
                              'bg-amber-500/20 text-amber-400'
                            }`}>
                              {source.type}
                            </span>
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-4 right-4 text-purpose-gold">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}

            {step === 'query' && (
              <motion.div 
                key="query"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {GRAPH_QUERIES.map(query => (
                  <div 
                    key={query.id}
                    onClick={() => setSelectedQuery(query.id)}
                    className={`p-6 border rounded-lg cursor-pointer transition-all flex items-center justify-between group ${
                      selectedQuery === query.id 
                        ? 'bg-purpose-gold/10 border-purpose-gold' 
                        : 'bg-neutral-850 border-spacegray hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${selectedQuery === query.id ? 'bg-purpose-gold text-black' : 'bg-neutral-800 text-gray-400'}`}>
                        {query.focus === 'network' && <Users className="w-5 h-5" />}
                        {query.focus === 'finance' && <Database className="w-5 h-5" />}
                        {query.focus === 'infra' && <Search className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className={`text-lg font-medium ${selectedQuery === query.id ? 'text-purpose-gold' : 'text-white'}`}>{query.label}</h3>
                        <p className="text-sm text-gray-400 mt-1">{query.description}</p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedQuery === query.id ? 'border-purpose-gold bg-purpose-gold' : 'border-gray-600'
                    }`}>
                      {selectedQuery === query.id && <div className="w-2 h-2 bg-black rounded-full"></div>}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {step === 'building' && (
              <motion.div 
                key="building"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-4 border-spacegray rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-purpose-gold rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Database className="w-8 h-8 text-purpose-gold animate-pulse" />
                  </div>
                </div>
                <h3 className="text-2xl font-display text-white mb-2">Ingesting Data Streams</h3>
                <p className="text-gray-400 font-mono text-sm max-w-md mx-auto">
                  Correlating entities across selected sources. Resolving identity clusters. Calculating centrality metrics...
                </p>
                
                <div className="w-full max-w-md mt-8 space-y-2">
                  <div className="flex justify-between text-xs font-mono text-gray-500 uppercase">
                    <span>Progress</span>
                    <span>72%</span>
                  </div>
                  <div className="h-1 bg-spacegray rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-purpose-gold"
                      initial={{ width: "0%" }}
                      animate={{ width: "72%" }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                    ></motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-spacegray bg-neutral-850 flex justify-end">
          {step === 'sources' && (
            <button 
              onClick={handleNext}
              disabled={selectedSources.length !== 2}
              className={`flex items-center gap-2 px-6 py-3 rounded-md font-mono text-xs uppercase tracking-widest font-bold transition-all ${
                selectedSources.length === 2 
                  ? 'bg-purpose-gold text-black hover:bg-white' 
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          )}
          
          {step === 'query' && (
            <button 
              onClick={handleNext}
              disabled={!selectedQuery}
              className={`flex items-center gap-2 px-6 py-3 rounded-md font-mono text-xs uppercase tracking-widest font-bold transition-all ${
                selectedQuery
                  ? 'bg-purpose-gold text-black hover:bg-white' 
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              Build Graph <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

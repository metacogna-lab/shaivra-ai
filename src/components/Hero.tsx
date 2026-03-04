import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, User, Building2, Globe, Shield, Database } from 'lucide-react';
import { ZenEnsoSwordIcon } from './ui/Icons';
import HomepageGraphSimulation from './HomepageGraphSimulation';
import { portalApi } from '../services/portalApi';

interface HeroProps {
  onExplore: () => void;
  onMission: () => void;
  onRequestAccess: () => void;
  onPipeline: () => void;
}

const Hero: React.FC<HeroProps> = ({ onExplore, onMission, onRequestAccess, onPipeline }) => {
  const [showSimulation, setShowSimulation] = useState(false);
  const [seedData, setSeedData] = useState({ target: '', sectors: [] as string[], focus: '' });
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<string[]>(['PERSON', 'ORG']);

  const [runId, setRunId] = useState<string | null>(null);

  const handleStartSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (seedData.target) {
      setShowSimulation(true);
      try {
        const sectorStr = seedData.sectors.join(', ');
        const { runId } = await portalApi.startAgentInvestigation(seedData.target, sectorStr, seedData.focus, selectedEntityTypes);
        setRunId(runId);
      } catch (error) {
        console.error("Investigation Error", error);
      }
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-40">
      
      <AnimatePresence>
        {showSimulation && (
          <HomepageGraphSimulation 
            onClose={() => {
              setShowSimulation(false);
              setRunId(null);
            }} 
            seed={seedData}
            runId={runId}
            entityTypes={selectedEntityTypes}
          />
        )}
      </AnimatePresence>

      <div className="container max-w-7xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">
        
        {/* Shaded Container with Light Animation */}
        <motion.div 
            className="relative bg-neutral-900/30 backdrop-blur-xl border border-white/10 rounded-3xl p-12 md:p-16 shadow-2xl overflow-hidden w-full"
            initial={{ borderColor: "rgba(255, 255, 255, 0.05)" }}
            animate={{ borderColor: ["rgba(255, 255, 255, 0.05)", "rgba(245, 158, 11, 0.3)", "rgba(255, 255, 255, 0.05)"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
            {/* Ambient Light Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none"></div>

            {/* Moving Light Sheen */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                initial={{ x: '-150%' }}
                animate={{ x: '150%' }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 5 }}
            />
            
            {/* Icon & Brand */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="relative mb-8 flex flex-col items-center justify-center gap-4"
            >
              <div className="flex items-center gap-6">
                <ZenEnsoSwordIcon className="relative w-16 h-16 md:w-24 md:h-24 text-white/90 opacity-90" />
                <span className="font-display text-5xl md:text-7xl font-bold tracking-tighter text-white/90">SHAIVRA</span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-display text-4xl md:text-6xl font-medium leading-tight tracking-tight mb-6 text-white"
            >
              Where Integrity Meets <br />
              <span className="text-cyber-cyan">Strategic Power.</span>
            </motion.h1>

            {/* Concise Subtext */}
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="max-w-2xl mx-auto text-lg md:text-xl text-text-secondary leading-relaxed mb-10"
            >
              Intelligence designed for those who lead with conscience and act with precision.
            </motion.p>

            {/* Focused CTA - Dual Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg mx-auto"
            >
              <button 
                onClick={onRequestAccess}
                className="group px-8 py-5 bg-purpose-gold text-neutral-950 font-mono text-sm uppercase tracking-[0.2em] font-bold transition-all hover:bg-white flex justify-center items-center gap-3 cursor-pointer z-50 relative"
              >
                Request Access
              </button>
              
              <button 
                onClick={onMission}
                className="group px-8 py-5 bg-transparent border border-white/20 text-white font-mono text-sm uppercase tracking-[0.2em] transition-all hover:bg-white/5 hover:border-white flex justify-center items-center gap-3 cursor-pointer z-50 relative"
              >
                Our Mission
              </button>
            </motion.div>
        </motion.div>

        {/* Explore Shaivra Section - Outside Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className="w-full mt-24 max-w-4xl mx-auto"
        >
          <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-purpose-gold/50"></div>
              <h2 className="font-display text-2xl md:text-3xl font-bold tracking-widest text-white uppercase">Explore Shaivra</h2>
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-purpose-gold/50"></div>
            </div>

            <div className="w-full bg-neutral-900/50 border border-white/5 p-8 rounded-3xl backdrop-blur-md shadow-2xl">
              <form onSubmit={handleStartSimulation} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-left">
                    <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2 ml-1 tracking-widest">Target Entity</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Global Resources Corp"
                      value={seedData.target}
                      onChange={e => setSeedData({...seedData, target: e.target.value})}
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-purpose-gold outline-none transition-all"
                      required
                    />
                  </div>
                  <div className="text-left">
                    <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2 ml-1 tracking-widest">Sectors / Domains (Multiple)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'Community', label: 'Community Groups' },
                        { id: 'Activists', label: 'Activists & NGOs' },
                        { id: 'SmallBiz', label: 'Small Organizations' },
                        { id: 'Energy', label: 'Energy & Resources' },
                        { id: 'Finance', label: 'Financial Services' },
                        { id: 'Tech', label: 'Technology & Cyber' },
                      ].map((sector) => (
                        <button
                          key={sector.id}
                          type="button"
                          onClick={() => {
                            setSeedData(prev => ({
                              ...prev,
                              sectors: prev.sectors.includes(sector.id)
                                ? prev.sectors.filter(s => s !== sector.id)
                                : [...prev.sectors, sector.id]
                            }));
                          }}
                          className={`px-3 py-2 rounded-lg border text-[10px] font-mono transition-all text-left ${
                            seedData.sectors.includes(sector.id)
                              ? 'bg-purpose-gold/10 border-purpose-gold text-purpose-gold'
                              : 'bg-neutral-950 border-white/10 text-gray-500 hover:border-white/20'
                          }`}
                        >
                          {sector.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-mono text-gray-500 uppercase ml-1 tracking-widest">Entity Focus (Find Hidden Links)</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'PERSON', label: 'People', icon: User },
                      { id: 'ORG', label: 'Orgs', icon: Building2 },
                      { id: 'LOC', label: 'Locations', icon: Globe },
                      { id: 'CYBER_THREAT', label: 'Cyber', icon: Shield },
                      { id: 'CRYPTO_WALLET', label: 'Financial', icon: Database },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setSelectedEntityTypes(prev => 
                            prev.includes(type.id) 
                              ? prev.filter(t => t !== type.id) 
                              : [...prev, type.id]
                          );
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-mono transition-all ${
                          selectedEntityTypes.includes(type.id)
                            ? 'bg-purpose-gold/20 border-purpose-gold text-purpose-gold shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                            : 'bg-neutral-950 border-white/10 text-gray-500 hover:border-white/20'
                        }`}
                      >
                        <type.icon className="w-3 h-3" />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 rounded-xl group"
                  >
                    <Activity className="w-4 h-4 text-purpose-gold group-hover:scale-110 transition-transform" />
                    Seed Live Intelligence Graph
                  </button>
                  <button 
                    type="button"
                    onClick={onPipeline}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 rounded-xl group"
                  >
                    <Activity className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                    View Ingestion Pipeline
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Subtle Scroll Hint - Outside Container */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
          <span className="text-[10px] uppercase tracking-widest text-gray-700 font-mono">Scroll for Intel</span>
          <div className="w-[1px] h-8 bg-gradient-to-b from-gray-700 to-transparent"></div>
      </motion.div>
    </section>
  );
};

export default Hero;
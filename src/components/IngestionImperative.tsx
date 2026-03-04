import React from 'react';
import { motion } from 'framer-motion';
import { GlobeIcon, DocIcon, ProcessorIcon, GraphIcon, DatabaseIcon } from './ui/Icons';

interface IngestionImperativeProps {
  onExplore?: () => void;
}

const IngestionImperative: React.FC<IngestionImperativeProps> = ({ onExplore }) => {
  const pipelineStages = [
    {
      id: 1,
      title: "Fetch",
      icon: <GlobeIcon className="w-6 h-6" />,
      desc: "Scrape global endpoints."
    },
    {
      id: 2,
      title: "Normalize",
      icon: <DatabaseIcon className="w-6 h-6" />,
      desc: "Unify data schemas."
    },
    {
      id: 3,
      title: "Extract",
      icon: <DocIcon className="w-6 h-6" />,
      desc: "NLP Entity Extraction."
    },
    {
      id: 4,
      title: "Link",
      icon: <ProcessorIcon className="w-6 h-6" />,
      desc: "Resolve Relationships."
    },
    {
      id: 5,
      title: "Insight",
      icon: <GraphIcon className="w-6 h-6" />,
      desc: "Strategic Output."
    }
  ];

  return (
    <section id="osint" className="py-40 bg-charcoal border-t border-spacegray/50 relative overflow-hidden">
      
      {/* Background Texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

      <div className="container max-w-6xl mx-auto px-6 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            
            {/* Left: Pain Point Copy */}
            <div>
                <div className="font-mono text-xs text-purpose-gold uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purpose-gold rounded-full animate-pulse"></span>
                    The Asymmetric Disadvantage
                </div>
                <h2 className="font-display text-5xl md:text-6xl font-medium text-white mb-8 leading-tight">
                    Drowning in <br/><span className="text-text-secondary">fragmented noise.</span>
                </h2>
                <div className="space-y-6 text-lg text-text-secondary">
                    <p>
                        Opposition forces leverage billion-dollar intelligence apparatuses. NGOs rely on spreadsheets and manual searches. 
                    </p>
                    <p>
                        This resource gap creates blind spots where threats mature unnoticed. Shaivra automates the collection and correlation of data that you simply do not have the manpower to process manually.
                    </p>
                </div>
                
                <div className="mt-12">
                    <button 
                    onClick={onExplore}
                    className="text-xs font-mono uppercase tracking-widest text-white border border-spacegray px-8 py-4 hover:bg-neutral-800 hover:border-purpose-gold transition-colors"
                    >
                    Access The Knowledge Graph
                    </button>
                </div>
            </div>

            {/* Right: Vertical Pipeline Visualization (More prominent) */}
            <div className="relative pl-12 border-l border-spacegray/30">
                <div className="space-y-12">
                    {pipelineStages.map((stage, i) => (
                    <motion.div
                        key={stage.id}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-8 group"
                    >
                        <div className="w-16 h-16 bg-neutral-850 border border-spacegray group-hover:border-purpose-gold transition-colors flex items-center justify-center text-white shrink-0 relative z-10">
                            {stage.icon}
                        </div>
                        
                        <div>
                            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white mb-1 group-hover:text-purpose-gold transition-colors">
                                {stage.title}
                            </h3>
                            <p className="text-sm text-text-secondary font-light">
                                {stage.desc}
                            </p>
                        </div>
                    </motion.div>
                    ))}
                </div>
            </div>

        </div>

      </div>
    </section>
  );
};

export default IngestionImperative;
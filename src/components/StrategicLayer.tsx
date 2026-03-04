import React from 'react';
import { motion } from 'framer-motion';
import { STRATEGIC_PILLARS } from '../constants';

const StrategicLayer: React.FC = () => {
  return (
    <section id="strategy" className="py-32 bg-charcoal relative border-b border-spacegray/50">
      <div className="container max-w-6xl mx-auto px-6 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          {/* Text Content - Core Prop */}
          <div>
            <span className="font-mono text-xs text-cyber-cyan uppercase tracking-widest mb-4 block">
                Core Value Proposition
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-medium mb-6 text-white leading-tight">
              Asymmetry <br/> Solved.
            </h2>
            <p className="text-base text-text-secondary leading-relaxed max-w-md mb-8">
              Achieve parity with nation-states through accessible, state-grade intelligence capabilities.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono text-white">
                <span className="px-3 py-1 border border-spacegray rounded-full">Automated Ingestion</span>
                <span className="px-3 py-1 border border-spacegray rounded-full">Deep Linkage</span>
            </div>
          </div>

          {/* Visual Stack - Simplified */}
          <div className="relative h-[300px] flex flex-col justify-center gap-4">
              {STRATEGIC_PILLARS.map((pillar, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-6 group"
                >
                    <div className={`w-1 h-full min-h-[60px] ${
                        i === 0 ? 'bg-purpose-gold' : i === 1 ? 'bg-cyber-cyan' : 'bg-alert-crimson'
                    } opacity-60 group-hover:opacity-100 transition-opacity`}></div>
                    
                    <div>
                      <h4 className="font-display text-2xl text-white mb-1 group-hover:translate-x-1 transition-transform">
                        {pillar.title}
                      </h4>
                      <p className="text-text-secondary text-sm font-light">
                        {pillar.description}
                      </p>
                    </div>
                </motion.div>
              ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default StrategicLayer;
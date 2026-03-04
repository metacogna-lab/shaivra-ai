import React from 'react';
import { motion } from 'framer-motion';
import { LockIcon, ShieldIcon, HandIcon } from './ui/Icons';

const MissionValues: React.FC = () => {
  return (
    <section id="mission" className="py-24 bg-neutral-900 border-t border-spacegray relative">
      <div className="container max-w-6xl mx-auto px-6 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 items-start">
            
            {/* Header Column */}
            <div className="md:col-span-1">
                <h3 className="font-display text-2xl text-white mb-2">Trust & <br/>Credibility</h3>
                <div className="w-12 h-1 bg-purpose-gold"></div>
            </div>

            {/* Values Columns */}
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8">
                
                <div className="group">
                    <div className="text-gray-500 group-hover:text-purpose-gold mb-4 transition-colors">
                        <LockIcon className="w-6 h-6" />
                    </div>
                    <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-2">Private</h4>
                    <p className="text-sm text-text-secondary leading-relaxed">
                        Zero-knowledge architecture ensures your data is never our product.
                    </p>
                </div>

                <div className="group">
                    <div className="text-gray-500 group-hover:text-purpose-gold mb-4 transition-colors">
                        <ShieldIcon className="w-6 h-6" />
                    </div>
                    <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-2">Auditable</h4>
                    <p className="text-sm text-text-secondary leading-relaxed">
                        Trace every insight to its source with zero black boxes.
                    </p>
                </div>

                <div className="group">
                    <div className="text-gray-500 group-hover:text-purpose-gold mb-4 transition-colors">
                        <HandIcon className="w-6 h-6" />
                    </div>
                    <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest mb-2">Aligned</h4>
                    <p className="text-sm text-text-secondary leading-relaxed">
                        Service provided strictly to those protecting the public good.
                    </p>
                </div>

            </div>
        </div>
      </div>
    </section>
  );
};

export default MissionValues;
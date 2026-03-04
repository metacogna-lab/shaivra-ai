import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PRODUCTS } from '../constants';
import { LensIcon, ForgeIcon, ShieldIcon, NodeIcon, ChevronIcon } from './ui/Icons';
import { ViewType } from '../types';

interface ProductShowcaseProps {
  onNavigate: (view: ViewType) => void;
}

const ProductShowcase: React.FC<ProductShowcaseProps> = ({ onNavigate }) => {
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  const getIcon = (type: string, className: string) => {
    switch(type) {
      case 'lens': return <LensIcon className={className} />;
      case 'forge': return <ForgeIcon className={className} />;
      case 'shield': return <ShieldIcon className={className} />;
      default: return <NodeIcon className={className} />;
    }
  };

  return (
    <section id="products" className="py-40 relative bg-neutral-900/30">
      <span id="tools" className="absolute top-0"></span> {/* Anchor for Tools nav */}
      <div className="container max-w-7xl mx-auto px-6">
        
        <div className="mb-24 text-center">
            <h2 className="font-display text-4xl font-medium text-white mb-4">The Shaivra Suite</h2>
            <p className="text-text-secondary text-sm font-mono uppercase tracking-widest">
                Integrated capabilities for the modern battlespace
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {PRODUCTS.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative p-10 bg-neutral-850 border border-spacegray hover:border-purpose-gold transition-all duration-300 flex flex-col justify-between h-[420px]"
              onMouseEnter={() => setHoveredProduct(product.id)}
              onMouseLeave={() => setHoveredProduct(null)}
            >
              <div>
                {/* Header */}
                <div className="mb-8 flex justify-between items-start">
                    <div className="text-text-secondary group-hover:text-purpose-gold transition-colors">
                        {getIcon(product.icon, "w-10 h-10")}
                    </div>
                    <span className="font-mono text-xs text-spacegray group-hover:text-purpose-gold transition-colors">0{index+1}</span>
                </div>

                <h3 className="font-display text-3xl font-medium mb-2 text-white">
                    {product.name}
                </h3>
                
                <p className="text-purpose-gold text-[10px] font-mono uppercase tracking-[0.2em] mb-6">
                    {product.tagline}
                </p>
                
                <div className="h-[1px] w-12 bg-white/10 mb-6 group-hover:w-full transition-all duration-500"></div>
              </div>

              {/* CTA */}
              <button 
                onClick={() => {
                    if (product.id === 'forge') onNavigate('forge-monitor');
                    else if (product.id === 'shield') onNavigate('shield-monitor');
                    else onNavigate(product.id as ViewType);
                }}
                className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-white group-hover:text-purpose-gold transition-colors border-t border-spacegray pt-6 w-full"
              >
                Open {product.name} Console <ChevronIcon className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
        
        {/* Bottom Navigation */}
        <div className="mt-24 flex justify-center">
             <button 
                onClick={() => onNavigate('mission')}
                className="text-xs font-mono text-gray-500 hover:text-white transition-colors border-b border-transparent hover:border-white pb-1"
             >
                View Operational Mandate &rarr;
             </button>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
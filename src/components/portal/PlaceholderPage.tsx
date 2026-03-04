import React from 'react';
import { motion } from 'framer-motion';
import { Construction, Lock, Hammer, Activity, Settings } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  description: string;
  icon: 'forge' | 'shield' | 'governance' | 'observability';
}

const iconMap = {
  forge: Hammer,
  shield: Lock,
  governance: Settings,
  observability: Activity,
};

const PlaceholderPage: React.FC<PlaceholderProps> = ({ title, description, icon }) => {
  const Icon = iconMap[icon];

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-full mb-6 relative group"
      >
        <div className="absolute inset-0 bg-purpose-gold/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        <Icon className="w-12 h-12 text-purpose-gold relative z-10" />
      </motion.div>
      
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-display font-bold text-white mb-2"
      >
        {title}
      </motion.h1>
      
      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-neutral-400 font-mono text-sm max-w-md"
      >
        {description}
      </motion.p>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 px-4 py-2 bg-neutral-800/50 border border-neutral-700 rounded-md text-xs font-mono text-neutral-500 flex items-center gap-2"
      >
        <Construction className="w-3 h-3" />
        Module Under Development // Access Restricted
      </motion.div>
    </div>
  );
};

export default PlaceholderPage;

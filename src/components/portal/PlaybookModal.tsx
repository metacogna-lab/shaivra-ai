import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, Target, Activity, ChevronRight } from 'lucide-react';
import { Playbook } from '../../contracts';

interface PlaybookModalProps {
  playbook: Playbook | null;
  onClose: () => void;
}

export const PlaybookModal: React.FC<PlaybookModalProps> = ({ playbook, onClose }) => {
  if (!playbook) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-neutral-900 border border-spacegray rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-2xl"
        >
          <div className="p-6 border-b border-spacegray flex justify-between items-center">
            <h2 className="text-xl font-display font-medium text-white">Strategic Playbook: {playbook.id}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {playbook.strategies.map(strat => (
              <div key={strat.id} className="mb-8 p-6 bg-neutral-850 rounded-lg border border-spacegray">
                <h3 className="text-lg font-display text-purpose-gold mb-2">{strat.name}</h3>
                <p className="text-sm text-gray-300 mb-6">{strat.description}</p>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-neutral-900 rounded border border-spacegray">
                    <h4 className="text-[10px] font-mono text-gray-500 uppercase">Provenance</h4>
                    <p className="text-xs text-white">{strat.rationale.signalProvenance}</p>
                  </div>
                  <div className="p-4 bg-neutral-900 rounded border border-spacegray">
                    <h4 className="text-[10px] font-mono text-gray-500 uppercase">Logic</h4>
                    <p className="text-xs text-white">{strat.rationale.strategyLogic}</p>
                  </div>
                  <div className="p-4 bg-neutral-900 rounded border border-spacegray">
                    <h4 className="text-[10px] font-mono text-gray-500 uppercase">Impact</h4>
                    <p className="text-xs text-white">{strat.rationale.impactEstimate}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button className="px-4 py-2 bg-purpose-gold text-black font-mono text-xs uppercase font-bold rounded hover:bg-white transition-colors">
                    Execute Playbook
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

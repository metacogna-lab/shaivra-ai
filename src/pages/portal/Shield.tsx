import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, AlertTriangle, Radar, Terminal, Activity, FileJson, Server } from 'lucide-react';

const ShieldPage: React.FC = () => {
  const mockContract = {
    "assessment_id": "uuid-v4",
    "target_cluster": "cluster_xyz_123",
    "threat_vectors": ["disinformation", "bot_amplification"],
    "sensitivity": "high"
  };

  const mockAlert = {
    "alert_id": "alt_99283",
    "severity": "CRITICAL",
    "vector": "coordinated_inauthentic_behavior",
    "confidence": 0.98,
    "timestamp": new Date().toISOString()
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Shield Defense Matrix</h1>
          <p className="text-neutral-400 font-mono text-sm mt-1">Automated threat response and infrastructure protection.</p>
        </div>
        <div className="px-3 py-1 bg-neutral-800 border border-neutral-700 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
          <span className="text-xs font-mono text-amber-500 uppercase">Under Development</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: API & Contract */}
        <div className="space-y-6">
          
          {/* API Endpoint Preview */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex items-center gap-2 bg-neutral-900/80">
              <Terminal className="w-4 h-4 text-purpose-gold" />
              <span className="text-sm font-medium text-white">API Endpoint Specification</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 font-mono text-sm">
                <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">POST</span>
                <span className="text-neutral-300">/v1/shield/assess</span>
              </div>
              <p className="text-xs text-neutral-500 font-mono">
                Triggers a comprehensive threat assessment on a specified data cluster.
              </p>
              <button disabled className="w-full py-2 bg-neutral-800 border border-neutral-700 text-neutral-500 rounded-lg text-xs font-mono uppercase cursor-not-allowed flex items-center justify-center gap-2">
                <Lock className="w-3 h-3" /> Endpoint Disabled
              </button>
            </div>
          </div>

          {/* Risk Intake Contract */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex items-center gap-2 bg-neutral-900/80">
              <FileJson className="w-4 h-4 text-purpose-gold" />
              <span className="text-sm font-medium text-white">Risk Assessment Contract</span>
            </div>
            <div className="p-0">
              <pre className="p-6 text-xs font-mono text-neutral-300 bg-neutral-950 overflow-x-auto">
                {JSON.stringify(mockContract, null, 2)}
              </pre>
            </div>
          </div>

        </div>

        {/* Right Column: Threat Visualization */}
        <div className="space-y-6">
            
            {/* Alert Pipeline Mock */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-neutral-800 flex items-center gap-2 bg-neutral-900/80">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-white">Alerting Pipeline Output</span>
                </div>
                <div className="p-0">
                    <pre className="p-6 text-xs font-mono text-red-400 bg-neutral-950 overflow-x-auto border-l-2 border-red-500">
                        {JSON.stringify(mockAlert, null, 2)}
                    </pre>
                </div>
            </div>

            {/* Radar Visualization Placeholder */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden flex flex-col h-64 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-48 h-48">
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 border border-neutral-800 rounded-full border-t-purpose-gold/50"
                        ></motion.div>
                         <motion.div 
                            animate={{ rotate: -360 }}
                            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-4 border border-neutral-800 rounded-full border-b-red-500/50"
                        ></motion.div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Shield className="w-8 h-8 text-neutral-600" />
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between text-xs font-mono text-neutral-500">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>SYSTEM_SECURE</span>
                    </div>
                    <span>SCANNING_VECTORS...</span>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ShieldPage;

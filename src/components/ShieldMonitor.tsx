import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowRight, Lock, Server, Database, Users, AlertTriangle, CheckCircle, Activity, Search } from 'lucide-react';
import { portalApi } from '../services/portalApi';
import { ProprietaryAsset, ShieldComparison } from '../portalTypes';

const ShieldMonitor: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState<'infrastructure' | 'personnel' | 'intellectual_property'>('infrastructure');
  const [assets, setAssets] = useState<ProprietaryAsset[]>([]);
  const [comparisons, setComparisons] = useState<ShieldComparison[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addAsset = async () => {
    if (!assetName) return;
    setIsProcessing(true);
    try {
      const res = await portalApi.uploadProprietaryAsset({ name: assetName, type: assetType });
      setAssets([...assets, res.data]);
      setAssetName('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const runAnalysis = async (assetId: string) => {
    setIsProcessing(true);
    try {
      // Simulate linking to a recent threat source
      const threatRef = `threat_${Math.random().toString(36).substr(2, 9)}`;
      const res = await portalApi.runShieldComparison(assetId, threatRef);
      setComparisons([...comparisons, res.data]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal text-white font-sans flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-white/10 bg-neutral-900/90 backdrop-blur flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <ArrowRight className="w-5 h-5 rotate-180" />
          </button>
          <div className="h-6 w-[1px] bg-white/10"></div>
          <h1 className="font-display text-lg tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-purpose-gold" />
            Shield Defense Matrix
          </h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
           <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <Lock className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-500">SECURE ENVIRONMENT</span>
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar: Asset Management */}
        <div className="w-full md:w-96 border-r border-white/10 bg-neutral-900 p-6 flex flex-col gap-8 z-20 shadow-xl overflow-y-auto">
          
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">Proprietary Asset Ingestion</h3>
            <div className="space-y-4 bg-neutral-800/50 p-4 rounded-lg border border-white/5">
              <input 
                type="text" 
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="Asset Name (e.g. Core DB)"
                className="w-full bg-neutral-950 border border-white/10 rounded p-2 text-sm text-white focus:border-purpose-gold outline-none"
              />
              <select 
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as any)}
                className="w-full bg-neutral-950 border border-white/10 rounded p-2 text-sm text-white focus:border-purpose-gold outline-none"
              >
                <option value="infrastructure">Infrastructure</option>
                <option value="personnel">Personnel</option>
                <option value="intellectual_property">Intellectual Property</option>
              </select>
              <button 
                onClick={addAsset}
                disabled={isProcessing || !assetName}
                className="w-full py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-mono uppercase tracking-wider rounded transition-colors disabled:opacity-50"
              >
                {isProcessing ? "Encrypting..." : "Secure Upload"}
              </button>
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">Secure Asset Vault</h3>
            <div className="space-y-3">
              {assets.length === 0 && (
                <div className="text-center py-8 text-gray-600 text-xs italic">No assets secured.</div>
              )}
              {assets.map(asset => (
                <div key={asset.asset_id} className="bg-neutral-800 border border-white/5 p-3 rounded flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    {asset.type === 'infrastructure' ? <Server className="w-4 h-4 text-blue-400" /> :
                     asset.type === 'personnel' ? <Users className="w-4 h-4 text-yellow-400" /> :
                     <Database className="w-4 h-4 text-purple-400" />}
                    <div>
                      <div className="text-sm font-medium text-white">{asset.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{asset.asset_id}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => runAnalysis(asset.asset_id)}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-full transition-all"
                    title="Run Threat Analysis"
                  >
                    <Activity className="w-4 h-4 text-purpose-gold" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Area: Threat Matrix */}
        <div className="flex-1 bg-neutral-950 p-8 overflow-y-auto relative">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto space-y-8 relative z-10">
            
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display text-white">Active Threat Matrix</h2>
              <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Real-time Monitoring
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence>
                {comparisons.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="h-64 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-gray-600 gap-4"
                  >
                    <Search className="w-8 h-8 opacity-50" />
                    <p className="text-sm font-mono">Select an asset to initiate threat comparison.</p>
                  </motion.div>
                )}
                
                {comparisons.map((comp) => (
                  <motion.div
                    key={comp.comparison_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-neutral-900 border ${comp.vulnerability_detected ? 'border-red-500/50' : 'border-green-500/30'} p-6 rounded-xl relative overflow-hidden`}
                  >
                    {/* Background Glow */}
                    <div className={`absolute inset-0 opacity-10 ${comp.vulnerability_detected ? 'bg-red-500' : 'bg-green-500'}`}></div>

                    <div className="relative z-10 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-xs text-gray-500 uppercase tracking-wider">Comparison ID: {comp.comparison_id}</span>
                          <span className="text-xs text-gray-600">|</span>
                          <span className="font-mono text-xs text-gray-500">{new Date(comp.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">
                          Asset Ref: <span className="font-mono text-gray-400">{comp.asset_ref}</span>
                        </h3>
                        <div className="flex items-center gap-2 mt-4">
                          {comp.vulnerability_detected ? (
                            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                              <AlertTriangle className="w-4 h-4" />
                              <span className="text-xs font-bold uppercase">Vulnerability Detected</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-xs font-bold uppercase">System Secure</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Match Score</div>
                        <div className={`text-3xl font-mono font-bold ${comp.match_score > 80 ? 'text-red-500' : 'text-green-500'}`}>
                          {comp.match_score}%
                        </div>
                      </div>
                    </div>

                    {comp.vulnerability_detected && (
                      <div className="mt-6 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">Recommended Action:</span>
                          <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors">
                            Initiate Mitigation Protocol
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ShieldMonitor;

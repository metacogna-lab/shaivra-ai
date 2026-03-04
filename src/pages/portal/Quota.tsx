import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HardDrive, Database, Shield, Zap, ArrowUpRight, Check, AlertCircle, Loader2 } from 'lucide-react';

const Quota: React.FC = () => {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('Strategic');

  const plans = [
    {
      name: 'Tactical',
      storage: '50 GB',
      retention: '30 Days',
      compute: 'Standard',
      price: '$499/mo',
      features: ['Basic OSINT', 'Single Target Pipeline', 'Standard Reporting']
    },
    {
      name: 'Strategic',
      storage: '500 GB',
      retention: '90 Days',
      compute: 'High-Performance',
      price: '$2,499/mo',
      features: ['Advanced OSINT', 'Multi-Target Pipeline', 'Strategic Synthesis', 'Graph Analysis']
    },
    {
      name: 'Sovereign',
      storage: '5 TB',
      retention: 'Unlimited',
      compute: 'Dedicated Cluster',
      price: 'Contact Sales',
      features: ['Full OSINT Network', 'Aggressive Recon', 'Predictive Modeling', 'Dedicated Support']
    }
  ];

  const handleUpgrade = (plan: string) => {
    setIsUpgrading(true);
    setTimeout(() => {
      setCurrentPlan(plan);
      setIsUpgrading(false);
    }, 2000);
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Quota & Storage Management</h1>
          <p className="text-neutral-400 font-mono text-sm mt-1">Resource Allocation // Infrastructure Scaling</p>
        </div>
      </div>

      {/* Current Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-neutral-900/50 border border-neutral-800 rounded-xl p-8">
          <h2 className="text-xs font-mono text-neutral-500 uppercase mb-6 flex items-center gap-2">
            <HardDrive className="w-3 h-3" /> Infrastructure Utilization
          </h2>
          
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-white">Encrypted Storage</span>
                <span className="text-xs font-mono text-neutral-500">342.5 GB / 500 GB (68%)</span>
              </div>
              <div className="h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '68%' }}
                  className="h-full bg-purpose-gold"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-white">Compute Units (Monthly)</span>
                <span className="text-xs font-mono text-neutral-500">1,240 / 2,500 (49%)</span>
              </div>
              <div className="h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '49%' }}
                  className="h-full bg-cyan-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-white">API Request Quota</span>
                <span className="text-xs font-mono text-neutral-500">84,102 / 100,000 (84%)</span>
              </div>
              <div className="h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '84%' }}
                  className="h-full bg-red-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
            <p className="text-xs text-red-400 leading-relaxed">
              Warning: API Request Quota is approaching its limit. Automated ingestion pipelines may be throttled once the limit is reached. Consider enhancing your quota.
            </p>
          </div>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-mono text-neutral-500 uppercase mb-6">Current Plan</h2>
            <div className="text-4xl font-display font-bold text-white mb-2">{currentPlan}</div>
            <p className="text-sm text-neutral-400">Enterprise Intelligence Tier</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-500">Next Billing</span>
              <span className="text-white">April 14, 2026</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-500">Amount</span>
              <span className="text-white">$2,499.00</span>
            </div>
            <button className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-lg transition-colors border border-neutral-700">
              View Billing History
            </button>
          </div>
        </div>
      </div>

      {/* Upgrade Options */}
      <h2 className="text-xl font-display font-bold text-white tracking-tight mt-12">Enhance Infrastructure Quota</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div 
            key={plan.name}
            className={`bg-neutral-900/50 border rounded-xl p-8 flex flex-col transition-all ${
              currentPlan === plan.name 
                ? 'border-purpose-gold ring-1 ring-purpose-gold/50' 
                : 'border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              {currentPlan === plan.name && (
                <span className="px-2 py-1 bg-purpose-gold text-neutral-950 text-[10px] font-bold rounded uppercase">Active</span>
              )}
            </div>
            
            <div className="mb-6">
              <span className="text-3xl font-bold text-white">{plan.price}</span>
              {plan.price !== 'Contact Sales' && <span className="text-xs text-neutral-500 ml-1">/ month</span>}
            </div>

            <div className="space-y-4 mb-8 flex-1">
              <div className="flex items-center gap-3 text-xs text-neutral-300">
                <HardDrive className="w-4 h-4 text-neutral-500" /> {plan.storage} Storage
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-300">
                <Database className="w-4 h-4 text-neutral-500" /> {plan.retention} Retention
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-300">
                <Zap className="w-4 h-4 text-neutral-500" /> {plan.compute} Compute
              </div>
              <div className="pt-4 border-t border-neutral-800 space-y-2">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-[11px] text-neutral-400">
                    <Check className="w-3 h-3 text-purpose-gold" /> {feature}
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => handleUpgrade(plan.name)}
              disabled={currentPlan === plan.name || isUpgrading}
              className={`w-full py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                currentPlan === plan.name
                  ? 'bg-neutral-800 text-neutral-500 cursor-default'
                  : 'bg-purpose-gold hover:bg-white text-neutral-950 shadow-lg shadow-purpose-gold/10'
              }`}
            >
              {isUpgrading && plan.name !== currentPlan ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {currentPlan === plan.name ? 'Current Plan' : 'Enhance Quota'}
                  {currentPlan !== plan.name && <ArrowUpRight className="w-4 h-4" />}
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Quota;

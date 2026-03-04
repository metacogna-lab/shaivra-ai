import React from 'react';

export const RiskPulse: React.FC = () => {
  return (
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-md">
      <h3 className="text-neutral-400 font-mono text-xs uppercase mb-4">Strategic Risk Pulse</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-neutral-500 text-xs">Narrative Risk Trend</p>
          <p className="text-white text-xl font-bold">↑ 12%</p>
        </div>
        <div>
          <p className="text-neutral-500 text-xs">Operational Drift</p>
          <p className="text-white text-xl font-bold">0.42</p>
        </div>
        <div>
          <p className="text-neutral-500 text-xs">Mission Impact</p>
          <p className="text-white text-xl font-bold">High</p>
        </div>
        <div>
          <p className="text-neutral-500 text-xs">Escalation Prob.</p>
          <p className="text-white text-xl font-bold">75%</p>
        </div>
      </div>
    </div>
  );
};

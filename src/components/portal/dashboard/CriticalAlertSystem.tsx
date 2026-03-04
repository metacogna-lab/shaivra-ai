import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

export const CriticalAlertSystem: React.FC = () => {
  return (
    <div className="bg-neutral-900 border border-red-500/20 p-4 rounded-xl shadow-lg mb-6 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-red-500 w-6 h-6" />
          <h2 className="text-white font-bold">Critical Alert: Narrative Velocity Spike</h2>
        </div>
        <div className="flex gap-2">
          <button className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm">Acknowledge</button>
          <button className="bg-neutral-800 text-white px-3 py-1 rounded-lg text-sm">Escalate</button>
        </div>
      </div>
      <p className="text-neutral-400 text-sm mt-2">New critical narrative cluster detected: Cluster X — velocity spike 58% above baseline.</p>
    </div>
  );
};

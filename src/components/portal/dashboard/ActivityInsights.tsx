import React from 'react';
import { RefreshCw, XCircle, CheckCircle } from 'lucide-react';

export const ActivityInsights: React.FC = () => {
  const jobs = [
    { title: 'Twitter Stream', status: 'Processing', quality: 'High', eta: '120s', icon: RefreshCw, color: 'text-yellow-500' },
    { title: 'Reddit nsec', status: 'Failed', quality: 'High', eta: '—', icon: XCircle, color: 'text-red-500' },
    { title: 'RSS: CISA Alerts', status: 'Complete', quality: 'High', eta: '—', icon: CheckCircle, color: 'text-green-500' },
  ];

  return (
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-md">
      <h3 className="text-neutral-400 font-mono text-xs uppercase mb-4">Activity & Insights</h3>
      <div className="space-y-4">
        {jobs.map((job, i) => (
          <div key={i} className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-3">
              <job.icon className={`w-5 h-5 ${job.color}`} />
              <div>
                <p className="text-white text-sm font-bold">{job.title}</p>
                <p className="text-neutral-500 text-xs">{job.status} • {job.quality}</p>
              </div>
            </div>
            <p className="text-neutral-400 text-sm font-mono">{job.eta}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

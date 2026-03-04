import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';

const UserAnalytics: React.FC = () => {
  const [logs, setLogs] = useState(analyticsService.getLogs());
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLogs(analyticsService.getLogs());
  }, []);

  const filteredLogs = logs.filter(log => 
    log.feature.toLowerCase().includes(filter.toLowerCase()) ||
    log.username.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">User Analytics</h1>
      <input 
        type="text"
        placeholder="Filter by feature or username..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 mb-4"
      />
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-800 text-neutral-400 uppercase text-xs">
            <tr>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Username</th>
              <th className="p-3">Feature</th>
              <th className="p-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, index) => (
              <tr key={index} className="border-t border-neutral-800">
                <td className="p-3 font-mono">{log.timestamp}</td>
                <td className="p-3">{log.username}</td>
                <td className="p-3">{log.feature}</td>
                <td className="p-3">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserAnalytics;

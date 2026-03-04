import React from 'react';

export const ClippedIntelligence: React.FC = () => {
  const clips = [
    { title: 'Infrastructure Vulnerability', summary: 'TargetCorp shows critical gaps in API security.', confidence: '0.92', tag: 'Reputation Risk' },
    { title: 'Market Entrant detected', summary: 'Competitor Alpha launched new product line.', confidence: '0.85', tag: 'Regulatory Pressure' },
  ];

  return (
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-md">
      <h3 className="text-neutral-400 font-mono text-xs uppercase mb-4">Clipped Intelligence</h3>
      <div className="grid grid-cols-1 gap-4">
        {clips.map((clip, i) => (
          <div key={i} className="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
            <p className="text-white font-bold">{clip.title}</p>
            <p className="text-neutral-400 text-sm">{clip.summary}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-neutral-500 text-xs">Conf: {clip.confidence}</span>
              <span className="text-cyan-400 text-xs bg-cyan-950/50 px-2 py-1 rounded">{clip.tag}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

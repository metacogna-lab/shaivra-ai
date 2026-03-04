import React, { useEffect, useState } from 'react';

// Renamed internally to reflect function, keeping file name to avoid breakages
const TacticalBackground: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden"
      style={{ opacity: 0.08 }} // Very subtle
    >
      <div className="relative w-[80vw] h-[80vw] max-w-[800px] max-h-[800px]">
        {/* Rotating Radar Sweep / Globe Frame */}
        <div className="absolute inset-0 border border-white/10 rounded-full animate-spin-slow" style={{ animationDuration: '60s' }}></div>
        <div className="absolute inset-12 border border-white/5 rounded-full animate-spin-slow" style={{ animationDuration: '40s', animationDirection: 'reverse' }}></div>
        <div className="absolute inset-24 border border-white/5 rounded-full"></div>
        
        {/* Crosshairs */}
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5"></div>
        <div className="absolute left-1/2 top-0 h-full w-[1px] bg-white/5"></div>

        {/* Tactical Markers */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 bg-charcoal text-[10px] text-white/20 px-2 font-mono">N 00°00'00"</div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 bg-charcoal text-[10px] text-white/20 px-2 font-mono">S 00°00'00"</div>
        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 bg-charcoal text-[10px] text-white/20 py-2 font-mono writing-vertical">W</div>
        <div className="absolute right-0 top-1/2 translate-x-1 -translate-y-1/2 bg-charcoal text-[10px] text-white/20 py-2 font-mono writing-vertical">E</div>
      </div>
    </div>
  );
};

export default TacticalBackground;
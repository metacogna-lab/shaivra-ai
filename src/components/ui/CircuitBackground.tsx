import React from 'react';
import { motion } from 'framer-motion';

const CircuitBackground: React.FC = () => {
  // Normalized coordinates 0-100
  const paths = [
    // Top Left Cluster
    "M 0 15 H 5 L 10 20 V 35",
    "M 8 0 V 8 L 12 12 H 25",
    "M 0 40 H 15 L 20 45 V 60",
    
    // Top Right Cluster
    "M 100 15 H 95 L 90 20 V 35",
    "M 92 0 V 8 L 88 12 H 75",
    "M 100 40 H 85 L 80 45 V 60",

    // Bottom Left Cluster
    "M 0 85 H 5 L 10 80 V 65",
    "M 8 100 V 92 L 12 88 H 25",
    "M 0 60 H 15 L 20 55 V 40",

    // Bottom Right Cluster
    "M 100 85 H 95 L 90 80 V 65",
    "M 92 100 V 92 L 88 88 H 75",
    "M 100 60 H 85 L 80 55 V 40",
    
    // Horizontal Data Buses
    "M 30 20 H 70",
    "M 30 80 H 70",
    "M 20 50 H 80",
    
    // Vertical Data Buses
    "M 50 20 V 80",
    "M 20 30 V 70",
    "M 80 30 V 70",
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 px-4 md:px-12 py-8">
      <div className="relative w-full h-full overflow-hidden rounded-lg">
        
        {/* Subtle Grid */}
        <div 
            className="absolute inset-0 opacity-[0.03]" 
            style={{
                backgroundImage: 'linear-gradient(#F59E0B 1px, transparent 1px), linear-gradient(90deg, #F59E0B 1px, transparent 1px)',
                backgroundSize: '60px 60px'
            }}
        ></div>

        <svg className="absolute inset-0 w-full h-full opacity-80" preserveAspectRatio="none" viewBox="0 0 100 100">
            <defs>
                <linearGradient id="pulse-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="transparent" />
                </linearGradient>
            </defs>
            
            {/* Base Traces */}
            {paths.map((d, i) => (
                <path 
                    key={`base-${i}`} 
                    d={d} 
                    stroke="#71717A" 
                    strokeWidth="0.5" 
                    fill="none" 
                    vectorEffect="non-scaling-stroke"
                    className="opacity-80"
                />
            ))}

            {/* Alive Pulses */}
            {paths.map((d, i) => (
                <motion.path
                    key={`pulse-${i}`}
                    d={d}
                    stroke="url(#pulse-gradient)"
                    strokeWidth="1.0"
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                    initial={{ pathLength: 0, pathOffset: 0, opacity: 0 }}
                    animate={{ 
                        pathLength: [0.1, 0.3, 0.1], 
                        pathOffset: [0, 1, 0],
                        opacity: [0, 1, 0]
                    }}
                    transition={{ 
                        duration: 4 + Math.random() * 6, 
                        repeat: Infinity, 
                        ease: "linear",
                        delay: Math.random() * 5,
                        repeatDelay: Math.random() * 3
                    }}
                />
            ))}
        </svg>
        
        {/* Dimensional Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(12,13,15,0.6)_100%)]"></div>
      </div>
    </div>
  );
};

export default CircuitBackground;

import React from 'react';
import { ArrowLeft, Menu, X, ChevronRight, Filter, Clock } from 'lucide-react';

// Keep UI/Navigation icons simple for usability
export const BackIcon = ({ className }: { className?: string }) => <ArrowLeft className={className} />;
export const FilterIcon = ({ className }: { className?: string }) => <Filter className={className} />;
export const ClockIcon = ({ className }: { className?: string }) => <Clock className={className} />;
export const MenuIcon = ({ className }: { className?: string }) => <Menu className={className} />;
export const CloseIcon = ({ className }: { className?: string }) => <X className={className} />;
export const ChevronIcon = ({ className }: { className?: string }) => <ChevronRight className={className} />;

// --------------------------------------------------------
// CUSTOM RUGGED ICONOGRAPHY
// --------------------------------------------------------

export const ZenEnsoSwordIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    fill="currentColor" 
    className={className}
    style={{ overflow: 'visible' }}
  >
    {/* Rugged Enso (Shattered Ring) */}
    <path 
      d="M 85 25 L 88 22 C 95 35 95 60 85 75 L 82 72 C 88 60 88 40 85 25 Z" 
      className="opacity-90"
    />
    <path 
      d="M 80 80 C 60 95 40 95 20 80 L 18 85 C 40 105 65 100 85 85 Z" 
      className="opacity-90"
    />
    <path 
      d="M 15 75 C 5 60 5 40 15 25 L 12 22 C 0 40 -2 65 10 80 Z" 
      className="opacity-90"
    />
    <path 
      d="M 20 20 C 40 5 60 5 80 20 L 82 15 C 60 -2 35 -2 15 15 Z" 
      className="opacity-90"
    />
    
    {/* The Sword (Jagged Shard) */}
    <path 
      d="M 20 85 L 25 88 L 88 15 L 82 12 L 18 82 Z" 
      className="text-white drop-shadow-md"
    />
  </svg>
);

export const LensIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    {/* Jagged Eye */}
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    <path d="M 2 12 L 0 12 M 24 12 L 22 12 M 12 2 L 12 0 M 12 24 L 12 22" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const ForgeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    {/* Heavy Hammer/Anvil */}
    <path d="M3 6h18v3h-2v10h-4v-4h-6v4H5V9H3V6zm6 5h6V9H9v2z" />
    <path d="M 10 2 L 14 2 L 13 6 L 11 6 Z" /> 
  </svg>
);

export const ShieldIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    {/* Angular Spiked Shield */}
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
  </svg>
);

export const SignalIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    {/* Jagged Pulse */}
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinejoin="miter" strokeLinecap="square" />
  </svg>
);

export const NodeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    {/* Sharp Connections */}
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

export const GraphIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
     <rect x="4" y="4" width="6" height="6" />
     <rect x="14" y="4" width="6" height="6" />
     <rect x="4" y="14" width="6" height="6" />
     <path d="M 14 17 L 10 17 M 7 10 L 7 14 M 17 10 L 17 14" />
  </svg>
);

export const LockIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
     <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM8.9 6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H8.9V6zM18 20H6V10h12v10z"/>
  </svg>
);

export const ZapIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34 4.86-9.04 5-9.34h.88l-1 7h3.5c.58 0 .57.32.38.66-.19.34-4.86 9.04-5 9.34z"/>
  </svg>
);

export const ScaleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    {/* Rugged Balance Scales */}
    <path d="M 12 2 L 14 6 L 10 6 Z" />
    <path d="M 12 5 L 12 22 M 6 10 L 18 10" stroke="currentColor" strokeWidth="2" />
    <path d="M 6 10 L 3 16 L 9 16 Z" opacity="0.8" />
    <path d="M 18 10 L 15 16 L 21 16 Z" opacity="0.8" />
  </svg>
);

export const GlobeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    {/* Broken/Rugged Globe */}
    <circle cx="12" cy="12" r="9" strokeDasharray="4 2" />
    <path d="M 3 12 L 21 12" />
    <path d="M 12 3 C 15 8 15 16 12 21" />
    <path d="M 12 3 C 9 8 9 16 12 21" />
  </svg>
);

export const HandIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    {/* Abstract Geometric Hand */}
    <path d="M 12 10 L 12 2 L 14 4 L 14 10 Z" />
    <path d="M 16 10 L 16 4 L 18 6 L 18 10 Z" />
    <path d="M 8 10 L 8 4 L 10 6 L 10 10 Z" />
    <path d="M 4 12 L 4 18 L 12 22 L 20 18 L 20 12 Z" opacity="0.8" />
  </svg>
);

// New Technical Icons
export const DocIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M 4 2 L 14 2 L 20 8 L 20 22 L 4 22 Z" strokeLinejoin="bevel" />
    <path d="M 14 2 L 14 8 L 20 8" />
    <path d="M 8 12 L 16 12" />
    <path d="M 8 16 L 14 16" />
  </svg>
);

export const DatabaseIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M 21 12 C 21 13.66 16.97 15 12 15 C 7.03 15 3 13.66 3 12" />
    <path d="M 3 5 L 3 19 C 3 20.66 7.03 22 12 22 C 16.97 22 21 20.66 21 19 L 21 5" />
    <path d="M 21 12 L 21 5" opacity="0" /> {/* Spacer */}
  </svg>
);

export const ProcessorIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <rect x="4" y="4" width="16" height="16" strokeLinejoin="bevel" />
    <rect x="9" y="9" width="6" height="6" fill="currentColor" opacity="0.5" />
    <path d="M 9 1 L 9 4" />
    <path d="M 15 1 L 15 4" />
    <path d="M 9 20 L 9 23" />
    <path d="M 15 20 L 15 23" />
    <path d="M 1 9 L 4 9" />
    <path d="M 1 15 L 4 15" />
    <path d="M 20 9 L 23 9" />
    <path d="M 20 15 L 23 15" />
  </svg>
);

export const ScanIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M 2 7 L 2 2 L 7 2" />
    <path d="M 17 2 L 22 2 L 22 7" />
    <path d="M 22 17 L 22 22 L 17 22" />
    <path d="M 7 22 L 2 22 L 2 17" />
    <path d="M 2 12 L 22 12" strokeDasharray="2 2" />
  </svg>
);

// Graph Filters (Keep simple or standard for clarity in small UI)
export const PersonIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
);
export const OrgIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2z"/></svg>
);
export const EventIcon = ({ className }: { className?: string }) => (
   <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>
);
export const PolicyIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
);
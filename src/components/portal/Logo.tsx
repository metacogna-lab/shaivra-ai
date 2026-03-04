import React from 'react';
import { ZenEnsoSwordIcon } from '../ui/Icons';

export const PortalLogo: React.FC = () => {
  return (
    <div className="flex items-center gap-3">
      <ZenEnsoSwordIcon className="w-8 h-8 text-purpose-gold" />
      <span className="font-display text-xl font-bold text-white tracking-tighter">SHAIVRA</span>
    </div>
  );
};

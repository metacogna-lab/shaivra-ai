import React from 'react';
import { APP_NAME } from '../constants';
import { ViewType } from '../types';

interface FooterProps {
  onNavigate: (view: ViewType) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer id="contact" className="bg-charcoal pt-24 pb-12 border-t border-white/5 relative z-10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
          
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 bg-cyber-cyan rounded-full animate-pulse"></div>
              <span 
                className="font-display text-2xl font-bold tracking-tighter uppercase text-white cursor-pointer hover:text-purpose-gold transition-colors"
                onClick={() => onNavigate('landing')}
              >
                {APP_NAME}
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">
              Boutique private intelligence for the aligned sector. 
              Empowering those who protect the public good with visibility and resilience.
            </p>
            <div className="flex gap-4">
               {/* Affiliation Badges - Visual Only */}
               <div className="w-8 h-8 rounded-full border border-spacegray bg-neutral-850 flex items-center justify-center text-[8px] text-gray-600 font-mono cursor-default" title="ISO Compliant">ISO</div>
               <div className="w-8 h-8 rounded-full border border-spacegray bg-neutral-850 flex items-center justify-center text-[8px] text-gray-600 font-mono cursor-default" title="GDP Protocol">GDP</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-16">
            <div>
              <h5 className="font-display text-sm font-bold uppercase tracking-widest text-white mb-6">Capabilities</h5>
              <ul className="space-y-4 text-sm text-text-secondary">
                <li><button onClick={() => onNavigate('lens')} className="hover:text-cyber-cyan transition-colors text-left">OSINT Pipeline</button></li>
                <li><button onClick={() => onNavigate('landing')} className="hover:text-cyber-cyan transition-colors text-left">Platform Suite</button></li>
                <li><button onClick={() => onNavigate('landing')} className="hover:text-cyber-cyan transition-colors text-left">Strategic Layer</button></li>
              </ul>
            </div>
             <div>
              <h5 className="font-display text-sm font-bold uppercase tracking-widest text-white mb-6">Mandate</h5>
              <ul className="space-y-4 text-sm text-text-secondary">
                <li><button onClick={() => onNavigate('mission')} className="hover:text-cyber-cyan transition-colors text-left">Mission & Values</button></li>
                <li><button onClick={() => onNavigate('mission')} className="hover:text-cyber-cyan transition-colors text-left">Ethics Charter</button></li>
                <li><button onClick={() => onNavigate('mission')} className="hover:text-cyber-cyan transition-colors text-left">Community</button></li>
              </ul>
            </div>
            <div>
              <h5 className="font-display text-sm font-bold uppercase tracking-widest text-white mb-6">Access</h5>
              <ul className="space-y-4 text-sm text-text-secondary">
                <li><span className="text-gray-600 cursor-not-allowed">Client Portal (Private)</span></li>
                <li><span className="text-gray-600 cursor-not-allowed">Request Demo</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 text-xs text-gray-600 uppercase tracking-wider font-mono">
          <p>&copy; {new Date().getFullYear()} Shaivra Intelligence. Systems Active.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span className="hover:text-gray-400 cursor-pointer">Privacy</span>
            <span className="hover:text-gray-400 cursor-pointer">Terms</span>
            <span className="hover:text-gray-400 cursor-pointer">Signal Protocol</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
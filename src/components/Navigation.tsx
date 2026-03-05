import React, { useState, useEffect } from 'react';
import { APP_NAME, NAVIGATION_ITEMS } from '../constants';
import { Menu, X } from 'lucide-react';
import { ZenEnsoSwordIcon } from './ui/Icons';
import { ViewType } from '../contracts';
import { Link } from 'react-router-dom';

interface NavigationProps {
  onNavigate: (view: ViewType) => void;
  currentView: ViewType;
  onRequestAccess: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onNavigate, currentView, onRequestAccess }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    
    // Internal Routing Logic
    if (id === 'mission') onNavigate('mission');
    else if (id === 'lens') onNavigate('lens');
    else if (id === 'forge') onNavigate('forge');
    else if (id === 'shield') onNavigate('shield');
    else if (id === 'explorer') onNavigate('explorer');
    else if (id === 'projects') onNavigate('projects');
    else {
        onNavigate('landing');
    }
  };

  return (
    <nav 
      className={`fixed top-8 left-4 right-4 md:left-12 md:right-12 z-50 transition-all duration-500 border-b rounded-t-lg ${
        isScrolled || currentView !== 'landing'
          ? 'glass-panel border-glass-border py-4' 
          : 'bg-transparent border-transparent py-8'
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onNavigate('landing')}
        >
          <ZenEnsoSwordIcon className="w-10 h-10 text-purpose-gold group-hover:scale-110 transition-transform duration-300" />
          <span className="font-display text-2xl font-bold tracking-tighter text-white uppercase select-none group-hover:text-purpose-gold transition-colors">
            {APP_NAME}
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10">
          {NAVIGATION_ITEMS.map((item) => (
            <a 
              key={item.label}
              href={`#${item.id}`}
              onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick(item.id, e);
              }}
              className="text-xs uppercase tracking-[0.2em] font-bold text-text-secondary hover:text-purpose-gold transition-colors duration-300 relative group"
            >
              {item.label}
              <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-purpose-gold transition-all duration-300 group-hover:w-full"></span>
            </a>
          ))}
          <button 
            onClick={onRequestAccess}
            className="px-6 py-2 border border-purpose-gold text-purpose-gold hover:bg-purpose-gold hover:text-black transition-all duration-300 rounded-sm text-[10px] uppercase tracking-widest font-bold"
          >
            Request Access
          </button>
          <Link 
            to="/portal/login" 
            className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 hover:text-white transition-colors"
          >
            Login
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full glass-panel border-b border-glass-border p-8 flex flex-col gap-8">
           {NAVIGATION_ITEMS.map((item) => (
            <a 
              key={item.label}
              href="#"
              className="text-2xl font-display text-gray-300 hover:text-purpose-gold"
              onClick={(e) => handleLinkClick(item.id, e)}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navigation;

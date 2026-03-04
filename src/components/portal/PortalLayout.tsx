import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, Database, Hammer, Lock, Activity, Settings, LogOut, HardDrive, Zap, BarChart3, Bot, FileText, Search, Building2, Layers, TrendingUp, Folder } from 'lucide-react';
import { motion } from 'framer-motion';

const PortalLayout: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-800 flex flex-col bg-neutral-900/50 backdrop-blur-sm">
        <div className="p-6 border-b border-neutral-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-purpose-gold rounded-md flex items-center justify-center text-neutral-950">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-white">SHAIVRA PORTAL</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <div className="text-xs font-mono text-neutral-500 uppercase px-3 py-2 mt-2">Core Systems</div>
          
          <Link to="/portal/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/portal/dashboard') ? 'bg-neutral-800 text-purpose-gold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>

          <Link to="/portal/lens" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/portal/lens') ? 'bg-neutral-800 text-purpose-gold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>
            <Database className="w-4 h-4" />
            <span className="text-sm font-medium">Lens (Ingestion)</span>
          </Link>

          <Link to="/portal/recon" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/portal/recon') ? 'bg-neutral-800 text-purpose-gold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Advanced Recon</span>
          </Link>

          <Link to="/portal/analytics" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/portal/analytics') ? 'bg-neutral-800 text-purpose-gold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm font-medium">Intelligence Analytics</span>
          </Link>

          <Link to="/portal/bot" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/portal/bot') ? 'bg-neutral-800 text-purpose-gold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>
            <Bot className="w-4 h-4" />
            <span className="text-sm font-medium">Autonomous Bot</span>
          </Link>

          <Link to="/portal/reports" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/portal/reports') ? 'bg-neutral-800 text-purpose-gold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Daily Reports</span>
          </Link>

          <Link to="/portal/weekly-reports" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/portal/weekly-reports') ? 'bg-neutral-800 text-purpose-gold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>
            <Layers className="w-4 h-4" />
            <span className="text-sm font-medium">Weekly Reviews</span>
          </Link>

          <Link to="/portal/trends" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/portal/trends') ? 'bg-neutral-800 text-purpose-gold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Trends</span>
          </Link>

          <Link to="/portal/search" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/portal/search') ? 'bg-neutral-800 text-purpose-gold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>
            <Search className="w-4 h-4" />
            <span className="text-sm font-medium">Global Search</span>
          </Link>

          <Link to="/portal/projects" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/portal/projects') ? 'bg-neutral-800 text-purpose-gold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>
            <Folder className="w-4 h-4" />
            <span className="text-sm font-medium">Projects</span>
          </Link>

          <Link to="/portal/org-profiler" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/portal/org-profiler') ? 'bg-neutral-800 text-purpose-gold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-medium">Org Profiler</span>
          </Link>

          <Link to="/portal/forge" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/portal/forge') ? 'bg-neutral-800 text-purpose-gold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>
            <Hammer className="w-4 h-4" />
            <span className="text-sm font-medium">Forge (Analysis)</span>
          </Link>

          <Link to="/portal/shield" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/portal/shield') ? 'bg-neutral-800 text-purpose-gold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">Shield (Defense)</span>
          </Link>

          <div className="text-xs font-mono text-neutral-500 uppercase px-3 py-2 mt-6">Administration</div>

          <Link to="/portal/observability" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/portal/observability') ? 'bg-neutral-800 text-purpose-gold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium">Observability</span>
          </Link>

          <Link to="/portal/governance" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/portal/governance') ? 'bg-neutral-800 text-purpose-gold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Governance</span>
          </Link>

          <Link to="/portal/quota" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/portal/quota') ? 'bg-neutral-800 text-purpose-gold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>
            <HardDrive className="w-4 h-4" />
            <span className="text-sm font-medium">Quota & Storage</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-mono text-neutral-400">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">Analyst Demo</div>
              <div className="text-xs text-neutral-500 truncate">analyst@shaivra.io</div>
            </div>
            <Link to="/" className="text-neutral-500 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-neutral-950 relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <div className="relative z-10 p-8 max-w-7xl mx-auto">
            <Outlet />
        </div>
      </main>
    </div>
  );
};

export default PortalLayout;

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './src/components/Navigation';
import Hero from './src/components/Hero';
import ProductShowcase from './src/components/ProductShowcase';
import StrategicLayer from './src/components/StrategicLayer';
import MissionValues from './src/components/MissionValues';
import IngestionImperative from './src/components/IngestionImperative';
import Footer from './src/components/Footer';
import AnimatedBackground from './src/components/ui/AnimatedBackground';
import LionBackground from './src/components/ui/LionBackground';
import CircuitBackground from './src/components/ui/CircuitBackground';
import KnowledgeGraphExplorer from './src/components/KnowledgeGraphExplorer';
import MissionBrief from './src/components/MissionBrief';
import ToolDetail from './src/components/ToolDetail';
import PipelineMonitor from './src/components/PipelineMonitor';
import ForgeMonitor from './src/components/ForgeMonitor';
import ShieldMonitor from './src/components/ShieldMonitor';
import CampaignAnalysis from './src/components/CampaignAnalysis';
import AgentNetworkMonitor from './src/components/AgentNetworkMonitor';
import Projects from './src/components/Projects';
import { ViewType } from './src/contracts';

// Portal Imports
import PortalLayout from './src/components/portal/PortalLayout';
import PortalLogin from './src/pages/portal/Login';
import Onboarding from './src/pages/portal/Onboarding';
import OnboardingConfirmation from './src/pages/portal/OnboardingConfirmation';
import Dashboard from './src/pages/portal/Dashboard';
import Lens from './src/pages/portal/Lens';
import Forge from './src/pages/portal/Forge';
import ShieldPage from './src/pages/portal/Shield';
import Quota from './src/pages/portal/Quota';
import AdvancedRecon from './src/pages/portal/AdvancedRecon';
import IntelligenceAnalytics from './src/pages/portal/IntelligenceAnalytics';
import AutonomousBot from './src/pages/portal/AutonomousBot';
import DailyReports from './src/pages/portal/DailyReports';
import WeeklyReports from './src/pages/portal/WeeklyReports';
import Trends from './src/pages/portal/Trends';
import GlobalSearch from './src/pages/portal/GlobalSearch';
import OrgProfiler from './src/pages/portal/OrgProfiler';
import UserAnalytics from './src/pages/portal/UserAnalytics';
import PlaceholderPage from './src/components/portal/PlaceholderPage';
import RequestAccessModal from './src/components/RequestAccessModal';

const LandingApp: React.FC = () => {
  const [view, setView] = useState<ViewType>('landing');
  const [isRequestAccessOpen, setIsRequestAccessOpen] = useState(false);

  const handleNavigate = (newView: ViewType) => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setView(newView);
  };

  return (
    <div className="relative min-h-screen bg-charcoal text-white selection:bg-purpose-gold selection:text-black font-sans">
      {/* Global Frame with Increased Margin */}
      <div className="fixed inset-0 pointer-events-none z-[100] px-4 md:px-12 py-8">
        <div className="w-full h-full border border-glass-border/50 rounded-lg relative">
             {/* Corner Marks */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-purpose-gold/50"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-purpose-gold/50"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-purpose-gold/50"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-purpose-gold/50"></div>
        </div>
      </div>

      <LionBackground />
      <AnimatedBackground />
      
      <RequestAccessModal isOpen={isRequestAccessOpen} onClose={() => setIsRequestAccessOpen(false)} />

      <AnimatePresence>
        {view === 'landing' && (
            <motion.div
                key="circuit-bg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="fixed inset-0 z-0"
            >
                <CircuitBackground />
            </motion.div>
        )}
      </AnimatePresence>

      <Navigation 
        onNavigate={handleNavigate} 
        currentView={view} 
        onRequestAccess={() => setIsRequestAccessOpen(true)}
      />

      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <main>
              <Hero 
                onExplore={() => setView('explorer')} 
                onMission={() => setView('mission')} 
                onRequestAccess={() => setIsRequestAccessOpen(true)}
                onPipeline={() => setView('pipeline')}
              />
              <IngestionImperative onExplore={() => setView('explorer')} />
              <ProductShowcase onNavigate={handleNavigate} />
              <StrategicLayer />
              <MissionValues />
            </main>
            <Footer onNavigate={handleNavigate} />
          </motion.div>
        )}

        {view === 'explorer' && (
          <motion.div
            key="explorer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal"
          >
            <KnowledgeGraphExplorer onBack={() => setView('landing')} />
          </motion.div>
        )}

        {view === 'pipeline' && (
          <motion.div
            key="pipeline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal"
          >
            <PipelineMonitor onBack={() => setView('landing')} onNavigate={(v) => setView(v as ViewType)} />
          </motion.div>
        )}

        {view === 'forge-monitor' && (
          <motion.div
            key="forge-monitor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal"
          >
            <ForgeMonitor onBack={() => setView('landing')} onNavigate={(v) => setView(v as ViewType)} />
          </motion.div>
        )}

        {view === 'shield-monitor' && (
          <motion.div
            key="shield-monitor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal"
          >
            <ShieldMonitor onBack={() => setView('landing')} />
          </motion.div>
        )}

        {view === 'campaign-analysis' && (
          <motion.div
            key="campaign-analysis"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal"
          >
            <CampaignAnalysis onBack={() => setView('landing')} />
          </motion.div>
        )}

        {view === 'agent-network' && (
          <motion.div
            key="agent-network"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal"
          >
            <AgentNetworkMonitor onBack={() => setView('landing')} />
          </motion.div>
        )}

        {view === 'projects' && (
          <motion.div
            key="projects"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal overflow-y-auto"
          >
            <Projects />
          </motion.div>
        )}

        {view === 'mission' && (
            <motion.div
                key="mission"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="relative z-40"
            >
                <MissionBrief onBack={() => setView('landing')} />
                <Footer onNavigate={handleNavigate} />
            </motion.div>
        )}

        {(view === 'lens' || view === 'forge' || view === 'shield') && (
            <motion.div
                key="tool"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-40"
            >
                <ToolDetail toolId={view} onBack={() => setView('landing')} />
                <Footer onNavigate={handleNavigate} />
            </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/portal/login" element={<PortalLogin />} />
        <Route path="/portal/onboarding" element={<Onboarding />} />
        <Route path="/portal/onboarding/confirmation" element={<OnboardingConfirmation />} />
        <Route path="/portal" element={<PortalLayout />}>
            <Route index element={<Navigate to="/portal/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="lens" element={<Lens />} />
            <Route path="recon" element={<AdvancedRecon />} />
            <Route path="analytics" element={<IntelligenceAnalytics />} />
            <Route path="bot" element={<AutonomousBot />} />
            <Route path="reports" element={<DailyReports />} />
            <Route path="weekly-reports" element={<WeeklyReports />} />
            <Route path="trends" element={<Trends />} />
            <Route path="search" element={<GlobalSearch />} />
            <Route path="org-profiler" element={<OrgProfiler />} />
            <Route path="user-analytics" element={<UserAnalytics />} />
            <Route path="forge" element={<Forge />} />
            <Route path="shield" element={<ShieldPage />} />
            <Route path="quota" element={<Quota />} />
            <Route path="governance" element={<PlaceholderPage title="Governance" description="Policy enforcement and audit logging." icon="governance" />} />
            <Route path="observability" element={<PlaceholderPage title="Observability" description="System health monitoring and distributed tracing." icon="observability" />} />
        </Route>
        <Route path="/*" element={<LandingApp />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

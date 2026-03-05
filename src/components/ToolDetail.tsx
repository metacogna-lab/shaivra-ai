import React from 'react';
import { motion } from 'framer-motion';
import { BackIcon, LensIcon, ForgeIcon, ShieldIcon, ScanIcon, ZapIcon, ScaleIcon, GlobeIcon, DatabaseIcon, ProcessorIcon, DocIcon } from './ui/Icons';
import { ViewType } from '../contracts';

interface ToolDetailProps {
  toolId: 'lens' | 'forge' | 'shield';
  onBack: () => void;
}

const ToolDetail: React.FC<ToolDetailProps> = ({ toolId, onBack }) => {
  
  const content = {
      lens: {
          title: "Shaivra LENS",
          icon: <LensIcon className="w-16 h-16 text-white" />,
          subtitle: "Omniscient Observation",
          theory: "Intelligence is not about data volume; it is about signal clarity. Lens aggregates millions of unstructured data points—from corporate filings to dark web chatter—and resolves them into a unified, queryable knowledge graph.",
          desc: "The Shaivra Lens engine continuously ingests data from over 40,000 global sources. It uses advanced NLP to detect entities, sentiment, and relationships that human analysts miss. For NGOs, this means the ability to see the full supply chain of an illicit operation or the hidden funding network behind a policy shift.",
          capabilities: [
              { title: "Multi-Vector Ingestion", desc: "Simultaneous scraping of open web, deep web, and leaks.", icon: <DatabaseIcon className="w-5 h-5" /> },
              { title: "Entity Resolution", desc: "Disambiguates 'John Smith' from 'J. Smith' across borders.", icon: <ProcessorIcon className="w-5 h-5" /> },
              { title: "Sentiment Mapping", desc: "Geospatial heatmaps of public sentiment trends.", icon: <GlobeIcon className="w-5 h-5" /> },
              { title: "Visual Forensics", desc: "Metadata analysis and deepfake detection on media.", icon: <ScanIcon className="w-5 h-5" /> }
          ],
          caseStudy: {
              title: "Field Report: Illegal Logging Ring",
              quote: "\"Lens allowed us to link the shipping manifest data from three different ports to a single shell company in Panama. We visualized the entire network in seconds, saving months of manual investigation.\"",
              author: "Lead Investigator, Rainforest Watch Alliance"
          },
          stat: "240GB / Day"
      },
      forge: {
          title: "Shaivra FORGE",
          icon: <ForgeIcon className="w-16 h-16 text-white" />,
          subtitle: "Narrative Engineering",
          theory: "In the modern information war, truth alone is insufficient. It must be delivered with precision. Forge simulates the information ecosystem to predict how narratives will travel, allowing you to optimize your impact before you release a single word.",
          desc: "Forge provides a sandbox for influence operations. By modeling the audience's psychographic profile and the network topology of social platforms, Forge helps mission-driven organizations craft messages that penetrate echo chambers. It moves beyond 'awareness' to 'strategic outcome'.",
          capabilities: [
              { title: "Viral Simulation", desc: "Predict the K-factor of a campaign before launch.", icon: <ZapIcon className="w-5 h-5" /> },
              { title: "Node Targeting", desc: "Identify the specific influencers who bridge communities.", icon: <ProcessorIcon className="w-5 h-5" /> },
              { title: "Narrative A/B", desc: "Test message resonance against synthetic audience models.", icon: <DocIcon className="w-5 h-5" /> },
              { title: "Bot Detection", desc: "Filter out inorganic amplification to see real traction.", icon: <ShieldIcon className="w-5 h-5" /> }
          ],
          caseStudy: {
              title: "Field Report: Public Health Initiative",
              quote: "\"We were fighting a massive disinformation campaign. Forge helped us identify the five key nodes spreading the falsehoods and design a counter-narrative that neutralized the rumor within 48 hours.\"",
              author: "Comms Director, Global Health Corp"
          },
          stat: "94% Accuracy"
      },
      shield: {
          title: "Shaivra SHIELD",
          icon: <ShieldIcon className="w-16 h-16 text-white" />,
          subtitle: "Active Defense",
          theory: "To disrupt the status quo is to invite attack. Shield is not passive antivirus; it is an active counter-measure system that hardens your digital perimeter and detects threats before they breach the wall.",
          desc: "Shield provides enterprise-grade security for organizations with limited IT resources. It constantly scans for leaked credentials, monitors for domain spoofing, and employs adaptive honeypots to confuse attackers. It ensures that your investigation survives to see the light of day.",
          capabilities: [
              { title: "Attack Surface Map", desc: "Real-time visualization of all exposed digital assets.", icon: <GlobeIcon className="w-5 h-5" /> },
              { title: "Leak Detection", desc: "Instant alerts if staff credentials appear in dumps.", icon: <ScanIcon className="w-5 h-5" /> },
              { title: "Honeypot Deploys", desc: "Decoy servers to trap and analyze intruder tactics.", icon: <DatabaseIcon className="w-5 h-5" /> },
              { title: "Reputation Guard", desc: "Automated flagging of smear campaigns and doxxing.", icon: <ScaleIcon className="w-5 h-5" /> }
          ],
          caseStudy: {
              title: "Field Report: Investigative Consortium",
              quote: "\"Two days before our exposé went live, we saw a massive spike in phishing attempts. Shield flagged them instantly and auto-locked the targeted accounts. The story ran on time.\"",
              author: "Editor in Chief, The Transparency Project"
          },
          stat: "< 10ms Latency"
      }
  };

  const data = content[toolId];

  return (
    <div className="relative min-h-screen bg-charcoal pt-32 pb-20">
      <div className="container max-w-6xl mx-auto px-6 relative z-10">
        
        <button onClick={onBack} className="flex items-center gap-3 text-text-secondary hover:text-purpose-gold transition-colors mb-12 group">
            <BackIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-mono text-xs uppercase tracking-widest">Return to Suite</span>
        </button>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-24 items-center">
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-neutral-850 border border-spacegray flex items-center justify-center text-purpose-gold">
                        {data.icon}
                    </div>
                    <div className="w-[1px] h-12 bg-spacegray"></div>
                    <div className="font-mono text-purpose-gold text-sm uppercase tracking-[0.2em]">
                        {data.subtitle}
                    </div>
                </div>
                
                <h1 className="font-display text-6xl lg:text-7xl text-white font-medium mb-8 leading-none">{data.title}</h1>
                
                <div className="space-y-6 text-lg text-text-secondary leading-relaxed">
                    <p className="font-medium text-white">{data.theory}</p>
                    <p>{data.desc}</p>
                </div>
            </motion.div>

            {/* Visual / Stat Block */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
                <div className="absolute -inset-4 border border-spacegray/50 rounded-lg"></div>
                <div className="relative bg-neutral-850 border border-spacegray aspect-video flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(245,158,11,0.03)_50%,transparent_75%,transparent_100%)] bg-[length:40px_40px] animate-pulse-slow"></div>
                    <div className="text-center">
                         <div className="text-5xl font-display font-bold text-white mb-2">{data.stat}</div>
                         <div className="text-xs font-mono text-purpose-gold uppercase tracking-widest">System Throughput</div>
                    </div>
                    
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-purpose-gold"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-purpose-gold"></div>
                </div>
            </motion.div>
        </div>

        {/* Capabilities Grid */}
        <div className="mb-24">
            <h3 className="font-mono text-white text-sm uppercase tracking-widest mb-10 pb-4 border-b border-spacegray flex justify-between items-center">
                <span>Technical Specifications</span>
                <span className="text-xs text-gray-500">v3.4.1 Stable</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {data.capabilities.map((cap, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group bg-neutral-900/50 p-6 border border-spacegray hover:border-purpose-gold/50 transition-all duration-300"
                    >
                        <div className="mb-4 text-text-secondary group-hover:text-purpose-gold transition-colors">
                            {cap.icon}
                        </div>
                        <h4 className="font-display text-lg text-white mb-3">{cap.title}</h4>
                        <p className="text-sm text-text-secondary leading-relaxed">{cap.desc}</p>
                    </motion.div>
                ))}
            </div>
        </div>

        {/* Case Study */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-neutral-850 border border-spacegray p-12 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-4">
                <ScanIcon className="w-24 h-24 text-spacegray/20" />
            </div>
            
            <div className="relative z-10 max-w-3xl">
                <div className="font-mono text-xs text-cyber-cyan uppercase tracking-widest mb-4">
                    {data.caseStudy.title}
                </div>
                <blockquote className="font-display text-2xl text-white italic leading-relaxed mb-6">
                    {data.caseStudy.quote}
                </blockquote>
                <div className="flex items-center gap-4">
                    <div className="w-8 h-[1px] bg-purpose-gold"></div>
                    <span className="text-sm text-text-secondary font-mono uppercase">{data.caseStudy.author}</span>
                </div>
            </div>
        </motion.div>

      </div>
    </div>
  );
};

export default ToolDetail;

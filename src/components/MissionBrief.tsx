import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Ghost, Scale, Eye, Zap, Lock, Heart, Globe, Activity } from 'lucide-react';

interface MissionBriefProps {
  onBack: () => void;
}

const MissionBrief: React.FC<MissionBriefProps> = ({ onBack }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="relative min-h-screen bg-charcoal pt-32 pb-20 overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

      <div className="container max-w-5xl mx-auto px-6 relative z-10">
        
        {/* Navigation */}
        <button 
            onClick={onBack} 
            className="flex items-center gap-3 text-gray-500 hover:text-purpose-gold transition-colors mb-16 group"
        >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-mono text-xs uppercase tracking-widest">Return to Base</span>
        </button>

        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-24"
        >

            {/* Header Section */}
            <motion.section variants={itemVariants} className="border-l-2 border-purpose-gold pl-8 relative">
                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-purpose-gold rounded-full blur-sm opacity-50"></div>
                <h1 className="font-display text-5xl md:text-7xl text-white font-medium mb-6 tracking-tight">
                    Operational Mandate
                </h1>
                <p className="text-xl md:text-2xl text-gray-400 leading-relaxed max-w-3xl font-light">
                    Strategic intelligence for organizations that serve the <span className="text-white font-medium">public good</span>.
                </p>
                <div className="mt-8 inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-sm">
                    <p className="font-mono text-xs text-purpose-gold uppercase tracking-widest">
                        "Asymmetric advantage for the aligned."
                    </p>
                </div>
            </motion.section>

            {/* Philosophy: Light & Dark */}
            <motion.section variants={itemVariants} className="grid grid-cols-1 md:grid-cols-12 gap-12">
                <div className="md:col-span-4">
                    <h2 className="font-mono text-purpose-gold text-sm uppercase tracking-widest mb-4">01. The Philosophy</h2>
                    <h3 className="font-display text-3xl text-white">Shadow & Light</h3>
                </div>
                <div className="md:col-span-8 prose prose-invert prose-lg text-gray-400">
                    <p>
                        In an increasingly opaque world, true impact requires more than just good intent—it requires <span className="text-white">vision in the dark</span>. 
                        Shaivra exists to bridge this gap, integrating the discipline of elite intelligence with the purpose of ethical progress.
                    </p>
                    <p>
                        We operate in the shadows so our partners can stand in the light. By applying the tradecraft of state-grade operations to the mission of humanitarian and environmental defense, we correct the asymmetry of power.
                    </p>
                </div>
            </motion.section>

            {/* The Holistic Entity */}
            <motion.section variants={itemVariants} className="bg-neutral-900/50 border border-white/5 p-8 md:p-12 rounded-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5">
                    <Shield className="w-64 h-64" />
                </div>
                <div className="relative z-10">
                    <h2 className="font-mono text-gray-500 text-sm uppercase tracking-widest mb-6">02. The Entity</h2>
                    <h3 className="font-display text-3xl text-white mb-6">Holistic Intelligence</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-gray-400">
                        <div>
                            <p className="mb-4">
                                Shaivra is not merely a toolset; it is a holistic operational partner. We function as a force multiplier, providing the protective infrastructure that allows benevolent organizations to operate safely in hostile environments.
                            </p>
                            <p>
                                We do not serve everyone. We serve the <span className="text-white">aligned</span>. Our capabilities are reserved exclusively for those dedicated to the preservation of life, truth, and dignity.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <Eye className="w-5 h-5 text-purpose-gold mt-1 shrink-0" />
                                <p className="text-sm"><strong>Total Visibility:</strong> Illuminating threats before they materialize.</p>
                            </div>
                            <div className="flex items-start gap-4">
                                <Scale className="w-5 h-5 text-purpose-gold mt-1 shrink-0" />
                                <p className="text-sm"><strong>Ethical Precision:</strong> Action guided by strict moral alignment.</p>
                            </div>
                            <div className="flex items-start gap-4">
                                <Lock className="w-5 h-5 text-purpose-gold mt-1 shrink-0" />
                                <p className="text-sm"><strong>Sovereign Defense:</strong> Protecting the data and integrity of the mission.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Objectives */}
            <motion.section variants={itemVariants}>
                <div className="text-center mb-16">
                    <h2 className="font-display text-4xl md:text-5xl text-white mb-6">"We protect the sacred."</h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Our mandate is to empower those who fight for the future.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { icon: Heart, title: "Humanitarian Defense", desc: "Shielding vulnerable communities from physical and digital harm." },
                        { icon: Globe, title: "Ecological Preservation", desc: "Providing intelligence to protect critical environmental assets." },
                        { icon: Zap, title: "Systemic Accountability", desc: "Exposing corruption and disrupting systems of exploitation." },
                        { icon: Activity, title: "Operational Resilience", desc: "Ensuring the continuity of mission-critical organizations." }
                    ].map((obj, i) => (
                        <div key={i} className="bg-neutral-850 p-6 border border-white/5 hover:border-purpose-gold/30 transition-colors group">
                            <obj.icon className="w-8 h-8 text-gray-600 group-hover:text-purpose-gold transition-colors mb-4" />
                            <h4 className="font-display text-lg text-white mb-2">{obj.title}</h4>
                            <p className="text-sm text-gray-500 leading-relaxed">{obj.desc}</p>
                        </div>
                    ))}
                </div>
            </motion.section>

            {/* Values & Standards */}
            <motion.section variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div>
                    <h2 className="font-mono text-purpose-gold text-sm uppercase tracking-widest mb-8">03. Core Values</h2>
                    <ul className="space-y-6">
                        {[
                            { label: "Alignment First", desc: "We only engage when the mission serves the greater good." },
                            { label: "Quiet Professionalism", desc: "Competence speaks for itself. We value results over recognition." },
                            { label: "Defensive Dominance", desc: "We use superior intelligence to prevent harm, not to inflict it." },
                            { label: "Radical Discretion", desc: "The safety of our partners depends on our silence." },
                            { label: "Long-Term Vision", desc: "We build for generational impact, not quarterly cycles." }
                        ].map((val, i) => (
                            <li key={i} className="flex items-start gap-4 border-b border-white/5 pb-6 last:border-0">
                                <span className="font-mono text-purpose-gold/50 text-xs mt-1">0{i+1}</span>
                                <div>
                                    <h4 className="text-white font-medium mb-1">{val.label}</h4>
                                    <p className="text-sm text-gray-500">{val.desc}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h2 className="font-mono text-purpose-gold text-sm uppercase tracking-widest mb-8">04. Operational Standards</h2>
                    <div className="space-y-8">
                        <div className="bg-neutral-900 p-6 border-l-2 border-tactical-green">
                            <h4 className="text-white font-display text-xl mb-2">The Circle of Protection</h4>
                            <p className="text-sm text-gray-400">Every operation begins with a comprehensive assessment of safety, ensuring our actions shield rather than expose.</p>
                        </div>
                        <div className="bg-neutral-900 p-6 border-l-2 border-cyber-cyan">
                            <h4 className="text-white font-display text-xl mb-2">The Ghost Step</h4>
                            <p className="text-sm text-gray-400">We maintain a minimal footprint. Our interventions are designed to be decisive yet untraceable, preserving operational security.</p>
                        </div>
                        <div className="bg-neutral-900 p-6 border-l-2 border-alert-crimson">
                            <h4 className="text-white font-display text-xl mb-2">The Mirror of Truth</h4>
                            <p className="text-sm text-gray-400">Rigorous internal review ensures that our methods remain as noble as our ends. We hold ourselves to the highest ethical standard.</p>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Footer */}
            <motion.section variants={itemVariants} className="pt-24 border-t border-white/10 text-center">
                <div className="mb-12">
                    <h2 className="font-display text-3xl md:text-4xl text-white mb-4">Call to Alignment</h2>
                    <p className="text-gray-400 max-w-xl mx-auto">
                        To those who build, heal, and protect: <span className="text-white">we are your shield.</span><br/>
                        To those who exploit and oppress: <span className="text-white">we are your shadow.</span>
                    </p>
                </div>

                <div className="inline-block relative py-8 px-12 border-y border-purpose-gold/30">
                    <p className="font-display text-2xl md:text-3xl text-purpose-gold tracking-wide italic">
                        “From stillness, we strike.<br/>
                        From silence, we shape.”
                    </p>
                </div>

                <div className="mt-16 text-xs font-mono text-gray-600">
                    SHAIVRA INTELLIGENCE CORE // EST. 2025
                </div>
            </motion.section>

        </motion.div>
      </div>
    </div>
  );
};

export default MissionBrief;
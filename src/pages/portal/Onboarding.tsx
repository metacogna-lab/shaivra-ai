import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, Loader2, CheckCircle, Lock, Server } from 'lucide-react';
import { portalApi } from '../../services/portalApi';
import { OnboardingRequest } from '../../portalTypes';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<OnboardingRequest>({
    email: '',
    organization_name: '',
    intended_use_case: 'threat_intelligence',
    market_segment: '',
    consent: false,
    phone_number: '',
    role_title: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await portalApi.register(formData);
      // Pass the response data (including demo temp password) to the confirmation page
      navigate('/portal/onboarding/confirmation', { state: { registration: response.data, email: formData.email } });
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please check your inputs and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purpose-gold/5 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purpose-gold rounded-lg flex items-center justify-center shadow-lg shadow-purpose-gold/20">
              <span className="font-display font-bold text-neutral-950 text-xl">S</span>
            </div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">Portal Access Request</h1>
          </div>
          <p className="text-neutral-400 font-mono text-sm max-w-lg mx-auto">
            Secure onboarding for the Shaivra Intelligence Suite. 
            Access is restricted to authorized organizations.
          </p>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col md:flex-row">
            
            {/* Left Panel: Form */}
            <div className="p-8 md:w-2/3 border-r border-neutral-800">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Server className="w-4 h-4 text-purpose-gold" /> Organization Details
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-neutral-500 uppercase mb-1">Work Email *</label>
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="analyst@organization.com"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-purpose-gold focus:outline-none transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-neutral-500 uppercase mb-1">Organization Name *</label>
                      <input 
                        type="text" 
                        name="organization_name"
                        value={formData.organization_name}
                        onChange={handleChange}
                        placeholder="Acme Corp Global"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-purpose-gold focus:outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purpose-gold" /> Access Scope
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-neutral-500 uppercase mb-1">Intended Use Case *</label>
                      <select 
                        name="intended_use_case"
                        value={formData.intended_use_case}
                        onChange={handleChange}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-purpose-gold focus:outline-none transition-colors"
                      >
                        <option value="threat_intelligence">Threat Intelligence</option>
                        <option value="market_analysis">Market Analysis</option>
                        <option value="narrative_monitoring">Narrative Monitoring</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-neutral-500 uppercase mb-1">Market Segment *</label>
                      <input 
                        type="text" 
                        name="market_segment"
                        value={formData.market_segment}
                        onChange={handleChange}
                        placeholder="e.g. Finance, Defense"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-purpose-gold focus:outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-800">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        name="consent"
                        checked={formData.consent}
                        onChange={handleChange}
                        className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-neutral-600 bg-neutral-900 transition-all checked:border-purpose-gold checked:bg-purpose-gold"
                        required
                      />
                      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-950 opacity-0 peer-checked:opacity-100">
                        <CheckCircle className="h-3 w-3" />
                      </div>
                    </div>
                    <span className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors">
                      I consent to the processing of organization data for identity verification and access provisioning. 
                      I acknowledge the <span className="text-purpose-gold underline">Zero Knowledge Architecture</span> policy.
                    </span>
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-white hover:bg-neutral-200 text-neutral-950 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Request Access
                </button>

              </form>
            </div>

            {/* Right Panel: Trust & Policy */}
            <div className="p-8 md:w-1/3 bg-neutral-950/50 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase mb-2 flex items-center gap-2">
                    <Lock className="w-3 h-3 text-green-500" /> Zero Knowledge
                  </h4>
                  <p className="text-[10px] text-neutral-500 leading-relaxed">
                    Shaivra utilizes a Zero Knowledge Architecture. Your raw data payloads are processed in ephemeral enclaves and never persisted in plaintext.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-xs font-bold text-white uppercase mb-2 flex items-center gap-2">
                    <Shield className="w-3 h-3 text-blue-500" /> Data Sovereignty
                  </h4>
                  <p className="text-[10px] text-neutral-500 leading-relaxed">
                    All generated intelligence artifacts remain the sole property of the tenant organization. We do not resell or aggregate your data.
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white uppercase mb-2 flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-purpose-gold" /> Compliance
                  </h4>
                  <ul className="text-[10px] text-neutral-500 space-y-1">
                    <li>• SOC 2 Type II Ready</li>
                    <li>• GDPR / CCPA Compliant</li>
                    <li>• ISO 27001 Aligned</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-800">
                <p className="text-[10px] text-neutral-600 font-mono text-center">
                  ID: {Math.random().toString(36).substr(2, 8).toUpperCase()}
                </p>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;

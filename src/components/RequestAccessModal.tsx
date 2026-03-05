import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, ArrowRight, Loader2, CheckCircle, Lock, Server } from 'lucide-react';
import { portalApi } from '../services/portalApi';
import { emailService } from '../services/emailService';
import { OnboardingRequest } from '../contracts';

interface RequestAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RequestAccessModal: React.FC<RequestAccessModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<OnboardingRequest>({
    email: '',
    organization_name: '',
    consent: false,
    phone_number: '',
    role_title: '',
    key_field: ''
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
      // Register
      await portalApi.register(formData);
      
      // Notify Admin
      await emailService.sendAdminSignupEmail(formData.email, formData.organization_name);
      
      onClose();
      // Navigate to confirmation page
      navigate('/portal/onboarding/confirmation', { state: { email: formData.email } });
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please check your inputs and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]">
              
              {/* Header */}
              <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purpose-gold rounded-lg flex items-center justify-center">
                    <span className="font-display font-bold text-neutral-950 text-lg">S</span>
                  </div>
                  <h2 className="font-display font-bold text-xl text-white tracking-tight">Request Access</h2>
                </div>
                <button 
                  onClick={onClose}
                  className="text-neutral-500 hover:text-white transition-colors p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Form Section */}
                <div className="p-6 md:w-2/3 overflow-y-auto">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Server className="w-3 h-3 text-purpose-gold" /> Organization Details
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Work Email *</label>
                          <input 
                            type="email" 
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="analyst@organization.com"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-purpose-gold focus:outline-none transition-colors"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Organization Name *</label>
                          <input 
                            type="text" 
                            name="organization_name"
                            value={formData.organization_name}
                            onChange={handleChange}
                            placeholder="Acme Corp Global"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-purpose-gold focus:outline-none transition-colors"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Lock className="w-3 h-3 text-purpose-gold" /> Security & Identity
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-4">
                         <div>
                          <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Organization Key / ID (Optional)</label>
                          <input 
                            type="password" 
                            name="key_field"
                            value={formData.key_field}
                            onChange={handleChange}
                            placeholder="••••••••••••"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-purpose-gold focus:outline-none transition-colors"
                          />
                          <p className="text-[10px] text-neutral-600 mt-1">
                            If you have a pre-provisioned organization key, enter it here.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-800">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center pt-0.5">
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
                        <span className="text-[10px] text-neutral-400 group-hover:text-neutral-300 transition-colors leading-tight">
                          I consent to processing for identity verification. 
                          <br/>Protected by <span className="text-purpose-gold">Zero Knowledge Architecture</span>.
                        </span>
                      </label>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-white hover:bg-neutral-200 text-neutral-950 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                      Submit Request
                    </button>

                  </form>
                </div>

                {/* Info Panel */}
                <div className="hidden md:flex flex-col justify-between p-6 w-1/3 bg-neutral-950 border-l border-neutral-800">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-bold text-white uppercase mb-2 flex items-center gap-2">
                        <Lock className="w-3 h-3 text-green-500" /> Zero Knowledge
                      </h4>
                      <p className="text-[10px] text-neutral-500 leading-relaxed">
                        Raw data payloads are processed in ephemeral enclaves and never persisted in plaintext.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-[10px] font-bold text-white uppercase mb-2 flex items-center gap-2">
                        <Shield className="w-3 h-3 text-blue-500" /> Data Sovereignty
                      </h4>
                      <p className="text-[10px] text-neutral-500 leading-relaxed">
                        Intelligence artifacts remain the sole property of the tenant organization.
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-neutral-800">
                    <p className="text-[10px] text-neutral-600 font-mono text-center">
                      SECURE CHANNEL<br/>ENCRYPTED
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RequestAccessModal;

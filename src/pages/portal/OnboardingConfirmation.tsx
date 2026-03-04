import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, ArrowRight, Lock, Terminal } from 'lucide-react';
import { OnboardingResponse } from '../../portalTypes';

const OnboardingConfirmation: React.FC = () => {
  const location = useLocation();
  const state = location.state as { registration: OnboardingResponse; email: string } | undefined;

  if (!state) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
        <p>No registration data found. Please return to onboarding.</p>
        <Link to="/portal/onboarding" className="ml-4 text-purpose-gold underline">Go Back</Link>
      </div>
    );
  }

  const { registration, email } = state;

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20 shadow-lg shadow-green-500/10">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Registration Successful</h1>
          <p className="text-neutral-400 font-mono text-sm mt-2">
            Your organization identity has been provisioned.
          </p>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl mb-8">
          <div className="p-8 space-y-6">
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-blue-400 mb-1">Check Your Email</h3>
                <p className="text-xs text-blue-300/80 leading-relaxed">
                  A confirmation link and temporary credentials have been sent to <span className="font-mono text-white">{email}</span>.
                  Please verify your account within 24 hours.
                </p>
              </div>
            </div>

            {/* DEMO ONLY: Simulated Email Content */}
            <div className="border border-neutral-800 rounded-lg overflow-hidden">
              <div className="bg-neutral-950 px-4 py-2 border-b border-neutral-800 flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-500 uppercase flex items-center gap-2">
                  <Terminal className="w-3 h-3" /> Demo Environment: Simulated Email
                </span>
                <span className="text-[10px] font-mono text-neutral-600">INTERNAL_DEBUG_VIEW</span>
              </div>
              <div className="p-4 bg-neutral-900/30 font-mono text-xs space-y-3">
                <div className="flex justify-between border-b border-neutral-800 pb-2">
                  <span className="text-neutral-500">Subject:</span>
                  <span className="text-white">Welcome to Shaivra Portal - Action Required</span>
                </div>
                <div className="space-y-2 text-neutral-300">
                  <p>Hello,</p>
                  <p>Your access request has been approved. Use the following temporary credentials to initialize your account:</p>
                  
                  <div className="bg-neutral-950 p-3 rounded border border-neutral-800 my-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-neutral-500">User ID:</span>
                      <span className="text-purpose-gold">{registration.user_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Temp Password:</span>
                      <span className="text-white font-bold select-all">{registration.demo_temp_password}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-neutral-500">
                    Trace ID: {registration.trace_id}<br/>
                    Expires: {new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()}
                  </p>
                </div>
              </div>
            </div>

            <Link 
              to="/portal/login" 
              className="w-full bg-white hover:bg-neutral-200 text-neutral-950 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 group"
            >
              <Lock className="w-4 h-4" />
              Proceed to Login
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingConfirmation;

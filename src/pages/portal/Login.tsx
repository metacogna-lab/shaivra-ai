import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { portalApi } from '../../services/portalApi';
import { Turnstile } from '../../components/portal/Turnstile';

const PortalLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresReset, setRequiresReset] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      setError('Please complete the security verification.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const response = await portalApi.login(email, password, turnstileToken);
      
      if ((response as any).status === 'requires_reset') {
        setRequiresReset(true);
      } else if (response.token) {
        navigate('/portal/dashboard');
      } else {
        setError('Invalid credentials');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await portalApi.resetPassword({
        email,
        temp_password: password,
        new_password: newPassword
      });
      
      // Auto-login after reset
      const response = await portalApi.login(email, newPassword);
      if (response.token) {
        navigate('/portal/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purpose-gold/5 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-purpose-gold rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purpose-gold/20">
            <span className="font-display font-bold text-neutral-950 text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Portal Access</h1>
          <p className="text-neutral-400 font-mono text-sm mt-2">Authorized Personnel Only</p>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          
          {!requiresReset ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-mono text-neutral-500 uppercase mb-2">Username</label>
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="shaivra-ai"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-purpose-gold focus:outline-none transition-colors placeholder:text-neutral-700"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-mono text-neutral-500 uppercase mb-2">Key</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-purpose-gold focus:outline-none transition-colors placeholder:text-neutral-700"
                  required
                />
              </div>

              <Turnstile onVerify={setTurnstileToken} />

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-2 text-red-400 text-xs font-mono bg-red-500/10 p-3 rounded-lg border border-red-500/20"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-purpose-gold hover:bg-white text-neutral-950 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purpose-gold/20 hover:shadow-purpose-gold/40"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Authenticate
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-white font-bold">Security Update Required</h3>
                <p className="text-xs text-neutral-400 mt-1">Please set a new secure password to activate your account.</p>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-500 uppercase mb-2">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 12 chars"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-purpose-gold focus:outline-none transition-colors placeholder:text-neutral-700"
                  required
                  minLength={12}
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-500 uppercase mb-2">Confirm Password</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-purpose-gold focus:outline-none transition-colors placeholder:text-neutral-700"
                  required
                />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-2 text-red-400 text-xs font-mono bg-red-500/10 p-3 rounded-lg border border-red-500/20"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-purpose-gold hover:bg-white text-neutral-950 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purpose-gold/20 hover:shadow-purpose-gold/40"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Update & Login
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-neutral-800 text-center">
            <p className="text-[10px] text-neutral-600 font-mono uppercase tracking-wider">
              Protected by Shaivra Shield v2.4
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PortalLogin;

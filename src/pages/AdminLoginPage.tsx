import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Eye,
  EyeOff,
  LogIn,
  ArrowLeft,
  ChevronDown,
  Info,
  Mail,
} from 'lucide-react';
import { loginAdmin } from '../services/hospitalPartnerService';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    setLoading(true);
    setTimeout(() => {
      const ok = loginAdmin(email.trim(), password);
      setLoading(false);
      if (ok) {
        navigate('/admin', { replace: true });
      } else {
        setError('Invalid credentials. Please check the demo credentials below.');
      }
    }, 600);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-12">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fbbf24 1px, transparent 1px), linear-gradient(to bottom, #fbbf24 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <button
          onClick={() => navigate('/role-select')}
          className="flex items-center gap-2 text-slate-500 hover:text-amber-400 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Role Selection
        </button>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-600 to-amber-500 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-amber-100 text-xs font-medium tracking-widest uppercase">MediBridge AI</p>
                <h1 className="text-white text-xl font-bold leading-tight">Platform Admin Console</h1>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="admin@medibridge.ai"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-10 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-slate-500 transition-all"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter admin password"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-10 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-slate-500 transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm bg-red-900/30 border border-red-800/50 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 disabled:opacity-60 text-white font-semibold text-sm rounded-lg px-4 py-3 transition-all shadow-lg shadow-amber-900/40"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Authenticating…' : 'Sign In to Admin Console'}
            </button>
          </form>

          <div className="px-8 pb-7">
            <button
              onClick={() => setShowHint(v => !v)}
              className="w-full flex items-center justify-between text-slate-500 hover:text-slate-300 text-xs bg-slate-800/60 rounded-lg px-3 py-2.5 transition-colors border border-slate-800"
            >
              <span className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                Demo credentials — click to reveal
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHint ? 'rotate-180' : ''}`} />
            </button>
            {showHint && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 bg-slate-950/80 rounded-lg border border-slate-800 p-4 space-y-3"
              >
                <p className="text-xs text-amber-400 font-semibold uppercase tracking-wide">Demo / Prototype Credentials</p>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>Email: <code className="text-amber-300">admin@medibridge.ai</code></div>
                  <div>Password: <code className="text-amber-300">MediBridge@2026</code></div>
                </div>
                <button
                  type="button"
                  onClick={() => { setEmail('admin@medibridge.ai'); setPassword('MediBridge@2026'); setShowHint(false); }}
                  className="w-full text-xs bg-amber-900/40 hover:bg-amber-800/50 text-amber-300 rounded-md px-3 py-1.5 transition-colors border border-amber-800/50"
                >
                  Auto-fill demo credentials
                </button>
              </motion.div>
            )}
          </div>
        </div>

        <p className="text-center text-slate-700 text-xs mt-6">
          MediBridge AI · Platform Admin Console · Restricted Access
        </p>
      </motion.div>
    </div>
  );
};

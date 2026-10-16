import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  Eye,
  EyeOff,
  LogIn,
  ArrowLeft,
  ChevronDown,
  Info,
  ShieldCheck,
} from 'lucide-react';
import {
  loginHospital,
  getHospitals,
  getActiveHospitalId,
} from '../services/hospitalPartnerService';

export const HospitalLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const hospitals = getHospitals();
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(
    () => getActiveHospitalId() || hospitals[0]?.id || ''
  );
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const selectedHospital = hospitals.find(h => h.id === selectedHospitalId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!selectedHospitalId) { setError('Please select your hospital.'); return; }
    if (!pin.trim()) { setError('Please enter your access PIN.'); return; }
    setLoading(true);
    setTimeout(() => {
      const ok = loginHospital(selectedHospitalId, pin.trim());
      setLoading(false);
      if (ok) {
        navigate('/hospital', { replace: true });
      } else {
        setError('Incorrect PIN. Please check the demo credentials below.');
      }
    }, 600);
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4 py-12">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
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
          className="flex items-center gap-2 text-slate-400 hover:text-sky-400 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Role Selection
        </button>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-sky-600 to-sky-500 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sky-100 text-xs font-medium tracking-widest uppercase">MediBridge AI</p>
                <h1 className="text-white text-xl font-bold leading-tight">Hospital Partner Portal</h1>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Select your hospital</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={selectedHospitalId}
                  onChange={e => { setSelectedHospitalId(e.target.value); setError(''); }}
                  className="w-full appearance-none bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-10 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                >
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {selectedHospital && (
                <p className="mt-1.5 text-slate-500 text-xs">
                  {selectedHospital.address}, {selectedHospital.district}
                </p>
              )}
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Access PIN</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={e => { setPin(e.target.value); setError(''); }}
                  placeholder="Enter your PIN"
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-10 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent placeholder:text-slate-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
              className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 disabled:opacity-60 text-white font-semibold text-sm rounded-lg px-4 py-3 transition-all shadow-lg shadow-sky-900/40"
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
              {loading ? 'Signing in…' : 'Sign In to Hospital Portal'}
            </button>
          </form>

          <div className="px-8 pb-7">
            <button
              onClick={() => setShowHint(v => !v)}
              className="w-full flex items-center justify-between text-slate-400 hover:text-slate-200 text-xs bg-slate-700/50 rounded-lg px-3 py-2.5 transition-colors border border-slate-700"
            >
              <span className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-sky-400" />
                Demo credentials — click to reveal
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHint ? 'rotate-180' : ''}`} />
            </button>
            {showHint && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 bg-slate-950/60 rounded-lg border border-slate-700 p-4 space-y-3"
              >
                <p className="text-xs text-amber-400 font-semibold uppercase tracking-wide">Demo / Prototype Credentials</p>
                {hospitals.map(h => (
                  <div key={h.id} className="text-xs text-slate-400">
                    <span className="text-slate-200 font-medium">{h.name}</span>
                    <span className="ml-2">ID: <code className="text-sky-300">{h.id}</code></span>
                  </div>
                ))}
                <div className="border-t border-slate-700 pt-2 text-xs text-slate-400">
                  PIN for all hospitals: <code className="text-sky-300 text-sm font-bold">1234</code>
                </div>
                <button
                  type="button"
                  onClick={() => { setPin('1234'); setShowHint(false); }}
                  className="w-full text-xs bg-sky-900/40 hover:bg-sky-800/50 text-sky-300 rounded-md px-3 py-1.5 transition-colors border border-sky-800/50"
                >
                  Auto-fill PIN → 1234
                </button>
              </motion.div>
            )}
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          MediBridge AI · Hospital Partner Platform · Demo Mode
        </p>
      </motion.div>
    </div>
  );
};

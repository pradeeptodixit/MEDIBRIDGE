import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Shield,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { MediBridgeLogo } from './MediBridgeLogo';
import {
  getHospitals,
  setActiveHospitalId,
  setUserRole,
  type UserRole,
} from '../../services/hospitalPartnerService';

interface RoleSelectionScreenProps {
  onSelectRole: (role: UserRole, hospitalId?: string) => void;
  currentRole?: UserRole | null;
}

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({
  onSelectRole,
  currentRole,
}) => {
  const hospitals = getHospitals();
  const [showHospitalSelector, setShowHospitalSelector] = useState(false);
  const [selectedHospitalForModal, setSelectedHospitalForModal] = useState<string>(
    hospitals[0]?.id || 'dh-sitapur'
  );

  const handlePatientSelect = () => {
    setUserRole('patient');
    onSelectRole('patient');
  };

  const handleHospitalSelect = (hospitalId: string) => {
    setActiveHospitalId(hospitalId);
    setUserRole('hospital');
    onSelectRole('hospital', hospitalId);
  };

  const handleAdminSelect = () => {
    setUserRole('admin');
    onSelectRole('admin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-teal-950 to-slate-950 text-white flex flex-col justify-between relative overflow-hidden py-8 px-4 sm:px-6 lg:px-8">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with MediBridge Brand */}
      <div className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MediBridgeLogo animated />
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-black text-white text-xl sm:text-2xl tracking-tight">
                MediBridge
              </span>
              <span className="text-teal-400 font-extrabold text-lg sm:text-xl tracking-wide">
                AI
              </span>
            </div>
            <p className="text-[11px] text-teal-300/80 font-medium hidden sm:block">
              Intelligent Healthcare Navigation &amp; Connected Partner Network
            </p>
          </div>
        </div>

        {currentRole && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
            <span>Currently:</span>
            <span className="font-bold text-teal-400 capitalize">{currentRole}</span>
          </div>
        )}
      </div>

      {/* Center Role Choice */}
      <div className="relative z-10 max-w-4xl mx-auto w-full my-auto py-8">
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-4"
          >
            <Sparkles size={13} className="text-teal-400 animate-pulse" />
            <span>Welcome to MediBridge AI</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-tight"
          >
            Are you a Patient or a Hospital?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-slate-300 text-sm sm:text-base mt-3 max-w-xl mx-auto"
          >
            Select your portal to access personalized clinical assistance or manage institutional healthcare operations and referral tracking.
          </motion.p>
        </div>

        {/* The Two Main Cards: Patient & Hospital */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* 🧑 Patient Option */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="relative group bg-gradient-to-b from-slate-800/90 to-slate-900/90 hover:from-teal-900/50 hover:to-slate-900/90 border border-slate-700/80 hover:border-teal-500/60 rounded-3xl p-7 transition-all duration-200 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  🧑
                </div>
                <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Citizen Care
                </span>
              </div>

              <h2 className="font-display font-black text-2xl text-white mb-2 group-hover:text-teal-300 transition-colors">
                Patient Portal
              </h2>

              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                Access AI symptom triage, verified medical guidance, emergency 108/112 escalation, family health management, and government health schemes.
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 size={14} className="text-teal-400 shrink-0" />
                  <span>Clinical AI Triage &amp; Red-Flag Warnings</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 size={14} className="text-teal-400 shrink-0" />
                  <span>Nearby Public Facility &amp; Specialist Matching</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 size={14} className="text-teal-400 shrink-0" />
                  <span>Family Circle Records &amp; Government Schemes</span>
                </div>
              </div>
            </div>

            <button
              onClick={handlePatientSelect}
              className="w-full py-3.5 px-5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-teal-500/30 cursor-pointer"
            >
              <span>Enter as Patient</span>
              <ArrowRight size={16} />
            </button>
          </motion.div>

          {/* 🏥 Hospital Option */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="relative group bg-gradient-to-b from-slate-800/90 to-slate-900/90 hover:from-sky-900/50 hover:to-slate-900/90 border border-slate-700/80 hover:border-sky-500/60 rounded-3xl p-7 transition-all duration-200 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-16 h-16 rounded-2xl bg-sky-500/20 border border-sky-500/40 text-sky-300 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  🏥
                </div>
                <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Partner Portal
                </span>
              </div>

              <h2 className="font-display font-black text-2xl text-white mb-2 group-hover:text-sky-300 transition-colors">
                Hospital Dashboard
              </h2>

              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                Monitor incoming MediBridge referrals, update treatment completion, calculate billable commission, view monthly invoices, and track payments.
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 size={14} className="text-sky-400 shrink-0" />
                  <span>Attributed Referral Pipeline (MB-REF-XXXX)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 size={14} className="text-sky-400 shrink-0" />
                  <span>Configurable Commission (e.g. 5%, 7%, 4%)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 size={14} className="text-sky-400 shrink-0" />
                  <span>Monthly Invoices &amp; Verified Payment Tracking</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleHospitalSelect(selectedHospitalForModal)}
                className="w-full py-3.5 px-5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-sky-500/30 cursor-pointer"
              >
                <span>Enter as Hospital</span>
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => setShowHospitalSelector(true)}
                className="w-full py-1 text-center text-xs text-sky-300/70 hover:text-sky-300 transition-colors cursor-pointer"
              >
                Select specific hospital account ({hospitals.length} available)
              </button>
            </div>
          </motion.div>
        </div>

        {/* Subtle Admin Portal Access */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 text-center"
        >
          <button
            onClick={handleAdminSelect}
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-teal-300 transition-colors px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
          >
            <Shield size={13} className="text-teal-400" />
            <span>MediBridge Platform Admin Access (Financial Overview &amp; Commission Rates)</span>
            <ArrowRight size={12} />
          </button>
        </motion.div>
      </div>

      {/* Footer info */}
      <div className="relative z-10 text-center text-xs text-slate-500">
        MediBridge AI Healthcare Platform • Deterministic Clinical Safety &amp; Transparent Institutional Settlement
      </div>

      {/* Hospital Account Chooser Modal (Allows selecting which hospital account to open) */}
      {showHospitalSelector && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Building2 className="text-sky-400" size={20} />
                <h3 className="font-display font-bold text-lg text-white">
                  Select Hospital Account
                </h3>
              </div>
              <button
                onClick={() => setShowHospitalSelector(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-white/5"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Each hospital operates in isolated multi-tenant mode with its own patient records, treatment bills, commission agreements, and monthly invoices.
            </p>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {hospitals.map(h => (
                <div
                  key={h.id}
                  onClick={() => setSelectedHospitalForModal(h.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedHospitalForModal === h.id
                      ? 'bg-sky-500/15 border-sky-400 ring-1 ring-sky-400/40'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{h.name}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {h.commissionRate}% comm.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span>{h.district}, {h.state}</span>
                    <span>•</span>
                    <span className="capitalize">{h.type.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  setShowHospitalSelector(false);
                  handleHospitalSelect(selectedHospitalForModal);
                }}
                className="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Log In to Hospital Dashboard</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

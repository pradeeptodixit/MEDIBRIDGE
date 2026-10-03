import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Award,
} from 'lucide-react';
import { DataProvenanceBadge } from '../components/ui/DataProvenanceBadge';

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Hero Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 mb-4">
            <Sparkles size={13} className="text-teal-600" />
            Smart India Hackathon 2026 Project
          </div>

          <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 tracking-tight">
            MediBridge AI
          </h1>
          <p className="text-xl font-bold text-teal-700 mt-2">
            From first symptom to completed care.
          </p>
          <p className="text-slate-600 text-sm sm:text-base mt-3 max-w-3xl mx-auto leading-relaxed">
            MediBridge AI is an AI-powered healthcare management and continuity platform that connects citizens, ASHA frontline workers, and healthcare facilities from first symptom to completed care — while detecting community-level health risks and referral bottlenecks.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              onClick={() => navigate('/assessment')}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-xs flex items-center gap-2"
            >
              <span>Start Health Assessment</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/impact')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
            >
              <span>Command Center</span>
            </button>
          </div>
        </div>

        {/* System Architecture Diagram */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900">
                Care Continuity &amp; Data Flow
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Connecting frontline community care with primary health centre coordination.
              </p>
            </div>
            <DataProvenanceBadge type="rule_based" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">1</div>
              <h3 className="font-bold text-sm text-slate-900">Citizen &amp; ASHA Triage</h3>
              <p className="text-slate-600 leading-relaxed">
                Bilingual voice/text symptom assessment with client-side normalizer and Groq LLM assistance.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">2</div>
              <h3 className="font-bold text-sm text-slate-900">Facility Matching</h3>
              <p className="text-slate-600 leading-relaxed">
                Scores facilities by urgency level, available services, distance, and current load.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">3</div>
              <h3 className="font-bold text-sm text-slate-900">Closed-Loop Referrals</h3>
              <p className="text-slate-600 leading-relaxed">
                Tracking ID generated and routed to PHC Care Desk for acceptance, consultation, and lab testing.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">4</div>
              <h3 className="font-bold text-sm text-slate-900">MediBridge Sentinel</h3>
              <p className="text-slate-600 leading-relaxed">
                Tracks symptom trends across demo villages and highlights unusual changes in weekly report counts.
              </p>
            </div>
          </div>
        </div>

        {/* Safety */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-teal-400" />
            <h2 className="font-display font-bold text-xl text-white">
              MediBridge Safety Guardrails
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            MediBridge is a care navigation tool — not a diagnostic platform. It does not prescribe medication or confirm conditions. Emergency keyword checks run on the client before the AI is called, and the AI cannot downgrade a result already flagged as RED.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
            <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-700">
              <span className="font-bold text-teal-300 block mb-1">✓ Non-Diagnostic Language</span>
              <span className="text-slate-300">Uses cautious phrasing ("symptom report trend", "may require clinical review", "recommended care level").</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-700">
              <span className="font-bold text-teal-300 block mb-1">✓ Zero Client Secrets</span>
              <span className="text-slate-300">GROQ_API_KEY is stored strictly in serverless environment variables and never exposed to the client bundle.</span>
            </div>
          </div>
        </div>

        {/* Truthful Lineage & Hackathon Disclosure */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs text-xs text-slate-500 space-y-2">
          <div className="font-bold text-slate-700 text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-teal-600" />
            Project Lineage &amp; Evaluation Disclosure
          </div>
          <p className="leading-relaxed">
            MediBridge AI evolved from an earlier prototype foundation originally explored for rural healthcare referral continuity (SIH 2026 PS 26133). For <strong>HackCulture Hacktivate 2.0 (HealthTech: Healthcare Management)</strong>, the platform has been significantly enhanced with the MediBridge Sentinel intelligence layer, explainable facility matching, early health trend signals, and the Health Command Center.
          </p>
        </div>

      </div>
    </div>
  );
};

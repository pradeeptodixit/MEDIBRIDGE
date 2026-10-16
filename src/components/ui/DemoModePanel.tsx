import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, ArrowRight, ShieldAlert, Activity, Users, Clock, CheckCircle2, RotateCcw } from 'lucide-react';
import { loadDemoData, clearDemoData } from '../../data/demoDataGenerator';
import { resetDemoReferrals } from '../../services/referralService';
import { useToast } from '../../hooks/useToast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoModePanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'sc-primary-flow',
      title: 'PRIMARY DEMO: Village Fever Cluster → End-to-End Care Completion',
      desc: 'Sentinel detects Rampur Kalan fever trend (+40%) → ASHA verifies → Citizen self-triages (YELLOW) → Facility matching recommends PHC → Referral created → PHC Care Desk accepts & completes → Command Center updates.',
      icon: <Activity className="w-5 h-5 text-amber-600" />,
      targetPath: '/village-health',
      badge: 'PRIMARY JUDGING FLOW',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400/40',
      isPrimary: true,
    },
    {
      id: 'sc-red',
      title: 'Scenario B: RED Emergency Safety Check (Deterministic Override)',
      desc: 'Input: "Severe crushing chest pain, left arm radiation, profuse sweating" → Deterministic safety overrides immediately to RED → 108/112 emergency escalation with zero AI downgrade.',
      icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
      targetPath: '/emergency',
      badge: 'RED SAFETY OVERRIDE',
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300 ring-2 ring-rose-400/40',
      isPrimary: false,
    },
    {
      id: 'sc-command',
      title: 'Scenario C: Health Command Center & Referral Bottleneck',
      desc: 'Command Center monitors district risk map, active alerts, facility load, and detects stalled referrals needing escalation.',
      icon: <Clock className="w-5 h-5 text-purple-600" />,
      targetPath: '/impact',
      badge: 'COMMAND CENTER',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      isPrimary: false,
    },
    {
      id: 'sc-asha',
      title: 'Scenario D: ASHA Frontline Household Survey',
      desc: 'ASHA worker conducts field survey in Rampur Kalan → identifies high-risk maternal anemia (Hb < 7 g/dL) → generates direct ASHA referral to PHC Medical Officer.',
      icon: <Users className="w-5 h-5 text-teal-600" />,
      targetPath: '/village-health',
      badge: 'ASHA FIELD HUB',
      badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
      isPrimary: false,
    },
    {
      id: 'sc-journey',
      title: 'Scenario E: Closed-Loop Care Journey 2.0',
      desc: 'Follow Patient MB-2026-0001 step-by-step through triage, PHC appointment, Truenat diagnostics, and ASHA field closure.',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      targetPath: '/care-journey',
      badge: 'CARE JOURNEY 2.0',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      isPrimary: false,
    },
  ];

  const handleSelectScenario = (path: string, title: string) => {
    loadDemoData();
    addToast(`Loaded ${title}. Demonstration state ready.`, 'success');
    onClose();
    navigate(path);
  };

  const handleReset = () => {
    clearDemoData();
    resetDemoReferrals();
    loadDemoData();
    addToast('Demo state reset to default 5 connected cases.', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-xl text-slate-900">
                Hacktivate 2.0 Demonstration Scenarios
              </h2>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                HealthTech Judging
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Select a pre-configured scenario to evaluate the MediBridge healthcare management workflow.
            </p>
          </div>
        </div>

        <div className="space-y-3 my-4">
          {scenarios.map(sc => (
            <div
              key={sc.id}
              onClick={() => handleSelectScenario(sc.targetPath, sc.title)}
              className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                sc.isPrimary
                  ? 'border-amber-300 bg-amber-50/40 hover:bg-amber-50/70 hover:border-amber-500 shadow-xs'
                  : 'border-slate-200 hover:border-teal-500 hover:bg-teal-50/30'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  {sc.icon}
                  <span>{sc.title}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${sc.badgeColor}`}>
                  {sc.badge}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed ml-7">
                {sc.desc}
              </p>
              <div className="mt-2.5 ml-7 flex items-center gap-1 text-xs font-semibold text-teal-700 group-hover:text-teal-800">
                <span>Launch Walkthrough</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-semibold px-2 py-1 rounded hover:bg-slate-100 transition-colors"
            title="Reset demo data to initial state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo State</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
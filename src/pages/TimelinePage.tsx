import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  Calendar,
  CheckCircle2,
  Sparkles,
  Building2,
  FileText,
  UserCheck,
  Stethoscope,
  FlaskConical,
  ShieldAlert,
  Star,
  MessageSquare,
} from 'lucide-react';
import type { Referral, ReferralStatus } from '../types';
import { getReferrals, updateReferralStatus } from '../services/referralService';
import { ReferralStatusPipeline } from '../components/referral/ReferralStatusPipeline';
import { DataProvenanceBadge } from '../components/ui/DataProvenanceBadge';
import { FeedbackModal } from '../components/feedback/FeedbackModal';
import { FeedbackSubmittedBadge } from '../components/feedback/FeedbackSubmittedBadge';
import { getFeedbackForReferral } from '../services/feedbackService';
import type { HospitalFeedback } from '../types/feedback';

export const TimelinePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryReferralId = searchParams.get('referralId');

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [selectedReferralId, setSelectedReferralId] = useState<string | null>(queryReferralId);

  // Feedback state
  const [feedbackModalReferral, setFeedbackModalReferral] = useState<Referral | null>(null);
  const [submittedFeedbackMap, setSubmittedFeedbackMap] = useState<Record<string, HospitalFeedback>>({});

  const loadData = () => {
    const loadedRefs = getReferrals();
    setReferrals(loadedRefs);
    if (queryReferralId && loadedRefs.some(r => r.id === queryReferralId)) {
      setSelectedReferralId(queryReferralId);
    } else if (loadedRefs.length > 0 && !selectedReferralId) {
      setSelectedReferralId(loadedRefs[0].id);
    }
    // Rebuild feedback map for all referrals
    const fbMap: Record<string, HospitalFeedback> = {};
    loadedRefs.forEach(r => {
      const fb = getFeedbackForReferral(r.id);
      if (fb) fbMap[r.id] = fb;
    });
    setSubmittedFeedbackMap(fbMap);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('medibridge:referrals_updated', loadData);
    window.addEventListener('medibridge:feedback_updated', loadData);
    return () => {
      window.removeEventListener('medibridge:referrals_updated', loadData);
      window.removeEventListener('medibridge:feedback_updated', loadData);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryReferralId]);

  const activeReferral = referrals.find(r => r.id === selectedReferralId) || referrals[0];

  const handleAdvanceStatus = (nextStatus: ReferralStatus) => {
    if (!activeReferral) return;
    updateReferralStatus(activeReferral.id, nextStatus, 'PHC Care Desk / ASHA Lead', `Advanced during demonstration`);
    loadData();
  };

  const handleFeedbackSubmitted = (feedback: HospitalFeedback) => {
    setFeedbackModalReferral(null);
    setSubmittedFeedbackMap(prev => ({ ...prev, [feedback.referralId]: feedback }));
  };

  // 8 Care Journey Visual Stages
  const JOURNEY_STAGES = [
    { key: 'created', label: '1. Symptom & Triage', desc: 'Citizen / ASHA assessment', icon: <Activity size={16} /> },
    { key: 'accepted', label: '2. PHC Accepted', desc: 'Facility acknowledged referral', icon: <Building2 size={16} /> },
    { key: 'scheduled', label: '3. Appt Scheduled', desc: 'Consultation slot booked', icon: <Calendar size={16} /> },
    { key: 'consultation', label: '4. Clinical Review', desc: 'Medical Officer evaluation', icon: <Stethoscope size={16} /> },
    { key: 'diagnostic', label: '5. Lab Diagnostics', desc: 'Truenat / Blood work', icon: <FlaskConical size={16} /> },
    { key: 'specialist', label: '6. Specialist Review', desc: 'District escalation if needed', icon: <ShieldAlert size={16} /> },
    { key: 'follow_up', label: '7. ASHA Follow-up', desc: 'Frontline home verification', icon: <UserCheck size={16} /> },
    { key: 'completed', label: '8. Care Completed', desc: 'Loop closed & recovered', icon: <CheckCircle2 size={16} /> },
  ];

  const currentStatusIdx = activeReferral
    ? JOURNEY_STAGES.findIndex(s => s.key === activeReferral.status)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                <Sparkles size={12} className="text-teal-600" /> Care Journey 2.0
              </span>
              <DataProvenanceBadge type="patient_entered" />
              <DataProvenanceBadge type="prototype_synthetic" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900">
              Closed-Loop Care Journey
            </h1>
            <p className="text-slate-600 text-sm mt-1 max-w-2xl">
              From first symptom to completed care — tracking patient progression across healthcare facility handoffs and ASHA field visits.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/assessment')}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-colors shadow-xs"
            >
              Start New Assessment
            </button>
          </div>
        </div>

        {/* CORE PROOF POINT CALLOUT */}
        <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl p-5 shadow-xs border border-teal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-teal-300 uppercase tracking-widest block">
              The MediBridge Core Differentiation
            </span>
            <p className="font-display font-bold text-base text-white">
              "Closed-loop care means the patient is never lost after referral."
            </p>
            <p className="text-xs text-slate-300">
              Unlike generic symptom checkers, MediBridge connects citizen assessment to ASHA field verification, PHC clinical consultation, and verified case closure.
            </p>
          </div>
          <div className="shrink-0 flex sm:flex-col gap-2">
            <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30 text-center">
              ✓ 100% Loop Closure
            </span>
          </div>
        </div>

        {/* REFERRAL SELECTOR */}
        {referrals.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText size={16} className="text-teal-600" />
                Select Patient Referral Journey to View
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {referrals.length} referrals loaded
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {referrals.map(ref => (
                <button
                  key={ref.id}
                  onClick={() => setSelectedReferralId(ref.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeReferral?.id === ref.id
                      ? 'border-teal-500 bg-teal-50/50 ring-1 ring-teal-500/30'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 font-mono">{ref.id}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ref.urgency === 'RED'
                          ? 'bg-rose-100 text-rose-800'
                          : ref.urgency === 'YELLOW'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {ref.urgency}
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-slate-800 truncate">{ref.patientName}</div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">{ref.destinationFacilityName}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ACTIVE JOURNEY PIPELINE DISPLAY */}
        {activeReferral && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                  {activeReferral.id}
                </span>
                <h2 className="font-display font-bold text-xl text-slate-900 mt-1">
                  {activeReferral.patientName}'s Care Progression
                </h2>
                <p className="text-xs text-slate-500">
                  Origin: {activeReferral.originVillageName} → Facility: {activeReferral.destinationFacilityName}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Advance Status (Demo):</span>
                <select
                  value={activeReferral.status}
                  onChange={e => handleAdvanceStatus(e.target.value as ReferralStatus)}
                  className="text-xs font-bold bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 cursor-pointer"
                >
                  {JOURNEY_STAGES.map(s => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                  <option value="overdue">Overdue (&gt;48h)</option>
                </select>
              </div>
            </div>

            {/* Visual Pipeline Bar */}
            <ReferralStatusPipeline currentStatus={activeReferral.status} />

            {/* Detailed Stage-by-Stage Vertical Steps */}
            <div className="space-y-4 pt-2">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider text-slate-400">
                Detailed Handoff Audit Log
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {JOURNEY_STAGES.map((stage, idx) => {
                  const isCompleted = currentStatusIdx >= idx;
                  const isCurrent = currentStatusIdx === idx;

                  return (
                    <div key={stage.key} className="relative flex items-start gap-4">
                      {/* Bullet icon */}
                      <div
                        className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all ${
                          isCompleted
                            ? 'bg-emerald-600 ring-4 ring-emerald-100'
                            : isCurrent
                            ? 'bg-teal-600 ring-4 ring-teal-100 animate-pulse'
                            : 'bg-slate-300'
                        }`}
                      >
                        {isCompleted ? '✓' : idx + 1}
                      </div>

                      <div className={`flex-1 p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-teal-50/60 border-teal-300 shadow-2xs'
                          : isCompleted
                          ? 'bg-white border-slate-200'
                          : 'bg-slate-50/50 border-slate-200 opacity-60'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                            {stage.icon}
                            <span>{stage.label}</span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800'
                                : isCurrent
                                ? 'bg-teal-100 text-teal-800 font-extrabold'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isCompleted ? 'COMPLETED' : isCurrent ? 'ACTIVE NOW' : 'PENDING'}
                          </span>
                        </div>
                                                <p className="text-xs text-slate-600">{stage.desc}</p>

                         {/* Feedback CTA — only on the completed stage when referral is done */}
                         {stage.key === 'completed' && activeReferral?.status === 'completed' && (
                           <div className="mt-3">
                             {submittedFeedbackMap[activeReferral.id] ? (
                               <FeedbackSubmittedBadge feedback={submittedFeedbackMap[activeReferral.id]} />
                             ) : (
                               <button
                                 onClick={() => setFeedbackModalReferral(activeReferral)}
                                 className="w-full flex items-center justify-center gap-2 mt-1 py-2 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                               >
                                 <Star size={13} className="fill-white text-white" />
                                 Share Your Experience
                                 <MessageSquare size={13} />
                               </button>
                             )}
                           </div>
                         )}
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>
           </div>
         )}

      </div>

      {/* Feedback Modal */}
      {feedbackModalReferral && (
        <FeedbackModal
          isOpen={true}
          referral={feedbackModalReferral}
          onClose={() => setFeedbackModalReferral(null)}
          onSubmitted={handleFeedbackSubmitted}
        />
      )}
    </div>
  );
};

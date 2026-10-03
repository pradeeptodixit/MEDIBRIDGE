import React from 'react';
import { Building2, User, Calendar, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import type { Referral, ReferralStatus } from '../../types/referral';
import { ReferralStatusPipeline } from './ReferralStatusPipeline';

interface Props {
  referral: Referral;
  showActions?: boolean;
  onStatusUpdate?: (id: string, status: ReferralStatus) => void;
  lang?: 'en' | 'hi';
  compact?: boolean;
}

export const ReferralCard: React.FC<Props> = ({
  referral,
  showActions = false,
  onStatusUpdate,
  lang = 'en',
  compact = false,
}) => {
  const urgencyColors = {
    RED: 'bg-rose-500/10 text-rose-700 border-rose-200',
    YELLOW: 'bg-amber-500/10 text-amber-800 border-amber-200',
    GREEN: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  };

  const formattedDate = new Date(referral.createdAt).toLocaleDateString(
    lang === 'hi' ? 'hi-IN' : 'en-IN',
    {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden p-4 sm:p-5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2.5 py-1 rounded-md tracking-wider">
            {referral.id}
          </span>

          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
              urgencyColors[referral.urgency]
            }`}
          >
            {referral.urgency} PRIORITY
          </span>

          {referral.isDemoData && (
            <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
              Prototype Demonstration Data
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Patient & Facility Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3.5 text-sm">
        <div className="flex items-start gap-2">
          <User className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs text-slate-600 block">Patient Identifier</span>
            <span className="font-semibold text-slate-900">{referral.patientName}</span>
            {(referral.age || referral.gender) && (
              <span className="text-xs text-slate-500 ml-1.5">
                ({referral.age ? `${referral.age}y` : ''}
                {referral.gender ? ` · ${referral.gender}` : ''})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Building2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs text-slate-600 block">Care Route</span>
            <div className="flex items-center gap-1 font-medium text-slate-800 text-xs">
              <span>{referral.originVillageName || 'Local Village'}</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="font-semibold text-indigo-900">
                {referral.destinationFacilityName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reason / Symptoms summary */}
      <div className="bg-slate-50 rounded-lg p-3 my-3 text-xs text-slate-700 border border-slate-100">
        <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1">
          <FileText className="w-3.5 h-3.5 text-teal-600" />
          <span>Clinical Reason for Referral</span>
        </div>
        <p className="line-clamp-2">{referral.reason || referral.symptoms}</p>
        {referral.aiSummary && (
          <div className="mt-2 pt-2 border-t border-slate-200/60 text-slate-600">
            <span className="font-medium text-teal-800">Doctor Summary: </span>
            {referral.aiSummary}
          </div>
        )}
      </div>

      {/* Pipeline tracker */}
      <div className="my-3">
        <ReferralStatusPipeline
          currentStatus={referral.status}
          urgency={referral.urgency}
          compact={compact}
          lang={lang}
        />
      </div>

      {/* Actions (for PHC / Healthcare workers) */}
      {showActions && onStatusUpdate && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
          {referral.status === 'created' && (
            <button
              onClick={() => onStatusUpdate(referral.id, 'accepted')}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Accept Referral
            </button>
          )}

          {referral.status === 'accepted' && (
            <button
              onClick={() => onStatusUpdate(referral.id, 'consultation')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              Start Consultation
            </button>
          )}

          {referral.status === 'consultation' && (
            <div className="flex gap-2">
              <button
                onClick={() => onStatusUpdate(referral.id, 'diagnostic')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                Order Diagnostics
              </button>
              <button
                onClick={() => onStatusUpdate(referral.id, 'specialist')}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                Refer to District Hospital
              </button>
            </div>
          )}

          {referral.status === 'diagnostic' && (
            <button
              onClick={() => onStatusUpdate(referral.id, 'follow_up')}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              Diagnostic Done → Send to ASHA Follow-up
            </button>
          )}

          {referral.status === 'specialist' && (
            <button
              onClick={() => onStatusUpdate(referral.id, 'follow_up')}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              Specialist Review Complete → ASHA Follow-up
            </button>
          )}

          {referral.status === 'follow_up' && (
            <button
              onClick={() => onStatusUpdate(referral.id, 'completed')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Mark Case Closed
            </button>
          )}

          {referral.status === 'overdue' && (
            <button
              onClick={() => onStatusUpdate(referral.id, 'accepted')}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              Acknowledge Overdue Referral
            </button>
          )}
        </div>
      )}
    </div>
  );
};

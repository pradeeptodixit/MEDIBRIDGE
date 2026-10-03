import React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { ReferralStatus } from '../../types/referral';
import { REFERRAL_STATUS_PIPELINE, REFERRAL_STATUS_LABELS } from '../../types/referral';

interface Props {
  currentStatus: ReferralStatus;
  urgency?: 'GREEN' | 'YELLOW' | 'RED';
  compact?: boolean;
  lang?: 'en' | 'hi';
}

export const ReferralStatusPipeline: React.FC<Props> = ({
  currentStatus,
  urgency = 'YELLOW',
  compact = false,
  lang = 'en',
}) => {
  const isOverdue = currentStatus === 'overdue';
  const activeIndex = isOverdue ? 1 : REFERRAL_STATUS_PIPELINE.indexOf(currentStatus);

  if (compact) {
    const currentLabel = REFERRAL_STATUS_LABELS[currentStatus]?.[lang] || currentStatus;
    const urgencyBadgeColor =
      urgency === 'RED'
        ? 'bg-rose-100 text-rose-800 border-rose-200'
        : urgency === 'YELLOW'
        ? 'bg-amber-100 text-amber-800 border-amber-200'
        : 'bg-emerald-100 text-emerald-800 border-emerald-200';

    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${urgencyBadgeColor}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {urgency} Priority
        </span>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            isOverdue
              ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
              : currentStatus === 'completed'
              ? 'bg-teal-50 text-teal-800 border-teal-300'
              : 'bg-slate-100 text-slate-800 border-slate-200'
          }`}
        >
          {isOverdue ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          ) : currentStatus === 'completed' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          )}
          {currentLabel}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full py-3 overflow-x-auto">
      {isOverdue && (
        <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs font-medium text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            {lang === 'hi'
              ? 'चेतावनी: यह रेफरल 48 घंटे से अधिक समय से बिना सुविधा प्रतिक्रिया के लंबित है। तत्काल फॉलो-अप आवश्यक है।'
              : 'Action Required: This referral has exceeded 48 hours without acknowledgment. Frontline follow-up flagged.'}
          </span>
        </div>
      )}

      <div className="min-w-[580px] flex items-center justify-between relative">
        {/* Connecting track line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 -z-0" />
        <div
          className="absolute top-4 left-4 h-0.5 bg-teal-500 transition-all duration-500 -z-0"
          style={{
            width: `${Math.max(0, Math.min(100, (activeIndex / (REFERRAL_STATUS_PIPELINE.length - 1)) * 100))}%`,
          }}
        />

        {REFERRAL_STATUS_PIPELINE.map((step, idx) => {
          const isDone = idx < activeIndex || currentStatus === 'completed';
          const isCurrent = idx === activeIndex && !isOverdue;
          const label = REFERRAL_STATUS_LABELS[step]?.[lang] || step;

          return (
            <div key={step} className="flex flex-col items-center relative z-10 group">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? 'bg-teal-600 text-white shadow-sm ring-4 ring-white'
                    : isCurrent
                    ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                    : 'bg-white text-slate-400 border-2 border-slate-300 ring-4 ring-white'
                }`}
                title={label}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={`mt-2 text-[11px] font-medium text-center max-w-[85px] leading-tight ${
                  isCurrent
                    ? 'text-amber-700 font-bold'
                    : isDone
                    ? 'text-teal-900 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

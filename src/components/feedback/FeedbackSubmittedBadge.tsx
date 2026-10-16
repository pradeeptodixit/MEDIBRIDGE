/**
 * FeedbackSubmittedBadge — Shows after a completed referral has feedback
 * MediBridge AI
 */

import React from 'react';
import { CheckCircle2, Star } from 'lucide-react';
import type { HospitalFeedback } from '../../types/feedback';

interface FeedbackSubmittedBadgeProps {
  feedback: HospitalFeedback;
}

export const FeedbackSubmittedBadge: React.FC<FeedbackSubmittedBadgeProps> = ({ feedback }) => {
  const isToday =
    new Date(feedback.submittedAt).toDateString() === new Date().toDateString();

  const submittedLabel = isToday
    ? 'Today'
    : new Date(feedback.submittedAt).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
      <div className="flex items-center gap-2.5">
        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-emerald-950">✓ Feedback Submitted</span>
            <span className="text-[11px] text-slate-600 font-medium">
              Overall Rating:
            </span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(s => (
                <Star
                  key={s}
                  size={12}
                  className={s <= feedback.overallRating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}
                />
              ))}
            </div>
            <span className="text-[10px] font-semibold text-slate-500 bg-white/80 px-2 py-0.5 rounded border border-emerald-100">
              Submitted: {submittedLabel}
            </span>
          </div>
          <p className="text-[11px] text-emerald-800 mt-1">
            Thank you for helping improve the patient experience.
          </p>
        </div>
      </div>
    </div>
  );
};
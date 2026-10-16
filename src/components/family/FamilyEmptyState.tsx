import React from 'react';
import { Users, FileQuestion, TrendingUp, AlertCircle, Plus } from 'lucide-react';

interface Props {
  type: 'no_members' | 'no_reports' | 'single_report' | 'missing_metric';
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export const FamilyEmptyState: React.FC<Props> = ({
  type,
  onAction,
  actionLabel,
  className = '',
}) => {
  if (type === 'no_members') {
    return (
      <div className={`text-center p-8 sm:p-12 bg-white rounded-2xl border border-slate-200 shadow-xs ${className}`}>
        <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-teal-100 shadow-2xs">
          <Users size={28} />
        </div>
        <h3 className="font-display font-bold text-lg text-slate-900 mb-1">
          Build your family health circle
        </h3>
        <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed">
          Add family members to keep their assessment reports, physiological measurements, and care continuity journeys in one place.
        </p>
        {onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-colors shadow-xs"
          >
            <Plus size={16} />
            <span>{actionLabel || 'Add Family Member'}</span>
          </button>
        )}
      </div>
    );
  }

  if (type === 'no_reports') {
    return (
      <div className={`text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 ${className}`}>
        <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center mx-auto mb-3">
          <FileQuestion size={24} />
        </div>
        <h4 className="font-bold text-sm text-slate-800 mb-1">No health reports yet</h4>
        <p className="text-slate-500 text-xs max-w-sm mx-auto mb-4 leading-relaxed">
          Complete an assessment or log vitals to begin building this family member's health journey.
        </p>
        {onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors shadow-2xs"
          >
            <Plus size={14} />
            <span>{actionLabel || 'Start Assessment'}</span>
          </button>
        )}
      </div>
    );
  }

  if (type === 'single_report') {
    return (
      <div className={`p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900 ${className}`}>
        <TrendingUp size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Trend analysis unavailable yet</span>
          <span className="text-amber-800 text-[11px] leading-relaxed">
            At least two recorded reports are required to calculate physiological direction and change over time. Add another assessment when available.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 flex items-center gap-2 ${className}`}>
      <AlertCircle size={14} className="text-slate-400 shrink-0" />
      <span>Not available in this report.</span>
    </div>
  );
};

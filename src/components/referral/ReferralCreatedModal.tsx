import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Building2, Calendar, FileText, X } from 'lucide-react';
import type { Referral } from '../../types/referral';
import { ReferralStatusPipeline } from './ReferralStatusPipeline';

interface Props {
  referral: Referral;
  isOpen: boolean;
  onClose: () => void;
  lang?: 'en' | 'hi';
}

export const ReferralCreatedModal: React.FC<Props> = ({
  referral,
  isOpen,
  onClose,
  lang = 'en',
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNavigateToJourney = () => {
    onClose();
    navigate('/care-journey');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl text-slate-900">
              {lang === 'hi' ? 'रेफरल सफलतापूर्वक बनाया गया' : 'Referral Successfully Created'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'hi'
                ? 'आपका रेफरल प्राथमिक स्वास्थ्य केंद्र (PHC) को भेज दिया गया है'
                : 'Your case has been linked to the public healthcare continuum'}
            </p>
          </div>
        </div>

        {/* Primary Referral Identifier Card */}
        <div className="bg-slate-900 text-white rounded-xl p-4 my-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400">
              Official Referral Tracking ID
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-400 text-slate-950">
              {referral.urgency} PRIORITY
            </span>
          </div>
          <div className="font-mono text-2xl font-black tracking-widest text-teal-400 my-1">
            {referral.id}
          </div>
          <div className="text-[11px] text-slate-300">
            Show this ID or digital slip upon arriving at {referral.destinationFacilityName}
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-2.5 text-xs text-slate-700 my-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Assigned Facility:
            </span>
            <span className="font-semibold text-slate-900">{referral.destinationFacilityName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Primary Reason:
            </span>
            <span className="font-medium text-slate-800 text-right max-w-[240px] truncate">
              {referral.reason}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Created At:
            </span>
            <span className="font-medium text-slate-800">
              {new Date(referral.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Status pipeline */}
        <div className="my-4">
          <div className="text-xs font-semibold text-slate-600 mb-1">Continuity Status:</div>
          <ReferralStatusPipeline currentStatus={referral.status} urgency={referral.urgency} compact={true} lang={lang} />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 mt-6">
          <button
            onClick={handleNavigateToJourney}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>{lang === 'hi' ? 'मेरी देखभाल यात्रा देखें' : 'View in My Care Journey'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
          >
            {lang === 'hi' ? 'बंद करें' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
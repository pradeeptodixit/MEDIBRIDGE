/**
 * FeedbackModal — Hospital Experience Feedback Form
 * MediBridge AI
 *
 * Appears when a referral reaches status = "completed".
 * Measures PATIENT EXPERIENCE, not clinical quality.
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, ThumbsUp, ThumbsDown, CheckCircle2, AlertCircle, ArrowDown } from 'lucide-react';
import type { HospitalFeedback, WaitTimeRating } from '../../types/feedback';
import { submitFeedback } from '../../services/feedbackService';
import { StarRating } from './StarRating';
import type { Referral } from '../../types/referral';

interface FeedbackModalProps {
  isOpen: boolean;
  referral: Referral;
  onClose: () => void;
  onSubmitted: (feedback: HospitalFeedback) => void;
}

interface FormErrors {
  overallRating?: boolean;
  waitTime?: boolean;
  communicationRating?: boolean;
  cleanlinessRating?: boolean;
  careExperienceRating?: boolean;
  wouldRecommend?: boolean;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  referral,
  onClose,
  onSubmitted,
}) => {
  const [overallRating, setOverallRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [waitTime, setWaitTime] = useState<WaitTimeRating | null>(null);
  const [careExperienceRating, setCareExperienceRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [communicationRating, setCommunicationRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [cleanlinessRating, setCleanlinessRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [showValidationBanner, setShowValidationBanner] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const getMissingFields = () => {
    const list: { id: string; name: string }[] = [];
    if (!overallRating) list.push({ id: 'fb-overall', name: 'Overall experience' });
    if (!waitTime) list.push({ id: 'fb-waittime', name: 'Waiting time' });
    if (!careExperienceRating) list.push({ id: 'fb-care', name: 'Care received' });
    if (!communicationRating) list.push({ id: 'fb-communication', name: 'Communication' });
    if (!cleanlinessRating) list.push({ id: 'fb-cleanliness', name: 'Cleanliness' });
    if (wouldRecommend === null) list.push({ id: 'fb-recommend', name: 'Recommendation' });
    return list;
  };

  const missingList = getMissingFields();

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!overallRating) errs.overallRating = true;
    if (!waitTime) errs.waitTime = true;
    if (!careExperienceRating) errs.careExperienceRating = true;
    if (!communicationRating) errs.communicationRating = true;
    if (!cleanlinessRating) errs.cleanlinessRating = true;
    if (wouldRecommend === null) errs.wouldRecommend = true;

    setErrors(errs);
    const isValid = Object.keys(errs).length === 0;

    if (!isValid) {
      setShowValidationBanner(true);
      // Auto-scroll to the first missing field
      const missing = getMissingFields();
      if (missing.length > 0) {
        const el = document.getElementById(missing[0].id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    } else {
      setShowValidationBanner(false);
    }

    return isValid;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      const record = submitFeedback({
        referralId: referral.id,
        patientId: referral.patientId || 'P-DEMO',
        facilityId: referral.destinationFacilityId || 'phc-rampur',
        facilityName: referral.destinationFacilityName || 'PHC Rampur Kalan',
        overallRating: overallRating!,
        waitTime: waitTime!,
        communicationRating: communicationRating!,
        cleanlinessRating: cleanlinessRating!,
        careExperienceRating: careExperienceRating!,
        comment: comment.trim() || undefined,
        wouldRecommend: wouldRecommend!,
      });

      // Quick smooth transition
      setTimeout(() => {
        setSubmitting(false);
        onSubmitted(record);
      }, 200);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setSubmitting(false);
    }
  };

  const WAIT_TIME_OPTIONS: { value: WaitTimeRating; label: string; icon: string }[] = [
    { value: 'short', label: 'Short', icon: '⚡' },
    { value: 'acceptable', label: 'Acceptable', icon: '✓' },
    { value: 'long', label: 'Long', icon: '⏳' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 relative max-h-[92vh] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="bg-white border-b border-slate-100 px-5 pt-5 pb-3.5 shrink-0 relative">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                aria-label="Close feedback form"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                  <MessageSquare size={16} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  Patient Experience Feedback
                </span>
              </div>
              <h2 className="font-display font-black text-xl text-slate-900">
                How was your experience?
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Your feedback helps healthcare facilities understand and improve the patient experience.
              </p>

              {/* Facility context tag */}
              <div className="mt-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center justify-between">
                <span>
                  <span className="font-medium text-slate-500">Facility: </span>
                  <span className="font-bold text-slate-900">{referral.destinationFacilityName}</span>
                </span>
                <span className="font-mono text-[10px] font-bold bg-white text-teal-700 px-2 py-0.5 rounded border border-slate-200">
                  {referral.id}
                </span>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div
              ref={scrollContainerRef}
              className="px-5 py-4 space-y-5 overflow-y-auto flex-1 overscroll-contain"
            >
              {/* 1. Overall Experience */}
              <StarRating
                id="fb-overall"
                label="1. Overall experience"
                value={overallRating}
                onChange={(val) => {
                  setOverallRating(val);
                  setErrors(e => ({ ...e, overallRating: false }));
                  setShowValidationBanner(false);
                }}
                error={errors.overallRating}
              />

              {/* 2. Waiting Time */}
              <div id="fb-waittime" className="scroll-mt-24">
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`text-xs font-bold ${errors.waitTime ? 'text-rose-600' : 'text-slate-800'}`}>
                    2. How was the waiting time?
                    <span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  {waitTime && (
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 capitalize">
                      {waitTime}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {WAIT_TIME_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setWaitTime(opt.value);
                        setErrors(e => ({ ...e, waitTime: false }));
                        setShowValidationBanner(false);
                      }}
                      className={`flex flex-col items-center py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        waitTime === opt.value
                          ? 'border-teal-500 bg-teal-50 text-teal-900 ring-2 ring-teal-400 shadow-2xs'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-lg mb-0.5">{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
                {errors.waitTime && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                    <span>⚠</span> Please select waiting time.
                  </p>
                )}
              </div>

              {/* 3. Care Experience */}
              <StarRating
                id="fb-care"
                label="3. How satisfied were you with the care you received?"
                value={careExperienceRating}
                onChange={(val) => {
                  setCareExperienceRating(val);
                  setErrors(e => ({ ...e, careExperienceRating: false }));
                  setShowValidationBanner(false);
                }}
                error={errors.careExperienceRating}
              />

              {/* 4. Communication */}
              <StarRating
                id="fb-communication"
                label="4. How satisfied were you with staff communication?"
                value={communicationRating}
                onChange={(val) => {
                  setCommunicationRating(val);
                  setErrors(e => ({ ...e, communicationRating: false }));
                  setShowValidationBanner(false);
                }}
                error={errors.communicationRating}
              />

              {/* 5. Cleanliness */}
              <StarRating
                id="fb-cleanliness"
                label="5. How satisfied were you with facility cleanliness?"
                value={cleanlinessRating}
                onChange={(val) => {
                  setCleanlinessRating(val);
                  setErrors(e => ({ ...e, cleanlinessRating: false }));
                  setShowValidationBanner(false);
                }}
                error={errors.cleanlinessRating}
              />

              {/* 6. Recommendation */}
              <div id="fb-recommend" className="scroll-mt-24">
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`text-xs font-bold ${errors.wouldRecommend ? 'text-rose-600' : 'text-slate-800'}`}>
                    6. Would you recommend this facility?
                    <span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  {wouldRecommend !== null && (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        wouldRecommend
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {wouldRecommend ? 'Yes, Recommend' : 'Would Not Recommend'}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setWouldRecommend(true);
                      setErrors(e => ({ ...e, wouldRecommend: false }));
                      setShowValidationBanner(false);
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      wouldRecommend === true
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-400 shadow-2xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <ThumbsUp size={16} className={wouldRecommend === true ? 'text-emerald-600' : 'text-slate-400'} />
                    <span>Yes, I recommend</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWouldRecommend(false);
                      setErrors(e => ({ ...e, wouldRecommend: false }));
                      setShowValidationBanner(false);
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      wouldRecommend === false
                        ? 'border-rose-400 bg-rose-50 text-rose-900 ring-2 ring-rose-400 shadow-2xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <ThumbsDown size={16} className={wouldRecommend === false ? 'text-rose-600' : 'text-slate-400'} />
                    <span>No, would not</span>
                  </button>
                </div>
                {errors.wouldRecommend && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                    <span>⚠</span> Please select Yes or No.
                  </p>
                )}
              </div>

              {/* 7. Written Comment (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    7. Additional comments
                    <span className="text-slate-400 font-normal ml-1">(optional)</span>
                  </label>
                  <span className="text-[11px] text-slate-400">{comment.length}/500</span>
                </div>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Share details about staff courtesy, queue management, or overall facility condition..."
                  rows={2}
                  maxLength={500}
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 resize-none transition-all"
                />
              </div>

              {/* Disclaimer */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-500 leading-relaxed">
                <strong className="text-slate-700">Patient Experience Notice:</strong> This feedback measures service satisfaction and facility experience. It is not a clinical quality assessment or medical review.
              </div>
            </div>

            {/* Modal Sticky Footer with Submit Button */}
            <div className="bg-white border-t border-slate-100 p-4 shrink-0 space-y-2">
              {showValidationBanner && missingList.length > 0 && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center justify-between gap-2 animate-shake">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle size={15} className="text-rose-600 shrink-0" />
                    <span>
                      Please complete all 6 questions (<strong>{missingList.length}</strong> remaining: {missingList.map(m => m.name).join(', ')}).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(missingList[0].id);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="text-[10px] font-bold text-rose-700 hover:text-rose-900 underline shrink-0 flex items-center gap-0.5"
                  >
                    <span>Jump</span>
                    <ArrowDown size={11} />
                  </button>
                </div>
              )}

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl transition-all shadow-sm active:scale-98 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Saving Feedback...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Submit Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/**
 * FacilityFeedbackInsights — Patient Experience panel for facility dashboard
 * MediBridge AI
 *
 * Shows aggregated patient satisfaction metrics calculated dynamically from real stored feedback.
 * Does NOT claim to evaluate clinical quality or medical correctness.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Star, Users, ThumbsUp, Clock, MessageSquare, AlertCircle, Building2, ChevronDown } from 'lucide-react';
import type { FacilityFeedbackStats, HospitalFeedback } from '../../types/feedback';
import { getFacilityFeedbackStats, getFeedbackForFacility, getAllFeedback } from '../../services/feedbackService';
import { DataProvenanceBadge } from '../ui/DataProvenanceBadge';

interface FacilityFeedbackInsightsProps {
  facilityId: string;
  facilityName: string;
}

const KNOWN_FACILITIES = [
  { id: 'phc-rampur', name: 'PHC Rampur Kalan' },
  { id: 'dh-sitapur', name: 'Sitapur District Hospital' },
  { id: 'chc-sitapur', name: 'CHC Sitapur Block' },
];

const RatingBar: React.FC<{ label: string; value: number; icon: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => {
  const pct = value > 0 ? (value / 5) * 100 : 0;
  const color =
    value >= 4 ? 'bg-emerald-500' : value >= 3 ? 'bg-amber-400' : 'bg-rose-400';

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 w-32 shrink-0">
        <span className="text-slate-500">{icon}</span>
        <span className="text-xs text-slate-700 font-medium">{label}</span>
      </div>
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-slate-800 w-10 shrink-0 text-right">
        {value > 0 ? `${value.toFixed(1)}/5` : '—'}
      </span>
    </div>
  );
};

export const FacilityFeedbackInsights: React.FC<FacilityFeedbackInsightsProps> = ({
  facilityId: defaultFacilityId,
  facilityName: defaultFacilityName,
}) => {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(defaultFacilityId);
  const [selectedFacilityName, setSelectedFacilityName] = useState<string>(defaultFacilityName);
  const [stats, setStats] = useState<FacilityFeedbackStats | null>(null);
  const [comments, setComments] = useState<HospitalFeedback[]>([]);
  const [showComments, setShowComments] = useState(false);

  const loadData = useCallback(() => {
    const known = KNOWN_FACILITIES.find(f => f.id === selectedFacilityId);
    const name = known ? known.name : selectedFacilityName;
    setSelectedFacilityName(name);

    const s = getFacilityFeedbackStats(selectedFacilityId, name);
    setStats(s);

    const facilityComments = getFeedbackForFacility(selectedFacilityId).filter(f => f.comment && f.comment.trim().length > 0);
    setComments(facilityComments);
  }, [selectedFacilityId, selectedFacilityName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener('storage', handler);
    window.addEventListener('medibridge:feedback_updated', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('medibridge:feedback_updated', handler);
    };
  }, [loadData]);

  if (!stats) return null;

  const hasData = stats.totalResponses > 0;

  const allFeedback = getAllFeedback();
  const facilityResponseCounts: Record<string, number> = {};
  allFeedback.forEach(f => {
    facilityResponseCounts[f.facilityId] = (facilityResponseCounts[f.facilityId] || 0) + 1;
  });

  let operationalInsight: string | null = null;
  if (hasData) {
    const longWaitRatio = stats.waitTimeDistribution.long / stats.totalResponses;
    if (longWaitRatio > 0.3) {
      operationalInsight = 'Waiting-time satisfaction is lower than other experience areas.';
    } else if (stats.averageCommunicationRating < 4) {
      operationalInsight = 'Patient feedback indicates an opportunity to improve communication.';
    } else if (stats.averageCleanlinessRating < 4) {
      operationalInsight = 'Patient feedback indicates an opportunity to improve facility cleanliness.';
    } else if (stats.averageCareExperienceRating < 4) {
      operationalInsight = 'Patient feedback indicates an opportunity to enhance the care experience.';
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-600" />
            <h2 className="font-display font-bold text-slate-900 text-base">Patient Experience</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Service satisfaction &amp; feedback loop for healthcare facility operations
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <DataProvenanceBadge type="patient_entered" />
          {hasData && (
            <span className="text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
              {stats.totalResponses} response{stats.totalResponses !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Facility Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-semibold text-[11px] shrink-0 mr-1 flex items-center gap-1">
          <Building2 size={12} /> Facility:
        </span>
        {KNOWN_FACILITIES.map(fac => {
          const count = facilityResponseCounts[fac.id] || 0;
          const isSelected = selectedFacilityId === fac.id;
          return (
            <button
              key={fac.id}
              onClick={() => setSelectedFacilityId(fac.id)}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>{fac.name}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!hasData ? (
        <div className="py-8 flex flex-col items-center justify-center text-center gap-2 text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100">
          <MessageSquare size={28} className="opacity-40 text-slate-400" />
          <p className="text-sm font-bold text-slate-700">No patient feedback yet for {selectedFacilityName}.</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Feedback will appear here dynamically once patients complete their care journey and submit their experience.
          </p>
        </div>
      ) : (
        <>
          {/* Overall score + recommendation */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    size={14}
                    className={
                      s <= Math.round(stats.averageOverallRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-slate-200 text-slate-200'
                    }
                  />
                ))}
              </div>
              <div className="text-2xl font-black text-teal-900">
                {stats.averageOverallRating.toFixed(1)}
                <span className="text-xs font-semibold text-teal-600">/5</span>
              </div>
              <p className="text-[11px] text-teal-700 font-medium">Overall Experience</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center mb-1">
                <ThumbsUp size={18} className="text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-900">
                {stats.recommendationPercentage}
                <span className="text-xs font-semibold text-emerald-600">%</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium">Would Recommend</p>
            </div>
          </div>

          {/* Detailed ratings */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Satisfaction by Area</p>
            <RatingBar
              label="Communication"
              value={stats.averageCommunicationRating}
              icon={<Users size={13} />}
            />
            <RatingBar
              label="Cleanliness"
              value={stats.averageCleanlinessRating}
              icon={<span className="text-[13px]">🏥</span>}
            />
            <RatingBar
              label="Care Received"
              value={stats.averageCareExperienceRating}
              icon={<span className="text-[13px]">💊</span>}
            />
          </div>

          {/* Wait time distribution */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <Clock size={12} /> Waiting Time Responses
            </p>
            <div className="flex gap-2">
              {[
                { key: 'short', label: 'Short', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', count: stats.waitTimeDistribution.short },
                { key: 'acceptable', label: 'Acceptable', color: 'bg-amber-100 text-amber-800 border-amber-200', count: stats.waitTimeDistribution.acceptable },
                { key: 'long', label: 'Long', color: 'bg-rose-100 text-rose-800 border-rose-200', count: stats.waitTimeDistribution.long },
              ].map(item => (
                <div
                  key={item.key}
                  className={`flex-1 text-center py-2 rounded-lg border text-xs font-bold ${item.color}`}
                >
                  <div className="text-base font-black">{item.count}</div>
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Operational insight */}
          {operationalInsight && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="font-bold">Service Insight: </strong>
                {operationalInsight}
              </p>
            </div>
          )}

          {/* Internal Comments section */}
          {comments.length > 0 && (
            <div className="border-t border-slate-100 pt-3">
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center justify-between w-full text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors py-1"
              >
                <span>Internal Feedback Comments ({comments.length})</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${showComments ? 'rotate-180' : ''}`}
                />
              </button>

              {showComments && (
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                  {comments.map(c => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-mono">{c.referralId}</span>
                        <span>{new Date(c.submittedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="italic text-slate-800">"{c.comment}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Non-clinical disclaimer */}
          <div className="text-[11px] text-slate-400 text-center leading-relaxed border-t border-slate-100 pt-3">
            Measures patient experience and service satisfaction. Does not evaluate clinical correctness or medical outcomes.
          </div>
        </>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  Activity,
  Check,
  X,
} from 'lucide-react';
import type { FacilityRecommendation } from '../../types';
import { facilityTypeLabel } from '../../services/facilityMatchingService';
import { DataProvenanceBadge } from '../ui/DataProvenanceBadge';

export interface FacilityMatchCardProps {
  recommendation: FacilityRecommendation;
  onSelect?: (rec: FacilityRecommendation) => void;
  isSelected?: boolean;
  className?: string;
}

interface ScoreMetric {
  key: keyof FacilityRecommendation['score'];
  label: string;
  value: number;
  max: number;
  description: string;
}

export const FacilityMatchCard: React.FC<FacilityMatchCardProps> = ({
  recommendation,
  onSelect,
  isSelected = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const {
    facilityName,
    facilityType,
    score,
    distanceKm,
    matchingCapabilities = [],
    missingCapabilities = [],
    reasons = [],
    urgencyFitLabel,
  } = recommendation;

  // Facility badge color mappings
  const facilityTypeBadges: Record<
    FacilityRecommendation['facilityType'],
    { badge: string; text: string }
  > = {
    sub_centre: {
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
      text: 'Sub-Centre',
    },
    phc: {
      badge: 'bg-teal-50 text-teal-700 border-teal-200',
      text: 'Primary Health Centre (PHC)',
    },
    chc: {
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      text: 'Community Health Centre (CHC)',
    },
    district_hospital: {
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
      text: 'District Hospital',
    },
    specialty: {
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      text: 'Specialty Hospital',
    },
  };

  const badgeConfig = facilityTypeBadges[facilityType] ?? {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    text: facilityTypeLabel(facilityType),
  };

  // Score breakdown configuration
  const scoreMetrics: ScoreMetric[] = [
    {
      key: 'urgencyFit',
      label: 'Urgency Fit',
      value: score.urgencyFit,
      max: 25,
      description: 'Alignment with clinical urgency tier',
    },
    {
      key: 'capabilityMatch',
      label: 'Capability Match',
      value: score.capabilityMatch,
      max: 25,
      description: 'OPD, Doctor, and required clinical capabilities',
    },
    {
      key: 'diagnosticAvailability',
      label: 'Diagnostics',
      value: score.diagnosticAvailability,
      max: 20,
      description: 'Lab, RDT, ultrasound, or imaging availability',
    },
    {
      key: 'emergencyCapability',
      label: 'Emergency',
      value: score.emergencyCapability,
      max: 15,
      description: '24x7 trauma and emergency triage readiness',
    },
    {
      key: 'distanceScore',
      label: 'Distance',
      value: score.distanceScore,
      max: 10,
      description: 'Travel time and proximity proximity score',
    },
    {
      key: 'loadScore',
      label: 'Patient Load',
      value: score.loadScore,
      max: 5,
      description: 'Available bed and patient throughput headroom',
    },
  ];

  // Score color threshold
  const getScoreColor = (total: number) => {
    if (total >= 80) {
      return {
        text: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        bar: 'bg-emerald-500',
        label: 'High Match',
      };
    }
    if (total >= 60) {
      return {
        text: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        bar: 'bg-amber-500',
        label: 'Moderate Match',
      };
    }
    return {
      text: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      bar: 'bg-rose-500',
      label: 'Low Match',
    };
  };

  const scoreTheme = getScoreColor(score.total);

  return (
    <div
      className={[
        'bg-white rounded-xl border transition-all duration-200 overflow-hidden shadow-sm',
        isSelected
          ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md bg-teal-50/10'
          : 'border-slate-200 hover:border-teal-300 hover:shadow-md',
        className,
      ].join(' ')}
    >
      {/* Top Header */}
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-[220px]">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badgeConfig.badge}`}
              >
                {badgeConfig.text}
              </span>

              {distanceKm != null && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  {distanceKm.toFixed(1)} km
                </span>
              )}

              {isSelected && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full border border-teal-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                  Selected Facility
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <Building2 className="w-5 h-5 text-teal-600 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {facilityName}
              </h3>
            </div>
          </div>

          {/* Overall Score Badge */}
          <div className="flex flex-col items-end shrink-0">
            <div
              className={`flex items-baseline gap-1 px-3 py-1.5 rounded-lg border font-mono ${scoreTheme.bg} ${scoreTheme.border}`}
            >
              <Activity className={`w-4 h-4 ${scoreTheme.text} self-center mr-0.5`} />
              <span className={`text-xl font-black ${scoreTheme.text}`}>
                {score.total}
              </span>
              <span className="text-xs text-slate-400 font-medium">/100</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-1">
              {scoreTheme.label} Score
            </span>
          </div>
        </div>

        {/* Total Score Progress Bar */}
        <div className="mt-3.5">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span className="font-medium text-slate-700">Deterministic Match Score</span>
            <span className="font-semibold text-slate-900">{score.total}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${scoreTheme.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, score.total))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Score Breakdown Section */}
      <div className="px-4 sm:px-5 py-3 bg-slate-50/70 border-y border-slate-100">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Score Breakdown (Rule-Based)
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 transition-colors cursor-pointer"
            aria-expanded={isExpanded}
          >
            <span>{isExpanded ? 'Hide Breakdown' : 'View Breakdown'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Summary Grid (First 3 metrics always visible, all 6 when expanded or on desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {scoreMetrics.slice(0, isExpanded ? 6 : 3).map((metric) => {
            const percentage = Math.round((metric.value / metric.max) * 100);
            return (
              <div
                key={metric.key}
                className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs"
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-600 font-medium truncate" title={metric.label}>
                    {metric.label}
                  </span>
                  <span className="font-mono font-semibold text-slate-900 ml-1 shrink-0">
                    {metric.value}/{metric.max}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-teal-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Extended metrics when expanded */}
        {isExpanded && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200/60">
            {scoreMetrics.slice(3, 6).map((metric) => {
              const percentage = Math.round((metric.value / metric.max) * 100);
              return (
                <div
                  key={metric.key}
                  className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-600 font-medium truncate" title={metric.label}>
                      {metric.label}
                    </span>
                    <span className="font-mono font-semibold text-slate-900 ml-1 shrink-0">
                      {metric.value}/{metric.max}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-teal-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Capabilities: Matching vs Missing */}
      <div className="p-4 sm:p-5 space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Matching Capabilities */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Matching Capabilities ({matchingCapabilities.length})</span>
            </div>
            {matchingCapabilities.length > 0 ? (
              <ul className="space-y-1.5">
                {matchingCapabilities.map((cap, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-1.5 text-xs text-emerald-900 bg-emerald-50/60 px-2.5 py-1 rounded-md border border-emerald-100"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 italic">No specific matching capabilities recorded</p>
            )}
          </div>

          {/* Missing Capabilities / Gaps */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-2">
              <XCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Capability Gaps &amp; Limits ({missingCapabilities.length})</span>
            </div>
            {missingCapabilities.length > 0 ? (
              <ul className="space-y-1.5">
                {missingCapabilities.map((gap, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-1.5 text-xs text-amber-900 bg-amber-50/60 px-2.5 py-1 rounded-md border border-amber-200/60"
                  >
                    <X className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>No major gaps — facility meets requested requirements</span>
              </div>
            )}
          </div>
        </div>

        {/* Explainable Section: Why MediBridge Recommends */}
        <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Why MediBridge recommends this facility</span>
            </div>
            {urgencyFitLabel && (
              <span className="text-[11px] font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {urgencyFitLabel}
              </span>
            )}
          </div>

          {reasons.length > 0 ? (
            <ul className="space-y-1 text-xs text-slate-700 pt-1">
              {reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold shrink-0 mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">
              Facility scored on urgency tier, capability availability, distance, and current load.
            </p>
          )}
        </div>

        {/* Provenance Indicators */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <DataProvenanceBadge type="prototype_synthetic" size="xs" />
            <DataProvenanceBadge type="rule_based" size="xs" />
          </div>
          <span className="text-slate-400">Deterministic scoring model</span>
        </div>

        {/* CTA Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {onSelect && (
            <button
              type="button"
              onClick={() => onSelect(recommendation)}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer ${
                isSelected
                  ? 'bg-teal-700 text-white ring-2 ring-teal-700 ring-offset-1 hover:bg-teal-800'
                  : 'bg-teal-600 text-white hover:bg-teal-700 active:scale-[0.99]'
              }`}
            >
              {isSelected ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Selected Facility</span>
                </>
              ) : (
                <>
                  <span>Select Facility &amp; Create Referral</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Hide Details' : 'View Facility Details'}</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  Activity,
  ArrowRight,
  Info,
  Building2,
  Users,
  Building,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import type { EarlyWarningAlert, SentinelSeverity, SentinelSource } from '../../types';
import { DataProvenanceBadge } from '../ui/DataProvenanceBadge';

export interface EarlyWarningCardProps {
  alert: EarlyWarningAlert;
  onAction?: (villageId: string) => void;
  onSelect?: (alert: EarlyWarningAlert) => void;
  className?: string;
  compact?: boolean;
}

const SEVERITY_CONFIG: Record<
  SentinelSeverity,
  {
    label: string;
    sublabel: string;
    badgeClasses: string;
    accentBorder: string;
    dotBg: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  WATCH: {
    label: 'WATCH',
    sublabel: 'Low threshold signal',
    badgeClasses: 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-200',
    accentBorder: 'border-l-amber-500',
    dotBg: 'bg-amber-500',
    icon: AlertTriangle,
  },
  HIGH: {
    label: 'HIGH',
    sublabel: 'Elevated health signal',
    badgeClasses: 'bg-orange-50 text-orange-800 border-orange-300 ring-1 ring-orange-200',
    accentBorder: 'border-l-orange-500',
    dotBg: 'bg-orange-500',
    icon: ShieldAlert,
  },
  CRITICAL: {
    label: 'CRITICAL',
    sublabel: 'Immediate protocol review',
    badgeClasses: 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-200',
    accentBorder: 'border-l-rose-600',
    dotBg: 'bg-rose-600 animate-pulse',
    icon: ShieldAlert,
  },
};

const SOURCE_LABELS: Record<SentinelSource, string> = {
  village_trend: 'Village Trend Signal',
  referral_bottleneck: 'Referral Bottleneck',
  facility_load: 'Facility Load Signal',
  patient_risk: 'Patient Risk Trend',
};

const ACTOR_CONFIG: Record<
  EarlyWarningAlert['assignedRole'],
  {
    label: string;
    badgeClasses: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  asha: {
    label: 'ASHA Field Worker',
    badgeClasses: 'bg-teal-50 text-teal-800 border-teal-200',
    icon: Users,
  },
  phc: {
    label: 'PHC Medical Officer',
    badgeClasses: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    icon: Building2,
  },
  district: {
    label: 'District Health Administration (CHC / DH)',
    badgeClasses: 'bg-purple-50 text-purple-800 border-purple-200',
    icon: Building,
  },
};

export const EarlyWarningCard: React.FC<EarlyWarningCardProps> = ({
  alert,
  onAction,
  onSelect,
  className = '',
  compact = false,
}) => {
  const navigate = useNavigate();
  const [isEvidenceExpanded, setIsEvidenceExpanded] = useState(!compact);

  const severity = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.WATCH;
  const SeverityIcon = severity.icon;

  const actor = ACTOR_CONFIG[alert.assignedRole] || ACTOR_CONFIG.asha;
  const ActorIcon = actor.icon;

  const handleReviewVillage = () => {
    if (onAction && alert.villageId) {
      onAction(alert.villageId);
    } else if (onSelect) {
      onSelect(alert);
    } else if (alert.villageId) {
      navigate(`/village-health?village=${encodeURIComponent(alert.villageId)}`);
    } else {
      navigate('/village-health');
    }
  };

  const formattedChange =
    alert.changePercent > 0
      ? `+${alert.changePercent}%`
      : `${alert.changePercent}%`;

  const formattedDate = new Date(alert.createdAt).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`bg-white rounded-xl border border-slate-200 border-l-4 ${severity.accentBorder} shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5 flex flex-col justify-between gap-4 ${className}`}
      aria-label={`Rule-based early warning alert for ${alert.villageName || 'Village'}`}
    >
      <div>
        {/* Top Bar: Village Info, Provenance & Severity */}
        <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-base truncate">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="truncate">{alert.villageName || 'Unassigned Village'}</span>
              {alert.villageId && (
                <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                  {alert.villageId}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px] text-slate-500">
              <span className="font-medium text-slate-600">
                {SOURCE_LABELS[alert.source] || 'Rule-based early warning'}
              </span>
              <span className="text-slate-300">·</span>
              <span>Health signal</span>
              <DataProvenanceBadge
                type={alert.isDemoData ? 'prototype_synthetic' : 'rule_based'}
                size="xs"
              />
            </div>
          </div>

          {/* Severity Badge & Timestamp */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${severity.badgeClasses}`}
            >
              <span className={`w-2 h-2 rounded-full ${severity.dotBg}`} />
              <SeverityIcon className="w-3.5 h-3.5" />
              <span>{severity.label}</span>
            </span>

            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="w-3 h-3 text-slate-400" />
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="mt-3 mb-2.5">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
            {alert.title}
          </h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {alert.description}
          </p>
        </div>

        {/* Metrics Grid: Symptom Metric, Observed vs Baseline, % Change Badge */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100 my-3 text-xs">
          {/* Symptom Metric */}
          <div className="flex flex-col justify-center">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              Symptom Metric
            </span>
            <span className="font-semibold text-slate-900 mt-0.5 truncate text-sm">
              {alert.metric}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">Symptom report trend</span>
          </div>

          {/* Observed vs Baseline */}
          <div className="flex flex-col justify-center border-t sm:border-t-0 sm:border-l sm:border-r border-slate-200 pt-2 sm:pt-0 sm:px-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Reports vs Baseline
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-extrabold text-slate-900">
                {alert.currentValue}
              </span>
              <span className="text-xs text-slate-500">
                / baseline {alert.baselineValue}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5">Reporting period</span>
          </div>

          {/* % Change Badge */}
          <div className="flex flex-col justify-center border-t sm:border-t-0 pt-2 sm:pt-0 sm:pl-1">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Deviation Shift
            </span>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${
                  alert.changePercent >= 40
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                {formattedChange}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5">vs expected baseline</span>
          </div>
        </div>

        {/* Explainable Evidence Bullet List */}
        {alert.evidence && alert.evidence.length > 0 && (
          <div className="my-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                Explainable Evidence Factors ({alert.evidence.length})
              </span>
              <button
                type="button"
                onClick={() => setIsEvidenceExpanded(!isEvidenceExpanded)}
                className="text-[11px] text-teal-700 hover:text-teal-800 font-medium inline-flex items-center gap-0.5 cursor-pointer"
              >
                {isEvidenceExpanded ? 'Collapse' : 'Expand'}
                {isEvidenceExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </div>

            {isEvidenceExpanded && (
              <ul className="space-y-1.5 rounded-lg bg-slate-50/70 p-2.5 border border-slate-100 text-xs text-slate-700">
                {alert.evidence.map((factor, index) => (
                  <li key={index} className="flex items-start gap-2 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Recommended Action & Target Actor */}
        <div className="p-3 rounded-lg border border-teal-200/80 bg-teal-50/40 text-xs my-2">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              Recommended Protocol Action
            </span>

            {/* Target Actor Badge */}
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${actor.badgeClasses}`}
            >
              <ActorIcon className="w-3 h-3" />
              <span>Target Actor: {actor.label}</span>
            </span>
          </div>

          <p className="text-slate-800 leading-relaxed font-medium">
            {alert.recommendedAction}
          </p>
          {alert.recommendedActionHi && (
            <p className="text-slate-600 text-[11px] mt-1 italic">
              {alert.recommendedActionHi}
            </p>
          )}
          <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
            <span>Requires clinical evaluation and local field verification.</span>
          </div>
        </div>
      </div>

      {/* Footer: Safety Note & CTA Button */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] text-slate-500">
          Rule-based early warning · Health signal analysis
        </div>

        <button
          type="button"
          onClick={handleReviewVillage}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-teal-700 text-white hover:bg-teal-800 active:bg-teal-900 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 shadow-sm cursor-pointer"
        >
          <span>Review Village</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.article>
  );
};

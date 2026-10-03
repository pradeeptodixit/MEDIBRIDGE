import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Users,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ArrowRight,
  FileText,
  Clock,
  ShieldAlert,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { DEMO_VILLAGES } from '../data/villageData';
import type { VillageProfile } from '../types';
import { getReferrals, getReferralStats, getOverdueReferrals } from '../services/referralService';
import type { Referral } from '../types/referral';
import { getAllFamilyRecords } from '../services/familyService';
import {
  generateEarlyWarningAlerts,
  generateCommandCenterActions,
  generateVillageRiskSummaries,
  calculateReferralBottleneck,
  calculateFacilityLoad,
} from '../services/sentinelService';
import { DataProvenanceBadge } from '../components/ui/DataProvenanceBadge';
import { SentinelPanel } from '../components/sentinel/SentinelPanel';
import { VillageRiskMap } from '../components/sentinel/VillageRiskMap';

export const ImpactDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [villages, setVillages] = useState<VillageProfile[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [assessmentsCount, setAssessmentsCount] = useState<number>(16);
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'sentinel' | 'facilities'>('overview');

  const loadData = () => {
    try {
      const storedVillages = localStorage.getItem('mb_villages');
      if (storedVillages) {
        const parsed = JSON.parse(storedVillages);
        if (parsed && parsed.length > 0) setVillages(parsed);
      } else {
        setVillages(DEMO_VILLAGES);
      }

      const timelineRaw = localStorage.getItem('medibridge_timeline');
      const userAssessments = timelineRaw ? JSON.parse(timelineRaw).length : 0;
      const familyRecords = getAllFamilyRecords();
      // Total recorded evaluations: user assessments + family longitudinal records + base prototype cohort
      setAssessmentsCount(userAssessments + familyRecords.length + 8);
    } catch {
      setVillages(DEMO_VILLAGES);
    }

    setReferrals(getReferrals());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('medibridge:referrals_updated', loadData);
    return () => window.removeEventListener('medibridge:referrals_updated', loadData);
  }, []);

  const stats = getReferralStats();
  const overdueReferrals = getOverdueReferrals();
  const sentinelAlerts = generateEarlyWarningAlerts(villages, referrals);
  const commandActions = generateCommandCenterActions(villages, referrals);
  const villageSummaries = generateVillageRiskSummaries(villages, referrals);
  const bottleneck = calculateReferralBottleneck(referrals);
  const facilityLoads = calculateFacilityLoad(referrals);

  // Operational Funnel calculated deterministically from registered records
  const totalReferrals = referrals.length;
  const acceptedReferrals = referrals.filter(r => ['accepted', 'scheduled', 'consultation', 'diagnostic', 'specialist', 'follow_up', 'completed'].includes(r.status)).length;
  const consultationReferrals = referrals.filter(r => ['consultation', 'diagnostic', 'specialist', 'follow_up', 'completed'].includes(r.status)).length;
  const diagnosticReferrals = referrals.filter(r => ['diagnostic', 'specialist', 'follow_up', 'completed'].includes(r.status)).length;
  const completedReferrals = stats.completed;

  const funnel = {
    assessments: Math.max(totalReferrals, assessmentsCount),
    referrals: totalReferrals,
    accepted: acceptedReferrals,
    consultations: consultationReferrals,
    diagnostics: diagnosticReferrals,
    completed: completedReferrals,
  };

  const completionRate = totalReferrals > 0 ? Math.round((completedReferrals / totalReferrals) * 100) : 0;
  const redEmergencyCount = referrals.filter(r => r.urgency === 'RED').length;
  const highRiskPatientsCount = referrals.filter(r => r.urgency === 'RED' || r.urgency === 'YELLOW').length;
  const followUpsDueCount = referrals.filter(r => r.status === 'follow_up').length;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Command Center Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  <Activity size={12} className="text-teal-600" /> MediBridge Sentinel v2.0
                </span>
                <DataProvenanceBadge type="prototype_synthetic" />
                <DataProvenanceBadge type="rule_based" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
                Health Command Center
              </h1>
              <p className="text-slate-600 text-sm mt-1 max-w-3xl">
                Early Warning &amp; Care Operations Intelligence — continuous surveillance of village health trends, referral bottlenecks, and healthcare facility loads.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate('/village-health')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <span>ASHA Field Hub</span>
              </button>
              <button
                onClick={() => navigate('/facility')}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                <span>PHC Care Desk</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation View Switcher */}
          <div className="flex items-center gap-1 border-t border-slate-100 pt-4 mt-6 overflow-x-auto">
            {[
              { id: 'overview', label: 'Command Overview', icon: <Layers size={14} /> },
              { id: 'map', label: 'District Risk Map', icon: <Building2 size={14} /> },
              { id: 'sentinel', label: `Sentinel Signals (${sentinelAlerts.length})`, icon: <Sparkles size={14} /> },
              { id: 'facilities', label: 'Facility Loads', icon: <Activity size={14} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* TOP 8 KPI CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            {
              label: 'High-Risk Patients',
              val: highRiskPatientsCount,
              sub: 'Active care flags',
              icon: <Users className="w-4 h-4 text-amber-600" />,
              bg: 'bg-amber-50/50 border-amber-200',
            },
            {
              label: 'Emergency Escalations',
              val: redEmergencyCount,
              sub: '108 RED cases',
              icon: <ShieldAlert className="w-4 h-4 text-rose-600" />,
              bg: 'bg-rose-50/50 border-rose-200 text-rose-900',
            },
            {
              label: 'Pending Referrals',
              val: funnel.referrals - stats.completed,
              sub: 'Active in pipeline',
              icon: <FileText className="w-4 h-4 text-indigo-600" />,
              bg: 'bg-indigo-50/50 border-indigo-200',
            },
            {
              label: 'Overdue (>48h)',
              val: overdueReferrals.length,
              sub: 'Requires action',
              icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
              bg: overdueReferrals.length > 0 ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200',
            },
            {
              label: 'Sentinel Alerts',
              val: sentinelAlerts.length,
              sub: 'Early warning signals',
              icon: <Sparkles className="w-4 h-4 text-purple-600" />,
              bg: 'bg-purple-50/50 border-purple-200',
            },
            {
              label: 'Facility Load',
              val: 'Moderate',
              sub: 'PHC capacity',
              icon: <Building2 className="w-4 h-4 text-teal-600" />,
              bg: 'bg-teal-50/50 border-teal-200',
            },
            {
              label: 'Care Completion',
              val: `${completionRate}%`,
              sub: `${funnel.completed} closed cases`,
              icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
              bg: 'bg-emerald-50/50 border-emerald-200',
            },
            {
              label: 'Follow-ups Due',
              val: followUpsDueCount,
              sub: 'ASHA field visits',
              icon: <Clock className="w-4 h-4 text-blue-600" />,
              bg: 'bg-blue-50/50 border-blue-200',
            },
          ].map((kpi, idx) => (
            <div key={idx} className={`p-3 rounded-xl border ${kpi.bg} flex flex-col justify-between`}>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span className="truncate">{kpi.label}</span>
                {kpi.icon}
              </div>
              <div className="text-xl font-bold font-display text-slate-900 mt-1">
                {kpi.val}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 truncate">{kpi.sub}</span>
            </div>
          ))}
        </div>

        {/* TAB 1: OVERVIEW VIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* SECTION A — TODAY'S ACTION QUEUE */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-bold text-lg text-slate-900">
                      Today's Action Queue
                    </h2>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      {commandActions.length} Actions Priority
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Automated operational dispatch generated by Sentinel trend analysis and referral status monitoring.
                  </p>
                </div>
                <DataProvenanceBadge type="rule_based" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {commandActions.slice(0, 6).map(action => (
                  <div
                    key={action.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      action.severity === 'critical'
                        ? 'bg-rose-50/50 border-rose-300'
                        : action.severity === 'high'
                        ? 'bg-orange-50/50 border-orange-300'
                        : 'bg-amber-50/30 border-amber-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                            action.severity === 'critical'
                              ? 'bg-rose-100 text-rose-900 border-rose-300'
                              : action.severity === 'high'
                              ? 'bg-orange-100 text-orange-900 border-orange-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}
                        >
                          [{action.severity.toUpperCase()}]
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                          Actor: {action.actor.toUpperCase()}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 mb-1">
                        {action.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {action.description}
                      </p>

                      <div className="p-2.5 rounded-lg bg-white/90 border border-slate-200/80 mb-3 text-xs">
                        <span className="font-semibold text-slate-700 block text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">
                          Recommended Action:
                        </span>
                        <p className="text-slate-800 font-medium text-[11px]">
                          {action.recommendedAction}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(action.ctaPath)}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 mt-2"
                    >
                      <span>{action.ctaLabel}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION B & C — BOTTLENECKS & FACILITY LOAD */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Closed-Loop Referral Pipeline & Bottlenecks */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div>
                    <h2 className="font-display font-bold text-lg text-slate-900">
                      Closed-Loop Referral Funnel &amp; Bottlenecks
                    </h2>
                    <p className="text-xs text-slate-500">
                      Patient retention across care stages from initial assessment to case closure.
                    </p>
                  </div>
                  <DataProvenanceBadge type="prototype_synthetic" />
                </div>

                {bottleneck && (
                  <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold text-amber-900 block">Bottleneck Detected: {bottleneck.stuckStage}</span>
                        <span className="text-amber-800 text-[11px]">{bottleneck.description}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/facility')}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors shrink-0"
                    >
                      Resolve Bottleneck
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  {[
                    { stage: '1. AI-Assisted Triage Assessments', count: funnel.assessments, pct: 100, color: 'bg-teal-600' },
                    { stage: '2. Clinical Referrals Created', count: funnel.referrals, pct: Math.round((funnel.referrals / funnel.assessments) * 100), color: 'bg-teal-500' },
                    { stage: '3. Facility Accepted', count: funnel.accepted, pct: Math.round((funnel.accepted / funnel.referrals) * 100), color: 'bg-indigo-600' },
                    { stage: '4. Physical Consultations', count: funnel.consultations, pct: Math.round((funnel.consultations / funnel.referrals) * 100), color: 'bg-indigo-500' },
                    { stage: '5. Diagnostics & Lab Screening', count: funnel.diagnostics, pct: Math.round((funnel.diagnostics / funnel.referrals) * 100), color: 'bg-amber-500' },
                    { stage: '6. ASHA Follow-up & Case Closure', count: funnel.completed, pct: Math.round((funnel.completed / funnel.referrals) * 100), color: 'bg-emerald-600' },
                  ].map((step, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                        <span>{step.stage}</span>
                        <span className="font-mono text-sm font-bold text-slate-900">{step.count}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-1">
                        <div className={`h-full ${step.color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, step.pct)}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Conversion metric</span>
                        <span className="font-medium text-slate-700">{step.pct}% retention</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Col: Facility Load & Capacity */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Facility Load &amp; Capacity
                  </h3>
                  <DataProvenanceBadge type="prototype_synthetic" />
                </div>

                <div className="space-y-3 text-xs">
                  {facilityLoads.map(fac => (
                    <div key={fac.facilityId} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">{fac.facilityName}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            fac.loadLevel === 'high'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : fac.loadLevel === 'moderate'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {fac.loadLevel.toUpperCase()} LOAD
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600 mt-2">
                        <span>Active Referrals: <strong>{fac.activeReferrals}</strong></span>
                        <span>Overdue Cases: <strong className={fac.overdueReferrals > 0 ? 'text-rose-600' : 'text-slate-700'}>{fac.overdueReferrals}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-slate-900 text-white text-xs space-y-2">
                  <div className="font-bold text-teal-300 text-xs uppercase tracking-wider">
                    Hacktivate 2.0 Core Message
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    "MediBridge doesn't stop at telling a patient where to go. It connects the entire care journey and gives healthcare teams visibility into community risks and bottlenecks."
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DISTRICT RISK MAP */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <VillageRiskMap
              villages={villageSummaries}
              onSelectVillage={id => navigate(`/village-health?village=${id}`)}
            />
          </div>
        )}

        {/* TAB 3: SENTINEL SIGNALS */}
        {activeTab === 'sentinel' && (
          <div className="space-y-4">
            <SentinelPanel
              alerts={sentinelAlerts}
              onSelectAlert={alert => navigate(`/village-health?village=${alert.villageId}`)}
            />
          </div>
        )}

        {/* TAB 4: FACILITY LOADS */}
        {activeTab === 'facilities' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h2 className="font-display font-bold text-lg text-slate-900">
                  Healthcare Facility Capability &amp; Load Matrix
                </h2>
                <p className="text-xs text-slate-500">
                  Capacity metrics used by the explainable facility matching engine.
                </p>
              </div>
              <DataProvenanceBadge type="prototype_synthetic" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {facilityLoads.map(fac => (
                <div key={fac.facilityId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{fac.facilityName}</span>
                    <span className="text-xs font-semibold text-slate-500 uppercase">{fac.facilityType}</span>
                  </div>
                  <div className="text-xs space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>General OPD:</span>
                      <strong className="text-emerald-700">Available</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Diagnostics Support:</span>
                      <strong className="text-amber-700">Basic / Truenat</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Load:</span>
                      <strong className="text-slate-900">{fac.activeReferrals} referrals</strong>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/facility')}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2 rounded-lg transition-colors"
                  >
                    Manage Facility Desk
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

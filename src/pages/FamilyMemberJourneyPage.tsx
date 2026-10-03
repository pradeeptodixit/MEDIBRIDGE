import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  GitCompare,
  HeartPulse,
  LineChart,
  Plus,
  Building2,
  FileText,
  ChevronRight,
  Edit3,
} from 'lucide-react';
import type {
  FamilyMember,
  FamilyHealthRecord,
  MeasurementMetricType,
  LongitudinalMetricData,
} from '../types/family';
import {
  getFamilyMemberById,
  getMemberRecords,
  comparePreviousAndLatest,
  extractLongitudinalData,
  getLinkedReferralForMember,
  formatMeasurementValue,
  updateFamilyMember,
  deleteFamilyMember,
} from '../services/familyService';
import { HealthTrendChart } from '../components/family/HealthTrendChart';
import { HealthMetricCard } from '../components/family/HealthMetricCard';
import { ReportComparisonModal } from '../components/family/ReportComparisonModal';
import { AddFamilyMemberModal } from '../components/family/AddFamilyMemberModal';
import { FamilyEmptyState } from '../components/family/FamilyEmptyState';
import { DataProvenanceBadge } from '../components/ui/DataProvenanceBadge';
import { useToast } from '../hooks/useToast';

export const FamilyMemberJourneyPage: React.FC = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [member, setMember] = useState<FamilyMember | null>(null);
  const [records, setRecords] = useState<FamilyHealthRecord[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MeasurementMetricType>('blood_pressure');
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadData = useCallback(() => {
    if (!memberId) return;
    const m = getFamilyMemberById(memberId);
    setMember(m);
    if (m) {
      const recs = getMemberRecords(m.id);
      setRecords(recs);
    }
  }, [memberId]);

  useEffect(() => {
    loadData();
    window.addEventListener('medibridge:family_updated', loadData);
    return () => window.removeEventListener('medibridge:family_updated', loadData);
  }, [loadData]);

  if (!member) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-slate-600 font-semibold mb-4">Family member not found.</p>
          <button
            onClick={() => navigate('/family')}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-xs"
          >
            Back to Family Circle
          </button>
        </div>
      </div>
    );
  }

  // Longitudinal data map
  const longitudinalMap = extractLongitudinalData(records);
  const availableMetrics = Array.from(longitudinalMap.keys());

  // Set default metric if current selected has no points
  const activeMetricData: LongitudinalMetricData | undefined =
    longitudinalMap.get(selectedMetric) ||
    (availableMetrics.length > 0 ? longitudinalMap.get(availableMetrics[0]) : undefined);

  // Compare previous vs latest
  const comparisons = comparePreviousAndLatest(records);

  // Linked Care Continuity referral
  const linkedReferral = getLinkedReferralForMember(member, records);

  // Latest record
  const latestRecord = records[records.length - 1];
  const previousRecord = records.length >= 2 ? records[records.length - 2] : null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <button
            onClick={() => navigate('/family')}
            className="flex items-center gap-1 text-slate-600 hover:text-teal-700 font-semibold transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Family Circle</span>
          </button>

          <div className="flex items-center gap-2">
            <DataProvenanceBadge type="patient_entered" />
            <DataProvenanceBadge type="rule_based" />
          </div>
        </div>

        {/* Member Profile Header */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl ${member.avatarBg || 'bg-teal-600'} text-white font-black text-xl flex items-center justify-center shrink-0 shadow-xs`}>
                {member.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
                    {member.name}'s Health Journey
                  </h1>
                  {member.isDemoData && (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                      PROTOTYPE DATA
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 text-xs text-slate-600 mt-1 flex-wrap">
                  <span className="font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 uppercase tracking-wider text-[11px]">
                    {member.relationship}
                  </span>
                  <span>•</span>
                  <span>Age: <strong>{member.age}</strong></span>
                  {member.gender && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{member.gender}</span>
                    </>
                  )}
                  {latestRecord && (
                    <>
                      <span>•</span>
                      <span>Latest Assessment: <strong>{formatDate(latestRecord.date)}</strong></span>
                    </>
                  )}
                </div>

                {member.notes && (
                  <p className="text-xs text-slate-500 mt-2 italic">
                    "{member.notes}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
              >
                <Edit3 size={13} />
                <span>Edit Profile</span>
              </button>

              {records.length >= 2 && (
                <button
                  onClick={() => setShowComparisonModal(true)}
                  className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                >
                  <GitCompare size={14} className="text-indigo-600" />
                  <span>Compare Reports</span>
                </button>
              )}

              <button
                onClick={() => navigate(`/assessment?memberId=${member.id}`)}
                className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <Plus size={14} />
                <span>Assess {member.name.split(' ')[0]}</span>
              </button>
            </div>
          </div>
        </div>

        {/* If no reports exist */}
        {records.length === 0 ? (
          <FamilyEmptyState
            type="no_reports"
            onAction={() => navigate(`/assessment?memberId=${member.id}`)}
            actionLabel="Start First Assessment"
          />
        ) : (
          <>
            {/* If only 1 report exists */}
            {records.length === 1 && (
              <FamilyEmptyState type="single_report" />
            )}

            {/* SECTION 1: HEALTH PROGRESS (PREVIOUS vs LATEST) */}
            {comparisons.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                      <HeartPulse size={18} className="text-teal-600" />
                      <span>Health Progress (Previous vs. Latest Report)</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Comparing {previousRecord ? formatDate(previousRecord.date) : ''} vs.{' '}
                      {latestRecord ? formatDate(latestRecord.date) : ''}. Click any card to visualize its historical progression.
                    </p>
                  </div>
                  <DataProvenanceBadge type="rule_based" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {comparisons.map(comp => (
                    <HealthMetricCard
                      key={comp.metric}
                      comparison={comp}
                      isSelected={selectedMetric === comp.metric}
                      onClick={() => setSelectedMetric(comp.metric)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 2: LONGITUDINAL GRAPH (CORE FEATURE) */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                    <LineChart size={18} className="text-teal-600" />
                    <span>Longitudinal Health Progress Graph</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real recorded values over time. Observe physiological change across months.
                  </p>
                </div>

                {/* Metric Selector Tabs */}
                {availableMetrics.length > 1 && (
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {availableMetrics.map(metric => {
                      const data = longitudinalMap.get(metric);
                      const isSelected = selectedMetric === metric;
                      return (
                        <button
                          key={metric}
                          onClick={() => setSelectedMetric(metric)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                            isSelected
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {data?.label || metric}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {activeMetricData ? (
                <HealthTrendChart data={activeMetricData} />
              ) : (
                <FamilyEmptyState type="single_report" />
              )}
            </div>

            {/* SECTION 3: CARE FOLLOW-UP / CLOSED LOOP LINKAGE */}
            {linkedReferral && (
              <div className="bg-gradient-to-r from-slate-900 to-teal-950 text-white rounded-2xl p-5 shadow-xs border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 size={18} className="text-teal-400" />
                    <h3 className="font-display font-bold text-base text-white">
                      Active Care Follow-up Linked
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 px-2.5 py-0.5 rounded-full border border-teal-500/30">
                    {linkedReferral.id}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Referral Status</span>
                    <span className="font-bold text-sm text-teal-300 capitalize mt-0.5 block">
                      {linkedReferral.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Designated Facility</span>
                    <span className="font-bold text-sm text-white truncate mt-0.5 block">
                      {linkedReferral.destinationFacilityName}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Next Action</span>
                    <span className="font-bold text-sm text-amber-300 mt-0.5 block">
                      Clinical Consultation &amp; Vitals
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[11px] text-slate-400">
                    Reason: {linkedReferral.reason}
                  </span>
                  <Link
                    to={`/care-journey?referralId=${linkedReferral.id}`}
                    className="text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>View in Care Journey</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            )}

            {/* SECTION 4: REPORT HISTORY LIST */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                    <FileText size={16} className="text-teal-600" />
                    <span>Historical Assessment Reports ({records.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chronological audit log of recorded symptoms, clinical handoffs, and measurements.
                  </p>
                </div>

                {records.length >= 2 && (
                  <button
                    onClick={() => setShowComparisonModal(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                  >
                    <GitCompare size={13} />
                    <span>Compare Any Two</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {[...records]
                  .reverse()
                  .map((rec, idx) => (
                    <div
                      key={rec.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono">
                            Report #{records.length - idx}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 font-semibold">{formatDate(rec.date)}</span>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            rec.urgencyLevel === 'RED'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : rec.urgencyLevel === 'YELLOW'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {rec.urgencyLevel} URGENCY
                        </span>
                      </div>

                      <p className="text-slate-700 leading-relaxed font-medium">
                        <strong>Symptoms Reported:</strong> {rec.symptoms}
                      </p>

                      {rec.doctorSummary && (
                        <p className="text-slate-600 text-[11px] leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/80">
                          <strong>Doctor Summary:</strong> {rec.doctorSummary}
                        </p>
                      )}

                      {/* Measurement tags */}
                      {rec.measurements.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Vitals:</span>
                          {rec.measurements.map(m => (
                            <span
                              key={m.id}
                              className="inline-flex items-center gap-1 font-mono text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-700"
                            >
                              <span className="text-slate-400 text-[10px]">{m.label}:</span>
                              <strong className="text-teal-800">{formatMeasurementValue(m.metric, m.value)}</strong>
                              <span className="text-[9px] text-slate-400">{m.unit}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {/* Modals */}
        <ReportComparisonModal
          isOpen={showComparisonModal}
          onClose={() => setShowComparisonModal(false)}
          records={records}
          memberName={member.name}
        />

        <AddFamilyMemberModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={updates => {
            updateFamilyMember(member.id, updates);
            addToast('Updated profile details.', 'success');
            loadData();
          }}
          onDelete={() => {
            deleteFamilyMember(member.id);
            addToast('Family member removed.', 'info');
            navigate('/family');
          }}
          initialData={member}
        />

      </div>
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Users,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  ShieldCheck,
  Stethoscope,
  Activity,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import type { Referral, ReferralStatus } from '../types/referral';
import {
  getReferrals,
  updateReferralStatus,
  createReferral,
  resetDemoReferrals,
} from '../services/referralService';
import { ReferralCard } from '../components/referral/ReferralCard';
import { ReferralCreatedModal } from '../components/referral/ReferralCreatedModal';
import { FacilityFeedbackInsights } from '../components/feedback/FacilityFeedbackInsights';

export const FacilityDashboardPage: React.FC = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [createdReferralModal, setCreatedReferralModal] = useState<Referral | null>(null);

  const loadData = useCallback(() => {
    const list = getReferrals();
    setReferrals(list);
    if (selectedReferral) {
      const updated = list.find(r => r.id === selectedReferral.id);
      if (updated) setSelectedReferral(updated);
    }
  }, [selectedReferral]);

  useEffect(() => {
    loadData();
    window.addEventListener('medibridge:referrals_updated', loadData);
    return () => window.removeEventListener('medibridge:referrals_updated', loadData);
  }, [loadData]);

  const handleStatusChange = (id: string, newStatus: ReferralStatus) => {
    updateReferralStatus(id, newStatus, 'PHC Medical Officer Dr. Sharma');
    loadData();
  };

  const handleCreateEscalation = () => {
    const escalation = createReferral({
      patientName: 'Demo Patient #06 (Escalated)',
      age: 48,
      gender: 'Male',
      originType: 'phc',
      originVillageName: 'PHC Rampur Kalan',
      destinationFacilityId: 'dh-sitapur',
      destinationFacilityName: 'Sitapur District Hospital (Cardiology OPD)',
      destinationFacilityType: 'district_hospital',
      urgency: 'YELLOW',
      reason: 'Specialist cardiologist review required for atypical chest tightness and abnormal ECG',
      symptoms: 'Atypical angina on exertion, resting pulse 94 bpm, requires echocardiography',
      aiSummary: 'SPECIALIST REFERRAL (YELLOW): Escalated from Primary Health Centre due to diagnostic requirement (Echocardiogram) unavailable locally.',
      informationCompleteness: 'high',
      isDemoData: true,
    });
    setCreatedReferralModal(escalation);
    loadData();
  };

  const filteredReferrals = referrals.filter(r => {
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending'
        ? ['created', 'accepted'].includes(r.status)
        : statusFilter === 'active'
        ? ['scheduled', 'consultation', 'diagnostic', 'specialist'].includes(r.status)
        : r.status === statusFilter;

    const matchesSearch =
      searchQuery === '' ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.symptoms.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.originVillageName && r.originVillageName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const pendingCount = referrals.filter(r => r.status === 'created').length;
  const activeConsultCount = referrals.filter(r => ['accepted', 'consultation', 'diagnostic'].includes(r.status)).length;
  const highPriorityCount = referrals.filter(r => r.urgency === 'RED').length;
  const overdueCount = referrals.filter(r => r.status === 'overdue').length;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Prototype Header Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="p-2 rounded-xl bg-teal-600 text-white shadow-sm">
                  <Building2 className="w-6 h-6" />
                </span>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900">
                    PHC Care Desk
                  </h1>
                  <p className="text-slate-600 text-sm">
                    Primary Health Centre, Rampur Kalan · Block Sitapur · Public Health Network
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl">
                Prototype Demonstration Data
              </span>
              <button
                onClick={resetDemoReferrals}
                className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
                title="Reset prototype referrals to initial demo scenario"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Demo Queue
              </button>
            </div>
          </div>

          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-600 text-xs font-medium">
                <span>Awaiting Acceptance</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-display text-slate-900 mt-1">
                {pendingCount}
              </div>
              <span className="text-[11px] text-slate-500">Citizen & ASHA referrals incoming</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-600 text-xs font-medium">
                <span>Active Consultation / Labs</span>
                <Activity className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-display text-slate-900 mt-1">
                {activeConsultCount}
              </div>
              <span className="text-[11px] text-slate-500">Cases progressing through care</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-600 text-xs font-medium">
                <span>Emergency (RED) Escalations</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-display text-rose-600 mt-1">
                {highPriorityCount}
              </div>
              <span className="text-[11px] text-slate-500">Immediate facility attention</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-600 text-xs font-medium">
                <span>Follow-Up Overdue</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-display text-amber-700 mt-1">
                {overdueCount}
              </div>
              <span className="text-[11px] text-slate-500">&gt;48h without acknowledgment</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid: Referral Queue (Left) & Facility Capacity (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Referral Queue Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by Tracking ID, patient, or symptoms..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                  {[
                    { key: 'all', label: 'All Cases' },
                    { key: 'pending', label: 'Pending' },
                    { key: 'active', label: 'In Progress' },
                    { key: 'completed', label: 'Closed' },
                    { key: 'overdue', label: 'Overdue' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setStatusFilter(tab.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        statusFilter === tab.key
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Referrals List */}
              <div className="mt-4 space-y-3">
                {filteredReferrals.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-sm">No referrals match current filter.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      New referrals created by citizens or ASHA workers will appear in this intake queue.
                    </p>
                  </div>
                ) : (
                  filteredReferrals.map(referral => (
                    <ReferralCard
                      key={referral.id}
                      referral={referral}
                      showActions={true}
                      onStatusUpdate={handleStatusChange}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Facility Capacity & Referral Escalation */}
          <div className="space-y-6">
            {/* Facility Capability Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-teal-600" />
                  <h2 className="font-display font-bold text-slate-900 text-base">Facility Capability</h2>
                </div>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  Simulated
                </span>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-medium text-slate-800">General OPD</span>
                  <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    Available (Dr. Sharma on duty)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-medium text-slate-800">Primary Diagnostics</span>
                  <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    Malaria, Dengue, Hb in stock
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-medium text-slate-800">Essential Pharmacy</span>
                  <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    Free NHM Formulary active
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-medium text-slate-800">Maternity / ANC Room</span>
                  <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    ANM on call 24x7
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-rose-900">Cardiology / Ultrasound Specialist</span>
                    <span className="text-[10px] font-bold bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full">
                      Unavailable Locally
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-800">
                    Specialist equipment unavailable at Primary Health Centre. Recommended escalation destination:
                    Sitapur District Hospital (24 km away).
                  </p>
                  <button
                    onClick={handleCreateEscalation}
                    className="mt-3 w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Create District Specialist Escalation
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Continuity Guide */}
            <div className="bg-gradient-to-br from-teal-900 to-slate-900 rounded-2xl p-5 text-white shadow-sm">
              <h3 className="font-display font-bold text-base mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                Referral Loop Accountability
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                MediBridge guarantees that patient referrals do not get lost between village and hospital. Every
                status advance made on this Care Desk is immediately synchronized with the Citizen's{' '}
                <span className="text-teal-300 font-medium">Care Journey</span> and the frontline{' '}
                <span className="text-teal-300 font-medium">ASHA Field Hub</span>.
              </p>
            </div>

            {/* Patient Experience Insights */}
            <FacilityFeedbackInsights
              facilityId="phc-rampur"
              facilityName="PHC Rampur Kalan"
            />
          </div>
        </div>
      </div>

      {createdReferralModal && (
        <ReferralCreatedModal
          referral={createdReferralModal}
          isOpen={true}
          onClose={() => setCreatedReferralModal(null)}
        />
      )}
    </div>
  );
};

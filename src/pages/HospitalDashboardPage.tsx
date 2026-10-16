import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  IndianRupee,
  Percent,
  AlertCircle,
  TrendingUp,
  FileText,
  CreditCard,
  Building2,
  Filter,
  Search,
  PlusCircle,
  Eye,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { HospitalNavbar } from '../components/hospital/HospitalNavbar';
import { HospitalSidebar } from '../components/hospital/HospitalSidebar';
import { TreatmentBillModal } from '../components/hospital/TreatmentBillModal';
import { InvoiceViewModal } from '../components/hospital/InvoiceViewModal';
import { RecordPaymentModal } from '../components/hospital/RecordPaymentModal';
import {
  getActiveHospital,
  getHospitalStats,
  getReferralsForHospital,
  getInvoicesForHospital,
  getPaymentsForHospital,
  getReferralAnalytics,
  generateMonthlyInvoice,
  formatINR,
} from '../services/hospitalPartnerService';
import type {
  HospitalReferral,
  HospitalInvoice,
  HospitalPayment,
  HospitalReferralStatus,
} from '../types/hospital';

export const HospitalDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [activeHospital, setActiveHospital] = useState(getActiveHospital());
  const [stats, setStats] = useState(getHospitalStats(activeHospital.id));
  const [referrals, setReferrals] = useState<HospitalReferral[]>([]);
  const [invoices, setInvoices] = useState<HospitalInvoice[]>([]);
  const [payments, setPayments] = useState<HospitalPayment[]>([]);
  const [analytics, setAnalytics] = useState(getReferralAnalytics(activeHospital.id));

  // Filters & Search
  const [referralStatusFilter, setReferralStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [editingReferral, setEditingReferral] = useState<HospitalReferral | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<HospitalInvoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<HospitalInvoice | undefined>(undefined);

  const loadData = useCallback(() => {
    const hosp = getActiveHospital();
    setActiveHospital(hosp);
    const s = getHospitalStats(hosp.id);
    setStats(s);
    setReferrals(getReferralsForHospital(hosp.id));
    setInvoices(getInvoicesForHospital(hosp.id));
    setPayments(getPaymentsForHospital(hosp.id));
    setAnalytics(getReferralAnalytics(hosp.id));
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('medibridge:hospital_data_updated', loadData);
    return () => window.removeEventListener('medibridge:hospital_data_updated', loadData);
  }, [loadData]);

  // Filtered referrals
  const filteredReferrals = referrals.filter(r => {
    if (referralStatusFilter !== 'all' && r.referralStatus !== referralStatusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.patientAlias.toLowerCase().includes(q) ||
        r.serviceRequested.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: HospitalReferralStatus) => {
    switch (status) {
      case 'treatment_completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'treatment_pending':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'appointment_scheduled':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'contacted':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const formatStatusLabel = (status: string) => {
    return status
      .replace('_', ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const handleGenerateInvoice = () => {
    generateMonthlyInvoice(activeHospital.id, 'September 2026');
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <HospitalNavbar />

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <HospitalSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          pendingReferralsCount={stats.pendingReferrals}
          unbilledTreatmentsCount={
            referrals.filter(
              r =>
                r.treatmentStatus === 'Treatment Completed' &&
                r.treatmentBillAmount > 0 &&
                r.paymentStatus === 'unbilled'
            ).length
          }
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">
          {/* ==================================================================== */}
          {/* TAB: OVERVIEW */}
          {/* ==================================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Welcome & Hospital Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="text-sky-400" size={18} />
                    <span className="text-xs uppercase tracking-wider font-bold text-sky-300">
                      Institutional Partner Portal
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      LIVE ACCOUNT
                    </span>
                  </div>
                  <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
                    {activeHospital.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                    MediBridge AI referral attribution, treatment verification, and monthly commission settlement ledger.
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                  <div className="bg-white/10 backdrop-blur-xs border border-white/15 px-4 py-2 rounded-2xl text-right">
                    <span className="text-[11px] text-sky-300 block">Agreed Commission</span>
                    <span className="font-display font-black text-xl text-white">
                      {activeHospital.commissionRate}%
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Payable on completed treatment
                  </span>
                </div>
              </div>

              {/* 6 KEY OVERVIEW CARDS (As requested by user prompt) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Total Referrals */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Referrals</span>
                    <Users size={18} className="text-sky-600" />
                  </div>
                  <div className="font-display font-black text-3xl text-slate-900">
                    {stats.totalReferrals}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Patients routed via MediBridge AI
                  </p>
                </div>

                {/* 2. Completed Treatments */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Completed Treatments</span>
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  </div>
                  <div className="font-display font-black text-3xl text-emerald-950">
                    {stats.completedTreatments}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Received treatment &amp; discharge
                  </p>
                </div>

                {/* 3. Pending Referrals */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Pending Referrals</span>
                    <Clock size={18} className="text-amber-600" />
                  </div>
                  <div className="font-display font-black text-3xl text-amber-950">
                    {stats.pendingReferrals}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Scheduled / in-treatment
                  </p>
                </div>

                {/* 4. Total Treatment Value */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Treatment Value</span>
                    <IndianRupee size={18} className="text-indigo-600" />
                  </div>
                  <div className="font-display font-black text-2xl sm:text-3xl text-slate-900">
                    {formatINR(stats.totalTreatmentValue)}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Gross medical billing generated
                  </p>
                </div>

                {/* 5. MediBridge Commission */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">MediBridge Commission</span>
                    <Percent size={18} className="text-teal-600" />
                  </div>
                  <div className="font-display font-black text-2xl sm:text-3xl text-teal-900">
                    {formatINR(stats.mediBridgeCommission)}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {stats.commissionRate}% platform referral fee
                  </p>
                </div>

                {/* 6. Outstanding Amount */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-amber-900">
                    <span className="text-xs font-bold uppercase tracking-wider">Outstanding Amount</span>
                    <AlertCircle size={18} className="text-amber-700" />
                  </div>
                  <div className="font-display font-black text-2xl sm:text-3xl text-amber-950">
                    {formatINR(stats.outstandingAmount)}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-amber-800">
                    <span>Paid: {formatINR(stats.paidAmount)}</span>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="font-bold text-sky-700 hover:underline"
                    >
                      Settle →
                    </button>
                  </div>
                </div>
              </div>

              {/* ACTION BANNER (September 2026 status) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Billing Period: September 2026
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Completed Treatments: <strong>{stats.completedTreatments}</strong> • Treatment Value: <strong>{formatINR(stats.totalTreatmentValue)}</strong> • Outstanding: <strong>{formatINR(stats.outstandingAmount)}</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  <button
                    onClick={() => setActiveTab('invoices')}
                    className="flex-1 md:flex-none px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-700 transition-colors"
                  >
                    View Invoices
                  </button>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 font-bold text-xs text-white transition-colors shadow-xs"
                  >
                    Record Payment
                  </button>
                </div>
              </div>

              {/* ANALYTICS CHARTS SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Referrals & Revenue Over Time */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <TrendingUp size={16} className="text-sky-600" />
                        <span>Referrals &amp; Commission Over Time</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">Monthly patient volume &amp; commission</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {analytics.monthlyTrends.map(pt => (
                      <div key={pt.month} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{pt.month}</span>
                          <span className="text-slate-500 text-[11px]">
                            {pt.referrals} referrals • {formatINR(pt.treatmentValue)} value • <strong>{formatINR(pt.commission)} comm.</strong>
                          </span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                          <div
                            className="bg-sky-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, (pt.referrals / 40) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conversion Funnel */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <Sparkles size={16} className="text-teal-600" />
                        <span>Referral Conversion Funnel</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">From MediBridge triage to treatment discharge</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: 'Referred via AI', count: analytics.conversionFunnel.referred, pct: 100, color: 'bg-slate-300 text-slate-800' },
                      { label: 'Contacted by Hospital', count: analytics.conversionFunnel.contacted, pct: Math.round((analytics.conversionFunnel.contacted / (analytics.conversionFunnel.referred || 1)) * 100), color: 'bg-sky-400 text-sky-900' },
                      { label: 'Appointment Scheduled', count: analytics.conversionFunnel.appointmentScheduled, pct: Math.round((analytics.conversionFunnel.appointmentScheduled / (analytics.conversionFunnel.referred || 1)) * 100), color: 'bg-indigo-400 text-indigo-900' },
                      { label: 'In Treatment', count: analytics.conversionFunnel.treatmentPending, pct: Math.round((analytics.conversionFunnel.treatmentPending / (analytics.conversionFunnel.referred || 1)) * 100), color: 'bg-amber-400 text-amber-900' },
                      { label: 'Treatment Completed', count: analytics.conversionFunnel.treatmentCompleted, pct: Math.round((analytics.conversionFunnel.treatmentCompleted / (analytics.conversionFunnel.referred || 1)) * 100), color: 'bg-emerald-500 text-white font-bold' },
                    ].map(step => (
                      <div key={step.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700">{step.label}</span>
                          <span className="font-bold text-slate-900">
                            {step.count} ({step.pct}%)
                          </span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${step.color.split(' ')[0]}`}
                            style={{ width: `${step.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Referrals Preview */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Recent Attributed Referrals
                    </h3>
                    <p className="text-xs text-slate-500">
                      Showing latest incoming patients with MediBridge unique IDs
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('referrals')}
                    className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1"
                  >
                    <span>View All {referrals.length} Referrals</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">Referral ID</th>
                        <th className="py-3 px-4">Patient</th>
                        <th className="py-3 px-4">Treatment / Service</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Bill Value</th>
                        <th className="py-3 px-4 text-right">Commission</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {referrals.slice(0, 6).map(ref => (
                        <tr key={ref.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 font-mono font-bold text-sky-700">
                            {ref.id}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {ref.patientAlias}
                          </td>
                          <td className="py-3 px-4 text-slate-600 truncate max-w-xs">
                            {ref.serviceRequested}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                                ref.referralStatus
                              )}`}
                            >
                              {formatStatusLabel(ref.referralStatus)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-900">
                            {ref.treatmentBillAmount > 0
                              ? formatINR(ref.treatmentBillAmount)
                              : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-700">
                            {ref.commissionAmount > 0
                              ? formatINR(ref.commissionAmount)
                              : '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => setEditingReferral(ref)}
                              className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-[11px] transition-colors"
                            >
                              Update Bill
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB: REFERRALS */}
          {/* ==================================================================== */}
          {activeTab === 'referrals' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display font-black text-2xl text-slate-900">
                    Referral Pipeline
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Attributed patients referred through MediBridge AI with verified unique IDs
                  </p>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by Referral ID (MB-REF-...), patient alias, or service..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                  <Filter size={14} className="text-slate-400 shrink-0" />
                  {[
                    { id: 'all', label: 'All Statuses' },
                    { id: 'referred', label: 'Referred' },
                    { id: 'contacted', label: 'Contacted' },
                    { id: 'appointment_scheduled', label: 'Scheduled' },
                    { id: 'treatment_pending', label: 'In Treatment' },
                    { id: 'treatment_completed', label: 'Completed' },
                    { id: 'cancelled', label: 'Cancelled' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setReferralStatusFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                        referralStatusFilter === f.id
                          ? 'bg-sky-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Referrals Table (User prompt requirements) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Referral ID</th>
                        <th className="py-3 px-4">Patient</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Treatment / Service</th>
                        <th className="py-3 px-4">Referral Status</th>
                        <th className="py-3 px-4">Treatment Status</th>
                        <th className="py-3 px-4 text-right">Bill Value</th>
                        <th className="py-3 px-4 text-right">Commission ({activeHospital.commissionRate}%)</th>
                        <th className="py-3 px-4 text-center">Payment Status</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredReferrals.map(ref => (
                        <tr key={ref.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 font-mono font-bold text-sky-700">
                            {ref.id}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{ref.patientAlias}</div>
                            <div className="text-[10px] text-slate-400">
                              Age: {ref.patientAge} • {ref.patientGender}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {ref.referralDate}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate">
                            {ref.serviceRequested}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${getStatusBadge(
                                ref.referralStatus
                              )}`}
                            >
                              {formatStatusLabel(ref.referralStatus)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                            {ref.treatmentStatus}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                            {ref.treatmentBillAmount > 0
                              ? formatINR(ref.treatmentBillAmount)
                              : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-700 whitespace-nowrap">
                            {ref.commissionAmount > 0
                              ? formatINR(ref.commissionAmount)
                              : '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                ref.paymentStatus === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ref.paymentStatus === 'invoiced'
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {ref.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => setEditingReferral(ref)}
                              className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-xs transition-colors"
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredReferrals.length === 0 && (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-slate-400">
                            No referrals matching filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB: TREATMENTS */}
          {/* ==================================================================== */}
          {activeTab === 'treatments' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display font-black text-2xl text-slate-900">
                  Treatment Management &amp; Billing
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update clinical treatment progress and record final hospital bills to calculate commission
                </p>
              </div>

              {/* Treatment Workflow Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {referrals
                  .filter(
                    r =>
                      r.referralStatus !== 'cancelled' &&
                      r.treatmentStatus !== 'Cancelled'
                  )
                  .slice(0, 10)
                  .map(ref => (
                    <div
                      key={ref.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sky-700 text-xs">
                          {ref.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                            ref.referralStatus
                          )}`}
                        >
                          {ref.treatmentStatus}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          {ref.serviceRequested}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Patient: {ref.patientAlias} • Triage Date: {ref.referralDate}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">
                            Hospital Bill
                          </span>
                          <span className="font-bold text-sm text-slate-900">
                            {ref.treatmentBillAmount > 0
                              ? formatINR(ref.treatmentBillAmount)
                              : 'Bill Pending'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">
                            MediBridge 5% Comm.
                          </span>
                          <span className="font-bold text-sm text-emerald-700">
                            {ref.commissionAmount > 0
                              ? formatINR(ref.commissionAmount)
                              : '₹0'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-end">
                        <button
                          onClick={() => setEditingReferral(ref)}
                          className="w-full py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs transition-colors"
                        >
                          Enter / Update Final Bill Amount
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB: REVENUE & COMMISSION */}
          {/* ==================================================================== */}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display font-black text-2xl text-slate-900">
                  Revenue &amp; Commission Settlement
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Financial ledger showing gross treatment value generated and commission payable
                </p>
              </div>

              {/* Commission Rule Card */}
              <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white p-6 rounded-3xl border border-emerald-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={20} className="text-emerald-400" />
                    <h3 className="font-display font-bold text-base">
                      MediBridge Revenue Model Agreement
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
                    Agreement Rate: {activeHospital.commissionRate}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                    <span className="text-slate-300 block text-[11px]">Gross Medical Value</span>
                    <span className="font-display font-black text-xl text-white mt-0.5 block">
                      {formatINR(stats.totalTreatmentValue)}
                    </span>
                    <span className="text-[10px] text-emerald-300">Total hospital revenue</span>
                  </div>
                  <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                    <span className="text-slate-300 block text-[11px]">MediBridge Commission ({activeHospital.commissionRate}%)</span>
                    <span className="font-display font-black text-xl text-teal-300 mt-0.5 block">
                      {formatINR(stats.mediBridgeCommission)}
                    </span>
                    <span className="text-[10px] text-teal-300">Earned from 28 completed</span>
                  </div>
                  <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                    <span className="text-slate-300 block text-[11px]">Net Retained by Hospital</span>
                    <span className="font-display font-black text-xl text-white mt-0.5 block">
                      {formatINR(stats.totalTreatmentValue - stats.mediBridgeCommission)}
                    </span>
                    <span className="text-[10px] text-emerald-300">Hospital keeps ~{100 - activeHospital.commissionRate}%</span>
                  </div>
                </div>
              </div>

              {/* Monthly Breakdown List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
                <h3 className="font-bold text-sm text-slate-900">
                  Monthly Performance Ledger
                </h3>
                <div className="divide-y divide-slate-100">
                  {analytics.monthlyTrends.map(item => (
                    <div key={item.month} className="py-3.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{item.month}</span>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.completed} completed treatments of {item.referrals} referred
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">{formatINR(item.treatmentValue)}</div>
                        <div className="text-emerald-700 font-bold text-[11px]">
                          Comm: {formatINR(item.commission)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB: INVOICES */}
          {/* ==================================================================== */}
          {activeTab === 'invoices' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display font-black text-2xl text-slate-900">
                    Monthly Invoices
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official tax invoices for referral commissions with itemized case lists
                  </p>
                </div>
                <button
                  onClick={handleGenerateInvoice}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  <PlusCircle size={15} />
                  <span>Generate New Monthly Invoice</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Invoice #</th>
                        <th className="py-3 px-4">Billing Period</th>
                        <th className="py-3 px-4">Issue / Due Date</th>
                        <th className="py-3 px-4 text-center">Referrals</th>
                        <th className="py-3 px-4 text-right">Treatment Value</th>
                        <th className="py-3 px-4 text-right">Commission</th>
                        <th className="py-3 px-4 text-right">Paid</th>
                        <th className="py-3 px-4 text-right">Amount Due</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 font-mono font-bold text-sky-700">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {inv.billingPeriod}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {inv.issueDate} / {inv.dueDate}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-700">
                            {inv.successfulReferralsCount}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-slate-800">
                            {formatINR(inv.totalTreatmentValue)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">
                            {formatINR(inv.mediBridgeCommission)}
                          </td>
                          <td className="py-3 px-4 text-right text-emerald-700 font-semibold">
                            {formatINR(inv.paymentsReceived)}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-sky-950">
                            {formatINR(inv.finalAmountDue)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                inv.status === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : inv.status === 'Partially Paid'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : inv.status === 'Overdue'
                                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                                  : 'bg-sky-100 text-sky-900 border-sky-300'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setViewingInvoice(inv)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                title="View & Print Invoice"
                              >
                                <Eye size={14} />
                              </button>
                              {inv.finalAmountDue > 0 && (
                                <button
                                  onClick={() => {
                                    setPaymentTargetInvoice(inv);
                                    setShowPaymentModal(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] transition-colors"
                                >
                                  Pay
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {invoices.length === 0 && (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-slate-400">
                            No invoices generated yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB: PAYMENTS */}
          {/* ==================================================================== */}
          {activeTab === 'payments' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display font-black text-2xl text-slate-900">
                    Payment Ledger &amp; Remittances
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track submitted bank transfers, UTR references, and verification status
                  </p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  <CreditCard size={15} />
                  <span>Record New Remittance / UTR</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Payment ID</th>
                        <th className="py-3 px-4">Invoice #</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4">Transaction / UTR Reference</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {p.id}
                          </td>
                          <td className="py-3 px-4 font-mono text-sky-700">
                            {p.invoiceNumber}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {p.date}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {p.paymentMethod}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-700">
                            {p.transactionReference}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-slate-900">
                            {formatINR(p.amount)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                p.status === 'Verified'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-amber-100 text-amber-900 border-amber-300'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {payments.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No payment transactions recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB: HOSPITAL PROFILE & SETTINGS */}
          {/* ==================================================================== */}
          {(activeTab === 'profile' || activeTab === 'settings') && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display font-black text-2xl text-slate-900">
                  {activeTab === 'profile' ? 'Hospital Profile' : 'Settings & Commission Configuration'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Institutional credentials, banking details, and platform parameters
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div>
                    <label className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                      Hospital Legal Name
                    </label>
                    <p className="text-sm font-bold text-slate-900">{activeHospital.name}</p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                      Facility Classification
                    </label>
                    <p className="text-sm font-bold text-slate-900 capitalize">
                      {activeHospital.type.replace('_', ' ')}
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                      District &amp; State
                    </label>
                    <p className="text-sm font-semibold text-slate-800">
                      {activeHospital.district}, {activeHospital.state}
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                      Referral Commission Rate
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-sky-800">
                        {activeHospital.commissionRate}%
                      </span>
                      <span className="text-[10px] text-slate-400">
                        (Configured by MediBridge Admin)
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                      Official Contact Person
                    </label>
                    <p className="text-sm font-medium text-slate-800">{activeHospital.contactPerson}</p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                      Accounts &amp; Billing Email
                    </label>
                    <p className="text-sm font-medium text-slate-800">{activeHospital.contactEmail}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-bold text-xs text-slate-900 mb-3">
                    Registered Bank Remittance Details
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-bold">Account Name:</span>
                      <span className="font-semibold text-slate-800">{activeHospital.bankDetails.accountName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-bold">Account Number:</span>
                      <span className="font-mono font-bold text-slate-800">{activeHospital.bankDetails.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-bold">Bank &amp; Branch:</span>
                      <span className="font-semibold text-slate-800">{activeHospital.bankDetails.bankName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-bold">IFSC Code:</span>
                      <span className="font-mono font-bold text-slate-800">{activeHospital.bankDetails.ifscCode}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {editingReferral && (
        <TreatmentBillModal
          referral={editingReferral}
          onClose={() => setEditingReferral(null)}
          onUpdated={loadData}
        />
      )}

      {viewingInvoice && (
        <InvoiceViewModal
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          onPayClicked={inv => {
            setPaymentTargetInvoice(inv);
            setShowPaymentModal(true);
          }}
        />
      )}

      {showPaymentModal && (
        <RecordPaymentModal
          invoice={paymentTargetInvoice}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentTargetInvoice(undefined);
          }}
          onPaymentRecorded={loadData}
        />
      )}
    </div>
  );
};

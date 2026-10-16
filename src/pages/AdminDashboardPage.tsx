import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Building2,
  Plus,
  Edit2,
  Check,
  X,
  LogOut,
} from 'lucide-react';
import { MediBridgeLogo } from '../components/ui/MediBridgeLogo';
import {
  getPlatformOverviewStats,
  getHospitalRowsSummary,
  getAllReferrals,
  getAllPayments,
  updateHospitalCommission,
  verifyPayment,
  saveHospital,
  setUserRole,
  formatINR,
  logoutAdmin,
  isHospitalAuthenticated,
} from '../services/hospitalPartnerService';
import type {
  HospitalPartner,
  HospitalRowSummary,
  PlatformOverviewStats,
  HospitalReferral,
  HospitalPayment,
} from '../types/hospital';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [platformStats, setPlatformStats] = useState<PlatformOverviewStats>(
    getPlatformOverviewStats()
  );
  const [hospitalRows, setHospitalRows] = useState<HospitalRowSummary[]>(
    getHospitalRowsSummary()
  );
  const [allReferrals, setAllReferrals] = useState<HospitalReferral[]>(
    getAllReferrals()
  );
  const [allPayments, setAllPayments] = useState<HospitalPayment[]>(
    getAllPayments()
  );

  // Active admin subtab
  const [adminTab, setAdminTab] = useState<'hospitals' | 'referrals' | 'payments' | 'invoices'>('hospitals');

  // Edit Commission Modal State
  const [editingHospitalId, setEditingHospitalId] = useState<string | null>(null);
  const [newCommissionRate, setNewCommissionRate] = useState<number>(5.0);

  // Add Hospital Modal State
  const [showAddHospitalModal, setShowAddHospitalModal] = useState(false);
  const [newHospName, setNewHospName] = useState('');
  const [newHospDistrict, setNewHospDistrict] = useState('Sitapur');
  const [newHospType, setNewHospType] = useState<HospitalPartner['type']>('private_multispecialty');
  const [newHospComm, setNewHospComm] = useState(5.0);

  const loadData = useCallback(() => {
    setPlatformStats(getPlatformOverviewStats());
    setHospitalRows(getHospitalRowsSummary());
    setAllReferrals(getAllReferrals());
    setAllPayments(getAllPayments());
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('medibridge:hospital_data_updated', loadData);
    return () => window.removeEventListener('medibridge:hospital_data_updated', loadData);
  }, [loadData]);

  const handleUpdateCommission = (hospitalId: string) => {
    updateHospitalCommission(hospitalId, newCommissionRate);
    setEditingHospitalId(null);
    loadData();
  };

  const handleVerifyPayment = (paymentId: string) => {
    verifyPayment(paymentId, 'MediBridge Chief Financial Officer');
    loadData();
  };

  const handleAddHospital = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHospName.trim()) return;

    const id = `hosp-${newHospName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}-${Date.now().toString().slice(-4)}`;
    const newHospital: HospitalPartner = {
      id,
      name: newHospName.trim(),
      type: newHospType,
      district: newHospDistrict,
      state: 'Uttar Pradesh',
      address: `${newHospDistrict}, Uttar Pradesh`,
      contactPerson: 'Director of Healthcare Partnerships',
      contactEmail: `admin@${id}.org`,
      contactPhone: '+91 5862 200 111',
      commissionRate: newHospComm,
      bankDetails: {
        accountName: `${newHospName.trim()} Hospital Ltd`,
        accountNumber: '5020008472910',
        ifscCode: 'HDFC0001920',
        bankName: 'HDFC Bank',
      },
      activeStatus: 'active',
      joinedDate: new Date().toISOString().split('T')[0],
    };

    saveHospital(newHospital);
    setShowAddHospitalModal(false);
    setNewHospName('');
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <MediBridgeLogo animated size={28} />
              <div className="flex items-baseline gap-1">
                <span className="font-display font-black text-white text-base sm:text-lg">
                  MediBridge
                </span>
                <span className="text-amber-400 font-extrabold text-sm sm:text-base">
                  ADMIN
                </span>
              </div>
            </Link>
            <span className="text-slate-600">|</span>
            <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
              Platform Overview &amp; Partner Revenue Ledger
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setUserRole('patient');
                navigate('/');
              }}
              className="px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold transition-colors"
            >
              🧑 Patient Portal
            </button>
            <button
              onClick={() => {
                if (isHospitalAuthenticated()) {
                  setUserRole('hospital');
                  navigate('/hospital');
                } else {
                  navigate('/hospital-login');
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold transition-colors"
            >
              🏥 Hospital Portal
            </button>
            <button
              onClick={() => {
                logoutAdmin();
                navigate('/admin-login', { replace: true });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 text-xs font-medium transition-colors"
              title="Sign out of Admin Console"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={16} className="text-amber-400" />
              <span className="text-xs uppercase tracking-wider font-bold text-amber-400">
                MediBridge Platform Administration
              </span>
            </div>
            <h1 className="font-display font-black text-3xl text-white">
              Institutional Revenue &amp; Partner Control
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Cross-hospital financial oversight, dynamic commission agreement rates, and verified remittance clearing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddHospitalModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors shadow-lg"
            >
              <Plus size={15} />
              <span>Add Hospital Partner</span>
            </button>
          </div>
        </div>

        {/* 7 PLATFORM OVERVIEW CARDS (As requested by user prompt #13) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Total Hospitals */}
          <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
              Total Hospitals
            </span>
            <div className="font-display font-black text-2xl text-white">
              {platformStats.totalHospitals}
            </div>
            <span className="text-[10px] text-sky-400">Partner network</span>
          </div>

          {/* Total Referrals */}
          <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
              Total Referrals
            </span>
            <div className="font-display font-black text-2xl text-white">
              {platformStats.totalReferrals}
            </div>
            <span className="text-[10px] text-sky-400">Routed via AI</span>
          </div>

          {/* Completed Treatments */}
          <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
              Completed
            </span>
            <div className="font-display font-black text-2xl text-emerald-400">
              {platformStats.completedTreatments}
            </div>
            <span className="text-[10px] text-emerald-300">Billable cases</span>
          </div>

          {/* Total Treatment Value */}
          <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
              Treatment Value
            </span>
            <div className="font-display font-black text-xl text-white truncate">
              {formatINR(platformStats.totalTreatmentValue)}
            </div>
            <span className="text-[10px] text-slate-400">Gross hospital bills</span>
          </div>

          {/* Total MediBridge Revenue */}
          <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
              MediBridge Revenue
            </span>
            <div className="font-display font-black text-xl text-teal-400 truncate">
              {formatINR(platformStats.totalMediBridgeRevenue)}
            </div>
            <span className="text-[10px] text-teal-300">Commission accrued</span>
          </div>

          {/* Pending Payments */}
          <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
              Pending Invoices
            </span>
            <div className="font-display font-black text-xl text-amber-400 truncate">
              {formatINR(platformStats.pendingPayments)}
            </div>
            <span className="text-[10px] text-amber-300">Awaiting remittance</span>
          </div>

          {/* Overdue Payments */}
          <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
              Overdue
            </span>
            <div className="font-display font-black text-xl text-rose-400 truncate">
              {formatINR(platformStats.overduePayments)}
            </div>
            <span className="text-[10px] text-rose-300">Past due date</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          {[
            { id: 'hospitals', label: 'Hospital Comparison Ledger' },
            { id: 'referrals', label: 'All Platform Referrals' },
            { id: 'payments', label: 'Remittance Verification Queue' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                adminTab === tab.id
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ==================================================================== */}
        {/* SUBTAB 1: HOSPITAL COMPARISON & COMMISSION TABLE */}
        {/* ==================================================================== */}
        {adminTab === 'hospitals' && (
          <div className="space-y-4">
            <div className="bg-slate-800/90 border border-slate-700 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Building2 size={16} className="text-teal-400" />
                  <span>Hospital Accounts &amp; Commission Agreements</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Click 'Edit Rate' to modify hospital-specific commission %
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Hospital Name</th>
                      <th className="py-3 px-4 text-center">Total Referrals</th>
                      <th className="py-3 px-4 text-center">Completed</th>
                      <th className="py-3 px-4 text-right">Treatment Value</th>
                      <th className="py-3 px-4 text-center">Commission %</th>
                      <th className="py-3 px-4 text-right">MediBridge Revenue</th>
                      <th className="py-3 px-4 text-right">Paid</th>
                      <th className="py-3 px-4 text-right">Outstanding</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {hospitalRows.map(row => (
                      <tr key={row.hospitalId} className="hover:bg-slate-750/50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white text-sm">{row.hospitalName}</div>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {row.hospitalType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-300">
                          {row.totalReferrals}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-400">
                          {row.completedTreatments}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-200">
                          {formatINR(row.treatmentValue)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-900 border border-slate-600 px-2.5 py-1 rounded-lg">
                            <span className="font-mono font-bold text-amber-300 text-xs">
                              {row.commissionRate}%
                            </span>
                            <button
                              onClick={() => {
                                setEditingHospitalId(row.hospitalId);
                                setNewCommissionRate(row.commissionRate);
                              }}
                              className="text-slate-400 hover:text-white p-0.5"
                              title="Edit Commission %"
                            >
                              <Edit2 size={11} />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-teal-400">
                          {formatINR(row.mediBridgeRevenue)}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-400">
                          {formatINR(row.paidAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-amber-300">
                          {formatINR(row.outstandingAmount)}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => {
                              navigate('/hospital');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[11px] font-semibold transition-colors"
                          >
                            Open Portal
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
        {/* SUBTAB 2: ALL PLATFORM REFERRALS */}
        {/* ==================================================================== */}
        {adminTab === 'referrals' && (
          <div className="bg-slate-800/90 border border-slate-700 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">
                All Attributed Platform Referrals ({allReferrals.length})
              </h3>
              <span className="text-xs text-slate-400">
                Cross-hospital attribution tracking
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Referral ID</th>
                    <th className="py-3 px-4">Destination Hospital</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Treatment</th>
                    <th className="py-3 px-4 text-right">Bill (₹)</th>
                    <th className="py-3 px-4 text-right">Comm (₹)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {allReferrals.slice(0, 20).map(ref => (
                    <tr key={ref.id} className="hover:bg-slate-750/50">
                      <td className="py-3 px-4 font-mono font-bold text-sky-400">
                        {ref.id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {ref.hospitalName}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {ref.patientAlias}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {ref.serviceRequested}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-100">
                        {ref.treatmentBillAmount > 0 ? formatINR(ref.treatmentBillAmount) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-teal-400">
                        {ref.commissionAmount > 0 ? formatINR(ref.commissionAmount) : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700">
                          {ref.referralStatus.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* SUBTAB 3: REMITTANCE VERIFICATION QUEUE */}
        {/* ==================================================================== */}
        {adminTab === 'payments' && (
          <div className="bg-slate-800/90 border border-slate-700 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">
                  Payment Verification &amp; Clearance Queue
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirm bank UTR matches bank statement to mark invoices as Paid
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Payment ID</th>
                    <th className="py-3 px-4">Hospital</th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">UTR / Transaction ID</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {allPayments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-750/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">{p.id}</td>
                      <td className="py-3 px-4 font-semibold text-white">{p.hospitalName}</td>
                      <td className="py-3 px-4 font-mono text-sky-400">{p.invoiceNumber}</td>
                      <td className="py-3 px-4 text-slate-400">{p.date}</td>
                      <td className="py-3 px-4 text-slate-300">{p.paymentMethod}</td>
                      <td className="py-3 px-4 font-mono text-amber-300 font-bold">{p.transactionReference}</td>
                      <td className="py-3 px-4 text-right font-black text-white">{formatINR(p.amount)}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            p.status === 'Verified'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {p.status === 'Pending Verification' ? (
                          <button
                            onClick={() => handleVerifyPayment(p.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                          >
                            Verify &amp; Clear UTR
                          </button>
                        ) : (
                          <span className="text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1">
                            <Check size={13} />
                            <span>Cleared</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Edit Commission Modal */}
      {editingHospitalId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-white">
              Configure Hospital Commission Rate
            </h3>
            <p className="text-xs text-slate-400">
              Set custom commission percentage for this facility. Automatically applies to all subsequent referrals and treatments.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Commission Rate (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="30"
                  value={newCommissionRate}
                  onChange={e => setNewCommissionRate(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-600 font-bold text-white text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  %
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingHospitalId(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateCommission(editingHospitalId)}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors"
              >
                Save Rate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Hospital Modal */}
      {showAddHospitalModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleAddHospital} className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Add Healthcare Partner Hospital</h3>
              <button type="button" onClick={() => setShowAddHospitalModal(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Hospital Name</label>
              <input
                type="text"
                required
                value={newHospName}
                onChange={e => setNewHospName(e.target.value)}
                placeholder="e.g. LifeCare Multispecialty Hospital"
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">District</label>
                <input
                  type="text"
                  value={newHospDistrict}
                  onChange={e => setNewHospDistrict(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-300 block mb-1">Commission Rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={newHospComm}
                  onChange={e => setNewHospComm(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Facility Type</label>
              <select
                value={newHospType}
                onChange={e => setNewHospType(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              >
                <option value="district_hospital">District Hospital</option>
                <option value="private_multispecialty">Private Multispecialty</option>
                <option value="medical_college">Medical College</option>
                <option value="chc">Community Health Centre (CHC)</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddHospitalModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold"
              >
                Register Hospital
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

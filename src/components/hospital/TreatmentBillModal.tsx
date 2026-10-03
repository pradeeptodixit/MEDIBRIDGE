import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Stethoscope,
  ShieldCheck,
} from 'lucide-react';
import type {
  HospitalReferral,
  HospitalReferralStatus,
  TreatmentStatus,
} from '../../types/hospital';
import {
  updateReferralTreatment,
  formatINR,
} from '../../services/hospitalPartnerService';

interface TreatmentBillModalProps {
  referral: HospitalReferral;
  onClose: () => void;
  onUpdated: () => void;
}

export const TreatmentBillModal: React.FC<TreatmentBillModalProps> = ({
  referral,
  onClose,
  onUpdated,
}) => {
  const [treatmentStatus, setTreatmentStatus] = useState<TreatmentStatus>(
    referral.treatmentStatus
  );
  const [referralStatus, setReferralStatus] = useState<HospitalReferralStatus>(
    referral.referralStatus
  );
  const [billAmount, setBillAmount] = useState<number>(
    referral.treatmentBillAmount || 0
  );
  const appointmentDate = referral.appointmentDate || new Date().toISOString().split('T')[0];
  const [notes, setNotes] = useState<string>(referral.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  // Live Commission Calculation
  const commissionRate = referral.commissionRate;
  const isCompleted =
    treatmentStatus === 'Treatment Completed' ||
    referralStatus === 'treatment_completed';
  const calculatedCommission = isCompleted
    ? Math.round(billAmount * (commissionRate / 100))
    : 0;

  const handleStatusChange = (newStatus: TreatmentStatus) => {
    setTreatmentStatus(newStatus);
    if (newStatus === 'Treatment Completed') {
      setReferralStatus('treatment_completed');
    } else if (newStatus === 'In Treatment') {
      setReferralStatus('treatment_pending');
    } else if (newStatus === 'Awaiting Consultation') {
      setReferralStatus('appointment_scheduled');
    } else if (newStatus === 'Cancelled') {
      setReferralStatus('cancelled');
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    updateReferralTreatment(referral.id, {
      treatmentStatus,
      referralStatus,
      treatmentBillAmount: billAmount,
      appointmentDate,
      notes,
    });
    setIsSaving(false);
    onUpdated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-5"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Stethoscope size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">
                Update Treatment &amp; Billing
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-mono font-bold text-sky-700">{referral.id}</span>
                <span>•</span>
                <span>{referral.patientAlias}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Attribution Card */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-600">
            <span className="font-semibold">Service Requested:</span>
            <span className="font-bold text-slate-900">{referral.serviceRequested}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span className="font-semibold">Urgency Level:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-md ${
                referral.urgency === 'RED'
                  ? 'bg-rose-100 text-rose-800'
                  : referral.urgency === 'YELLOW'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {referral.urgency}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span className="font-semibold">MediBridge Attribution:</span>
            <span className="text-[11px] font-mono text-teal-700 font-bold">
              {referral.attributionProof.sourceTriageSessionId}
            </span>
          </div>
        </div>

        {/* Form Controls */}
        <div className="space-y-4 text-xs">
          {/* Treatment Status */}
          <div>
            <label className="font-bold text-slate-800 block mb-1.5">
              Treatment Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Awaiting Consultation',
                'In Treatment',
                'Treatment Completed',
                'Cancelled',
              ].map(status => (
                <button
                  type="button"
                  key={status}
                  onClick={() => handleStatusChange(status as TreatmentStatus)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold text-left transition-colors cursor-pointer ${
                    treatmentStatus === status
                      ? 'bg-sky-50 border-sky-400 text-sky-900 ring-1 ring-sky-400/40'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Treatment / Final Bill Amount */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Final Treatment / Hospital Bill Amount (₹)
            </label>
            <p className="text-[11px] text-slate-500 mb-1.5">
              Enter total bill amount charged for this treatment.
            </p>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="500"
                value={billAmount || ''}
                onChange={e => setBillAmount(Number(e.target.value))}
                placeholder="e.g. 50000"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Real-time MediBridge Commission Calculation Box */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-900">
              <span className="font-semibold flex items-center gap-1">
                <ShieldCheck size={14} className="text-emerald-700" />
                <span>Commission Rule:</span>
              </span>
              <span className="font-mono font-bold">{commissionRate}% on Completed Treatment</span>
            </div>

            <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-emerald-800 font-medium block">
                  MediBridge Commission Payable:
                </span>
                <span className="text-xs text-emerald-600">
                  {billAmount > 0
                    ? `₹${billAmount.toLocaleString('en-IN')} × ${commissionRate}%`
                    : 'Awaiting bill amount'}
                </span>
              </div>
              <div className="text-right">
                <span className="font-display font-black text-lg text-emerald-950">
                  {formatINR(calculatedCommission)}
                </span>
                {!isCompleted && billAmount > 0 && (
                  <span className="block text-[10px] text-amber-700 font-semibold">
                    (Becomes payable on Completion)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Clinical Notes / Doctor Remarks */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Clinical Summary / Discharge Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Surgery uneventful, patient stabilized and discharged with 7-day medication."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors shadow-xs"
          >
            {isSaving ? 'Saving...' : 'Save & Calculate Commission'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

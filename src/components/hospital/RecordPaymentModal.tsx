import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  CreditCard,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import type { HospitalInvoice, PaymentMethod } from '../../types/hospital';
import {
  recordHospitalPayment,
  getInvoicesForHospital,
  getActiveHospitalId,
  formatINR,
} from '../../services/hospitalPartnerService';

interface RecordPaymentModalProps {
  invoice?: HospitalInvoice;
  onClose: () => void;
  onPaymentRecorded: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  invoice,
  onClose,
  onPaymentRecorded,
}) => {
  const activeHospitalId = getActiveHospitalId();
  const availableInvoices = getInvoicesForHospital(activeHospitalId).filter(
    inv => inv.finalAmountDue > 0
  );

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    invoice ? invoice.id : availableInvoices[0]?.id || ''
  );
  const selectedInvoice =
    availableInvoices.find(i => i.id === selectedInvoiceId) || invoice;

  const [amount, setAmount] = useState<number>(
    selectedInvoice ? selectedInvoice.finalAmountDue : 10000
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    'Bank Transfer / NEFT / RTGS'
  );
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      setErrorMsg('Please select an outstanding invoice to settle.');
      return;
    }
    if (!transactionReference.trim()) {
      setErrorMsg('Please enter a valid Bank UTR, Transaction ID, or Reference number.');
      return;
    }
    if (amount <= 0) {
      setErrorMsg('Payment amount must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    recordHospitalPayment({
      invoiceId: selectedInvoiceId,
      hospitalId: activeHospitalId,
      amount,
      paymentMethod,
      transactionReference: transactionReference.trim(),
      notes: notes.trim() || undefined,
    });

    setIsSubmitting(false);
    onPaymentRecorded();
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
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">
                Record Commission Settlement
              </h3>
              <p className="text-xs text-slate-500">
                Submit remittance details for admin ledger verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Invoice Selection */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Select Invoice to Settle
            </label>
            {availableInvoices.length > 0 ? (
              <select
                value={selectedInvoiceId}
                onChange={e => {
                  setSelectedInvoiceId(e.target.value);
                  const inv = availableInvoices.find(i => i.id === e.target.value);
                  if (inv) setAmount(inv.finalAmountDue);
                }}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {availableInvoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} — {inv.billingPeriod} (Due: {formatINR(inv.finalAmountDue)})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                No unpaid invoices currently outstanding.
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Payment Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                ₹
              </span>
              <input
                type="number"
                min="1"
                value={amount || ''}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            {selectedInvoice && (
              <p className="text-[11px] text-slate-500 mt-1">
                Outstanding balance on this invoice: <strong>{formatINR(selectedInvoice.finalAmountDue)}</strong>
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="font-bold text-slate-800 block mb-1.5">
              Payment Gateway / Remittance Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Bank Transfer / NEFT / RTGS',
                'UPI',
                'Razorpay',
                'Direct Debit',
              ].map(method => (
                <button
                  type="button"
                  key={method}
                  onClick={() => setPaymentMethod(method as PaymentMethod)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold text-left transition-colors cursor-pointer ${
                    paymentMethod === method
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-1 ring-emerald-400/40'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction / Reference ID */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Bank UTR / Transaction Reference ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={transactionReference}
              onChange={e => setTransactionReference(e.target.value)}
              placeholder="e.g. UTR98234710234 or UPI/20260912/91823"
              className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              MediBridge verifies transaction authenticity with bank statements prior to ledger clearance.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Remittance Remarks (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Paid via State Bank corporate net banking"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Integrity Notice */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
            <ShieldCheck size={16} className="text-teal-600 shrink-0 mt-0.5" />
            <span>
              <strong>Zero Fake Payments:</strong> All submitted references are recorded in <em>Pending Verification</em> state until reconciled by the MediBridge finance team.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              {isSubmitting ? 'Recording...' : 'Submit Payment Reference'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

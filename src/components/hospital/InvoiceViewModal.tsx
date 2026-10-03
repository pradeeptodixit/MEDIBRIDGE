import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Printer,
  Download,
  FileText,
  CreditCard,
} from 'lucide-react';
import type { HospitalInvoice } from '../../types/hospital';
import {
  getHospitalById,
  getAllReferrals,
  formatINR,
} from '../../services/hospitalPartnerService';
import { MediBridgeLogo } from '../ui/MediBridgeLogo';

interface InvoiceViewModalProps {
  invoice: HospitalInvoice;
  onClose: () => void;
  onPayClicked?: (invoice: HospitalInvoice) => void;
}

export const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({
  invoice,
  onClose,
  onPayClicked,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const hospital = getHospitalById(invoice.hospitalId);
  const allReferrals = getAllReferrals();
  const itemizedReferrals = allReferrals.filter(r =>
    invoice.itemizedReferralIds.includes(r.id)
  );

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: HospitalInvoice['status']) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Partially Paid':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Overdue':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      default:
        return 'bg-sky-100 text-sky-900 border-sky-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col my-6 max-h-[90vh]"
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-sky-400" />
            <span className="font-display font-bold text-sm">
              MediBridge Tax Invoice • {invoice.invoiceNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Printer size={13} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div ref={printRef} className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 text-xs">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MediBridgeLogo size={24} />
                <span className="font-display font-black text-xl text-slate-900">
                  MediBridge <span className="text-teal-600">AI</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Healthcare Referral Platform &amp; Care Coordination
              </p>
              <p className="text-[11px] text-slate-500">
                GSTIN: 09AAACM9102K1Z5 • PAN: AAACM9102K
              </p>
              <p className="text-[11px] text-slate-500">
                support@medibridge.ai • +91 11 4092 8800
              </p>
            </div>

            <div className="text-right space-y-1">
              <span
                className={`inline-block font-bold uppercase text-[10px] tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                  invoice.status
                )}`}
              >
                {invoice.status}
              </span>
              <div className="font-mono font-bold text-sm text-slate-900 mt-1">
                {invoice.invoiceNumber}
              </div>
              <div className="text-slate-500 text-[11px]">
                Date: <strong>{invoice.issueDate}</strong>
              </div>
              <div className="text-slate-500 text-[11px]">
                Due Date: <strong>{invoice.dueDate}</strong>
              </div>
              <div className="text-slate-500 text-[11px]">
                Billing Period: <strong>{invoice.billingPeriod}</strong>
              </div>
            </div>
          </div>

          {/* Billed To Information */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Billed To (Healthcare Partner):
              </span>
              <h4 className="font-bold text-sm text-slate-900">{invoice.hospitalName}</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {hospital?.address || 'Civil Lines, Sitapur, Uttar Pradesh'}
              </p>
              <p className="text-[11px] text-slate-600">
                Contact: {hospital?.contactPerson || 'Medical Superintendent'}
              </p>
              <p className="text-[11px] text-slate-600">
                Email: {hospital?.contactEmail || 'billing@hospital.org'}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Remittance Account (MediBridge):
              </span>
              <p className="text-[11px] text-slate-700">Account: <strong>MediBridge Health Technologies Pvt Ltd</strong></p>
              <p className="text-[11px] text-slate-700">Bank: <strong>HDFC Bank, Cyber City Branch</strong></p>
              <p className="text-[11px] text-slate-700">A/C: <strong>50200084920192</strong></p>
              <p className="text-[11px] text-slate-700">IFSC: <strong>HDFC0000240</strong></p>
              <p className="text-[11px] text-slate-700">UPI: <strong>medibridge@hdfcbank</strong></p>
            </div>
          </div>

          {/* Itemized Referrals Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-900 text-xs">
                Successful Referrals &amp; Completed Treatments ({itemizedReferrals.length})
              </h4>
              <span className="text-[11px] text-slate-500">
                Attributed via MediBridge Triage
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Referral ID</th>
                    <th className="py-2 px-3">Patient</th>
                    <th className="py-2 px-3">Treatment/Service</th>
                    <th className="py-2 px-3 text-right">Bill Value</th>
                    <th className="py-2 px-3 text-right">Comm ({invoice.commissionRate}%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itemizedReferrals.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-bold text-sky-700 text-[11px]">
                        {r.id}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{r.patientAlias}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">{r.serviceRequested}</td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-900">
                        {formatINR(r.treatmentBillAmount)}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">
                        {formatINR(r.commissionAmount)}
                      </td>
                    </tr>
                  ))}
                  {itemizedReferrals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400">
                        Aggregated referral itemization for billing period {invoice.billingPeriod}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Breakdown */}
          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-2 border-t border-slate-200 pt-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Treatment Value:</span>
                <span className="font-semibold text-slate-900">
                  {formatINR(invoice.totalTreatmentValue)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>MediBridge Commission Rate:</span>
                <span className="font-semibold text-sky-700">{invoice.commissionRate}%</span>
              </div>
              <div className="flex justify-between text-slate-800 font-bold border-t border-slate-100 pt-1">
                <span>MediBridge Commission:</span>
                <span className="text-emerald-700">
                  {formatINR(invoice.mediBridgeCommission)}
                </span>
              </div>
              {invoice.previousOutstanding > 0 && (
                <div className="flex justify-between text-amber-800">
                  <span>Previous Outstanding:</span>
                  <span>{formatINR(invoice.previousOutstanding)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Payments Received:</span>
                <span className="text-emerald-600 font-semibold">
                  - {formatINR(invoice.paymentsReceived)}
                </span>
              </div>
              <div className="flex justify-between text-slate-950 font-black text-sm bg-slate-100 p-2 rounded-xl border border-slate-200">
                <span>Final Amount Due:</span>
                <span className="text-sky-900">{formatINR(invoice.finalAmountDue)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 italic">
              Note: {invoice.notes}
            </div>
          )}
        </div>

        {/* Bottom Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-semibold text-xs transition-colors"
            >
              <Download size={13} />
              <span>Download Invoice</span>
            </button>

            {invoice.finalAmountDue > 0 && onPayClicked && (
              <button
                onClick={() => {
                  onClose();
                  onPayClicked(invoice);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors shadow-xs"
              >
                <CreditCard size={14} />
                <span>Record / Settle Payment</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

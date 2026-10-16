import React, { useState } from 'react';
import { X, GitCompare, ArrowRight, ArrowDownRight, ArrowUpRight, Minus, AlertCircle } from 'lucide-react';
import type { FamilyHealthRecord } from '../../types/family';
import { compareTwoRecords, formatMeasurementValue } from '../../services/familyService';
import { DataProvenanceBadge } from '../ui/DataProvenanceBadge';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  records: FamilyHealthRecord[];
  memberName: string;
}

export const ReportComparisonModal: React.FC<Props> = ({
  isOpen,
  onClose,
  records,
  memberName,
}) => {
  const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const [olderId, setOlderId] = useState<string>(sorted[0]?.id || '');
  const [newerId, setNewerId] = useState<string>(sorted[sorted.length - 1]?.id || '');

  if (!isOpen) return null;

  const olderRecord = records.find(r => r.id === olderId) || sorted[0];
  const newerRecord = records.find(r => r.id === newerId) || sorted[sorted.length - 1];

  const comparisonResult = olderRecord && newerRecord && olderRecord.id !== newerRecord.id
    ? compareTwoRecords(olderRecord, newerRecord)
    : null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Close comparison modal"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-200">
            <GitCompare size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-lg text-slate-900">
                Compare Historical Reports
              </h2>
              <DataProvenanceBadge type="rule_based" size="xs" />
            </div>
            <p className="text-xs text-slate-500">
              Select two assessments to evaluate recorded physiological changes for {memberName}.
            </p>
          </div>
        </div>

        {/* Report Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 mb-5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Older Assessment</label>
            <select
              value={olderId}
              onChange={e => setOlderId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:border-teal-500 cursor-pointer"
            >
              {sorted.map((r, i) => (
                <option key={r.id} value={r.id}>
                  Report #{i + 1} — {formatDate(r.date)} ({r.urgencyLevel})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Newer Assessment</label>
            <select
              value={newerId}
              onChange={e => setNewerId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:border-teal-500 cursor-pointer"
            >
              {sorted.map((r, i) => (
                <option key={r.id} value={r.id}>
                  Report #{i + 1} — {formatDate(r.date)} ({r.urgencyLevel})
                </option>
              ))}
            </select>
          </div>
        </div>

        {olderId === newerId && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2 mb-4">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span>Please select two different reports to perform a comparative analysis.</span>
          </div>
        )}

        {/* Comparison Results */}
        {comparisonResult && (
          <div className="space-y-4 text-xs">
            {/* Urgency Level Progression */}
            <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between flex-wrap gap-2">
              <span className="font-semibold text-slate-300 text-[11px]">Triage Urgency Progression:</span>
              <div className="flex items-center gap-2 font-bold font-mono">
                <span className={`px-2 py-0.5 rounded text-[10px] ${
                  comparisonResult.urgencyChange.from === 'RED' ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40' :
                  comparisonResult.urgencyChange.from === 'YELLOW' ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' :
                  'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {comparisonResult.urgencyChange.from}
                </span>
                <ArrowRight size={14} className="text-slate-400" />
                <span className={`px-2 py-0.5 rounded text-[10px] ${
                  comparisonResult.urgencyChange.to === 'RED' ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40' :
                  comparisonResult.urgencyChange.to === 'YELLOW' ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' :
                  'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {comparisonResult.urgencyChange.to}
                </span>
              </div>
            </div>

            {/* What Changed? Table */}
            <div>
              <h3 className="font-bold text-sm text-slate-900 mb-2">What changed between assessments?</h3>
              <div className="space-y-2">
                {comparisonResult.comparisons.map(comp => {
                  const isDecreased = comp.direction === 'decreased';
                  const isIncreased = comp.direction === 'increased';
                  const isStable = comp.direction === 'stable';

                  return (
                    <div
                      key={comp.metric}
                      className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-slate-900">{comp.label}</span>
                          <span
                            className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.2 rounded-full uppercase ${
                              isDecreased ? 'bg-sky-100 text-sky-800' :
                              isIncreased ? 'bg-amber-100 text-amber-800' :
                              isStable ? 'bg-slate-100 text-slate-700' :
                              'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {isDecreased && <ArrowDownRight size={10} />}
                            {isIncreased && <ArrowUpRight size={10} />}
                            {isStable && <Minus size={10} />}
                            <span>{comp.status}</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{comp.interpretationText}</p>
                      </div>

                      <div className="text-right font-mono text-xs shrink-0 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="text-slate-500 text-[10px]">
                          {formatMeasurementValue(comp.metric, comp.previousValue)} →{' '}
                          <strong className="text-slate-900">
                            {formatMeasurementValue(comp.metric, comp.latestValue)}
                          </strong>{' '}
                          {comp.unit}
                        </div>
                        <div className="text-[11px] font-bold text-teal-700">
                          {comp.absoluteChange}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 text-slate-500 text-[11px] leading-relaxed border border-slate-200/80">
              <strong>Clinical Guardrail Notice:</strong> Directional measurements reflect recorded values over time and do not represent a definitive clinical diagnosis. Please consult a healthcare professional for persistent abnormalities.
            </div>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
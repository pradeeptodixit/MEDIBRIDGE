import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus, LineChart } from 'lucide-react';
import type { MetricComparison } from '../../types/family';
import { formatMeasurementValue } from '../../services/familyService';

interface Props {
  comparison: MetricComparison;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const HealthMetricCard: React.FC<Props> = ({
  comparison,
  isSelected = false,
  onClick,
  className = '',
}) => {
  const isDecreased = comparison.direction === 'decreased';
  const isIncreased = comparison.direction === 'increased';
  const isStable = comparison.direction === 'stable';

  const prevText = formatMeasurementValue(comparison.metric, comparison.previousValue);
  const latestText = formatMeasurementValue(comparison.metric, comparison.latestValue);

  const prevDateText = comparison.previousDate
    ? new Date(comparison.previousDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    : null;
  const latestDateText = comparison.latestDate
    ? new Date(comparison.latestDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    : null;

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl border transition-all cursor-pointer text-xs flex flex-col justify-between ${
        isSelected
          ? 'bg-teal-50/60 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
          : 'bg-white border-slate-200/90 hover:border-teal-300 hover:bg-slate-50/50 shadow-2xs'
      } ${className}`}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-bold text-slate-900 text-sm">{comparison.label}</span>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
              isDecreased
                ? 'bg-sky-50 text-sky-800 border-sky-200'
                : isIncreased
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : isStable
                ? 'bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
          >
            {isDecreased && <ArrowDownRight size={12} />}
            {isIncreased && <ArrowUpRight size={12} />}
            {isStable && <Minus size={12} />}
            <span>{comparison.status.toUpperCase()}</span>
          </span>
        </div>

        {/* Previous vs Latest Values */}
        <div className="grid grid-cols-2 gap-2 my-2.5 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
              Previous {prevDateText ? `(${prevDateText})` : ''}
            </span>
            <span className="font-mono font-bold text-sm text-slate-600 block mt-0.5">
              {prevText} <span className="text-[10px] font-normal text-slate-400">{comparison.unit}</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] text-teal-600 font-bold block uppercase">
              Latest {latestDateText ? `(${latestDateText})` : ''}
            </span>
            <span className="font-mono font-bold text-sm text-teal-900 block mt-0.5">
              {latestText} <span className="text-[10px] font-normal text-teal-700">{comparison.unit}</span>
            </span>
          </div>
        </div>

        {/* Change text */}
        <div className="text-[11px] text-slate-600 leading-relaxed mt-1">
          <strong className="text-slate-800">Change: </strong>
          <span>{comparison.absoluteChange}</span>
        </div>
      </div>

      {/* Footer / Graph Link */}
      <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
        <span className="truncate">{comparison.interpretationText}</span>
        <span className="inline-flex items-center gap-1 font-bold text-teal-700 shrink-0 ml-2">
          <LineChart size={12} />
          <span>Trend</span>
        </span>
      </div>
    </div>
  );
};

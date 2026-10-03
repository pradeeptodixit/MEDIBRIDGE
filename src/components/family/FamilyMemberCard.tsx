import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, ArrowRight, Edit3, HeartPulse } from 'lucide-react';
import type { FamilyMember, FamilyHealthRecord } from '../../types/family';
import { formatMeasurementValue } from '../../services/familyService';

interface Props {
  member: FamilyMember;
  records: FamilyHealthRecord[];
  onEdit?: (member: FamilyMember) => void;
  className?: string;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  father: 'Father',
  mother: 'Mother',
  spouse: 'Spouse',
  son: 'Son',
  daughter: 'Daughter',
  brother: 'Brother',
  sister: 'Sister',
  grandfather: 'Grandfather',
  grandmother: 'Grandmother',
  other: 'Relative',
};

export const FamilyMemberCard: React.FC<Props> = ({
  member,
  records,
  onEdit,
  className = '',
}) => {
  const navigate = useNavigate();

  // Find latest record
  const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestRecord = sorted[0];

  const lastAssessmentDate = latestRecord
    ? new Date(latestRecord.date).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No assessments yet';

  // Extract factual summary
  let factualSummary = 'No recorded physiological measurements yet.';
  if (latestRecord && latestRecord.measurements.length > 0) {
    const bp = latestRecord.measurements.find(m => m.metric === 'blood_pressure');
    const hr = latestRecord.measurements.find(m => m.metric === 'heart_rate');
    const gluc = latestRecord.measurements.find(m => m.metric === 'blood_glucose');

    const parts: string[] = [];
    if (bp) parts.push(`BP ${formatMeasurementValue('blood_pressure', bp.value)} mmHg`);
    if (hr) parts.push(`HR ${formatMeasurementValue('heart_rate', hr.value)} bpm`);
    if (gluc) parts.push(`Glucose ${formatMeasurementValue('blood_glucose', gluc.value)} mg/dL`);

    if (parts.length > 0) {
      factualSummary = `Latest: ${parts.join(' · ')}`;
    } else {
      factualSummary = latestRecord.summary.slice(0, 75) + '...';
    }
  }

  // Initials for avatar
  const initials = member.name
    .split(' ')
    .map(p => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-teal-300 hover:shadow-md transition-all flex flex-col justify-between ${className}`}>
      <div>
        {/* Top bar */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl ${member.avatarBg || 'bg-teal-600'} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs`}>
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-display font-bold text-base text-slate-900 leading-tight">
                  {member.name}
                </h3>
                {member.isDemoData && (
                  <span className="text-[9px] font-bold bg-amber-50 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded">
                    PROTOTYPE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                  {RELATIONSHIP_LABELS[member.relationship] || member.relationship}
                </span>
                <span>•</span>
                <span>{member.age} yrs</span>
                {member.gender && (
                  <>
                    <span>•</span>
                    <span className="capitalize">{member.gender}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {onEdit && (
            <button
              onClick={() => onEdit(member)}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              title="Edit Member Profile"
            >
              <Edit3 size={15} />
            </button>
          )}
        </div>

        {/* Status / Factual Data Summary */}
        <div className="my-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold mb-1">
            <HeartPulse size={13} className="text-teal-600" />
            <span>Factual Status Summary</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            {factualSummary}
          </p>
        </div>

        {/* Meta counters */}
        <div className="grid grid-cols-2 gap-2 py-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar size={13} className="text-slate-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block uppercase">Last Assessment</span>
              <span className="font-semibold text-slate-800 text-[11px] truncate block">
                {lastAssessmentDate}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <FileText size={13} className="text-slate-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Recorded Reports</span>
              <span className="font-semibold text-slate-800 text-[11px] block">
                {records.length} report{records.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="pt-3 mt-1 border-t border-slate-100">
        <button
          onClick={() => navigate(`/family/${member.id}`)}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs group"
        >
          <span>View Health Journey</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

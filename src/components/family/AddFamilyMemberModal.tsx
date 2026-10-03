import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check, Trash2 } from 'lucide-react';
import type { FamilyMember, FamilyRelationship } from '../../types/family';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberData: Omit<FamilyMember, 'id' | 'createdAt'>) => void;
  onDelete?: (id: string) => void;
  initialData?: FamilyMember | null;
}

const RELATIONSHIPS: { value: FamilyRelationship; label: string }[] = [
  { value: 'father', label: 'Father (पिता)' },
  { value: 'mother', label: 'Mother (माता)' },
  { value: 'spouse', label: 'Spouse (पति/पत्नी)' },
  { value: 'son', label: 'Son (पुत्र)' },
  { value: 'daughter', label: 'Daughter (पुत्री)' },
  { value: 'brother', label: 'Brother (भाई)' },
  { value: 'sister', label: 'Sister (बहन)' },
  { value: 'grandfather', label: 'Grandfather (दादा/नाना)' },
  { value: 'grandmother', label: 'Grandmother (दादी/नानी)' },
  { value: 'other', label: 'Other Relative' },
];

const AVATAR_COLORS = [
  'bg-teal-600',
  'bg-indigo-600',
  'bg-purple-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-emerald-700',
  'bg-sky-600',
  'bg-slate-700',
];

export const AddFamilyMemberModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<FamilyRelationship>('father');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [avatarBg, setAvatarBg] = useState<string>(AVATAR_COLORS[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setRelationship(initialData.relationship);
      setAge(String(initialData.age));
      setGender(initialData.gender || 'male');
      setAvatarBg(initialData.avatarBg || AVATAR_COLORS[0]);
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setRelationship('father');
      setAge('');
      setGender('male');
      setAvatarBg(AVATAR_COLORS[0]);
      setNotes('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide the family member\'s name.');
      return;
    }
    const parsedAge = parseInt(age, 10);
    if (!age || isNaN(parsedAge) || parsedAge < 0 || parsedAge > 125) {
      setError('Please provide a valid age between 0 and 125.');
      return;
    }

    onSave({
      name: name.trim(),
      relationship,
      age: parsedAge,
      gender,
      avatarBg,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200">
            <UserPlus size={20} />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900">
              {initialData ? 'Edit Family Member' : 'Add Family Member'}
            </h2>
            <p className="text-xs text-slate-500">
              {initialData
                ? 'Update member profile details and relationships'
                : 'Add a loved one to track their longitudinal healthcare records'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Full Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Ramesh Sharma"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900 text-xs transition-all"
            />
          </div>

          {/* Relationship & Age Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Relationship <span className="text-rose-500">*</span>
              </label>
              <select
                value={relationship}
                onChange={e => setRelationship(e.target.value as FamilyRelationship)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-800 text-xs cursor-pointer bg-white"
              >
                {RELATIONSHIPS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Age (Years) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                max="125"
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder="e.g. 52"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900 text-xs transition-all"
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Gender (Optional)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'male', label: 'Male' },
                { id: 'female', label: 'Female' },
                { id: 'other', label: 'Other' },
              ].map(g => (
                <button
                  type="button"
                  key={g.id}
                  onClick={() => setGender(g.id as any)}
                  className={`py-2 px-3 rounded-lg border font-semibold text-center transition-all ${
                    gender === g.id
                      ? 'bg-teal-50 border-teal-500 text-teal-800 ring-1 ring-teal-500/30'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Avatar Color */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Profile Badge Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {AVATAR_COLORS.map(color => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setAvatarBg(color)}
                  className={`w-7 h-7 rounded-full ${color} flex items-center justify-center transition-transform ${
                    avatarBg === color ? 'scale-115 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-105'
                  }`}
                >
                  {avatarBg === color && <Check size={14} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* General Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Health &amp; Wellness Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Hypertension history, routine BP checks, dietary sodium restriction"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900 text-xs resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            {initialData && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to remove ${initialData.name}?`)) {
                    onDelete(initialData.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-bold px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <Trash2 size={15} />
                <span>Remove</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors shadow-xs"
              >
                {initialData ? 'Save Changes' : 'Add Member'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

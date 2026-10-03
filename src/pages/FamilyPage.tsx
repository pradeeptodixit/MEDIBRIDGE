import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  HeartPulse,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import type { FamilyMember, FamilyHealthRecord } from '../types/family';
import {
  getFamilyMembers,
  getAllFamilyRecords,
  saveFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  resetDemoFamily,
} from '../services/familyService';
import { FamilyMemberCard } from '../components/family/FamilyMemberCard';
import { AddFamilyMemberModal } from '../components/family/AddFamilyMemberModal';
import { FamilyEmptyState } from '../components/family/FamilyEmptyState';
import { DataProvenanceBadge } from '../components/ui/DataProvenanceBadge';
import { useToast } from '../hooks/useToast';

export const FamilyPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [records, setRecords] = useState<FamilyHealthRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  const loadData = () => {
    setMembers(getFamilyMembers());
    setRecords(getAllFamilyRecords());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('medibridge:family_updated', loadData);
    return () => window.removeEventListener('medibridge:family_updated', loadData);
  }, []);

  const handleSaveMember = (memberData: Omit<FamilyMember, 'id' | 'createdAt'>) => {
    if (editingMember) {
      updateFamilyMember(editingMember.id, memberData);
      addToast(`Updated ${memberData.name}'s profile.`, 'success');
      setEditingMember(null);
    } else {
      const created = saveFamilyMember(memberData);
      addToast(`Added ${created.name} to family circle.`, 'success');
    }
    loadData();
  };

  const handleDeleteMember = (id: string) => {
    deleteFamilyMember(id);
    addToast('Family member removed.', 'info');
    loadData();
  };

  const handleResetDemo = () => {
    resetDemoFamily();
    addToast('Restored demonstration family records (Sharma Family).', 'info');
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Hero Header */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  <HeartPulse size={13} className="text-teal-600" /> MediBridge Family
                </span>
                <DataProvenanceBadge type="patient_entered" />
                <DataProvenanceBadge type="prototype_synthetic" />
              </div>

              <h1 className="text-2xl sm:text-4xl font-display font-black text-slate-900 tracking-tight">
                One place to manage your family's healthcare journey.
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
                Track historical health reports, compare physiological measurements across visits, and observe longitudinal health progress over time.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                onClick={handleResetDemo}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
                title="Reset to demo family state"
              >
                <RotateCcw size={13} />
                <span>Reset Demo Family</span>
              </button>

              <button
                onClick={() => {
                  setEditingMember(null);
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-colors shadow-xs"
              >
                <UserPlus size={16} />
                <span>Add Family Member</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Family Members</span>
              <span className="font-display font-bold text-lg sm:text-xl text-slate-900 mt-0.5 block">
                {members.length}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Health Reports</span>
              <span className="font-display font-bold text-lg sm:text-xl text-indigo-900 mt-0.5 block">
                {records.length}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Longitudinal Vitals</span>
              <span className="font-display font-bold text-lg sm:text-xl text-teal-800 mt-0.5 block">
                BP, HR, Glucose
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Care Continuity</span>
              <span className="font-display font-bold text-lg sm:text-xl text-emerald-700 mt-0.5 block">
                Connected PHC
              </span>
            </div>
          </div>
        </div>

        {/* Member Cards Grid */}
        {members.length === 0 ? (
          <FamilyEmptyState
            type="no_members"
            onAction={() => {
              setEditingMember(null);
              setShowAddModal(true);
            }}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <Users size={18} className="text-teal-600" />
                <span>Family Members ({members.length})</span>
              </h2>
              <span className="text-xs text-slate-500">
                Select a family member to view their longitudinal health journey
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {members.map(member => {
                const memberRecords = records.filter(r => r.memberId === member.id);
                return (
                  <FamilyMemberCard
                    key={member.id}
                    member={member}
                    records={memberRecords}
                    onEdit={m => {
                      setEditingMember(m);
                      setShowAddModal(true);
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Core Product Message Card */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-slate-800">
          <div className="space-y-1.5 max-w-2xl">
            <span className="text-[10px] font-bold text-teal-300 uppercase tracking-widest block">
              MediBridge Longitudinal Care Continuity
            </span>
            <h3 className="font-display font-bold text-lg sm:text-xl text-white">
              "MediBridge doesn't just store health reports. It helps you understand how recorded measurements change over time."
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Family members can observe physiological trends (such as blood pressure stabilization after medication adherence) without clinical guesswork or unverified AI claims.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={() => navigate('/assessment')}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition-colors shadow-sm flex items-center gap-2"
            >
              <span>New Assessment</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Add / Edit Member Modal */}
        <AddFamilyMemberModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingMember(null);
          }}
          onSave={handleSaveMember}
          onDelete={handleDeleteMember}
          initialData={editingMember}
        />
      </div>
    </div>
  );
};

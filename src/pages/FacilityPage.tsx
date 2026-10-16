import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Activity,
  Sparkles,
  Compass,
} from 'lucide-react';
import { FacilityMatchCard } from '../components/facility/FacilityMatchCard';
import { NearbyHospitalFinder } from '../components/emergency/NearbyHospitalFinder';
import { DataProvenanceBadge } from '../components/ui/DataProvenanceBadge';
import { ReferralCreatedModal } from '../components/referral/ReferralCreatedModal';
import { recommendFacilities } from '../services/facilityMatchingService';
import { createReferral } from '../services/referralService';
import type { AssessmentSession, UrgencyLevel, FacilityRecommendation, Referral } from '../types';

export const FacilityPage: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [recommendations, setRecommendations] = useState<FacilityRecommendation[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<FacilityRecommendation | null>(null);
  const [createdReferral, setCreatedReferral] = useState<Referral | null>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'matching' | 'finder'>('matching');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('medibridge_session');
      if (stored) {
        const sess: AssessmentSession = JSON.parse(stored);
        setSession(sess);
        const urgency: UrgencyLevel = sess.aiResponse?.urgencyLevel || 'YELLOW';
        const recs = recommendFacilities(urgency, sess.symptoms || 'General consultation', [], 3);
        setRecommendations(recs);
        if (recs.length > 0) setSelectedFacility(recs[0]);
        return;
      }
    } catch { /* ignore */ }

    // Fallback default: show recommendations for standard outpatient triage
    const recs = recommendFacilities('YELLOW', 'Fever and bodyache for 2 days', [], 3);
    setRecommendations(recs);
    if (recs.length > 0) setSelectedFacility(recs[0]);
  }, []);

  const handleSelectFacility = (rec: FacilityRecommendation) => {
    setSelectedFacility(rec);
    // Create referral
    const newRef = createReferral({
      patientName: session?.patientName || 'Demo Patient',
      age: session?.age || '42',
      gender: session?.gender || 'Male',
      assessmentId: session?.id || `demo-${Date.now()}`,
      originType: 'patient',
      originVillageName: 'Rampur Kalan',
      destinationFacilityId: rec.facilityId,
      destinationFacilityName: rec.facilityName,
      destinationFacilityType: rec.facilityType,
      urgency: (session?.aiResponse?.urgencyLevel as UrgencyLevel) || 'YELLOW',
      reason: session?.aiResponse?.recommendedNextStep || 'Clinical evaluation and diagnostic testing',
      symptoms: session?.symptoms || 'Persistent fever with fatigue',
      aiSummary: session?.aiResponse?.summary || 'Patient assessed with moderate urgency requiring outpatient consultation.',
      informationCompleteness: session?.aiResponse?.informationCompleteness || 'moderate',
      isDemoData: true,
    });

    setCreatedReferral(newRef);
    setShowReferralModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  <Building2 size={12} className="text-teal-600" /> Phase 1 Facility Care Matching
                </span>
                <DataProvenanceBadge type="prototype_synthetic" />
                <DataProvenanceBadge type="rule_based" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
                Healthcare Facility Matching
              </h1>
              <p className="text-slate-600 text-sm mt-1 max-w-2xl">
                MediBridge directs patients to the right level of public care (PHC, CHC, or District Hospital) based on clinical urgency, diagnostics, and distance.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate('/assessment')}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Activity size={15} />
                <span>Start Assessment</span>
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 border-t border-slate-100 pt-4 mt-6">
            <button
              onClick={() => setActiveTab('matching')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'matching'
                  ? 'bg-teal-50 text-teal-900 border border-teal-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sparkles size={14} />
              <span>Explainable Recommendations</span>
            </button>
            <button
              onClick={() => setActiveTab('finder')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'finder'
                  ? 'bg-teal-50 text-teal-900 border border-teal-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Compass size={14} />
              <span>Nearby Hospitals (GPS / City)</span>
            </button>
          </div>
        </div>

        {/* TAB 1: Explainable Facility Matching */}
        {activeTab === 'matching' && (
          <div className="space-y-6">
            {/* Active Triage Context */}
            {session ? (
              <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">
                    Active Triage Session
                  </span>
                  <div className="font-bold text-sm text-slate-900">
                    Patient: {session.patientName || 'Demo Patient'} · Urgency Tier: {session.aiResponse?.urgencyLevel || 'YELLOW'}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 truncate max-w-xl">
                    Reported Symptoms: {session.symptoms}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/report')}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 underline shrink-0"
                >
                  View Full Report →
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between gap-4 text-xs text-slate-600">
                <div>
                  <span className="font-bold text-slate-800">Showing default recommendation sample.</span> Complete an assessment to see personalized facility scoring based on your specific symptoms.
                </div>
                <button
                  onClick={() => navigate('/assessment')}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0"
                >
                  Start Triage
                </button>
              </div>
            )}

            {/* Why Facility Matching Matters Callout */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-teal-300 uppercase tracking-widest block mb-1">
                  Why Facility Matching Matters
                </span>
                <p className="font-display font-bold text-base text-white">
                  "Guiding patients to the right facility prevents hospital overcrowding and delays."
                </p>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Patients with mild conditions are matched to primary health centres, while complex cases requiring labs or doctors are escalated to CHCs or District Hospitals.
                </p>
              </div>
              <div className="shrink-0">
                <span className="text-xs font-bold bg-teal-500/20 text-teal-300 px-3 py-1 rounded-full border border-teal-500/30">
                  ✓ Explainable Matching Engine
                </span>
              </div>
            </div>

            {/* Recommendation Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg text-slate-900">
                  Top Recommended Facilities
                </h2>
                <span className="text-xs text-slate-500">
                  Scored across Urgency Fit, Diagnostics, Distance, and Capacity
                </span>
              </div>

              <div className="space-y-4">
                {recommendations.map(rec => (
                  <FacilityMatchCard
                    key={rec.facilityId}
                    recommendation={rec}
                    isSelected={selectedFacility?.facilityId === rec.facilityId}
                    onSelect={handleSelectFacility}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Nearby Hospital Finder (GPS / City Search) */}
        {activeTab === 'finder' && (
          <div className="space-y-4">
            <NearbyHospitalFinder lang="en" />
          </div>
        )}
      </div>

      {/* Referral Created Modal */}
      {showReferralModal && createdReferral && (
        <ReferralCreatedModal
          referral={createdReferral}
          isOpen={showReferralModal}
          onClose={() => setShowReferralModal(false)}
        />
      )}
    </div>
  );
};

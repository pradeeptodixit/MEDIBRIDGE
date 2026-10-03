import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, AlertTriangle, MapPin, 
  Search, HeartPulse, Brain, AlertCircle, Phone, Syringe,
  Plus, Check, Wifi, WifiOff, Users, Sparkles
} from 'lucide-react';
import { VillageProfile, HouseholdSurvey, HouseholdMember, UrgencyLevel } from '../types';
import type { Referral } from '../types/referral';
import { DEMO_VILLAGES } from '../data/villageData';
import { bhrsService } from '../services/bhrsService';
import { getReferralsByVillage, getReferrals, createReferral } from '../services/referralService';
import { addToSyncQueue } from '../services/syncService';
import { ReferralCreatedModal } from '../components/referral/ReferralCreatedModal';
import { ReferralCard } from '../components/referral/ReferralCard';
import { DataProvenanceBadge } from '../components/ui/DataProvenanceBadge';
import { EarlyWarningCard } from '../components/sentinel/EarlyWarningCard';
import { VillageRiskMap } from '../components/sentinel/VillageRiskMap';
import { generateEarlyWarningAlerts, generateVillageRiskSummaries } from '../services/sentinelService';

export const VillageHealthPage: React.FC = () => {
  const [villages, setVillages] = useState<VillageProfile[]>([]);
  const [selectedVillageId, setSelectedVillageId] = useState<string>('v1');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [createdReferralModal, setCreatedReferralModal] = useState<Referral | null>(null);
  const [villageReferrals, setVillageReferrals] = useState<Referral[]>([]);

  // Survey Form State
  const [surveyHead, setSurveyHead] = useState('');
  const [surveyAddress, setSurveyAddress] = useState('');
  const [waterSource, setWaterSource] = useState<'tap' | 'well' | 'river' | 'borewell'>('tap');
  const [sanitationType, setSanitationType] = useState<'improved' | 'basic' | 'open'>('improved');
  const [members, setMembers] = useState<Array<{
    name: string;
    age: number;
    gender: string;
    symptoms: string;
    isPregnant: boolean;
    trimester: 1 | 2 | 3;
    vaccinationUpToDate: boolean;
  }>>([
    { name: '', age: 30, gender: 'female', symptoms: '', isPregnant: false, trimester: 1, vaccinationUpToDate: true }
  ]);

  // Load from localStorage or fallback
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mb_villages');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.length > 0) {
          setVillages(parsed);
          setSelectedVillageId(parsed[0].id);
          return;
        }
      }
    } catch {}
    setVillages(DEMO_VILLAGES);
    setSelectedVillageId(DEMO_VILLAGES[0].id);
    localStorage.setItem('mb_villages', JSON.stringify(DEMO_VILLAGES));
  }, []);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncNotice('Internet connected. [Prototype sync simulation: surveys saved in local browser storage]');
      setTimeout(() => setSyncNotice(null), 4000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncNotice('Offline mode active. Surveys saved locally on this device in browser storage.');
      setTimeout(() => setSyncNotice(null), 4000);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const selectedVillage = villages.find(v => v.id === selectedVillageId) || villages[0] || DEMO_VILLAGES[0];
  const bhrsData = selectedVillage ? bhrsService.calculateVillageBHRS(selectedVillage) : null;

  const filteredVillages = villages.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.district.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = filterRisk === 'all' || v.riskLevel.toLowerCase() === filterRisk.toLowerCase();
    return matchesSearch && matchesRisk;
  });

  const handleAddMember = () => {
    setMembers(prev => [
      ...prev,
      { name: '', age: 25, gender: 'male', symptoms: '', isPregnant: false, trimester: 1, vaccinationUpToDate: true }
    ]);
  };

  const handleSaveSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyHead.trim()) return;

    // Calculate household risk score
    let riskScore = 15;
    const householdMembers: HouseholdMember[] = members.map((m, idx) => {
      let memberScore = 10;
      let urgency: UrgencyLevel = 'GREEN';
      const hasSymptoms = Boolean(m.symptoms.trim());

      if (hasSymptoms) {
        memberScore += 40;
        urgency = 'YELLOW';
        const severeKw = ['chest pain', 'unconscious', 'breathing', 'high fever', 'dehydration', '103', 'shivering'];
        if (severeKw.some(kw => m.symptoms.toLowerCase().includes(kw))) {
          memberScore += 40;
          urgency = 'RED';
        }
      }
      if (m.isPregnant) memberScore += 20;
      if (!m.vaccinationUpToDate && m.age < 5) memberScore += 25;

      riskScore = Math.max(riskScore, memberScore);

      return {
        id: `m-${Date.now()}-${idx}`,
        name: m.name || `Member ${idx + 1}`,
        age: Number(m.age) || 20,
        gender: m.gender,
        symptoms: m.symptoms || 'None reported',
        urgencyLevel: urgency,
        isPregnant: m.isPregnant,
        trimester: m.isPregnant ? m.trimester : undefined,
        vaccinationUpToDate: m.vaccinationUpToDate,
        riskScore: Math.min(100, memberScore),
        followUpRequired: urgency !== 'GREEN' || m.isPregnant,
        followUpStatus: urgency !== 'GREEN' || m.isPregnant ? 'pending' : undefined,
      };
    });

    if (waterSource === 'river' || waterSource === 'well') riskScore += 15;
    if (sanitationType === 'open') riskScore += 15;

    const newSurvey: HouseholdSurvey = {
      id: `hh-${Date.now()}`,
      villageId: selectedVillage.id,
      householdHead: surveyHead,
      address: surveyAddress || 'Main Village Ward',
      surveyedAt: new Date().toISOString(),
      surveyedBy: selectedVillage.ashWorkerName || 'ASHA Worker',
      members: householdMembers,
      waterSource,
      sanitationType,
      householdRiskScore: Math.min(100, riskScore),
      recommendations: [
        riskScore > 60 ? 'Schedule priority home visit within 48h' : 'Standard 14-day routine check',
        'Check child immunization record on U-WIN'
      ],
      synced: isOnline,
    };

    // Update village in state & localStorage
    const updatedVillages = villages.map(v => {
      if (v.id === selectedVillage.id) {
        const updatedSurveys = [newSurvey, ...(v.surveys || [])];
        const newPregnantCount = updatedSurveys.flatMap(s => s.members).filter(m => m.isPregnant).length;
        const newHighRiskCount = updatedSurveys.flatMap(s => s.members).filter(m => m.riskScore > 60).length;
        return {
          ...v,
          surveysCompleted: v.surveysCompleted + 1,
          pregnantWomen: Math.max(v.pregnantWomen, newPregnantCount),
          highRiskCount: Math.max(v.highRiskCount, newHighRiskCount),
          surveys: updatedSurveys,
          lastSurveyDate: new Date().toISOString().split('T')[0],
        };
      }
      return v;
    });

    setVillages(updatedVillages);
    localStorage.setItem('mb_villages', JSON.stringify(updatedVillages));
    addToSyncQueue('household_survey', `Survey: ${surveyHead} (${selectedVillage.name})`, newSurvey);

    // Reset Form
    setSurveyHead('');
    setSurveyAddress('');
    setMembers([{ name: '', age: 30, gender: 'female', symptoms: '', isPregnant: false, trimester: 1, vaccinationUpToDate: true }]);
    setShowSurveyModal(false);
    setSyncNotice(isOnline ? 'Household survey saved. [Prototype sync simulation: stored locally]' : 'Household survey saved offline in local storage.');
    setTimeout(() => setSyncNotice(null), 4000);
  };

  const handleReferMember = (m: HouseholdMember, hhHead: string) => {
    const ref = createReferral({
      patientName: m.name,
      age: m.age,
      gender: m.gender,
      originType: 'asha',
      originVillageId: selectedVillage.id,
      originVillageName: selectedVillage.name,
      destinationFacilityId: 'phc-rampur',
      destinationFacilityName: 'PHC Rampur Kalan',
      destinationFacilityType: 'phc',
      urgency: m.urgencyLevel || 'YELLOW',
      reason: `ASHA Field Referral: ${m.symptoms} (Household: ${hhHead})`,
      symptoms: m.symptoms,
      aiSummary: `ASHA FIELD ASSESSMENT: High-priority case from ${selectedVillage.name}. Member of ${hhHead}'s household. Risk score: ${m.riskScore}/100.`,
      informationCompleteness: 'moderate',
      isDemoData: true,
    });
    setCreatedReferralModal(ref);
    setVillageReferrals(getReferralsByVillage(selectedVillage.id));
  };

  useEffect(() => {
    setVillageReferrals(getReferralsByVillage(selectedVillageId));
  }, [selectedVillageId]);

  const getRiskBadgeColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'MODERATE': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header Banner */}
      <section className="bg-white border-b border-slate-200 pt-8 pb-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  <Sparkles size={12} /> ASHA Field Hub · Frontline Continuum
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />} {isOnline ? 'Connected' : 'Offline Mode (Local Storage)'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900">
                ASHA Field Hub — Village Health Intelligence
              </h1>
              <p className="text-slate-600 text-sm sm:text-base mt-1 max-w-2xl">
                Empowering ASHA frontline workers with household health surveys, priority follow-ups, and direct PHC referral dispatch.
              </p>
            </div>

            <button
              onClick={() => setShowSurveyModal(true)}
              className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm shadow-teal-600/20 shrink-0"
              id="btn-new-survey"
            >
              <Plus size={18} />
              + Record Household Survey
            </button>
          </div>
        </div>
      </section>

      {/* Sync / Connectivity Notice */}
      <AnimatePresence>
        {syncNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-6xl mx-auto px-4 mt-4"
          >
            <div className="bg-teal-600 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs">
              <span className="flex items-center gap-2">
                <Check size={16} /> {syncNotice}
              </span>
              <button onClick={() => setSyncNotice(null)} className="opacity-80 hover:opacity-100 text-xs">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Layout */}
      <div className="max-w-6xl mx-auto px-4 mt-6 space-y-6">

        {/* Sentinel Early Warning Section */}
        {(() => {
          const allReferrals = getReferrals();
          const alerts = generateEarlyWarningAlerts(villages, allReferrals);
          const summaries = generateVillageRiskSummaries(villages, allReferrals);
          return (
            <>
              {/* Early Warning Alerts Top Bar */}
              {alerts.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-600" />
                        <h2 className="font-display font-bold text-base text-slate-900">
                          Sentinel Early Warning Signals
                        </h2>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          {alerts.length} Signals Detected
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Explainable trend detection flagging unusual symptom report increases across district catchments.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <DataProvenanceBadge type="rule_based" />
                      <DataProvenanceBadge type="prototype_synthetic" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {alerts.slice(0, 2).map(alert => (
                      <EarlyWarningCard
                        key={alert.id}
                        alert={alert}
                        onAction={vId => setSelectedVillageId(vId)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* District Health Risk Map */}
              <VillageRiskMap
                villages={summaries}
                selectedVillageId={selectedVillageId}
                onSelectVillage={id => setSelectedVillageId(id)}
              />
            </>
          );
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Village Selector & Directory */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Building2 size={16} className="text-teal-600" />
                  Surveyed Villages ({filteredVillages.length})
                </h2>
                <div className="flex gap-1">
                  {['all', 'critical', 'high', 'stable'].map(r => (
                    <button
                      key={r}
                      onClick={() => setFilterRisk(r)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize transition-colors ${
                        filterRisk === r ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative mb-3">
                <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by village or district..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-base sm:text-sm"
                />
              </div>

              {/* Village List */}
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {filteredVillages.map(v => {
                  const isSelected = v.id === selectedVillage.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVillageId(v.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-teal-50/80 border-teal-500 shadow-xs ring-1 ring-teal-500'
                          : 'bg-white border-slate-200 hover:border-teal-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 truncate">{v.name}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getRiskBadgeColor(v.riskLevel)}`}>
                            {v.riskLevel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {v.district}, {v.state} · Pop: {v.population}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-black text-sm text-teal-700">{v.bhrsScore || 75}<span className="text-[10px] text-slate-400">/100</span></div>
                        <div className="text-[10px] text-slate-400 font-medium">BHRS Score</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ASHA Worker Contact Card */}
            {selectedVillage && (
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-4 border border-teal-200/80 text-xs text-slate-700 space-y-2">
                <div className="font-bold text-sm text-teal-900 flex items-center justify-between">
                  <span>Assigned ASHA Worker</span>
                  <span className="text-teal-600">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{selectedVillage.ashWorkerName}</span>
                  <a href={`tel:${selectedVillage.ashWorkerPhone}`} className="text-teal-700 font-bold flex items-center gap-1 hover:underline">
                    <Phone size={12} /> {selectedVillage.ashWorkerPhone}
                  </a>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Last field survey completed: <span className="font-medium text-slate-700">{selectedVillage.lastSurveyDate}</span>
                </p>
              </div>
            )}
          </div>

          {/* Right Two Columns: Selected Village Dashboard & Insights */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Top Village Header & BHRS Signature Score */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-display font-black text-slate-900">
                      {selectedVillage.name}
                    </h2>
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getRiskBadgeColor(selectedVillage.riskLevel)}`}>
                      {selectedVillage.riskLevel} TIER
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                    <MapPin size={13} className="text-teal-600" /> {selectedVillage.district}, {selectedVillage.state} · {selectedVillage.surveysCompleted}/{selectedVillage.households} Households Surveyed
                  </p>
                </div>

                {/* Bharat Health Readiness Score (BHRS) Gauge */}
                {bhrsData && (
                  <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl flex items-center gap-3 shrink-0 shadow-sm">
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">Bharat Health Readiness</div>
                      <div className="text-xs text-slate-300">Status: <span className="font-bold text-white">{bhrsData.status}</span></div>
                    </div>
                    <div className="w-12 h-12 rounded-full border-3 border-teal-400 flex items-center justify-center font-display font-black text-base text-teal-300 bg-teal-950/60">
                      {bhrsData.score}
                    </div>
                  </div>
                )}
              </div>

              {/* 4 KPI Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-1">
                    <Users size={14} className="text-teal-600" /> Population
                  </div>
                  <div className="text-lg font-black text-slate-900">{selectedVillage.population}</div>
                  <div className="text-[11px] text-slate-500">{selectedVillage.households} Households</div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-1">
                    <Syringe size={14} className="text-emerald-600" /> Vaccination
                  </div>
                  <div className="text-lg font-black text-slate-900">{selectedVillage.vaccinationCoverage}%</div>
                  <div className="text-[11px] text-emerald-600 font-medium">Under Mission Indradhanush</div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-1">
                    <HeartPulse size={14} className="text-rose-500" /> Pregnant Women
                  </div>
                  <div className="text-lg font-black text-slate-900">{selectedVillage.pregnantWomen}</div>
                  <div className="text-[11px] text-rose-600 font-medium">Tracked for ANC & JSY</div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-1">
                    <AlertTriangle size={14} className="text-amber-500" /> High-Risk Cases
                  </div>
                  <div className="text-lg font-black text-slate-900">{selectedVillage.highRiskCount}</div>
                  <div className="text-[11px] text-amber-600 font-medium">{selectedVillage.pendingFollowUps} Pending Follow-Ups</div>
                </div>
              </div>
            </div>

            {/* Disease Intelligence & Symptom Trends */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Brain size={16} className="text-teal-600" />
                  Symptom Intelligence & Cluster Vigilance
                </h3>
                <span className="text-xs text-slate-400 font-medium">ASHA Field Reports</span>
              </div>

              {/* Symptom Trends Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {selectedVillage.commonSymptoms.map((s, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 truncate">{s.symptom}</p>
                      <p className="text-[11px] text-slate-500">{s.count} households</p>
                    </div>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      s.trend === 'up' ? 'bg-red-100 text-red-700' : s.trend === 'down' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {s.trend === 'up' ? '↑ Rising' : s.trend === 'down' ? '↓ Falling' : '→ Stable'}
                    </span>
                  </div>
                ))}
              </div>

              {/* AI Narrative Box */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200/70 text-xs sm:text-sm text-teal-900 leading-relaxed">
                <span className="font-bold text-teal-800">🤖 AI Village Health Summary: </span>
                {selectedVillage.riskLevel === 'CRITICAL' ? (
                  `Urgent cluster alert: ${selectedVillage.commonSymptoms[0]?.count || 20}+ households in ${selectedVillage.name} report febrile and gastrointestinal symptoms. Water testing & mobile medical unit deployment advised immediately.`
                ) : selectedVillage.riskLevel === 'HIGH' ? (
                  `Elevated symptom load detected in ${selectedVillage.name}. ${selectedVillage.pregnantWomen} pregnant mothers require ANC follow-up. Intensified sanitation & vector control recommended.`
                ) : (
                  `${selectedVillage.name} exhibits stable epidemiological trends. Vaccination coverage is at ${selectedVillage.vaccinationCoverage}%. Continue routine fortnightly surveillance.`
                )}
              </div>
            </div>

            {/* High-Risk Families & Recent Surveys */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-500" />
                  High-Priority Family Follow-Up Queue
                </h3>
                <span className="text-xs text-slate-500">
                  {selectedVillage.surveys?.length || 0} Household Surveys on record
                </span>
              </div>

              {selectedVillage.surveys && selectedVillage.surveys.length > 0 ? (
                <div className="space-y-3">
                  {selectedVillage.surveys.map((survey) => (
                    <div
                      key={survey.id}
                      className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5 mb-2.5">
                        <div>
                          <span className="font-bold text-sm text-slate-900">{survey.householdHead}</span>
                          <span className="text-xs text-slate-500 ml-2">({survey.address})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            Water: <span className="capitalize font-medium text-slate-700">{survey.waterSource}</span> · Sanitation: <span className="capitalize font-medium text-slate-700">{survey.sanitationType}</span>
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                            survey.householdRiskScore > 70 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            Risk: {survey.householdRiskScore}/100
                          </span>
                        </div>
                      </div>

                      {/* Members Breakdown */}
                      <div className="space-y-1.5">
                        {survey.members.map((m) => (
                          <div key={m.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white border border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">{m.name} ({m.age}y, {m.gender})</span>
                              {m.isPregnant && (
                                <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded text-[10px] font-bold">
                                  Pregnant (T{m.trimester})
                                </span>
                              )}
                              <span className="text-slate-500 truncate max-w-[200px]">{m.symptoms}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {m.followUpRequired && (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                                  Follow-up Needed
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleReferMember(m, survey.householdHead)}
                                className="px-2 py-0.5 rounded bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold transition-colors shadow-2xs"
                              >
                                Refer to PHC
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No household surveys recorded yet for this village. Click "+ Record Household Survey" to add one.
                </div>
              )}
            </div>

            {/* Active Facility Referrals from this Village */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Building2 size={16} className="text-teal-600" />
                  Active Facility Referrals ({selectedVillage.name})
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {villageReferrals.length} Cases Referred
                </span>
              </div>

              {villageReferrals.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No facility referrals active for this village yet. Click "Refer to PHC" on any high-risk survey above to create one.
                </div>
              ) : (
                <div className="space-y-3">
                  {villageReferrals.map((r) => (
                    <ReferralCard key={r.id} referral={r} compact={true} />
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Household Survey Modal */}
      <AnimatePresence>
        {showSurveyModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">ASHA Household Survey Collection</h3>
                  <p className="text-xs text-slate-500">Village: <span className="font-bold text-teal-700">{selectedVillage.name}</span></p>
                </div>
                <button onClick={() => setShowSurveyModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
              </div>

              <form onSubmit={handleSaveSurvey} className="space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Household Head Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ram Prasad"
                      value={surveyHead}
                      onChange={(e) => setSurveyHead(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Address / Ward No.</label>
                    <input
                      type="text"
                      placeholder="e.g. Ward 4, Near Well"
                      value={surveyAddress}
                      onChange={(e) => setSurveyAddress(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 text-base sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Primary Water Source</label>
                    <select
                      value={waterSource}
                      onChange={(e) => setWaterSource(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm"
                    >
                      <option value="tap">Piped Tap Water (Safe)</option>
                      <option value="borewell">Borewell / Handpump</option>
                      <option value="well">Open Well</option>
                      <option value="river">River / Pond (Untreated)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Sanitation Facility</label>
                    <select
                      value={sanitationType}
                      onChange={(e) => setSanitationType(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm"
                    >
                      <option value="improved">Individual Household Toilet (IHHL)</option>
                      <option value="basic">Shared Community Toilet</option>
                      <option value="open">Open Defecation Area</option>
                    </select>
                  </div>
                </div>

                {/* Member Roster */}
                <div className="border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-slate-900 font-bold">Household Members ({members.length})</label>
                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="text-teal-600 hover:text-teal-700 font-bold text-xs flex items-center gap-1"
                    >
                      + Add Another Member
                    </button>
                  </div>

                  <div className="space-y-3">
                    {members.map((m, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 text-xs">Member #{idx + 1}</span>
                          {members.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setMembers(prev => prev.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:text-red-700 text-[11px]"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Name"
                            value={m.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMembers(prev => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                            }}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-base sm:text-xs"
                          />
                          <input
                            type="number"
                            placeholder="Age"
                            value={m.age || ''}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setMembers(prev => prev.map((item, i) => i === idx ? { ...item, age: val } : item));
                            }}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-base sm:text-xs"
                          />
                          <select
                            value={m.gender}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMembers(prev => prev.map((item, i) => i === idx ? { ...item, gender: val } : item));
                            }}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-base sm:text-xs"
                          >
                            <option value="female">Female</option>
                            <option value="male">Male</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <input
                          type="text"
                          placeholder="Current symptoms (fever, cough, diarrhea, etc. or leave blank)"
                          value={m.symptoms}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMembers(prev => prev.map((item, i) => i === idx ? { ...item, symptoms: val } : item));
                          }}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-base sm:text-xs"
                        />

                        <div className="flex items-center gap-4 flex-wrap text-xs text-slate-700">
                          {m.gender === 'female' && (
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={m.isPregnant}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setMembers(prev => prev.map((item, i) => i === idx ? { ...item, isPregnant: checked } : item));
                                }}
                                className="rounded text-teal-600 focus:ring-teal-500"
                              />
                              <span>Currently Pregnant</span>
                            </label>
                          )}
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={m.vaccinationUpToDate}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setMembers(prev => prev.map((item, i) => i === idx ? { ...item, vaccinationUpToDate: checked } : item));
                              }}
                              className="rounded text-teal-600 focus:ring-teal-500"
                            />
                            <span>Vaccines Up-To-Date</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowSurveyModal(false)}
                    className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                  >
                    Save & Triage Survey
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {createdReferralModal && (
        <ReferralCreatedModal
          referral={createdReferralModal}
          isOpen={true}
          onClose={() => setCreatedReferralModal(null)}
        />
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  Share2,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Activity,
  ChevronRight,
  RotateCcw,
  Volume2,
  VolumeX,
  Info,
  Copy,
  Check,
  Sparkles,
  ShieldAlert,
  FileText,
  Globe,
  ArrowRight,
  PlusCircle,
  Users,
} from 'lucide-react';
import { generateHealthReportPDF } from '../utils/pdfGenerator';
import { useSpeechSynthesis } from '../hooks/useVoice';
import { getAISourceLabel } from '../services/aiService';
import { createReferral, getReferralById, getReferrals } from '../services/referralService';
import { saveReportToFamilyMember } from '../services/familyService';
import type { AssessmentSession, HealthReport, UrgencyLevel, Language, Referral } from '../types';
import { ReferralCard } from '../components/referral/ReferralCard';
import { ReferralCreatedModal } from '../components/referral/ReferralCreatedModal';
import { DataProvenanceBadge } from '../components/ui/DataProvenanceBadge';
import { FacilityMatchCard } from '../components/facility/FacilityMatchCard';
import { recommendFacilities } from '../services/facilityMatchingService';
import { calculateFacilityLoad } from '../services/sentinelService';

const URGENCY_CONFIG = {
  GREEN: {
    label: 'ROUTINE CARE / HOME MONITORING',
    labelHi: 'घर पर देखभाल / निगरानी',
    tierBadge: 'GREEN TIER · LOW URGENCY',
    tierBadgeHi: 'ग्रीन टियर · कम तात्कालिकता',
    color: 'text-emerald-800',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    barColor: 'bg-emerald-600',
    emoji: '🟢',
    desc: 'Mild symptoms suitable for supportive home care and hydration. Visit local PHC if symptoms persist > 48-72h.',
    descHi: 'हल्के लक्षण जो घर पर आराम और तरल पदार्थ से संभाले जा सकते हैं। 48-72 घंटों से अधिक रहने पर PHC जाएं।',
  },
  YELLOW: {
    label: 'PHC CLINICAL EVALUATION RECOMMENDED',
    labelHi: 'प्राथमिक स्वास्थ्य केंद्र (PHC) में जांच की सलाह',
    tierBadge: 'YELLOW TIER · MEDICAL REVIEW REQUIRED',
    tierBadgeHi: 'येलो टियर · डॉक्टर जांच आवश्यक',
    color: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    barColor: 'bg-amber-500',
    emoji: '🟡',
    desc: 'Symptoms require clinical outpatient examination within 24 hours at nearest Primary Health Centre or clinic.',
    descHi: 'अगले 24 घंटों के भीतर नजदीकी प्राथमिक स्वास्थ्य केंद्र (PHC) में डॉक्टर को दिखाना आवश्यक है।',
  },
  RED: {
    label: 'URGENT MEDICAL EVALUATION REQUIRED',
    labelHi: 'तत्काल आपातकालीन चिकित्सा आवश्यक',
    tierBadge: 'RED TIER · IMMEDIATE EMERGENCY ACTION',
    tierBadgeHi: 'रेड टियर · तत्काल आपातकाल',
    color: 'text-rose-800',
    bg: 'bg-rose-50',
    border: 'border-rose-300',
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
    barColor: 'bg-rose-600',
    emoji: '🔴',
    desc: 'Potential emergency red-flag detected. Call 108 immediately or proceed to nearest emergency hospital.',
    descHi: 'गंभीर आपातकालीन संकेत मिले हैं। तुरंत 108 पर कॉल करें या नजदीकी आपातकालीन केंद्र जाएं।',
  },
};

const COMPLETENESS_CONFIG = {
  high: {
    label: 'High Completeness',
    labelHi: 'उच्च पूर्णता',
    desc: 'Detailed clinical context provided. Urgency recommendation reflects your reported specifics.',
    descHi: 'विस्तृत जानकारी उपलब्ध कराई गई। ट्राइएज आपकी दी गई जानकारी पर आधारित है।',
    color: 'text-emerald-700 bg-emerald-100',
    dots: 3,
  },
  moderate: {
    label: 'Moderate Completeness',
    labelHi: 'मध्यम पूर्णता',
    desc: 'Standard context provided. Additional details regarding duration and fever improve physician review.',
    descHi: 'मानक जानकारी दी गई। लक्षणों की अवधि का विवरण डॉक्टर समीक्षा को और बेहतर बनाता है।',
    color: 'text-amber-800 bg-amber-100',
    dots: 2,
  },
  limited: {
    label: 'Limited Completeness',
    labelHi: 'सीमित पूर्णता',
    desc: 'Preliminary information only. Bring this summary to the PHC Medical Officer for physical examination.',
    descHi: 'केवल प्राथमिक जानकारी। शारीरिक जांच के लिए यह सारांश PHC डॉक्टर को दिखाएं।',
    color: 'text-slate-600 bg-slate-100',
    dots: 1,
  },
};

export const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { toggleSpeak, isSpeaking } = useSpeechSynthesis();
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [report, setReport] = useState<HealthReport | null>(null);
  const [copiedDoctorSummary, setCopiedDoctorSummary] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [activeReferral, setActiveReferral] = useState<Referral | null>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('medibridge_session');
    if (!stored) {
      navigate('/assessment');
      return;
    }
    const sess: AssessmentSession = JSON.parse(stored);
    if (!sess.aiResponse) {
      navigate('/assessment');
      return;
    }
    setSession(sess);
    setLang(sess.language || 'en');

    // Auto-link report to family member if initiated from Family Circle
    if (sess.familyMemberId) {
      saveReportToFamilyMember(sess.familyMemberId, sess, sess.referralId);
    }

    // Check if referral was already created for this session
    if (sess.referralId) {
      const existingRef = getReferralById(sess.referralId);
      if (existingRef) setActiveReferral(existingRef);
    }

    const r: HealthReport = {
      id: sess.id,
      patientName: sess.patientName,
      age: sess.age,
      gender: sess.gender,
      careFor: sess.careFor,
      careAccessContext: sess.careAccessContext,
      symptoms: sess.symptoms,
      followUpAnswers: sess.followUpAnswers || [],
      urgencyLevel: sess.aiResponse.urgencyLevel,
      informationCompleteness: sess.aiResponse.informationCompleteness,
      summary: sess.aiResponse.summary,
      reasoningFactors: sess.aiResponse.reasoningFactors || [],
      nextSteps: sess.aiResponse.nextSteps || sess.aiResponse.immediateActions || [],
      immediateActions: sess.aiResponse.immediateActions || sess.aiResponse.nextSteps || [],
      warningSigns: sess.aiResponse.warningSigns || sess.aiResponse.warningSignsToWatch || [],
      warningSignsToWatch: sess.aiResponse.warningSignsToWatch || sess.aiResponse.warningSigns || [],
      recommendedNextStep: sess.aiResponse.recommendedNextStep,
      doctorSummary: sess.aiResponse.doctorSummary || '',
      aiSource: sess.aiSource || 'fallback',
      aiFallbackReason: sess.aiFallbackReason,
      referralId: sess.referralId,
      timestamp: new Date(),
    };
    setReport(r);
  }, [navigate]);

  if (!session || !report || !session.aiResponse) return null;

  const cfg = URGENCY_CONFIG[session.aiResponse.urgencyLevel];
  const completeness = COMPLETENESS_CONFIG[session.aiResponse.informationCompleteness || 'moderate'];
  const isEn = lang === 'en';
  const urgencyLevel = session.aiResponse.urgencyLevel as UrgencyLevel;

  const aiSourceInfo = getAISourceLabel(session.aiSource, lang);

  const doctorSummaryText = isEn
    ? session.aiResponse.doctorSummary || session.aiResponse.summary
    : session.aiResponse.doctorSummaryHi || session.aiResponse.summaryHi || session.aiResponse.doctorSummary;

  function handleCreateReferral() {
    if (!session) return;
    const newRef = createReferral({
      patientId: session.familyMemberId || undefined,
      patientName: session.patientName || 'Demo Patient',
      familyMemberId: session.familyMemberId,
      age: session.age,
      gender: session.gender,
      assessmentId: session.id,
      originType: session.careAccessContext === 'sub_centre' ? 'asha' : 'patient',
      originVillageName: 'Rampur Kalan',
      destinationFacilityId: 'phc-rampur',
      destinationFacilityName: 'PHC Rampur Kalan',
      destinationFacilityType: 'phc',
      urgency: urgencyLevel,
      reason: session.aiResponse?.recommendedNextStep || session.symptoms,
      symptoms: session.symptoms,
      aiSummary: doctorSummaryText,
      informationCompleteness: session.aiResponse?.informationCompleteness,
      isDemoData: true,
    });

    setActiveReferral(newRef);
    setShowReferralModal(true);

    // Save referral ID to current session
    const updatedSess = { ...session, referralId: newRef.id };
    setSession(updatedSess);
    localStorage.setItem('medibridge_session', JSON.stringify(updatedSess));

    if (session.familyMemberId) {
      saveReportToFamilyMember(session.familyMemberId, updatedSess, newRef.id);
    }
  }

  function handleCopyDoctorSummary() {
    navigator.clipboard.writeText(doctorSummaryText);
    setCopiedDoctorSummary(true);
    setTimeout(() => setCopiedDoctorSummary(false), 2500);
  }

  function handleDownloadPDF() {
    if (!report) return;
    generateHealthReportPDF(report);
  }

  async function handleShare() {
    if (!session?.aiResponse) return;
    const text = `MediBridge Care Plan (${session.aiResponse.urgencyLevel} Priority)\nRecommendation: ${session.aiResponse.recommendedNextStep}\nReferral ID: ${activeReferral?.id || 'Pending'}\n\nInformation guidance only — not a medical diagnosis.`;
    if (navigator.share) {
      await navigator.share({ title: 'MediBridge Care Plan', text, url: window.location.origin });
    } else {
      await navigator.clipboard.writeText(text);
    }
  }

  function handleReadAloud() {
    if (!session?.aiResponse) return;
    const text = isEn
      ? `${session.aiResponse.summary} ${session.aiResponse.recommendedNextStep}`
      : `${session.aiResponse.summaryHi} ${session.aiResponse.recommendedNextStepHi}`;
    toggleSpeak(text, isEn ? 'en-IN' : 'hi-IN');
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3.5 sticky top-0 z-20 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/assessment')}
            className="flex items-center gap-1.5 text-slate-600 hover:text-teal-600 transition-colors text-sm font-medium"
            aria-label="Start new assessment"
          >
            <ArrowLeft size={16} />
            <span>{isEn ? 'New Assessment' : 'नया मूल्यांकन'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(l => (l === 'en' ? 'hi' : 'en'))}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Globe size={13} />
              {isEn ? 'हिन्दी' : 'English'}
            </button>

            <button
              type="button"
              onClick={handleReadAloud}
              className={`p-2 rounded-lg transition-all ${
                isSpeaking
                  ? 'bg-blue-600 text-white shadow-xs animate-pulse'
                  : 'text-slate-600 hover:text-teal-600 hover:bg-teal-50'
              }`}
              title={isSpeaking ? (isEn ? 'Stop audio' : 'आवाज़ रोकें') : (isEn ? 'Read aloud' : 'बोलकर सुनाएं')}
              aria-label={isSpeaking ? 'Stop audio' : 'Read aloud'}
            >
              {isSpeaking ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-teal-700 border border-teal-200 hover:bg-teal-50 rounded-lg transition-all font-medium"
            >
              <Share2 size={15} />
              <span>{isEn ? 'Share' : 'शेयर'}</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-semibold shadow-xs"
              id="report-download-pdf"
            >
              <Download size={15} />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-5">
        {/* Transparent AI Engine & Safety Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl border bg-white border-slate-200 text-xs">
          <div className="flex items-center gap-2 font-medium text-slate-800">
            {aiSourceInfo.isRealAI ? (
              <Sparkles size={14} className="text-teal-600" />
            ) : (
              <ShieldAlert size={14} className="text-amber-600" />
            )}
            <span>
              {isEn ? 'Assessment Engine: ' : 'मूल्यांकन इंजन: '}
              <strong className={aiSourceInfo.isRealAI ? 'text-teal-700' : 'text-amber-700'}>
                {aiSourceInfo.label}
              </strong>
              {!aiSourceInfo.isRealAI && session.aiFallbackReason && (
                <span className="text-[11px] text-amber-700/80 font-normal ml-1.5 block sm:inline">
                  • {session.aiFallbackReason}
                </span>
              )}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Emergency Safety Checks Active</span>
          </div>
        </div>

        {/* Permanent Non-Diagnostic Disclaimer */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100/90 border border-slate-200 text-xs text-slate-600">
          <Info size={14} className="text-teal-600 shrink-0" />
          <span>
            {isEn
              ? 'MediBridge does not diagnose medical conditions. It assists with urgency assessment and care navigation.'
              : 'MediBridge चिकित्सा निदान नहीं करता है। यह तात्कालिकता मूल्यांकन और देखभाल मार्गदर्शन में सहायता करता है।'}
          </span>
        </div>

        {/* Family Circle Connection Banner */}
        {session.familyMemberId && (
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shrink-0">
                <Users size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-teal-950">
                    Linked to {session.patientName}'s Family Health Records
                  </h4>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                    ✓ Saved to Timeline
                  </span>
                </div>
                <p className="text-xs text-teal-700 mt-0.5">
                  Measurements and assessment summary have been added to the family health journey and trend graph.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/family/${session.familyMemberId}`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-xs"
            >
              <span>View in Family Circle</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        {/* 1. Urgency & Care Plan Header */}
        <div className={`${cfg.bg} ${cfg.border} border-2 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-sm`}>
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 ${cfg.bg} rounded-2xl border ${cfg.border} flex items-center justify-center text-3xl shadow-sm shrink-0`}>
              {cfg.emoji}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`inline-flex px-3 py-0.5 rounded-full border text-xs font-black uppercase tracking-wider ${cfg.badge}`}>
                  {isEn ? cfg.tierBadge : cfg.tierBadgeHi}
                </span>
                <span className="text-xs font-bold text-slate-600">
                  {isEn ? cfg.label : cfg.labelHi}
                </span>
              </div>

              <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 mt-1 leading-tight">
                {isEn ? 'YOUR CARE PLAN' : 'आपकी देखभाल योजना'}
              </h1>

              <p className="text-sm font-semibold text-slate-800 mt-1">
                {isEn ? session.aiResponse.summary : session.aiResponse.summaryHi}
              </p>
              <p className={`text-xs ${cfg.color} mt-1 font-medium`}>
                {isEn ? cfg.desc : cfg.descHi}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Referral Action & Continuity Loop (CORE DIFFERENTIATOR) */}
        <div className="bg-white rounded-2xl border-2 border-teal-500/80 shadow-md p-5 sm:p-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 text-xs font-bold uppercase tracking-wide border border-teal-200 mb-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-600" />
                Continuity of Care Workflow
              </div>
              <h2 className="text-lg sm:text-xl font-display font-bold text-slate-900">
                {activeReferral
                  ? (isEn ? 'Active Care Referral Linked' : 'सक्रिय देखभाल रेफरल लिंक है')
                  : (isEn ? 'Connect to Public Healthcare Referral' : 'सार्वजनिक स्वास्थ्य रेफरल से जुड़ें')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEn
                  ? 'MediBridge closes the loop between self-triage, your local ASHA worker, and the destination PHC.'
                  : 'मेडीब्रिज स्व-ट्राइएज, आशा कार्यकर्ता और प्राथमिक स्वास्थ्य केंद्र के बीच निरंतरता स्थापित करता है।'}
              </p>
            </div>

            {!activeReferral ? (
              <button
                onClick={handleCreateReferral}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 shrink-0"
                id="btn-create-referral"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isEn ? 'Create PHC Referral' : 'PHC रेफरल पर्ची बनाएं'}</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/care-journey')}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>{isEn ? 'View in Care Journey' : 'देखभाल यात्रा देखें'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {activeReferral && (
            <div className="mt-4">
              <ReferralCard referral={activeReferral} lang={lang} />
            </div>
          )}
        </div>

        {/* 3. Information Completeness (NO FAKE CONFIDENCE SCORE) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
              <Info size={14} className="text-teal-600" />
              {isEn ? 'Information Completeness' : 'जानकारी की पूर्णता'}
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${completeness.color}`}>
              {isEn ? completeness.label : completeness.labelHi}
            </span>
          </div>

          {/* Transparent dots scale */}
          <div className="flex gap-2 my-2.5">
            {[1, 2, 3].map(d => (
              <div
                key={d}
                className={`h-2.5 flex-1 rounded-full transition-all ${
                  d <= completeness.dots ? cfg.barColor : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {isEn ? completeness.desc : completeness.descHi}
          </p>
          <p className="text-[11px] text-slate-400 mt-2 italic">
            {isEn
              ? 'Calculated deterministically from symptom duration, reported severity, and follow-up responses — not a random confidence score.'
              : 'लक्षणों की अवधि और दिए गए उत्तरों से परिकलित — कोई यादृच्छिक विश्वास प्रतिशत नहीं।'}
          </p>
        </div>

        {/* 4. Why This Recommendation? (Explainable AI Factors) */}
        {session.aiResponse.reasoningFactors && session.aiResponse.reasoningFactors.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-1.5 text-sm sm:text-base">
              <div className="w-6 h-6 bg-teal-100 text-teal-800 rounded-lg flex items-center justify-center font-bold text-xs">
                ?
              </div>
              {isEn ? 'Why this urgency recommendation?' : 'यह सिफारिश क्यों की गई?'}
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              {isEn
                ? 'Clinical factors identified from your symptom profile:'
                : 'आपके लक्षणों से पहचाने गए मुख्य कारक:'}
            </p>
            <ul className="space-y-2">
              {(isEn
                ? session.aiResponse.reasoningFactors
                : session.aiResponse.reasoningFactorsHi || session.aiResponse.reasoningFactors
              ).map((factor, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 font-medium"
                >
                  <span className={`w-5 h-5 ${cfg.barColor} text-white rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5`}>
                    {i + 1}
                  </span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 5. Recommended Actions (Next Steps) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="mb-3">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold mb-3 ${cfg.bg} ${cfg.border} ${cfg.color}`}>
              <ChevronRight size={15} />
              <span>
                <strong>{isEn ? 'Clear Direction: ' : 'स्पष्ट दिशा: '}</strong>
                {isEn
                  ? session.aiResponse.recommendedNextStep
                  : session.aiResponse.recommendedNextStepHi || session.aiResponse.recommendedNextStep}
              </span>
            </div>
            <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle size={18} className="text-teal-600" />
              {isEn ? 'Recommended Next Actions' : 'अनुशंसित अगले कदम'}
            </h2>
          </div>
          <ul className="space-y-2">
            {(isEn
              ? session.aiResponse.nextSteps || session.aiResponse.immediateActions
              : session.aiResponse.nextStepsHi || session.aiResponse.immediateActionsHi || session.aiResponse.nextSteps
            ).map((action, i) => (
              <li
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 font-medium"
              >
                <span className="w-5 h-5 bg-teal-600 text-white rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                  ✓
                </span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 6. Doctor-Ready Summary Card */}
        <div className="bg-white rounded-2xl border border-teal-200 shadow-sm p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-teal-600" />
              <div>
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                  {isEn ? 'Doctor-Ready Summary' : 'डॉक्टर के लिए त्वरित सारांश'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {isEn
                    ? 'Concise clinical handoff summary for Primary Health Centre Medical Officer'
                    : 'प्राथमिक स्वास्थ्य केंद्र के डॉक्टर को दिखाने के लिए संक्षिप्त नैदानिक सारांश'}
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyDoctorSummary}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 rounded-lg text-xs font-semibold transition-colors"
              id="copy-doctor-summary"
            >
              {copiedDoctorSummary ? (
                <>
                  <Check size={13} className="text-teal-600" />
                  <span className="text-teal-600">{isEn ? 'Copied to Clipboard!' : 'कॉपी हुआ!'}</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>{isEn ? 'Copy Summary' : 'कॉपी करें'}</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs sm:text-sm text-slate-900 leading-relaxed font-mono">
            {doctorSummaryText}
          </div>
        </div>

        {/* 7. Warning Signs To Watch */}
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5">
          <h2 className="font-bold text-rose-950 flex items-center gap-2 mb-1 text-sm">
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
            {isEn ? 'Red-Flag Warning Signs' : 'खतरे के चेतावनी संकेत'}
          </h2>
          <p className="text-xs text-rose-800 mb-3">
            {isEn
              ? 'Seek immediate emergency attention at 108/112 if any of these arise:'
              : 'इनमें से कोई भी लक्षण दिखने पर तुरंत 108 पर कॉल करें:'}
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(isEn
              ? session.aiResponse.warningSigns || session.aiResponse.warningSignsToWatch
              : session.aiResponse.warningSignsHi || session.aiResponse.warningSignsToWatchHi || session.aiResponse.warningSigns
            ).map((sign, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-rose-900 font-medium bg-white/80 p-2.5 rounded-lg border border-rose-200/60">
                <span className="text-rose-600 font-bold shrink-0">⚠</span>
                <span>{sign}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 8. Intelligent Facility Matching */}
        {(() => {
          const allRefs = getReferrals();
          const loads = calculateFacilityLoad(allRefs);
          const recs = recommendFacilities(urgencyLevel, session.symptoms, loads, 2);

          return (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                    <Activity size={18} className="text-teal-600" />
                    {isEn ? 'Recommended Healthcare Facilities' : 'अनुशंसित स्वास्थ्य सुविधाएं'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Deterministic capability &amp; distance scoring matched to your urgency level
                  </p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <DataProvenanceBadge type="rule_based" />
                  <DataProvenanceBadge type="prototype_synthetic" />
                </div>
              </div>

              <div className="space-y-4">
                {recs.map(rec => (
                  <FacilityMatchCard
                    key={rec.facilityId}
                    recommendation={rec}
                    onSelect={() => handleCreateReferral()}
                  />
                ))}
              </div>
            </div>
          );
        })()}

        {/* 9. MediBridge Safety Guardrails Panel */}
        <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-teal-400" />
              <h3 className="font-display font-bold text-sm text-white">
                MediBridge Safety Guardrails
              </h3>
            </div>
            <DataProvenanceBadge type="rule_based" size="xs" />
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Every symptom assessment passes through four safety checks:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <span className="font-bold text-teal-300 block mb-0.5">1. Emergency Red-Flag Check</span>
              <span className="text-slate-300 text-[11px]">Scans for critical keywords like chest pain, stroke, or severe breathlessness.</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <span className="font-bold text-teal-300 block mb-0.5">2. AI-Assisted Triage</span>
              <span className="text-slate-300 text-[11px]">Serverless LLM provides bilingual care level and urgency guidance.</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <span className="font-bold text-teal-300 block mb-0.5">3. Response Validation</span>
              <span className="text-slate-300 text-[11px]">Validates response format and enforces non-diagnostic phrasing.</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <span className="font-bold text-teal-300 block mb-0.5">4. Safety Override</span>
              <span className="text-slate-300 text-[11px]">AI output cannot downgrade an emergency flagged as RED.</span>
            </div>
          </div>
        </div>

        {urgencyLevel === 'RED' && (
          <a
            href="tel:108"
            className="mt-4 w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-xl font-bold text-sm transition-colors shadow-sm"
            id="emergency-call-108-report"
          >
            📞 Call 108 Emergency Ambulance Now
          </a>
        )}

        {/* 9. Context & Privacy Notice */}
        <div className="bg-slate-100/80 rounded-xl p-4 text-xs text-slate-600 border border-slate-200">
          <p className="leading-relaxed">
            <strong>Privacy & Data Notice: </strong>
            Prototype session data is stored strictly locally in your browser. No centralized patient database or Aadhaar identifiers are collected in this demonstration.
          </p>
        </div>

        {/* 10. Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => navigate('/care-journey')}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <span>{isEn ? 'View in Care Journey' : 'मेरी देखभाल यात्रा'}</span>
            <ArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate('/assessment')}
            className="flex-1 border-2 border-slate-300 hover:border-slate-400 bg-white text-slate-800 font-bold text-sm py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            <span>{isEn ? 'Start Another Assessment' : 'नया मूल्यांकन शुरू करें'}</span>
          </button>
        </div>
      </div>

      {activeReferral && (
        <ReferralCreatedModal
          referral={activeReferral}
          isOpen={showReferralModal}
          onClose={() => setShowReferralModal(false)}
          lang={lang}
        />
      )}
    </div>
  );
};

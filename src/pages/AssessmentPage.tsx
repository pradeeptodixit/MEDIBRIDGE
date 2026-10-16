import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Send, Activity, Globe, ChevronRight,
  User, AlertCircle, Volume2, VolumeX, Zap, Users, Baby, UserCheck, Check,
  RefreshCw, ShieldAlert, Sparkles, Info
} from 'lucide-react';
import { analyzeSymptoms, isUsingRealAI, buildFallbackResponse } from '../services/aiService';
import type { AIAnalysisResult } from '../services/aiService';
import { useVoiceInput, useSpeechSynthesis } from '../hooks/useVoice';
import type { AssessmentSession, Message, Language, FollowUpQuestion, CareFor } from '../types';
import { DEMO_CASES } from '../data/healthData';
import { getFamilyMemberById } from '../services/familyService';

const STEPS = ['Who', 'Info', 'Symptoms', 'Follow-up', 'Analysis'];

let assessmentIdCounter = 0;
function generateId() {
  assessmentIdCounter += 1;
  return `ass-${Date.now()}-${assessmentIdCounter}`;
}

const SYMPTOM_CHIPS_EN = [
  'Fever', 'Cough', 'Headache', 'Chest discomfort', 'Weakness',
  'Vomiting', 'Dizziness', 'Stomach pain', 'Rash', 'Breathlessness',
];
const SYMPTOM_CHIPS_HI = [
  'बुखार', 'खांसी', 'सिरदर्द', 'सीने में बेचैनी', 'कमजोरी',
  'उल्टी', 'चक्कर', 'पेट दर्द', 'दाने', 'सांस लेने में तकलीफ',
];

const CARE_FOR_OPTIONS: { value: CareFor; label: string; labelHi: string; icon: React.ReactNode }[] = [
  { value: 'myself', label: 'Myself', labelHi: 'मैं खुद', icon: <User size={18} /> },
  { value: 'parent', label: 'Parent / Elder', labelHi: 'माता-पिता / बुजुर्ग', icon: <Users size={18} /> },
  { value: 'child', label: 'Child', labelHi: 'बच्चा', icon: <Baby size={18} /> },
  { value: 'someone_else', label: 'Someone Else', labelHi: 'कोई और', icon: <UserCheck size={18} /> },
];

// Trustworthy AI processing steps — these represent the actual processing pipeline
const AI_PROCESSING_STEPS = [
  { en: 'Understanding your symptoms', hi: 'आपके लक्षणों को समझा जा रहा है', check: 'Reviewing your responses', checkHi: 'आपके जवाबों की समीक्षा' },
  { en: 'Assessing urgency level', hi: 'तात्कालिकता स्तर का आकलन', check: 'Checking safety indicators', checkHi: 'सुरक्षा संकेतकों की जाँच' },
  { en: 'Preparing your guidance', hi: 'आपका मार्गदर्शन तैयार हो रहा है', check: 'Building your next-step recommendation', checkHi: 'अगले कदम की सिफारिश तैयार' },
];

const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-1 px-4 py-3 bg-slate-100 rounded-2xl rounded-bl-sm w-fit">
    {[0, 1, 2].map(i => (
      <div key={i} className="w-2 h-2 bg-slate-400 rounded-full typing-dot" />
    ))}
  </div>
);

const ChatBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      {!isUser && (
        <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0 shadow-xs">
          AI
        </div>
      )}
      <div
        className={`relative max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-teal-600 text-white rounded-br-sm shadow-xs'
            : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-sm shadow-xs'
        }`}
      >
        {message.content}
      </div>
      {isUser && (
        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center ml-2 mt-1 shrink-0">
          <User size={14} className="text-slate-600" />
        </div>
      )}
    </motion.div>
  );
};

const AIProcessingState: React.FC<{ lang: Language }> = ({ lang }) => {
  const [completedSteps, setCompletedSteps] = useState(0);

  useEffect(() => {
    const timers = AI_PROCESSING_STEPS.map((_, i) =>
      setTimeout(() => setCompletedSteps(i + 1), 700 + i * 850)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const isComplete = completedSteps >= AI_PROCESSING_STEPS.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-teal-50/90 border border-teal-200 rounded-2xl p-4 sm:p-5 shadow-xs mb-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white">
            <Sparkles size={14} className={isComplete ? '' : 'animate-pulse'} />
          </div>
          <div>
            <p className="text-sm font-bold text-teal-950">
              {isComplete
                ? (lang === 'hi' ? 'मूल्यांकन तैयार है' : 'Assessment ready')
                : (lang === 'hi' ? 'AI आपके लक्षणों का विश्लेषण कर रहा है' : 'Analysing your symptoms')}
            </p>
            {!isComplete && (
              <p className="text-[11px] text-teal-700">
                {lang === 'hi' ? 'कृपया प्रतीक्षा करें...' : 'Please wait...'}
              </p>
            )}
          </div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
          isComplete ? 'bg-green-100 text-green-800' : 'bg-teal-100 text-teal-800 ai-live-indicator'
        }`}>
          {isComplete ? '✓ Done' : 'AI Active'}
        </span>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {AI_PROCESSING_STEPS.map((step, i) => {
          const isDone = i < completedSteps;
          const isCurrent = i === completedSteps;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: isDone || isCurrent ? 1 : 0.35, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="space-y-0.5"
            >
              <div className={`flex items-center gap-2.5 text-xs sm:text-sm ${
                isDone ? 'text-teal-900' : isCurrent ? 'text-teal-800 font-semibold' : 'text-slate-400'
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isDone
                    ? 'bg-teal-600 text-white'
                    : isCurrent
                    ? 'border-2 border-teal-500 bg-white'
                    : 'border border-slate-300 bg-slate-100'
                }`}>
                  {isDone ? (
                    <Check size={11} strokeWidth={3} className="text-white" />
                  ) : isCurrent ? (
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                  ) : null}
                </div>
                <span className="font-medium">{lang === 'hi' ? step.hi : step.en}</span>
              </div>
              {isDone && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[11px] text-teal-600 flex items-center gap-1"
                  style={{ paddingLeft: '28px' }}
                >
                  <Check size={10} strokeWidth={3} />
                  {lang === 'hi' ? step.checkHi : step.check}
                </motion.p>
              )}
            </motion.div>
          );
        })}
      </div>

      <p className="text-[11px] text-teal-700/70 pt-3 mt-3 border-t border-teal-100 flex items-center gap-1.5">
        <Activity size={11} className="shrink-0 text-teal-500" />
        <span>
          {lang === 'hi'
            ? 'सुरक्षा दिशानिर्देशों के अनुसार लक्षणों का मूल्यांकन।'
            : 'Evaluating symptoms against clinical safety guidelines.'}
        </span>
      </p>
    </motion.div>
  );
};

// Error state when AI fails
const AIErrorState: React.FC<{
  lang: Language;
  reason: string;
  onRetry: () => void;
  onContinue: () => void;
}> = ({ lang, reason, onRetry, onContinue }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3 mb-3"
  >
    <div className="flex items-start gap-2">
      <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-800">
          {lang === 'hi' ? 'AI मूल्यांकन अस्थायी रूप से अनुपलब्ध' : 'AI assessment temporarily unavailable'}
        </p>
        <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
          {lang === 'hi'
            ? 'हम अभी AI विश्लेषण पूरा नहीं कर सके।'
            : `We couldn't complete the AI analysis right now.`}
          {reason && <span className="block mt-1 opacity-75">({reason})</span>}
        </p>
      </div>
    </div>
    <div className="flex gap-2">
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-semibold transition-colors"
      >
        <RefreshCw size={13} />
        {lang === 'hi' ? 'पुनः प्रयास करें' : 'Try Again'}
      </button>
      <button
        onClick={onContinue}
        className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors"
      >
        <ShieldAlert size={13} />
        {lang === 'hi' ? 'सुरक्षा मूल्यांकन जारी रखें' : 'Continue with Safety Assessment'}
      </button>
    </div>
  </motion.div>
);

// Voice waveform animation while listening
const VoiceWaveform: React.FC = () => (
  <div className="flex items-center gap-0.5 h-5">
    {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
      <motion.div
        key={i}
        className="w-1 bg-red-400 rounded-full"
        animate={{ scaleY: [1, h, 1] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.05, ease: 'easeInOut' }}
        style={{ height: `${h * 4}px` }}
      />
    ))}
  </div>
);

export const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    isListening,
    transcript,
    interimTranscript,
    error: voiceError,
    startListening,
    stopListening,
    clearTranscript,
    simulateVoiceInput,
  } = useVoiceInput();
  const { toggleSpeak, isSpeaking } = useSpeechSynthesis();

  // step: 0=carefor, 1=info, 2=symptoms, 3=followup, 4=analyzing
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<Language>('en');
  const [careFor, setCareFor] = useState<CareFor>('myself');
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [careAccessContext, setCareAccessContext] = useState<string>('at_home');
  const [symptoms, setSymptoms] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [followUpAnswers, setFollowUpAnswers] = useState<FollowUpQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [aiError, setAiError] = useState<{ reason: string; pendingSession: AssessmentSession } | null>(null);

  const [searchParams] = useSearchParams();
  const memberIdQuery = searchParams.get('memberId');
  const [familyMemberId, setFamilyMemberId] = useState<string | null>(memberIdQuery);
  const [familyMemberName, setFamilyMemberName] = useState<string | null>(null);

  useEffect(() => {
    if (memberIdQuery) {
      const member = getFamilyMemberById(memberIdQuery);
      if (member) {
        setFamilyMemberId(member.id);
        setFamilyMemberName(member.name);
        setPatientName(member.name);
        setAge(String(member.age));
        if (member.gender === 'male' || member.gender === 'female') {
          setGender(member.gender);
        }
        if (member.relationship === 'father' || member.relationship === 'mother' || member.relationship === 'grandfather' || member.relationship === 'grandmother') {
          setCareFor('parent');
        } else if (member.relationship === 'son' || member.relationship === 'daughter') {
          setCareFor('child');
        } else {
          setCareFor('someone_else');
        }
        setStep(2);
      }
    }
  }, [memberIdQuery]);

  // chatContainerRef — used to scroll ONLY the chat container, never the window
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback((force = false) => {
    const el = chatContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // Only auto-scroll if user is near the bottom (within 200px) or if forced
    if (force || distanceFromBottom < 200) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  // Scroll on new messages — uses container-scoped scroll, never window
  useEffect(() => { scrollToBottom(); }, [messages, isTyping, isAnalyzing, scrollToBottom]);

  // Voice transcript handler
  useEffect(() => {
    if (transcript) {
      if (step === 2) setSymptoms(prev => prev + (prev ? ' ' : '') + transcript);
      else setCurrentAnswer(prev => prev + (prev ? ' ' : '') + transcript);
      clearTranscript();
    }
  }, [transcript, step, clearTranscript]);

  function addMessage(role: Message['role'], content: string) {
    setMessages(prev => [...prev, { id: generateId(), role, content, timestamp: new Date() }]);
  }

  async function startFollowUp(sess: AssessmentSession) {
    if (!sess.aiResponse?.followUpQuestions.length) {
      await runFinalAnalysis(sess);
      return;
    }
    setStep(3);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const q = sess.aiResponse!.followUpQuestions[0];
      addMessage('assistant', lang === 'hi' ? q.questionHi : q.question);
      setFollowUpAnswers(sess.aiResponse!.followUpQuestions.map(fq => ({ ...fq, answer: '' })));
    }, 1000);
  }

  async function runFinalAnalysis(sess: AssessmentSession, forceUseFallback = false) {
    setStep(4);
    setIsAnalyzing(true);
    setAiError(null);

    try {
      let result: AIAnalysisResult;

      if (forceUseFallback) {
        result = {
          source: 'fallback',
          reason: 'User engaged local safety mode',
          response: buildFallbackResponse(sess),
        };
      } else {
        result = await analyzeSymptoms(sess);
      }

      const updatedSession: AssessmentSession = {
        ...sess,
        familyMemberId: familyMemberId || sess.familyMemberId,
        aiResponse: result.response,
        aiSource: result.source,
        aiFallbackReason: result.source === 'fallback' ? result.reason : undefined,
        endTime: new Date(),
      };

      localStorage.setItem('medibridge_session', JSON.stringify(updatedSession));
      saveToTimeline(updatedSession, result.response.urgencyLevel, result.response.summary, result.source);
      navigate('/report');
    } catch {
      setIsAnalyzing(false);
      setStep(3);
      addMessage('assistant', lang === 'hi'
        ? 'माफ करें, मूल्यांकन में समस्या हुई। कृपया पुनः प्रयास करें।'
        : 'Sorry, there was an error during analysis. Please try again.');
    }
  }

  function saveToTimeline(
    sess: AssessmentSession,
    urgencyLevel: string,
    summary: string,
    aiSource: 'groq' | 'fallback'
  ) {
    try {
      const stored = localStorage.getItem('medibridge_timeline');
      const timeline = stored ? JSON.parse(stored) : [];
      timeline.unshift({
        id: sess.id,
        date: new Date().toISOString(),
        symptoms: sess.symptoms,
        urgencyLevel,
        summary,
        patientName: sess.patientName,
        careFor: sess.careFor,
        careAccessContext: sess.careAccessContext,
        referralId: sess.referralId,
        familyMemberId: sess.familyMemberId,
        aiSource,
      });
      localStorage.setItem('medibridge_timeline', JSON.stringify(timeline.slice(0, 20)));
    } catch { /* ignore storage errors */ }
  }

  async function handleSymptomsSubmit() {
    if (!symptoms.trim()) return;
    const sess: AssessmentSession = {
      id: generateId(),
      patientName,
      age,
      gender,
      careFor,
      careAccessContext,
      familyMemberId: familyMemberId || undefined,
      symptoms: symptoms.trim(),
      language: lang,
      messages: [],
      followUpAnswers: [],
      startTime: new Date(),
    };

    addMessage('user', symptoms.trim());
    setIsTyping(true);

    try {
      const result = await analyzeSymptoms(sess);
      const tempResult = result.response;
      const sessWithResponse: AssessmentSession = {
        ...sess,
        aiResponse: tempResult,
        aiSource: result.source,
      };
      setSession(sessWithResponse);
      setIsTyping(false);

      const qCount = tempResult.followUpQuestions.length;
      addMessage('assistant', lang === 'hi'
        ? `धन्यवाद। बेहतर समझ के लिए मुझे ${qCount} सवाल पूछने हैं।`
        : `Thank you for sharing. I have ${qCount} follow-up questions to better assess your situation.`);
      await startFollowUp(sessWithResponse);
    } catch {
      setIsTyping(false);
      addMessage('assistant', lang === 'hi'
        ? 'आपके लक्षण प्राप्त करने में समस्या हुई। कृपया पुनः प्रयास करें।'
        : 'I had trouble processing your symptoms. Please try again.');
    }
  }

  async function handleFollowUpAnswer() {
    if (!currentAnswer.trim() || !session?.aiResponse) return;
    const answer = currentAnswer.trim();
    const questions = session.aiResponse.followUpQuestions;
    const currentQ = questions[currentQIndex];

    addMessage('user', answer);
    const updatedAnswers = [...followUpAnswers];
    updatedAnswers[currentQIndex] = { ...currentQ, answer };
    setFollowUpAnswers(updatedAnswers);
    setCurrentAnswer('');

    if (currentQIndex + 1 < questions.length) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const nextQ = questions[currentQIndex + 1];
        addMessage('assistant', lang === 'hi' ? nextQ.questionHi : nextQ.question);
        setCurrentQIndex(currentQIndex + 1);
      }, 800);
    } else {
      setIsTyping(true);
      setTimeout(async () => {
        setIsTyping(false);
        const finalSession: AssessmentSession = {
          ...session,
          followUpAnswers: updatedAnswers,
          messages,
        };
        await runFinalAnalysis(finalSession);
      }, 700);
    }
  }

  function addSymptomChip(chip: string) {
    setSymptoms(prev => prev + (prev && !prev.endsWith(' ') ? ', ' : '') + chip.toLowerCase());
    inputRef.current?.focus();
  }

  function loadDemoCase(demoId: string) {
    const demo = DEMO_CASES.find(d => d.id === demoId);
    if (!demo) return;
    if (demo.id === 'dad-hypertension-check' || demo.patientName.includes('Ramesh Sharma')) {
      setFamilyMemberId('fam-dad');
      setFamilyMemberName('Ramesh Sharma (Dad)');
      setCareFor('parent');
    } else {
      setFamilyMemberId(null);
      setFamilyMemberName(null);
      setCareFor('myself');
    }
    setPatientName(demo.patientName);
    setAge(demo.age);
    setGender(demo.gender);
    setSymptoms(demo.symptoms);
    setStep(2);
    setMessages([{
      id: generateId(),
      role: 'assistant',
      content: lang === 'hi'
        ? `नमस्ते ${demo.patientName}! 📋 डेमो परिदृश्य लोड हुआ: "${demo.scenario}". लक्षणों की समीक्षा करें और भेजें पर क्लिक करें।`
        : `Hello ${demo.patientName}! 📋 Demo Scenario loaded: "${demo.scenario}". Review the pre-filled symptoms and tap Send.`,
      timestamp: new Date(),
    }]);
  }

  function proceedFromCareFor() {
    setStep(1);
  }

  function proceedFromInfo() {
    if (!patientName.trim() || !age || !gender) return;
    setStep(2);
    setMessages([{
      id: generateId(),
      role: 'assistant',
      content: lang === 'hi'
        ? `नमस्ते ${patientName}! मैं MediBridge AI हूँ। कृपया बताएं आप क्या महसूस कर रहे हैं।`
        : `Hello ${patientName}! I'm MediBridge AI. Please describe what you${careFor !== 'myself' ? ` (assessing for ${CARE_FOR_OPTIONS.find(o => o.value === careFor)?.label})` : ''} are experiencing.`,
      timestamp: new Date(),
    }]);
  }

  const stepLabels = lang === 'hi'
    ? ['किसके लिए', 'जानकारी', 'लक्षण', 'प्रश्न', 'विश्लेषण']
    : STEPS;

  const progress = step === 0 ? 5
    : step === 1 ? 20
    : step === 2 ? 40
    : step === 3 ? 40 + (currentQIndex / (session?.aiResponse?.followUpQuestions.length || 3)) * 45
    : 100;

  return (
    <div className="bg-slate-50 flex flex-col" style={{ minHeight: '100dvh', overflow: 'hidden' }}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 shrink-0">
        <div className="max-w-2xl mx-auto">
          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
            {stepLabels.map((s, i) => (
              <div key={i} className={`flex items-center gap-1 shrink-0 ${i <= step ? 'text-teal-600' : 'text-slate-300'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                  i < step ? 'bg-teal-600 border-teal-600 text-white' :
                  i === step ? 'border-teal-600 text-teal-600' :
                  'border-slate-200 text-slate-400'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="text-[11px] font-medium hidden sm:inline">{s}</span>
                {i < stepLabels.length - 1 && <ChevronRight size={12} className="text-slate-200 shrink-0" />}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-teal-600 to-cyan-500 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          {/* Meta row */}
          <div className="flex items-center justify-between mt-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
              isUsingRealAI ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {isUsingRealAI ? <><Sparkles size={9} /> Groq AI</> : <><ShieldAlert size={9} /> Safety Mode</>}
            </span>
            <button
              onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium"
              aria-label="Toggle language"
            >
              <Globe size={13} />
              {lang === 'en' ? 'हिन्दी' : 'English'}
            </button>
          </div>

          {/* Permanent Non-Diagnostic Disclaimer */}
          <div className="mt-2.5 text-[11px] text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Info size={13} className="text-teal-600 shrink-0" />
            <span className="leading-snug">
              {lang === 'hi'
                ? 'MediBridge चिकित्सा निदान नहीं करता है। यह तात्कालिकता मूल्यांकन और देखभाल मार्गदर्शन में सहायता करता है।'
                : 'MediBridge does not diagnose medical conditions. It assists with urgency assessment and care navigation.'}
            </span>
          </div>
        </div>
      </div>

      <div className={`flex-1 max-w-2xl mx-auto w-full px-4 ${step >= 2 ? 'py-3' : 'py-6'} overflow-hidden`}>

        {/* STEP 0: Who are you assessing? */}
        {step === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-teal-100 shadow-xs">
                <Users size={30} className="text-teal-600" />
              </div>
              <h1 className="font-display font-bold text-2xl text-slate-900">
                {lang === 'hi' ? 'यह मूल्यांकन किसके लिए है?' : 'Who is this assessment for?'}
              </h1>
              <p className="text-slate-500 text-sm mt-2">
                {lang === 'hi' ? 'उचित सलाह देने के लिए हमें यह जानना जरूरी है।' : 'This helps us tailor follow-up questions appropriately.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {CARE_FOR_OPTIONS.map(opt => (
                <motion.button
                  key={opt.value}
                  onClick={() => setCareFor(opt.value)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    careFor === opt.value
                      ? 'border-teal-600 bg-teal-50 text-teal-800 font-medium shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300'
                  }`}
                  id={`care-for-${opt.value}`}
                  aria-pressed={careFor === opt.value}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    careFor === opt.value ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {opt.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{lang === 'hi' ? opt.labelHi : opt.label}</p>
                  </div>
                </motion.button>
              ))}
            </div>

            <motion.button
              onClick={proceedFromCareFor}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3.5 rounded-xl font-semibold transition-colors shadow-xs"
              id="proceed-from-carefor"
            >
              {lang === 'hi' ? 'जारी रखें →' : 'Continue →'}
            </motion.button>
          </motion.div>
        )}

        {/* STEP 1: Patient Info */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-teal-100 shadow-xs">
                <User size={30} className="text-teal-600" />
              </div>
              <h1 className="font-display font-bold text-2xl text-slate-900">
                {lang === 'hi' ? 'बुनियादी जानकारी' : 'Basic Information'}
              </h1>
              <p className="text-slate-500 text-sm mt-2">
                {lang === 'hi'
                  ? `${CARE_FOR_OPTIONS.find(o => o.value === careFor)?.labelHi} के बारे में जानकारी दें।`
                  : `Provide details about ${careFor === 'myself' ? 'yourself' : CARE_FOR_OPTIONS.find(o => o.value === careFor)?.label}.`}
              </p>
            </div>

            <div>
              <label htmlFor="patient-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                {lang === 'hi' ? 'नाम' : 'Name'} *
              </label>
              <input
                id="patient-name"
                type="text"
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                placeholder={lang === 'hi' ? 'नाम दर्ज करें' : 'Enter name'}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-base sm:text-sm bg-white"
                autoComplete="name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="patient-age" className="block text-sm font-medium text-slate-700 mb-1.5">
                  {lang === 'hi' ? 'आयु (वर्ष)' : 'Age (years)'} *
                </label>
                <input
                  id="patient-age"
                  type="number"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  placeholder="e.g. 35"
                  min="0" max="120"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-base sm:text-sm bg-white"
                />
              </div>
              <div>
                <label htmlFor="patient-gender" className="block text-sm font-medium text-slate-700 mb-1.5">
                  {lang === 'hi' ? 'लिंग' : 'Gender'} *
                </label>
                <select
                  id="patient-gender"
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-base sm:text-sm bg-white"
                >
                  <option value="">{lang === 'hi' ? 'चुनें' : 'Select'}</option>
                  <option value="Male">{lang === 'hi' ? 'पुरुष' : 'Male'}</option>
                  <option value="Female">{lang === 'hi' ? 'महिला' : 'Female'}</option>
                  <option value="Other">{lang === 'hi' ? 'अन्य' : 'Other'}</option>
                </select>
              </div>
            </div>

            {/* Care Access Context */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {lang === 'hi' ? 'वर्तमान स्थान / देखभाल संदर्भ' : 'Current Location Context'} *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'at_home', label: 'At Home', labelHi: 'घर पर' },
                  { value: 'sub_centre', label: 'Village Sub-Centre', labelHi: 'उप-केंद्र' },
                  { value: 'phc', label: 'Primary Health Centre', labelHi: 'प्राथमिक स्वास्थ्य केंद्र' },
                  { value: 'other', label: 'Other Facility', labelHi: 'अन्य' },
                ].map(ctx => (
                  <button
                    key={ctx.value}
                    type="button"
                    onClick={() => setCareAccessContext(ctx.value)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                      careAccessContext === ctx.value
                        ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {lang === 'hi' ? ctx.labelHi : ctx.label}
                  </button>
                ))}
              </div>
            </div>

            <motion.button
              onClick={proceedFromInfo}
              disabled={!patientName.trim() || !age || !gender}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold transition-colors shadow-xs"
              id="proceed-to-symptoms"
            >
              {lang === 'hi' ? 'लक्षण बताएं →' : 'Describe Symptoms →'}
            </motion.button>

            {/* Demo scenarios */}
            <div className="mt-4">
              <p className="text-center text-xs text-slate-500 mb-3 flex items-center justify-center gap-2 font-medium">
                <Zap size={13} className="text-teal-600" />
                {lang === 'hi' ? 'जज के लिए डेमो परिदृश्य' : 'Demo Scenarios for Judges'}
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-3 text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle size={13} className="shrink-0 text-amber-600" />
                {lang === 'hi'
                  ? 'ये डेमो केस हैं — वास्तविक चिकित्सा मामले नहीं।'
                  : 'Pre-configured test cases to evaluate triage behavior.'}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {DEMO_CASES.map(demo => (
                  <motion.button
                    key={demo.id}
                    onClick={() => loadDemoCase(demo.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${demo.color} text-white text-left shadow-xs`}
                    id={`demo-${demo.id}`}
                  >
                    <span className="text-2xl shrink-0">{demo.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="block font-semibold text-sm">{demo.label}</span>
                      <span className="block text-xs opacity-90">{demo.scenario}</span>
                    </div>
                    <span className={`shrink-0 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      demo.expectedOutcome === 'RED' ? 'bg-red-900/50' :
                      demo.expectedOutcome === 'YELLOW' ? 'bg-yellow-900/50' :
                      'bg-green-900/50'
                    }`}>
                      {demo.expectedOutcome === 'RED' ? '🔴 RED' : demo.expectedOutcome === 'YELLOW' ? '🟡 YELLOW' : '🟢 GREEN'}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* STEPS 2, 3, 4: Chat Interface */}
        {step >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col"
            style={{ height: 'calc(100dvh - 196px)', minHeight: '380px' }}
          >
            {familyMemberName && (
              <div className="mb-2 px-3 py-2 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs text-teal-900 shrink-0 shadow-2xs">
                <div className="flex items-center gap-2 truncate">
                  <Users size={14} className="text-teal-600 shrink-0" />
                  <span className="truncate">
                    Assessing for <strong>{familyMemberName}</strong> ({age}y, {gender})
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-teal-200/70 text-teal-900 px-2 py-0.5 rounded-full shrink-0 border border-teal-300">
                  Family Circle
                </span>
              </div>
            )}

            {/* Messages container — scrolls internally, NEVER the page */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto mb-3 space-y-1"
              style={{ overscrollBehavior: 'contain', scrollBehavior: 'smooth' }}
            >
              <AnimatePresence>
                {messages.map(msg => (
                  <ChatBubble key={msg.id} message={msg} />
                ))}
              </AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-end gap-2 mb-3"
                >
                  <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                    AI
                  </div>
                  <TypingIndicator />
                </motion.div>
              )}
              {isAnalyzing && <AIProcessingState lang={lang} />}
              {aiError && !isAnalyzing && (
                <AIErrorState
                  lang={lang}
                  reason={aiError.reason}
                  onRetry={() => {
                    setAiError(null);
                    runFinalAnalysis(aiError.pendingSession);
                  }}
                  onContinue={() => {
                    setAiError(null);
                    runFinalAnalysis(aiError.pendingSession, true);
                  }}
                />
              )}
              {/* Spacer so the last message isn't clipped at the bottom */}
              <div className="h-2" aria-hidden="true" />
            </div>

            {/* Voice-first prompt — only on step 2, before text entered */}
            {step === 2 && !symptoms && !isAnalyzing && !aiError && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 shrink-0"
              >
                <motion.button
                  onClick={() => isListening ? stopListening() : startListening(lang === 'hi' ? 'hi-IN' : 'en-IN')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                    isListening
                      ? 'bg-rose-600 text-white shadow-md animate-pulse'
                      : 'bg-teal-50 text-teal-700 border-2 border-dashed border-teal-300 hover:bg-teal-100 hover:border-teal-400'
                  }`}
                  id="voice-speak-btn"
                  aria-label={isListening ? 'Stop voice input' : 'Speak your symptoms'}
                >
                  {isListening ? (
                    <>
                      <VoiceWaveform />
                      <span>{interimTranscript || (lang === 'hi' ? 'सुन रहा है… बोलें' : 'Listening… speak now')}</span>
                      <MicOff size={18} />
                    </>
                  ) : (
                    <>
                      <Mic size={18} />
                      <span>{lang === 'hi' ? 'बोलकर बताएं अपने लक्षण' : 'Speak your symptoms aloud'}</span>
                      <span className="text-xs opacity-60">({lang === 'hi' ? 'या नीचे लिखें' : 'or type below'})</span>
                    </>
                  )}
                </motion.button>
                {voiceError && (
                  <div className="flex items-center justify-between gap-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-1.5 font-medium">
                    <div className="flex items-center gap-1.5 truncate">
                      <AlertCircle size={13} className="shrink-0 text-amber-600" />
                      <span className="truncate">{voiceError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => simulateVoiceInput(lang === 'hi' ? 'मुझे 2 दिनों से तेज़ बुखार और सिरदर्द है' : 'I have high fever and severe headache for 2 days')}
                      className="underline font-bold text-teal-700 hover:text-teal-900 shrink-0 text-[11px]"
                    >
                      {lang === 'hi' ? 'डेमो आवाज़ भरें' : 'Try sample voice'}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Symptom chips — only on step 2 */}
            {step === 2 && !isAnalyzing && !aiError && (
              <div className="mb-3 shrink-0">
                <p className="text-xs text-slate-400 mb-1.5 font-medium">
                  {lang === 'hi' ? 'त्वरित जोड़ें:' : 'Quick add symptom:'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(lang === 'hi' ? SYMPTOM_CHIPS_HI : SYMPTOM_CHIPS_EN).map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => addSymptomChip(lang === 'hi' ? SYMPTOM_CHIPS_EN[i] : chip)}
                      className="px-3 py-1 text-xs rounded-full bg-white text-slate-700 border border-slate-200 hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50 transition-colors font-medium shadow-2xs"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input area */}
            {!isAnalyzing && !aiError && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-3 shrink-0"
              >
                {voiceError && (
                  <div className="flex items-center justify-between gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1.5 text-xs mb-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <AlertCircle size={13} className="shrink-0 text-amber-600" />
                      <span className="truncate">{voiceError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => simulateVoiceInput(lang === 'hi' ? 'मुझे 2 दिनों से तेज़ बुखार और सिरदर्द है' : 'I have high fever and severe headache for 2 days')}
                      className="text-[10px] font-bold text-teal-800 bg-white border border-teal-200 hover:bg-teal-50 px-2 py-0.5 rounded shrink-0 transition-colors"
                    >
                      {lang === 'hi' ? 'डेमो आवाज़ भरें' : 'Simulate Voice'}
                    </button>
                  </div>
                )}

                {isListening && interimTranscript && (
                  <div className="flex items-center gap-2 text-teal-700 bg-teal-50 border border-teal-200 rounded-xl px-2.5 py-1.5 text-xs mb-2">
                    <VoiceWaveform />
                    <span className="italic font-medium truncate">"{interimTranscript}"</span>
                  </div>
                )}

                <textarea
                  ref={inputRef}
                  value={step === 2 ? symptoms : currentAnswer}
                  onChange={e => step === 2 ? setSymptoms(e.target.value) : setCurrentAnswer(e.target.value)}
                  placeholder={
                    step === 2
                      ? (lang === 'hi' ? 'अपने लक्षण यहाँ लिखें... (जैसे: 2 दिनों से तेज़ बुखार और सिरदर्द है)' : 'Describe your symptoms... (e.g., fever for 2 days with severe headache)')
                      : (lang === 'hi' ? 'अपना जवाब यहाँ लिखें...' : 'Type your answer here...')
                  }
                  rows={3}
                  className="w-full resize-none outline-none text-base sm:text-sm text-slate-800 placeholder-slate-400 leading-relaxed mb-2"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (step === 2) handleSymptomsSubmit();
                      else handleFollowUpAnswer();
                    }
                  }}
                  aria-label={step === 2 ? 'Describe symptoms' : 'Answer follow-up question'}
                />

                <div className="flex items-center gap-2">
                  {/* Voice input */}
                  <motion.button
                    type="button"
                    onClick={() => isListening ? stopListening() : startListening(lang === 'hi' ? 'hi-IN' : 'en-IN')}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className={`p-2.5 rounded-xl transition-all ${
                      isListening
                        ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-300 animate-pulse'
                        : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-600'
                    }`}
                    aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                    title={isListening ? 'Stop voice input' : 'Speak your symptoms aloud'}
                    id="voice-input-btn"
                  >
                    {isListening ? (
                      <div className="flex items-center gap-1">
                        <MicOff size={16} />
                        <VoiceWaveform />
                      </div>
                    ) : (
                      <Mic size={18} />
                    )}
                  </motion.button>

                  {/* Read aloud */}
                  <motion.button
                    type="button"
                    onClick={() => {
                      const lastMsg = messages[messages.length - 1];
                      if (lastMsg?.role === 'assistant') {
                        toggleSpeak(lastMsg.content, lang === 'hi' ? 'hi-IN' : 'en-IN');
                      }
                    }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className={`p-2.5 rounded-xl transition-all ${
                      isSpeaking
                        ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300 animate-pulse'
                        : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                    aria-label={isSpeaking ? 'Stop reading' : 'Read last message aloud'}
                    title={isSpeaking ? 'Stop reading aloud' : 'Read last message aloud'}
                    id="read-aloud-btn"
                  >
                    {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </motion.button>

                  <div className="flex-1" />

                  {/* Send button */}
                  <motion.button
                    onClick={step === 2 ? handleSymptomsSubmit : handleFollowUpAnswer}
                    disabled={step === 2 ? !symptoms.trim() : !currentAnswer.trim()}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-xs"
                    id="send-message-btn"
                  >
                    <Send size={16} />
                    {lang === 'hi' ? 'भेजें' : 'Send'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

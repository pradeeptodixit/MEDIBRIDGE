/**
 * Client-side AI service that coordinates symptom assessment,
 * emergency red-flag checks, and the serverless /api/ai endpoint.
 */

import type { AIResponse, AssessmentSession, UrgencyLevel, InformationCompleteness, AISource } from '../types';
import { normalizeSafetyInput } from '../utils/safetyNormalizer';

// Active provider config
export const activeProvider = 'groq';
export const isUsingRealAI = true;

// Emergency keyword check
const RED_PATTERNS = [
  'chest pain', 'chest tightness', 'chest pressure', 'heart attack',
  'difficulty breathing', 'cannot breathe', 'breathless', 'breathlessness',
  'unconscious', 'unresponsive', 'fainted', 'fainting',
  'stroke', 'face drooping', 'arm weakness', 'slurred speech',
  'seizure', 'fits', 'convulsion',
  'severe bleeding', 'blood vomit', 'vomiting blood', 'coughing blood',
  'snakebite', 'snake bite', 'poisoning', 'swallowed poison',
  'heatstroke', 'heat stroke', 'no sweat in extreme heat',
  'allergic reaction', 'throat swelling', 'tongue swelling',
  'severe burn', 'drowning', 'electric shock',
  'no pulse', 'stopped breathing', 'not breathing',
  'severe confusion', 'sudden confusion', 'cannot speak',
  'sudden severe headache', 'worst headache',
  'pain radiating to left arm', 'radiating arm pain',
];

export function checkDeterministicEmergency(symptoms: string): boolean {
  const normalized = normalizeSafetyInput(symptoms);
  const lower = `${(symptoms || '').toLowerCase()} ${normalized}`;
  return RED_PATTERNS.some(pattern => lower.includes(pattern));
}

// Estimates detail level from answer length and duration keywords
export function computeInformationCompleteness(session: AssessmentSession): InformationCompleteness {
  const answeredCount = (session.followUpAnswers || []).filter(a => a.answer && a.answer.trim().length > 3).length;
  const symptomsWordCount = (session.symptoms || '').trim().split(/\s+/).length;
  const hasGoodDetail = /\d+\s*(day|hour|week|month|दिन|घंटे|हफ्ते)/i.test(session.symptoms);

  if (answeredCount >= 3 || (answeredCount >= 2 && symptomsWordCount >= 15) || (hasGoodDetail && symptomsWordCount >= 20)) {
    return 'high';
  }
  if (answeredCount >= 1 || symptomsWordCount >= 10 || hasGoodDetail) {
    return 'moderate';
  }
  return 'limited';
}

// Response validation and emergency override
function validateAndNormalize(
  parsed: Partial<AIResponse>,
  session: AssessmentSession,
  isDeterministicEmergency: boolean
): AIResponse {
  let urgencyLevel: UrgencyLevel = 'YELLOW';
  if (['GREEN', 'YELLOW', 'RED'].includes(parsed.urgencyLevel as string)) {
    urgencyLevel = parsed.urgencyLevel as UrgencyLevel;
  }

  // Keep emergency RED results from being downgraded by the AI response.
  if (isDeterministicEmergency && urgencyLevel !== 'RED') {
    urgencyLevel = 'RED';
  }

  let informationCompleteness: InformationCompleteness = computeInformationCompleteness(session);
  if (['high', 'moderate', 'limited'].includes(parsed.informationCompleteness as string)) {
    informationCompleteness = parsed.informationCompleteness as InformationCompleteness;
  }

  const ensureArray = (val: unknown, fallback: string[]): string[] => {
    if (Array.isArray(val) && val.length > 0) return val.map(String);
    return fallback;
  };

  const ensureString = (val: unknown, fallback: string): string => {
    if (typeof val === 'string' && val.trim().length > 0) return val.trim();
    return fallback;
  };

  const fallbackForLevel = FALLBACK_RESPONSES[urgencyLevel];

  return {
    urgencyLevel,
    informationCompleteness,
    summary: ensureString(parsed.summary, fallbackForLevel.summary),
    summaryHi: ensureString(parsed.summaryHi, fallbackForLevel.summaryHi),
    reasoningFactors: ensureArray(parsed.reasoningFactors, fallbackForLevel.reasoningFactors),
    reasoningFactorsHi: ensureArray(parsed.reasoningFactorsHi, fallbackForLevel.reasoningFactorsHi),
    nextSteps: ensureArray(parsed.nextSteps, fallbackForLevel.nextSteps),
    nextStepsHi: ensureArray(parsed.nextStepsHi, fallbackForLevel.nextStepsHi),
    immediateActions: ensureArray(parsed.nextSteps ?? parsed.immediateActions, fallbackForLevel.nextSteps),
    immediateActionsHi: ensureArray(parsed.nextStepsHi ?? parsed.immediateActionsHi, fallbackForLevel.nextStepsHi),
    warningSigns: ensureArray(parsed.warningSigns ?? parsed.warningSignsToWatch, fallbackForLevel.warningSigns),
    warningSignsHi: ensureArray(parsed.warningSignsHi ?? parsed.warningSignsToWatchHi, fallbackForLevel.warningSignsHi),
    warningSignsToWatch: ensureArray(parsed.warningSigns ?? parsed.warningSignsToWatch, fallbackForLevel.warningSigns),
    warningSignsToWatchHi: ensureArray(parsed.warningSignsHi ?? parsed.warningSignsToWatchHi, fallbackForLevel.warningSignsHi),
    recommendedNextStep: ensureString(parsed.recommendedNextStep, fallbackForLevel.recommendedNextStep),
    recommendedNextStepHi: ensureString(parsed.recommendedNextStepHi, fallbackForLevel.recommendedNextStepHi),
    doctorSummary: ensureString(parsed.doctorSummary, fallbackForLevel.doctorSummary),
    doctorSummaryHi: ensureString(parsed.doctorSummaryHi, fallbackForLevel.doctorSummaryHi),
    followUpQuestions: Array.isArray(parsed.followUpQuestions) && parsed.followUpQuestions.length > 0
      ? parsed.followUpQuestions
      : FALLBACK_QUESTIONS[urgencyLevel].map((q, i) => ({ id: `q-${i}`, ...q })),
    disclaimer: ensureString(
      parsed.disclaimer,
      'This assessment is an informational urgency guide, not a medical diagnosis. Always consult a qualified healthcare professional. In emergencies, call 108 or 112.'
    ),
  };
}

// ─── Main AI Caller (Routes Exclusively to /api/ai) ───────────────────────────
export type AIAnalysisResult =
  | { source: 'groq'; response: AIResponse }
  | { source: 'fallback'; reason: string; response: AIResponse };

export async function analyzeSymptoms(session: AssessmentSession): Promise<AIAnalysisResult> {
  const isDeterministicEmergency = checkDeterministicEmergency(session.symptoms);

  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'triage',
        session: {
          patientName: session.patientName,
          age: session.age,
          gender: session.gender,
          careFor: session.careFor,
          careAccessContext: session.careAccessContext,
          symptoms: session.symptoms,
          language: session.language,
          followUpAnswers: session.followUpAnswers,
        },
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as { source?: string; response?: Partial<AIResponse>; reason?: string; error?: string };

      if (data.source === 'groq' && data.response) {
        const validated = validateAndNormalize(data.response, session, isDeterministicEmergency);
        return {
          source: 'groq',
          response: validated,
        };
      }

      if (data.source === 'fallback') {
        return {
          source: 'fallback',
          reason: data.reason || 'AI assessment is temporarily unavailable. Emergency safety checks remain active.',
          response: buildFallbackResponse(session, isDeterministicEmergency),
        };
      }
    }

    const errData = (await res.json().catch(() => ({}))) as { error?: string; reason?: string };
    console.warn('[AI Service] AI gateway error:', res.status, errData);

    return {
      source: 'fallback',
      reason: errData.reason || errData.error || `AI gateway error (HTTP ${res.status}). Emergency safety checks remain active.`,
      response: buildFallbackResponse(session, isDeterministicEmergency),
    };
  } catch (err) {
    console.warn('[AI Service] Connection error:', err);
    return {
      source: 'fallback',
      reason: (err as Error)?.message || 'AI assessment is temporarily unavailable. Emergency safety checks remain active.',
      response: buildFallbackResponse(session, isDeterministicEmergency),
    };
  }
}

// Fallback responses when AI endpoint is unreachable or offline
type FallbackBase = Omit<AIResponse, 'informationCompleteness' | 'followUpQuestions'>;

export const FALLBACK_RESPONSES: Record<UrgencyLevel, FallbackBase> = {
  RED: {
    urgencyLevel: 'RED',
    summary: 'The symptoms described indicate a potentially serious emergency requiring immediate medical care. Do not wait.',
    summaryHi: 'आपके बताए गए लक्षण एक संभावित गंभीर आपातकालीन स्थिति का संकेत देते हैं। तुरंत चिकित्सीय सहायता लें, प्रतीक्षा न करें।',
    reasoningFactors: [
      'Reported symptoms match emergency clinical red-flag indicators',
      'Immediate in-person stabilization is required at an emergency facility',
      'Prompt hospital transport minimizes acute clinical complications',
    ],
    reasoningFactorsHi: [
      'बताए गए लक्षण आपातकालीन रेड-फ्लैग संकेतकों से मेल खाते हैं',
      'आपातकालीन अस्पताल में तत्काल स्थिरीकरण आवश्यक है',
      'शीघ्र अस्पताल परिवहन जटिलताओं के जोखिम को कम करता है',
    ],
    nextSteps: [
      'Call 108 (Ambulance) or 112 (National Emergency) immediately',
      'Do not drive alone — have family or neighbors accompany you',
      'Loosen tight clothing and ensure an open, clear airway',
      'Keep the patient resting calmly in a comfortable position',
    ],
    nextStepsHi: [
      'तुरंत 108 (एम्बुलेंस) या 112 (राष्ट्रीय आपातकाल) पर कॉल करें',
      'अकेले गाड़ी न चलाएं — परिजनों या पड़ोसियों को साथ लें',
      'कसे हुए कपड़े ढीले करें और खुली हवा सुनिश्चित करें',
      'मरीज को शांत और आरामदायक स्थिति में आराम करने दें',
    ],
    immediateActions: [
      'Call 108 (Ambulance) or 112 (National Emergency) immediately',
      'Do not drive alone — have family or neighbors accompany you',
      'Loosen tight clothing and ensure an open, clear airway',
      'Keep the patient resting calmly in a comfortable position',
    ],
    immediateActionsHi: [
      'तुरंत 108 (एम्बुलेंस) या 112 (राष्ट्रीय आपातकाल) पर कॉल करें',
      'अकेले गाड़ी न चलाएं — परिजनों या पड़ोसियों को साथ लें',
      'कसे हुए कपड़े ढीले करें और खुली हवा सुनिश्चित करें',
      'मरीज को शांत और आरामदायक स्थिति में आराम करने दें',
    ],
    warningSigns: [
      'Loss of consciousness or unresponsiveness',
      'Severe respiratory distress or gasping',
      'Pale, bluish, or cold clammy skin',
      'Sudden speech difficulty or limb weakness',
    ],
    warningSignsHi: [
      'होश खोना या अनुत्तरदायी होना',
      'गंभीर सांस की तकलीफ या हांफना',
      'त्वचा का पीला, नीला या ठंडा पड़ना',
      'अचानक बोलने में लड़खड़ाहट या हाथ-पैर में कमजोरी',
    ],
    warningSignsToWatch: [
      'Loss of consciousness or unresponsiveness',
      'Severe respiratory distress or gasping',
      'Pale, bluish, or cold clammy skin',
      'Sudden speech difficulty or limb weakness',
    ],
    warningSignsToWatchHi: [
      'होश खोना या अनुत्तरदायी होना',
      'गंभीर सांस की तकलीफ या हांफना',
      'त्वचा का पीला, नीला या ठंडा पड़ना',
      'अचानक बोलने में लड़खड़ाहट या हाथ-पैर में कमजोरी',
    ],
    recommendedNextStep: 'Dial 108 or proceed immediately to the nearest Emergency Facility.',
    recommendedNextStepHi: 'तुरंत 108 पर कॉल करें या नजदीकी आपातकालीन केंद्र जाएं।',
    doctorSummary: 'EMERGENCY TRIAGE (RED): Patient presents with acute red-flag symptoms requiring emergency evaluation. Triage priority: Immediate stabilization.',
    doctorSummaryHi: 'आपातकालीन ट्राइएज (RED): मरीज गंभीर लक्षणों के साथ प्रस्तुत हुआ है। प्राथमिकता: तत्काल स्थिरीकरण।',
    disclaimer: 'This assessment is an informational urgency guide, not a medical diagnosis. Always consult a healthcare professional. Dial 108 or 112 in emergencies.',
  },

  YELLOW: {
    urgencyLevel: 'YELLOW',
    summary: 'Symptoms suggest clinical evaluation is recommended at your nearest Primary Health Centre (PHC) or clinic within 24 hours.',
    summaryHi: 'लक्षण बताते हैं कि अगले 24 घंटों के भीतर नजदीकी प्राथमिक स्वास्थ्य केंद्र (PHC) या क्लिनिक में डॉक्टर को दिखाना उचित है।',
    reasoningFactors: [
      'Symptom duration and severity warrant clinical diagnostic review by a medical officer',
      'Early primary healthcare review prevents symptom progression',
      'Essential diagnostic tests and clinical evaluation can be safely provided at the PHC',
    ],
    reasoningFactorsHi: [
      'लक्षणों की अवधि और तीव्रता को देखते हुए डॉक्टर द्वारा जांच जरूरी है',
      'प्राथमिक स्वास्थ्य केंद्र में समय पर जांच स्थिति बिगड़ने से रोकती है',
      'PHC पर जरूरी जांच और उपचार डॉक्टर द्वारा सुरक्षित रूप से उपलब्ध कराए जा सकते हैं',
    ],
    nextSteps: [
      'Visit your nearest PHC or Sub-centre within 24 hours',
      'Maintain adequate hydration with clean drinking water or ORS',
      'Rest and avoid heavy physical labor',
      'Take this referral and care plan to show the PHC Medical Officer',
    ],
    nextStepsHi: [
      '24 घंटे के भीतर नजदीकी PHC या उप-केंद्र जाएं',
      'साफ पानी या ORS पीकर पर्याप्त जलयोजन बनाए रखें',
      'आराम करें और भारी शारीरिक श्रम से बचें',
      'यह देखभाल योजना और रेफरल पर्ची PHC डॉक्टर को दिखाएं',
    ],
    immediateActions: [
      'Visit your nearest PHC or Sub-centre within 24 hours',
      'Maintain adequate hydration with clean drinking water or ORS',
      'Rest and avoid heavy physical labor',
      'Take this referral and care plan to show the PHC Medical Officer',
    ],
    immediateActionsHi: [
      '24 घंटे के भीतर नजदीकी PHC या उप-केंद्र जाएं',
      'साफ पानी या ORS पीकर पर्याप्त जलयोजन बनाए रखें',
      'आराम करें और भारी शारीरिक श्रम से बचें',
      'यह देखभाल योजना और रेफरल पर्ची PHC डॉक्टर को दिखाएं',
    ],
    warningSigns: [
      'High persistent fever not responding to basic measures (>102°F)',
      'Development of breathing discomfort or severe chest tightness',
      'Inability to tolerate oral fluids or severe vomiting',
      'Severe abdominal pain or extreme lightheadedness',
    ],
    warningSignsHi: [
      'तेज बुखार जो साधारण उपायों से कम न हो (>102°F)',
      'सांस लेने में तकलीफ या सीने में भारीपन शुरू होना',
      'पानी या तरल पदार्थ न पचना या लगातार उल्टी होना',
      'पेट में तेज दर्द या अत्यधिक चक्कर आना',
    ],
    warningSignsToWatch: [
      'High persistent fever not responding to basic measures (>102°F)',
      'Development of breathing discomfort or severe chest tightness',
      'Inability to tolerate oral fluids or severe vomiting',
      'Severe abdominal pain or extreme lightheadedness',
    ],
    warningSignsToWatchHi: [
      'तेज बुखार जो साधारण उपायों से कम न हो (>102°F)',
      'सांस लेने में तकलीफ या सीने में भारीपन शुरू होना',
      'पानी या तरल पदार्थ न पचना या लगातार उल्टी होना',
      'पेट में तेज दर्द या अत्यधिक चक्कर आना',
    ],
    recommendedNextStep: 'Schedule a visit to the local Primary Health Centre (PHC) within 24 hours.',
    recommendedNextStepHi: '24 घंटे के भीतर स्थानीय प्राथमिक स्वास्थ्य केंद्र (PHC) में डॉक्टर को दिखाएं।',
    doctorSummary: 'CLINICAL TRIAGE (YELLOW): Patient reports persistent symptoms requiring outpatient clinical examination. Recommended for PHC consultation and routine diagnostics.',
    doctorSummaryHi: 'क्लिनिकल ट्राइएज (YELLOW): मरीज निरंतर लक्षणों की रिपोर्ट करता है जिसके लिए ओपीडी जांच की आवश्यकता है। PHC परामर्श और सामान्य परीक्षण की सिफारिश।',
    disclaimer: 'This assessment is an informational urgency guide, not a medical diagnosis. If symptoms worsen rapidly, visit an emergency centre immediately.',
  },

  GREEN: {
    urgencyLevel: 'GREEN',
    summary: 'Symptoms appear mild and can generally be safely managed with home care, hydration, and observation.',
    summaryHi: 'लक्षण हल्के प्रतीत होते हैं और आमतौर पर घर पर आराम, पर्याप्त पानी/तरल पदार्थ और निगरानी से सुरक्षित रूप से प्रबंधित किए जा सकते हैं।',
    reasoningFactors: [
      'No emergency red-flag patterns or high-risk clinical triggers detected',
      'Reported mild symptoms typically resolve with rest and supportive care',
      'Routine follow-up indicated only if symptoms persist beyond 48 to 72 hours',
    ],
    reasoningFactorsHi: [
      'कोई आपातकालीन रेड-फ्लैग या उच्च-जोखिम संकेत नहीं मिला',
      'हल्के लक्षण आमतौर पर आराम और सही पोषण से ठीक हो जाते हैं',
      'केवल 48 से 72 घंटे से अधिक लक्षण बने रहने पर ही डॉक्टर से परामर्श आवश्यक है',
    ],
    nextSteps: [
      'Ensure adequate rest and 7-8 hours of sleep',
      'Drink plenty of clean boiled water, lemon water, or warm soups',
      'Eat light, freshly cooked, easily digestible home meals',
      'Monitor your symptoms for 48 hours; visit PHC if not improving',
    ],
    nextStepsHi: [
      'पर्याप्त आराम और 7-8 घंटे की नींद लें',
      'उबला हुआ साफ पानी, नींबू पानी या दाल का पानी पिएं',
      'हल्का, ताजा पका हुआ और सुपाच्य भोजन लें',
      '48 घंटों तक निगरानी रखें; सुधार न होने पर PHC जाएं',
    ],
    immediateActions: [
      'Ensure adequate rest and 7-8 hours of sleep',
      'Drink plenty of clean boiled water, lemon water, or warm soups',
      'Eat light, freshly cooked, easily digestible home meals',
      'Monitor your symptoms for 48 hours; visit PHC if not improving',
    ],
    immediateActionsHi: [
      'पर्याप्त आराम और 7-8 घंटे की नींद लें',
      'उबला हुआ साफ पानी, नींबू पानी या दाल का पानी पिएं',
      'हल्का, ताजा पका हुआ और सुपाच्य भोजन लें',
      '48 घंटों तक निगरानी रखें; सुधार न होने पर PHC जाएं',
    ],
    warningSigns: [
      'Fever developing or persisting beyond 3 days',
      'Symptoms worsening significantly in intensity',
      'Emergence of breathing difficulty or chest pain',
      'Inability to drink or severe weakness',
    ],
    warningSignsHi: [
      '3 दिन से अधिक बुखार रहना या नया बुखार आना',
      'लक्षणों की तीव्रता में उल्लेखनीय वृद्धि होना',
      'सांस लेने में तकलीफ या सीने में दर्द होना',
      'पानी न पी पाना या अत्यधिक कमजोरी महसूस होना',
    ],
    warningSignsToWatch: [
      'Fever developing or persisting beyond 3 days',
      'Symptoms worsening significantly in intensity',
      'Emergence of breathing difficulty or chest pain',
      'Inability to drink or severe weakness',
    ],
    warningSignsToWatchHi: [
      '3 दिन से अधिक बुखार रहना या नया बुखार आना',
      'लक्षणों की तीव्रता में उल्लेखनीय वृद्धि होना',
      'सांस लेने में तकलीफ या सीने में दर्द होना',
      'पानी न पी पाना या अत्यधिक कमजोरी महसूस होना',
    ],
    recommendedNextStep: 'Rest at home with adequate fluids. Consult your local ASHA worker or PHC if symptoms persist.',
    recommendedNextStepHi: 'घर पर आराम करें और तरल पदार्थ लें। लक्षण बने रहने पर आशा कार्यकर्ता या PHC से संपर्क करें।',
    doctorSummary: 'ROUTINE TRIAGE (GREEN): Patient reports mild symptoms suitable for home monitoring. Advised to seek healthcare if symptoms persist past 3 days.',
    doctorSummaryHi: 'रूटीन ट्राइएज (GREEN): मरीज हल्के लक्षणों की रिपोर्ट करता है। घर पर निगरानी उपयुक्त है। 3 दिन बाद लक्षण बने रहने पर PHC परामर्श की सलाह।',
    disclaimer: 'This assessment is an informational urgency guide, not a medical diagnosis. Always consult a healthcare professional if symptoms persist.',
  },
};

export const FALLBACK_QUESTIONS: Record<UrgencyLevel, Array<{ question: string; questionHi: string }>> = {
  RED: [
    { question: 'How long have these severe symptoms been present?', questionHi: 'ये गंभीर लक्षण कितने समय से हैं?' },
    { question: 'Is the patient conscious and responsive right now?', questionHi: 'क्या मरीज अभी होश में है और प्रतिक्रिया दे रहा है?' },
    { question: 'Is emergency transport or ambulance assistance available?', questionHi: 'क्या आपातकालीन वाहन या एम्बुलेंस सहायता उपलब्ध है?' },
  ],
  YELLOW: [
    { question: 'For how many days have you been experiencing these symptoms?', questionHi: 'आपको यह लक्षण कितने दिनों से महसूस हो रहे हैं?' },
    { question: 'Do you have a fever, and have you measured your temperature?', questionHi: 'क्या आपको बुखार है, और क्या आपने तापमान नापा है?' },
    { question: 'Are the symptoms gradually improving or worsening over time?', questionHi: 'क्या लक्षण समय के साथ बेहतर हो रहे हैं या बिगड़ रहे हैं?' },
  ],
  GREEN: [
    { question: 'Did the symptoms start recently (within the last 24-48 hours)?', questionHi: 'क्या यह लक्षण हाल ही में (पिछले 24-48 घंटों में) शुरू हुए हैं?' },
    { question: 'Are you able to eat, drink, and perform your daily tasks normally?', questionHi: 'क्या आप सामान्य रूप से खा-पी रहे हैं और दैनिक कार्य कर पा रहे हैं?' },
    { question: 'Have you had similar symptoms in the past that resolved on their own?', questionHi: 'क्या आपको पहले भी ऐसे लक्षण हुए हैं जो अपने आप ठीक हो गए थे?' },
  ],
};

export function buildFallbackResponse(session: AssessmentSession, isDeterministicEmergency?: boolean): AIResponse {
  const deterministic = isDeterministicEmergency ?? checkDeterministicEmergency(session.symptoms);

  let urgency: UrgencyLevel;
  if (deterministic) {
    urgency = 'RED';
  } else {
    const lower = (session.symptoms || '').toLowerCase();
    const yellowKeywords = ['fever', 'vomiting', 'diarrhea', 'headache', 'dizziness', 'pain', 'weakness', 'cough', 'chills', 'nausea', 'बुखार', 'दर्द', 'कमजोरी', 'उल्टी'];
    urgency = yellowKeywords.some(k => lower.includes(k)) ? 'YELLOW' : 'GREEN';
  }

  const base = FALLBACK_RESPONSES[urgency];
  const questions = FALLBACK_QUESTIONS[urgency];
  const informationCompleteness = computeInformationCompleteness(session);

  return {
    ...base,
    informationCompleteness,
    followUpQuestions: questions.map((q, i) => ({ id: `q-${i}`, question: q.question, questionHi: q.questionHi })),
  };
}

// Mental wellbeing guidance helper
export type WellbeingMood = 'calm' | 'okay' | 'stressed' | 'overwhelmed' | 'low';

export interface WellbeingGuidance {
  source: 'groq' | 'fallback';
  message: string;
  messageHi: string;
  suggestions: string[];
  suggestionsHi: string[];
  showCrisisInfo: boolean;
}

const WELLBEING_FALLBACK: Record<WellbeingMood, Omit<WellbeingGuidance, 'source'>> = {
  calm: {
    message: 'It is wonderful that you are feeling calm. Maintaining this balanced state with regular rest, nutritious food, and community connection supports your health.',
    messageHi: 'यह बहुत अच्छा है कि आप शांत महसूस कर रहे हैं। नियमित आराम, पौष्टिक भोजन और परिवार के साथ से यह संतुलन बनाए रखें।',
    suggestions: ['Maintain regular sleep and meal schedules', 'Stay connected with family and neighbors', 'Engage in light physical movement or morning walks'],
    suggestionsHi: ['नियमित नींद और भोजन की दिनचर्या बनाए रखें', 'परिवार और पड़ोसियों से जुड़े रहें', 'सुबह की सैर या हल्की शारीरिक गतिविधि करें'],
    showCrisisInfo: false,
  },
  okay: {
    message: 'Feeling okay is a solid baseline. Simple daily practices — taking short breaks, drinking clean water, and sharing with someone you trust — help preserve your balance.',
    messageHi: 'सामान्य महसूस करना एक अच्छी स्थिति है। छोटे-छोटे कदम — थोड़ा आराम, पर्याप्त पानी, और अपनों से बात करना — संतुलन बनाए रखते हैं।',
    suggestions: ['Take short breathing breaks during your day', 'Share your thoughts with a trusted friend or family member', 'Ensure you drink adequate water and rest well'],
    suggestionsHi: ['दिन के काम के बीच थोड़ा विश्राम लें', 'किसी भरोसेमंद व्यक्ति से अपने विचार साझा करें', 'पर्याप्त पानी पिएं और अच्छी नींद लें'],
    showCrisisInfo: false,
  },
  stressed: {
    message: 'Feeling stressed is common when managing daily responsibilities. Acknowledging tension and taking small, practical moments of rest can help you regain calm.',
    messageHi: 'दैनिक जिम्मेदारियों के बीच तनाव होना स्वाभाविक है। इसे पहचानना और कुछ पल का शांत विश्राम लेना मददगार होता है।',
    suggestions: ['Take five slow, deep breaths whenever tension rises', 'Discuss your concerns with someone who listens without judging', 'Focus on one immediate task at a time rather than everything at once', 'Avoid excessive tea or stimulants and rest in a quiet space'],
    suggestionsHi: ['तनाव महसूस होने पर 5 बार गहरी, धीमी सांस लें', 'किसी ऐसे व्यक्ति से बात करें जो बिना टोके सुने', 'एक समय में केवल एक काम पर ध्यान दें', 'ज्यादा चाय या तंबाकू से बचें और शांत जगह पर आराम करें'],
    showCrisisInfo: false,
  },
  overwhelmed: {
    message: 'Feeling overwhelmed can feel heavy, but remember you do not have to carry it alone. Reaching out to a trusted family member, community elder, or counselor is a sign of resilience.',
    messageHi: 'अत्यधिक दबाव महसूस होना कठिन हो सकता है, लेकिन आपको इसे अकेले नहीं सहना है। किसी अपने या स्वास्थ्य कार्यकर्ता से बात करना समझदारी का कदम है।',
    suggestions: ['Talk to someone you trust right now about how you feel', 'Contact the National Mental Health Helpline Tele-MANAS (14416, 24x7 toll-free)', 'Focus only on the next hour rather than tomorrow', 'If you feel unsafe, reach out to local emergency services or your nearest clinic'],
    suggestionsHi: ['अभी किसी भरोसेमंद व्यक्ति से अपनी बात साझा करें', 'राष्ट्रीय टेली-मानस हेल्पलाइन (14416, 24x7 टोल-फ्री) पर संपर्क करें', 'कल की चिंता छोड़कर केवल अगले कुछ घंटों पर ध्यान दें', 'यदि असुरक्षित महसूस हो तो तुरंत नजदीकी स्वास्थ्य केंद्र या 108 से संपर्क करें'],
    showCrisisInfo: true,
  },
  low: {
    message: 'Going through low periods happens to many of us. Speaking openly with someone who cares about you and taking small steps of self-care can bring meaningful relief.',
    messageHi: 'मन उदास होना कई लोगों के साथ होता है। किसी अपने से खुलकर बात करना और थोड़ा सा आराम मन को सहारा दे सकता है।',
    suggestions: ['Share your feelings with a trusted person in your community', 'Call Tele-MANAS (14416) for free, confidential guidance', 'Spend time in sunlight and take a brief, calm walk', 'Remember that seeking support is a natural, healthy step'],
    suggestionsHi: ['अपने किसी नजदीकी व्यक्ति से अपने मन की बात कहें', 'मुफ्त और गोपनीय मार्गदर्शन के लिए टेली-मानस (14416) पर कॉल करें', 'धूप में थोड़ा समय बिताएं और हल्की सैर करें', 'याद रखें कि मदद मांगना पूरी तरह सामान्य और जरूरी है'],
    showCrisisInfo: true,
  },
};

export async function getWellbeingGuidance(mood: WellbeingMood, lang: 'en' | 'hi' = 'en'): Promise<WellbeingGuidance> {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'wellbeing', mood, lang }),
    });

    if (res.ok) {
      const data = (await res.json()) as { source?: string; message?: string; messageHi?: string; suggestions?: string[]; suggestionsHi?: string[]; showCrisisInfo?: boolean };
      if (data.source === 'groq' && data.message) {
        return {
          source: 'groq',
          message: data.message,
          messageHi: data.messageHi || data.message,
          suggestions: Array.isArray(data.suggestions) ? data.suggestions : WELLBEING_FALLBACK[mood].suggestions,
          suggestionsHi: Array.isArray(data.suggestionsHi) ? data.suggestionsHi : WELLBEING_FALLBACK[mood].suggestionsHi,
          showCrisisInfo: Boolean(data.showCrisisInfo),
        };
      }
    }
  } catch {
    // Fall back safely
  }

  return {
    source: 'fallback',
    ...WELLBEING_FALLBACK[mood],
  };
}

// ─── UI Source Badge Helper ───────────────────────────────────────────────────
export function getAISourceLabel(source?: AISource | 'groq' | 'fallback', lang: 'en' | 'hi' = 'en'): { label: string; isRealAI: boolean } {
  if (source === 'groq') {
    return {
      label: lang === 'hi' ? 'ग्रॉक एआई (Groq AI)' : 'Groq AI',
      isRealAI: true,
    };
  }
  return {
    label: lang === 'hi' ? 'ऑफलाइन सुरक्षा मोड (Offline Safety Mode)' : 'Offline Safety Mode',
    isRealAI: false,
  };
}

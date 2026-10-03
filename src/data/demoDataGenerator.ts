import { DEMO_VILLAGES } from './villageData';
import { GOVERNMENT_SCHEMES } from './schemesData';
import { resetDemoReferrals } from '../services/referralService';
import { resetDemoFamily, FAMILY_STORAGE_KEYS } from '../services/familyService';

export const DEMO_STORAGE_KEYS = {
  villages: 'mb_villages',
  assessments: 'mb_assessments',
  schemes_matched: 'mb_schemes_matched',
  demo_loaded: 'mb_demo_loaded',
  referrals: 'mb_referrals',
  family_members: FAMILY_STORAGE_KEYS.members,
  family_records: FAMILY_STORAGE_KEYS.records,
};

export function isDemoLoaded(): boolean {
  return localStorage.getItem(DEMO_STORAGE_KEYS.demo_loaded) === 'true';
}

export function loadDemoData(): void {
  // 1. Seed Villages
  localStorage.setItem(DEMO_STORAGE_KEYS.villages, JSON.stringify(DEMO_VILLAGES));

  // 2. Seed Connected Referrals (Citizen → ASHA → PHC loop)
  resetDemoReferrals();

  // 3. Seed Family Members & Longitudinal Records
  resetDemoFamily();

  // 4. Seed Assessments with synthetic identifiers
  const sampleAssessments = [
    {
      id: 'demo-ass-1',
      patientName: 'Demo Patient #01 (Cardiac Emergency)',
      age: '52',
      gender: 'male',
      careFor: 'myself',
      careAccessContext: 'at_home',
      symptoms: 'Sudden tight crushing chest pain radiating to left arm with cold sweating for 30 minutes',
      urgencyLevel: 'RED',
      informationCompleteness: 'high',
      summary: 'Critical cardiac emergency red-flag detected. Immediate 108 emergency transport required.',
      reasoningFactors: ['Crushing chest discomfort', 'Radiation to left arm', 'Profuse cold sweating'],
      nextSteps: ['Call 108 immediately', 'Chew 300mg Aspirin if not allergic', 'Rest sitting upright'],
      immediateActions: ['Dial 108 Emergency Ambulance', 'Do not drive yourself', 'Keep airways clear'],
      warningSigns: ['Loss of consciousness', 'Shortness of breath', 'Bluish lips'],
      warningSignsToWatch: ['Loss of consciousness', 'Shortness of breath'],
      recommendedNextStep: 'Emergency Department / Nearest Cardiac Trauma Facility',
      doctorSummary: '52yo male presenting with acute retrosternal chest pain and diaphoresis. Suspect Acute Coronary Syndrome.',
      aiSource: 'groq',
      referralId: 'MB-2026-0003',
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    },
    {
      id: 'demo-ass-2',
      patientName: 'Demo Patient #02 (Persistent Fever)',
      age: '34',
      gender: 'male',
      careFor: 'myself',
      careAccessContext: 'at_home',
      symptoms: 'High grade fever for 3 days with ocular headache, myalgia and weakness',
      urgencyLevel: 'YELLOW',
      informationCompleteness: 'high',
      summary: 'Persistent febrile illness requiring outpatient clinical examination and baseline serology at Primary Health Centre.',
      reasoningFactors: ['Fever persisting > 72 hours', 'Generalized myalgia'],
      nextSteps: ['Visit local PHC within 24 hours', 'Complete blood count (CBC) and MP test', 'Maintain hydration'],
      immediateActions: ['Paracetamol for temperature', 'ORS hydration', 'Rest in cool room'],
      warningSigns: ['Petechiae/rashes', 'Persistent vomiting', 'Extreme lethargy'],
      warningSignsToWatch: ['Skin rashes', 'Bleeding gums'],
      recommendedNextStep: 'Primary Health Centre (PHC) / General Physician consultation',
      doctorSummary: '34yo male with 3-day pyrexia and arthralgia. Evaluation for dengue/malaria recommended.',
      aiSource: 'groq',
      referralId: 'MB-2026-0001',
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
    {
      id: 'demo-ass-3',
      patientName: 'Demo Patient #03 (Pediatric Cold)',
      age: '5',
      gender: 'male',
      careFor: 'child',
      careAccessContext: 'at_home',
      symptoms: 'Mild runny nose, clear discharge, sneezing for 2 days, playful and eating normally',
      urgencyLevel: 'GREEN',
      informationCompleteness: 'high',
      summary: 'Mild upper respiratory symptoms typical of a common viral cold. Safe for home hydration and observation.',
      reasoningFactors: ['No breathing difficulty', 'Active child', 'Normal appetite'],
      nextSteps: ['Warm fluids and rest', 'Saline nasal drops', 'Monitor temperature'],
      immediateActions: ['Keep warm', 'Steam inhalation if comfortable'],
      warningSigns: ['Fast breathing (>40/min)', 'Chest indrawing', 'Inability to drink'],
      warningSignsToWatch: ['Wheezing', 'Stridor'],
      recommendedNextStep: 'Home care and observation. Re-assess if fever develops.',
      doctorSummary: '5yo child with mild viral coryza, alert and hemodynamically stable.',
      aiSource: 'groq',
      timestamp: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    },
  ];
  localStorage.setItem(DEMO_STORAGE_KEYS.assessments, JSON.stringify(sampleAssessments));

  // 4. Seed Schemes Matched
  const sampleSchemes = GOVERNMENT_SCHEMES.slice(0, 5).map(s => s.id);
  localStorage.setItem(DEMO_STORAGE_KEYS.schemes_matched, JSON.stringify(sampleSchemes));

  // 5. Mark loaded
  localStorage.setItem(DEMO_STORAGE_KEYS.demo_loaded, 'true');
}

export function clearDemoData(): void {
  Object.values(DEMO_STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
}

export function getDemoStats(): { assessmentsCount: number; villagesCount: number; schemesCount: number } {
  try {
    const assessments = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEYS.assessments) || '[]');
    const villages = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEYS.villages) || '[]');
    const schemes = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEYS.schemes_matched) || '[]');
    return {
      assessmentsCount: assessments.length,
      villagesCount: villages.length,
      schemesCount: schemes.length,
    };
  } catch {
    return { assessmentsCount: 0, villagesCount: 0, schemesCount: 0 };
  }
}

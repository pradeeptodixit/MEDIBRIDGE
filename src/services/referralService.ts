/**
 * Referral tracking service.
 * Manages patient referrals across status stages (created, accepted, consultation,
 * diagnostics, follow-up, completed) stored in localStorage.
 */

import type { Referral, ReferralStatus, ReferralOriginType } from '../types/referral';

const REFERRALS_STORAGE_KEY = 'mb_referrals';
const REFERRAL_COUNTER_KEY = 'mb_referral_counter';
const REFERRAL_UPDATE_EVENT = 'medibridge:referrals_updated';

// ─── ID Generator ─────────────────────────────────────────────────────────────
function getNextReferralId(): string {
  let counter = 1;
  try {
    const raw = localStorage.getItem(REFERRAL_COUNTER_KEY);
    if (raw) {
      counter = parseInt(raw, 10) + 1;
    }
  } catch {
    counter = 1;
  }
  localStorage.setItem(REFERRAL_COUNTER_KEY, String(counter));
  return `MB-2026-${String(counter).padStart(4, '0')}`;
}

// ─── CRUD Operations ──────────────────────────────────────────────────────────
export function getReferrals(): Referral[] {
  try {
    const raw = localStorage.getItem(REFERRALS_STORAGE_KEY);
    if (!raw) {
      // Seed default demo referrals if storage is empty
      const demo = getSeedDemoReferrals();
      localStorage.setItem(REFERRALS_STORAGE_KEY, JSON.stringify(demo));
      return demo;
    }
    return JSON.parse(raw) as Referral[];
  } catch {
    return getSeedDemoReferrals();
  }
}

export function saveReferrals(referrals: Referral[]): void {
  try {
    localStorage.setItem(REFERRALS_STORAGE_KEY, JSON.stringify(referrals));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(REFERRAL_UPDATE_EVENT, { detail: referrals }));
    }
  } catch {
    // LocalStorage quota or access error
  }
}

export function getReferralById(id: string): Referral | undefined {
  const all = getReferrals();
  return all.find(r => r.id === id);
}

export function getReferralsByVillage(villageId?: string): Referral[] {
  const all = getReferrals();
  if (!villageId) return all;
  return all.filter(r => r.originVillageId === villageId || r.originVillageName?.toLowerCase().includes(villageId.toLowerCase()));
}

export function getReferralsByStatus(status: ReferralStatus | ReferralStatus[]): Referral[] {
  const all = getReferrals();
  const filterList = Array.isArray(status) ? status : [status];
  return all.filter(r => filterList.includes(r.status));
}

export interface CreateReferralParams {
  patientId?: string;
  patientName: string;
  familyMemberId?: string;
  age?: string | number;
  gender?: string;
  assessmentId?: string;
  originType: ReferralOriginType;
  originVillageId?: string;
  originVillageName?: string;
  destinationFacilityId?: string;
  destinationFacilityName?: string;
  destinationFacilityType?: 'sub_centre' | 'phc' | 'chc' | 'district_hospital' | 'specialty';
  urgency: 'GREEN' | 'YELLOW' | 'RED';
  reason: string;
  symptoms: string;
  aiSummary?: string;
  informationCompleteness?: 'high' | 'moderate' | 'limited';
  followUpDate?: string;
  isDemoData?: boolean;
}

export function createReferral(params: CreateReferralParams): Referral {
  const now = new Date().toISOString();
  const id = getNextReferralId();

  const newReferral: Referral = {
    id,
    patientId: params.patientId || `P-${Date.now().toString(36)}`,
    patientName: params.patientName || 'Demo Patient',
    familyMemberId: params.familyMemberId,
    age: params.age,
    gender: params.gender,
    assessmentId: params.assessmentId || `A-${Date.now().toString(36)}`,
    originType: params.originType,
    originVillageId: params.originVillageId || 'v1',
    originVillageName: params.originVillageName || 'Rampur Kalan',
    destinationFacilityId: params.destinationFacilityId || 'phc-rampur',
    destinationFacilityName: params.destinationFacilityName || 'PHC Rampur Kalan',
    destinationFacilityType: params.destinationFacilityType || 'phc',
    urgency: params.urgency,
    reason: params.reason,
    symptoms: params.symptoms,
    aiSummary: params.aiSummary || '',
    informationCompleteness: params.informationCompleteness || 'moderate',
    status: 'created',
    statusHistory: [
      {
        status: 'created',
        timestamp: now,
        actor: params.originType === 'asha' ? 'ASHA Frontline Worker' : 'Citizen Self-Triage',
        note: 'Referral originated from AI urgency assessment',
      },
    ],
    createdAt: now,
    updatedAt: now,
    followUpDate: params.followUpDate,
    isDemoData: params.isDemoData !== false,
  };

  const existing = getReferrals();
  saveReferrals([newReferral, ...existing]);
  return newReferral;
}

export function updateReferralStatus(
  id: string,
  newStatus: ReferralStatus,
  actor: string = 'PHC Medical Officer',
  note?: string
): Referral | null {
  const now = new Date().toISOString();
  const all = getReferrals();
  const target = all.find(r => r.id === id);

  if (!target) return null;

  target.status = newStatus;
  target.updatedAt = now;
  target.statusHistory.push({
    status: newStatus,
    timestamp: now,
    actor,
    note: note || `Status advanced to ${newStatus}`,
  });

  saveReferrals([...all]);
  return target;
}

// ─── Referral Funnel & Completion Metrics ─────────────────────────────────────
export interface ReferralStats {
  total: number;
  created: number;
  accepted: number;
  scheduled: number;
  consultation: number;
  diagnostic: number;
  specialist: number;
  follow_up: number;
  completed: number;
  overdue: number;
  completionRate: number; // 0-100%
}

export function getReferralStats(): ReferralStats {
  const all = getReferrals();
  const stats: ReferralStats = {
    total: all.length,
    created: 0,
    accepted: 0,
    scheduled: 0,
    consultation: 0,
    diagnostic: 0,
    specialist: 0,
    follow_up: 0,
    completed: 0,
    overdue: 0,
    completionRate: 0,
  };

  all.forEach(r => {
    if (r.status in stats) {
      stats[r.status]++;
    }
  });

  // Calculate completion rate: completed / total non-empty
  stats.completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  return stats;
}

// ─── Overdue Referral Detection ───────────────────────────────────────────────
export function getOverdueReferrals(): Referral[] {
  const all = getReferrals();
  return all.filter(r => r.status === 'overdue' || (r.status === 'created' && isOlderThanHours(r.createdAt, 48)));
}

function isOlderThanHours(dateStr: string, hours: number): boolean {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    return diffMs > hours * 3600 * 1000;
  } catch {
    return false;
  }
}

// ─── Pre-Seeded Synthetic Demonstration Cases ─────────────────────────────────
export function getSeedDemoReferrals(): Referral[] {
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 3600 * 1000).toISOString();

  return [
    {
      id: 'MB-2026-0001',
      patientId: 'fam-dad',
      patientName: 'Ramesh Sharma (Dad)',
      familyMemberId: 'fam-dad',
      age: 52,
      gender: 'Male',
      assessmentId: 'rec-dad-1',
      originType: 'patient',
      originVillageId: 'v1',
      originVillageName: 'Rampur Kalan',
      destinationFacilityId: 'phc-rampur',
      destinationFacilityName: 'PHC Rampur Kalan',
      destinationFacilityType: 'phc',
      urgency: 'YELLOW',
      reason: 'Stage-1 elevated blood pressure with morning dizziness and neck stiffness',
      symptoms: 'Mild morning headache, neck stiffness, dizziness after climbing stairs; recorded BP 150/95 mmHg',
      aiSummary: 'CLINICAL TRIAGE (YELLOW): 52yo male presenting with stage-1 elevated BP and morning dizziness. PHC baseline evaluation and lifestyle review scheduled.',
      informationCompleteness: 'high',
      status: 'accepted',
      statusHistory: [
        {
          status: 'created',
          timestamp: daysAgo(2),
          actor: 'Citizen Self-Triage',
          note: 'AI triage classified YELLOW; PHC referral generated for Dad',
        },
        {
          status: 'accepted',
          timestamp: daysAgo(1),
          actor: 'PHC Rampur Kalan (Dr. Sharma)',
          note: 'Accepted at Morning OPD for clinical review and vitals check',
        },
      ],
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
      isDemoData: true,
    },
    {
      id: 'MB-2026-0002',
      patientId: 'P-DEMO-02',
      patientName: 'Demo Patient #02 (Pooja D.)',
      age: 24,
      gender: 'Female',
      assessmentId: 'A-DEMO-02',
      originType: 'asha',
      originVillageId: 'v1',
      originVillageName: 'Rampur Kalan',
      destinationFacilityId: 'phc-rampur',
      destinationFacilityName: 'PHC Rampur Kalan',
      destinationFacilityType: 'phc',
      urgency: 'YELLOW',
      reason: 'High-Risk Pregnancy: 2nd trimester anemia with dizziness and pale conjunctiva',
      symptoms: 'Second trimester pregnancy, dizziness upon standing, hemoglobin 8.2 g/dL reported',
      aiSummary: 'MATERNAL TRIAGE (YELLOW): 24yo female in second trimester with moderate anemia. Requires urgent antenatal checkup, IFA review, and clinical workup.',
      informationCompleteness: 'high',
      status: 'scheduled',
      statusHistory: [
        {
          status: 'created',
          timestamp: hoursAgo(18),
          actor: 'ASHA Worker (Sunita Devi)',
          note: 'Identified during ASHA monthly household ANC survey',
        },
        {
          status: 'accepted',
          timestamp: hoursAgo(12),
          actor: 'PHC Medical Officer',
          note: 'Accepted into PHC High-Risk Pregnancy queue',
        },
        {
          status: 'scheduled',
          timestamp: hoursAgo(6),
          actor: 'PHC Reception Desk',
          note: 'Antenatal clinic appointment booked for tomorrow 10:00 AM',
        },
      ],
      createdAt: hoursAgo(18),
      updatedAt: hoursAgo(6),
      isDemoData: true,
    },
    {
      id: 'MB-2026-0003',
      patientId: 'P-DEMO-03',
      patientName: 'Demo Patient #03 (Master Aakash)',
      age: 7,
      gender: 'Male',
      assessmentId: 'A-DEMO-03',
      originType: 'patient',
      originVillageId: 'v4',
      originVillageName: 'Sonpur Tola',
      destinationFacilityId: 'dh-sitapur',
      destinationFacilityName: 'Sitapur District Hospital',
      destinationFacilityType: 'district_hospital',
      urgency: 'RED',
      reason: 'Acute respiratory distress and continuous chest in-drawing',
      symptoms: 'Stridor, rapid breathing, high fever, chest in-drawing in child',
      aiSummary: 'EMERGENCY TRIAGE (RED): Pediatric patient with acute lower respiratory tract distress. Emergency safety override applied. Immediate hospitalization indicated.',
      informationCompleteness: 'high',
      status: 'completed',
      statusHistory: [
        {
          status: 'created',
          timestamp: daysAgo(3),
          actor: 'Citizen Self-Triage',
          note: 'RED Priority — 108 Emergency initiated',
        },
        {
          status: 'accepted',
          timestamp: daysAgo(3),
          actor: 'District Hospital Casualty',
          note: 'Patient admitted to Pediatric ICU',
        },
        {
          status: 'consultation',
          timestamp: daysAgo(2),
          actor: 'Pediatric Specialist',
          note: 'Nebulization & IV antibiotics started',
        },
        {
          status: 'completed',
          timestamp: hoursAgo(8),
          actor: 'Medical Superintendent',
          note: 'Discharged stable. ASHA follow-up completed.',
        },
      ],
      createdAt: daysAgo(3),
      updatedAt: hoursAgo(8),
      isDemoData: true,
    },
    {
      id: 'MB-2026-0004',
      patientId: 'P-DEMO-04',
      patientName: 'Demo Patient #04 (Sunita B.)',
      age: 42,
      gender: 'Female',
      assessmentId: 'A-DEMO-04',
      originType: 'asha',
      originVillageId: 'v2',
      originVillageName: 'Madhavpur',
      destinationFacilityId: 'phc-madhavpur',
      destinationFacilityName: 'PHC Madhavpur',
      destinationFacilityType: 'phc',
      urgency: 'YELLOW',
      reason: 'Chronic joint swelling with intermittent low-grade fever',
      symptoms: 'Swollen knees, morning stiffness for 3 weeks, unable to walk to field',
      aiSummary: 'CLINICAL TRIAGE (YELLOW): Suspected inflammatory arthropathy. Needs ESR/CRP baseline at Community Health Centre.',
      informationCompleteness: 'moderate',
      status: 'overdue',
      statusHistory: [
        {
          status: 'created',
          timestamp: daysAgo(4),
          actor: 'ASHA Worker',
          note: 'Referred during door-to-door survey',
        },
        {
          status: 'overdue',
          timestamp: daysAgo(2),
          actor: 'System Auto-Monitor',
          note: 'Overdue: No facility acknowledgment within 48 hours. ASHA re-notification triggered.',
        },
      ],
      createdAt: daysAgo(4),
      updatedAt: daysAgo(2),
      isDemoData: true,
    },
    {
      id: 'MB-2026-0005',
      patientId: 'P-DEMO-05',
      patientName: 'Demo Patient #05 (Rameshwar K.)',
      age: 58,
      gender: 'Male',
      assessmentId: 'A-DEMO-05',
      originType: 'patient',
      originVillageId: 'v1',
      originVillageName: 'Rampur Kalan',
      destinationFacilityId: 'phc-rampur',
      destinationFacilityName: 'PHC Rampur Kalan',
      destinationFacilityType: 'phc',
      urgency: 'YELLOW',
      reason: 'Persistent dry cough for 3 weeks with unintentional weight loss',
      symptoms: 'Cough > 20 days, evening mild fever, loss of appetite',
      aiSummary: 'TB SURVEILLANCE TRIAGE (YELLOW): Chronic productive cough meeting National TB Elimination Programme (NTEP) screening criteria. Direct sputum microscopy ordered.',
      informationCompleteness: 'high',
      status: 'diagnostic',
      statusHistory: [
        {
          status: 'created',
          timestamp: daysAgo(2),
          actor: 'Citizen Self-Triage',
          note: 'Yellow triage flagged for chronic cough',
        },
        {
          status: 'accepted',
          timestamp: daysAgo(2),
          actor: 'PHC Medical Officer',
          note: 'Accepted at Morning OPD',
        },
        {
          status: 'consultation',
          timestamp: daysAgo(1),
          actor: 'PHC Medical Officer',
          note: 'Physical examination complete. Suspected NTEP case.',
        },
        {
          status: 'diagnostic',
          timestamp: hoursAgo(6),
          actor: 'PHC Laboratory Technician',
          note: 'Sputum sample collected for Truenat molecular testing',
        },
      ],
      createdAt: daysAgo(2),
      updatedAt: hoursAgo(6),
      isDemoData: true,
    },
    {
      id: 'MB-2026-0006',
      patientId: 'P-DEMO-06',
      patientName: 'Demo Patient #06 (Rajesh V.)',
      age: 45,
      gender: 'Male',
      assessmentId: 'A-DEMO-06',
      originType: 'patient',
      originVillageId: 'v3',
      originVillageName: 'Koregaon Khurd',
      destinationFacilityId: 'chc-sitapur',
      destinationFacilityName: 'CHC Sitapur Block',
      destinationFacilityType: 'chc',
      urgency: 'YELLOW',
      reason: 'Type-2 diabetes follow-up with uncontrolled polyuria and blurred vision',
      symptoms: 'Fasting glucose > 220 mg/dL, fatigue, frequent urination',
      aiSummary: 'ENDOCRINE TRIAGE (YELLOW): Diabetic patient requiring physician review and HbA1c testing.',
      informationCompleteness: 'high',
      status: 'consultation',
      statusHistory: [
        {
          status: 'created',
          timestamp: daysAgo(1),
          actor: 'Citizen Self-Triage',
          note: 'Referral generated for CHC Consultation',
        },
        {
          status: 'accepted',
          timestamp: hoursAgo(10),
          actor: 'CHC Outpatient Desk',
          note: 'Admitted to CHC General Medicine OPD',
        },
        {
          status: 'consultation',
          timestamp: hoursAgo(4),
          actor: 'Medical Specialist',
          note: 'Physician consultation complete; anti-diabetic medication adjusted',
        },
      ],
      createdAt: daysAgo(1),
      updatedAt: hoursAgo(4),
      isDemoData: true,
    },
    {
      id: 'MB-2026-0007',
      patientId: 'P-DEMO-07',
      patientName: 'Demo Patient #07 (Geeta D.)',
      age: 63,
      gender: 'Female',
      assessmentId: 'A-DEMO-07',
      originType: 'asha',
      originVillageId: 'v5',
      originVillageName: 'Bandhugaon',
      destinationFacilityId: 'phc-madhavpur',
      destinationFacilityName: 'PHC Madhavpur',
      destinationFacilityType: 'phc',
      urgency: 'GREEN',
      reason: 'Post-cataract surgery recovery follow-up visit',
      symptoms: 'Normal post-op healing, routine eye drop compliance check',
      aiSummary: 'ROUTINE SURVEILLANCE (GREEN): Post-operative recovery follow-up. ASHA verification scheduled.',
      informationCompleteness: 'high',
      status: 'follow_up',
      statusHistory: [
        {
          status: 'created',
          timestamp: daysAgo(3),
          actor: 'District Hospital Ophthalmology',
          note: 'Post-op discharge referral created for ASHA follow-up',
        },
        {
          status: 'follow_up',
          timestamp: hoursAgo(5),
          actor: 'ASHA Worker',
          note: 'Home visit scheduled for medication compliance check',
        },
      ],
      createdAt: daysAgo(3),
      updatedAt: hoursAgo(5),
      isDemoData: true,
    },
    {
      id: 'MB-2026-0008',
      patientId: 'P-DEMO-08',
      patientName: 'Demo Patient #08 (Rohan V.)',
      age: 34,
      gender: 'Male',
      assessmentId: 'A-DEMO-08',
      originType: 'patient',
      originVillageId: 'v1',
      originVillageName: 'Rampur Kalan',
      destinationFacilityId: 'phc-rampur',
      destinationFacilityName: 'PHC Rampur Kalan',
      destinationFacilityType: 'phc',
      urgency: 'YELLOW',
      reason: 'Persistent fever for 3 days with headache and severe fatigue',
      symptoms: 'Fever 101.4°F, persistent for 3 days with ocular headache and fatigue',
      aiSummary: 'CLINICAL TRIAGE (YELLOW): 34yo male presenting with 3-day pyrexia. Recommend PHC outpatient evaluation and baseline malaria serology.',
      informationCompleteness: 'high',
      status: 'created',
      statusHistory: [
        {
          status: 'created',
          timestamp: hoursAgo(3),
          actor: 'Citizen Self-Triage',
          note: 'AI triage classified YELLOW; PHC referral created',
        },
      ],
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(3),
      isDemoData: true,
    },
  ];
}

export function resetDemoReferrals(): void {
  const seed = getSeedDemoReferrals();
  saveReferrals(seed);
  localStorage.setItem(REFERRAL_COUNTER_KEY, '8');
}

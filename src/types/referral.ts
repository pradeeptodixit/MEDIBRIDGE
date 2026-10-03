/**
 * MediBridge AI — Core Referral & Care Continuity Types
 *
 * Models the complete referral loop:
 * Assessment → Referral → ASHA Field Hub → PHC Care Desk → Diagnostics/Specialist → Follow-Up → Case Closure
 */

export type ReferralStatus =
  | 'created'
  | 'accepted'
  | 'scheduled'
  | 'consultation'
  | 'diagnostic'
  | 'specialist'
  | 'follow_up'
  | 'completed'
  | 'overdue';

export type ReferralOriginType = 'patient' | 'asha' | 'phc';

export interface ReferralStatusStep {
  status: ReferralStatus;
  timestamp: string;
  actor: string;
  note?: string;
}

export interface Referral {
  id: string; // MB-2026-XXXX
  patientId: string;
  patientName: string;
  familyMemberId?: string;
  age?: string | number;
  gender?: string;
  assessmentId: string;

  originType: ReferralOriginType;
  originVillageId?: string;
  originVillageName?: string;

  destinationFacilityId: string;
  destinationFacilityName: string;
  destinationFacilityType: 'sub_centre' | 'phc' | 'chc' | 'district_hospital' | 'specialty';

  urgency: 'GREEN' | 'YELLOW' | 'RED';
  reason: string;
  symptoms: string;
  aiSummary?: string;
  informationCompleteness: 'high' | 'moderate' | 'limited';

  status: ReferralStatus;
  statusHistory: ReferralStatusStep[];

  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  followUpDate?: string;

  isDemoData: boolean; // Explicitly marks prototype demonstration records
}

export const REFERRAL_STATUS_PIPELINE: ReferralStatus[] = [
  'created',
  'accepted',
  'scheduled',
  'consultation',
  'diagnostic',
  'specialist',
  'follow_up',
  'completed',
];

export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, { en: string; hi: string; desc: string }> = {
  created: {
    en: 'Referral Created',
    hi: 'रेफरल बनाया गया',
    desc: 'Referral generated and queued for destination healthcare facility',
  },
  accepted: {
    en: 'Facility Accepted',
    hi: 'सुविधा ने स्वीकार किया',
    desc: 'Destination Primary Health Centre has acknowledged and accepted the referral',
  },
  scheduled: {
    en: 'Consultation Scheduled',
    hi: 'परामर्श निर्धारित',
    desc: 'Patient appointment scheduled with Medical Officer',
  },
  consultation: {
    en: 'Clinical Consultation',
    hi: 'डॉक्टर परामर्श जारी',
    desc: 'In-person clinical evaluation conducted by physician',
  },
  diagnostic: {
    en: 'Diagnostics in Progress',
    hi: 'जांच / टेस्ट जारी',
    desc: 'Laboratory blood tests, malaria/dengue screening, or vitals underway',
  },
  specialist: {
    en: 'Specialist Escalation',
    hi: 'विशेषज्ञ को भेजा गया',
    desc: 'Secondary referral to Community Health Centre or District Hospital',
  },
  follow_up: {
    en: 'ASHA Field Follow-Up',
    hi: 'आशा कार्यकर्ता फॉलो-अप',
    desc: 'Frontline worker community visit to verify recovery and treatment compliance',
  },
  completed: {
    en: 'Care Completed & Closed',
    hi: 'केस पूरा और बंद हुआ',
    desc: 'Treatment finalized, symptoms resolved, referral loop closed',
  },
  overdue: {
    en: 'Follow-Up Overdue',
    hi: 'फॉलो-अप समय समाप्त',
    desc: 'Referral has exceeded 48 hours without acknowledgment or field action',
  },
};

export interface FacilityCapability {
  facilityId: string;
  facilityName: string;
  facilityType: 'sub_centre' | 'phc' | 'chc' | 'district_hospital' | 'specialty';
  district: string;
  state: string;
  capabilities: {
    generalOPD: 'available' | 'limited' | 'unavailable';
    doctor: 'available' | 'limited' | 'unavailable';
    diagnostics: 'available' | 'limited' | 'unavailable';
    pharmacy: 'available' | 'limited' | 'unavailable';
    specialist: 'available' | 'limited' | 'unavailable';
    maternity: 'available' | 'limited' | 'unavailable';
    emergency: 'available' | 'limited' | 'unavailable';
  };
  isDemoData: true;
}

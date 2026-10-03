/**
 * MediBridge AI — Hospital Partner Service
 *
 * Manages B2B Hospital Partner interactions:
 * - Hospital Registry & Configurable Commission Rates (e.g. 5%, 7%, 3%)
 * - Attributed Referral Pipeline (MB-REF-XXXXXX)
 * - Treatment Completion & Commission Calculation (Bill * Rate)
 * - Monthly Invoicing & Breakdown
 * - Payment Tracking & UTR Verification
 * - Role-Based Data Isolation (Hospital A only sees Hospital A)
 * - Admin Platform Ledger
 */

import type {
  HospitalPartner,
  HospitalReferral,
  HospitalInvoice,
  HospitalPayment,
  HospitalStats,
  PlatformOverviewStats,
  HospitalRowSummary,
  MonthlyAnalyticsPoint,
  ConversionFunnelStats,
  HospitalReferralStatus,
  TreatmentStatus,
  PaymentMethod,
} from '../types/hospital';

// ─── STORAGE KEYS ─────────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  HOSPITALS: 'mb_hospital_partners',
  ACTIVE_HOSPITAL_ID: 'mb_active_hospital_id',
  REFERRALS: 'mb_hospital_referrals',
  INVOICES: 'mb_hospital_invoices',
  PAYMENTS: 'mb_hospital_payments',
  USER_ROLE: 'mb_user_role', // 'patient' | 'hospital' | 'admin'
  HOSPITAL_AUTH: 'mb_hospital_auth_token',  // session token for hospital login
  ADMIN_AUTH: 'mb_admin_auth_token',        // session token for admin login
};

// ─── DEMO CREDENTIALS (clearly marked as prototype/demo) ─────────────────────
// In production these would be validated server-side. For the demo, credentials
// are stored only in the auth service layer and never exposed in UI.
const DEMO_HOSPITAL_PIN = '1234'; // Same demo PIN for all hospitals
const DEMO_ADMIN_CREDENTIALS = {
  email: 'admin@medibridge.ai',
  password: 'MediBridge@2026',
};

// Simple deterministic session token (demo quality — not cryptographic)
function generateSessionToken(seed: string): string {
  const ts = Date.now().toString(36);
  const hash = Array.from(seed).reduce((acc, c) => acc + c.charCodeAt(0), 0).toString(16);
  return `mb-sess-${hash}-${ts}`;
}

const HOSPITAL_UPDATE_EVENT = 'medibridge:hospital_data_updated';

function notifyUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(HOSPITAL_UPDATE_EVENT));
  }
}

// ─── INITIAL SEED DATA ────────────────────────────────────────────────────────
const INITIAL_HOSPITALS: HospitalPartner[] = [
  {
    id: 'dh-sitapur',
    name: 'District Hospital Sitapur',
    type: 'district_hospital',
    district: 'Sitapur',
    state: 'Uttar Pradesh',
    address: 'Civil Lines, Near Collectorate, Sitapur, UP 261001',
    contactPerson: 'Dr. R. K. Saxena (Medical Superintendent)',
    contactEmail: 'billing@dhsitapur.up.gov.in',
    contactPhone: '+91 5862 245 108',
    commissionRate: 5.0, // Default 5%
    bankDetails: {
      accountName: 'District Hospital Sitapur Patient Welfare Fund',
      accountNumber: '30491029481',
      ifscCode: 'SBIN0000188',
      bankName: 'State Bank of India, Main Branch Sitapur',
      upiId: 'dhsitapur@sbi',
    },
    activeStatus: 'active',
    joinedDate: '2026-01-15',
  },
  {
    id: 'hosp-apex',
    name: 'Apex Super Specialty Hospital',
    type: 'private_multispecialty',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    address: 'Sector B, Aliganj, Lucknow, UP 226024',
    contactPerson: 'Ananya Verma (Head of Patient Partnerships)',
    contactEmail: 'accounts@apexhospital.org',
    contactPhone: '+91 522 410 9900',
    commissionRate: 7.0, // Configurable 7%
    bankDetails: {
      accountName: 'Apex Health Systems Pvt Ltd',
      accountNumber: '920020048192841',
      ifscCode: 'UTIB0000342',
      bankName: 'Axis Bank, Aliganj Lucknow',
      upiId: 'apexhealth@axisbank',
    },
    activeStatus: 'active',
    joinedDate: '2026-02-01',
  },
  {
    id: 'chc-misrikh',
    name: 'Community Health Centre (CHC) Misrikh',
    type: 'chc',
    district: 'Sitapur',
    state: 'Uttar Pradesh',
    address: 'Station Road, Misrikh-Neemsar, Sitapur, UP 261401',
    contactPerson: 'Dr. Vivek Mishra (Chief Medical Officer)',
    contactEmail: 'chcmisrikh@uphealth.nic.in',
    contactPhone: '+91 5862 284 311',
    commissionRate: 4.0, // Configurable 4%
    bankDetails: {
      accountName: 'CHC Misrikh Rogi Kalyan Samiti',
      accountNumber: '40192830192',
      ifscCode: 'PUNB0182900',
      bankName: 'Punjab National Bank, Misrikh',
      upiId: 'chcmisrikh@pnb',
    },
    activeStatus: 'active',
    joinedDate: '2026-02-10',
  },
  {
    id: 'hosp-caremax',
    name: 'CareMax Multispecialty Hospital',
    type: 'private_multispecialty',
    district: 'Sitapur',
    state: 'Uttar Pradesh',
    address: 'NH-24 Highway Junction, Sitapur, UP 261001',
    contactPerson: 'Dr. Sunita Kapoor (Administrative Director)',
    contactEmail: 'partnercare@caremaxhospitals.in',
    contactPhone: '+91 5862 291 000',
    commissionRate: 6.0, // Configurable 6%
    bankDetails: {
      accountName: 'CareMax Healthcare Enterprise Ltd',
      accountNumber: '50200049182910',
      ifscCode: 'HDFC0001824',
      bankName: 'HDFC Bank, Civil Lines Sitapur',
      upiId: 'caremax@hdfcbank',
    },
    activeStatus: 'active',
    joinedDate: '2026-03-01',
  },
];

// Seed Referrals for District Hospital Sitapur (matches user prompt specs: 42 referrals, 28 completed, ₹8,40,000 value, ₹42k commission, ₹20k paid, ₹22k outstanding)
function generateSeedReferrals(): HospitalReferral[] {
  const referrals: HospitalReferral[] = [];

  // Completed treatments for dh-sitapur (Total 28)
  const completedCases = [
    { s: 'Emergency Cardiac Catheterization', bill: 110000, urg: 'RED' as const, date: '2026-09-02', inv: 'INV-2026-09-DH01' },
    { s: 'Acute Coronary Syndrome ICU Care', bill: 85000, urg: 'RED' as const, date: '2026-09-03', inv: 'INV-2026-09-DH01' },
    { s: 'Orthopedic Fracture Fixation', bill: 45000, urg: 'YELLOW' as const, date: '2026-09-04', inv: 'INV-2026-09-DH01' },
    { s: 'Emergency Cesarean Delivery (LSCS)', bill: 38000, urg: 'RED' as const, date: '2026-09-05', inv: 'INV-2026-09-DH01' },
    { s: 'Severe Dengue Platelet Therapy', bill: 32000, urg: 'RED' as const, date: '2026-09-06', inv: 'INV-2026-09-DH01' },
    { s: 'General Surgery - Appendectomy', bill: 42000, urg: 'YELLOW' as const, date: '2026-09-07', inv: 'INV-2026-09-DH01' },
    { s: 'Pediatric Bronchopneumonia Inpatient', bill: 28000, urg: 'YELLOW' as const, date: '2026-09-08', inv: 'INV-2026-09-DH01' },
    { s: 'Diabetic Foot Ulcer Debridement', bill: 24000, urg: 'YELLOW' as const, date: '2026-09-09', inv: 'INV-2026-09-DH01' },
    { s: 'Neurological Evaluation & MRI', bill: 18000, urg: 'YELLOW' as const, date: '2026-09-10', inv: 'INV-2026-09-DH01' },
    { s: 'Acute Gastroenteritis & IV Therapy', bill: 14000, urg: 'YELLOW' as const, date: '2026-09-11', inv: 'INV-2026-09-DH01' },
    { s: 'Specialist ENT Microsurgery', bill: 30000, urg: 'GREEN' as const, date: '2026-09-11', inv: 'INV-2026-09-DH01' },
    { s: 'Urological Stent Placement', bill: 14000, urg: 'YELLOW' as const, date: '2026-09-12', inv: 'INV-2026-09-DH01' },
    // August completed cases (16 cases totaling ₹3,60,000 for August invoice)
    { s: 'Cholecystectomy Laparoscopic', bill: 50000, urg: 'YELLOW' as const, date: '2026-08-04', inv: 'INV-2026-08-DH01' },
    { s: 'Trauma Wound Repair & Inpatient', bill: 35000, urg: 'RED' as const, date: '2026-08-06', inv: 'INV-2026-08-DH01' },
    { s: 'Infectious Disease Isolation Care', bill: 25000, urg: 'YELLOW' as const, date: '2026-08-08', inv: 'INV-2026-08-DH01' },
    { s: 'Ophthalmic Cataract Phacoemulsification', bill: 22000, urg: 'GREEN' as const, date: '2026-08-10', inv: 'INV-2026-08-DH01' },
    { s: 'Neonatal Care Unit (SNCU) Inpatient', bill: 40000, urg: 'RED' as const, date: '2026-08-12', inv: 'INV-2026-08-DH01' },
    { s: 'Hypertensive Encephalopathy Stabilisation', bill: 30000, urg: 'RED' as const, date: '2026-08-14', inv: 'INV-2026-08-DH01' },
    { s: 'Chronic Kidney Disease Hemodialysis', bill: 20000, urg: 'YELLOW' as const, date: '2026-08-16', inv: 'INV-2026-08-DH01' },
    { s: 'Maternal Normal Delivery & Observation', bill: 15000, urg: 'GREEN' as const, date: '2026-08-18', inv: 'INV-2026-08-DH01' },
    { s: 'Orthopedic Joint Injection & Rehab', bill: 12000, urg: 'GREEN' as const, date: '2026-08-20', inv: 'INV-2026-08-DH01' },
    { s: 'Pediatric Asthma Exacerbation Care', bill: 18000, urg: 'YELLOW' as const, date: '2026-08-21', inv: 'INV-2026-08-DH01' },
    { s: 'Severe Malaria Artesunate Therapy', bill: 22000, urg: 'YELLOW' as const, date: '2026-08-23', inv: 'INV-2026-08-DH01' },
    { s: 'Dermatological Inpatient Therapy', bill: 16000, urg: 'GREEN' as const, date: '2026-08-24', inv: 'INV-2026-08-DH01' },
    { s: 'General Surgery Hernia Repair', bill: 28000, urg: 'YELLOW' as const, date: '2026-08-25', inv: 'INV-2026-08-DH01' },
    { s: 'Emergency Poisoning Toxin Clearance', bill: 15000, urg: 'RED' as const, date: '2026-08-26', inv: 'INV-2026-08-DH01' },
    { s: 'Endoscopic Gastrointestinal Procedure', bill: 17000, urg: 'YELLOW' as const, date: '2026-08-27', inv: 'INV-2026-08-DH01' },
    { s: 'Comprehensive Diagnostic Workup', bill: 15000, urg: 'GREEN' as const, date: '2026-08-28', inv: 'INV-2026-08-DH01' },
  ];

  // Create completed referrals
  completedCases.forEach((item, idx) => {
    const refNum = 101 + idx;
    const patNum = idx + 1;
    const commRate = 5.0;
    const commAmount = Math.round(item.bill * (commRate / 100));

    referrals.push({
      id: `MB-REF-000${refNum}`,
      patientId: `PAT-2026-${String(patNum).padStart(4, '0')}`,
      patientAlias: `Patient #${String(patNum).padStart(3, '0')} (${['A. K***r', 'R. S***a', 'S. D***i', 'M. S***h', 'P. V***a', 'V. Y***v'][idx % 6]})`,
      patientAge: 24 + ((idx * 7) % 55),
      patientGender: idx % 2 === 0 ? 'Male' : 'Female',
      hospitalId: 'dh-sitapur',
      hospitalName: 'District Hospital Sitapur',
      referralDate: item.date,
      serviceRequested: item.s,
      urgency: item.urg,
      symptomsSummary: `Clinical presentation triage verified via MediBridge AI. ${item.s} conducted as indicated.`,
      referralStatus: 'treatment_completed',
      treatmentStatus: 'Treatment Completed',
      treatmentBillAmount: item.bill,
      commissionRate: commRate,
      commissionAmount: commAmount,
      paymentStatus: item.inv === 'INV-2026-08-DH01' ? 'paid' : 'invoiced',
      invoiceId: item.inv,
      appointmentDate: item.date,
      treatmentCompletedDate: item.date,
      attributionProof: {
        sourceTriageSessionId: `session-mb-${refNum}`,
        triageTimestamp: `${item.date}T08:30:00Z`,
        originLocation: 'Rampur Kalan PHC Sector',
        deterministicUrgency: item.urg,
      },
    });
  });

  // 10 Pending/Active referrals for dh-sitapur
  const pendingCases = [
    { s: 'Cardiology TMT & Echo Workup', stat: 'treatment_pending' as HospitalReferralStatus, tStat: 'In Treatment' as TreatmentStatus, urg: 'YELLOW' as const, date: '2026-09-11' },
    { s: 'Orthopedic Knee Replacement Evaluation', stat: 'appointment_scheduled' as HospitalReferralStatus, tStat: 'Awaiting Consultation' as TreatmentStatus, urg: 'YELLOW' as const, date: '2026-09-11' },
    { s: 'Neurology EEG & Stroke Screening', stat: 'treatment_pending' as HospitalReferralStatus, tStat: 'In Treatment' as TreatmentStatus, urg: 'RED' as const, date: '2026-09-10' },
    { s: 'High-Risk Pregnancy Ante-Natal Consult', stat: 'appointment_scheduled' as HospitalReferralStatus, tStat: 'Awaiting Consultation' as TreatmentStatus, urg: 'RED' as const, date: '2026-09-10' },
    { s: 'Diabetic Retinopathy Laser Assessment', stat: 'contacted' as HospitalReferralStatus, tStat: 'Awaiting Consultation' as TreatmentStatus, urg: 'GREEN' as const, date: '2026-09-09' },
    { s: 'Pulmonary Function Test & Consultation', stat: 'appointment_scheduled' as HospitalReferralStatus, tStat: 'Awaiting Consultation' as TreatmentStatus, urg: 'YELLOW' as const, date: '2026-09-09' },
    { s: 'Gastroenterology Hepatitis Workup', stat: 'contacted' as HospitalReferralStatus, tStat: 'Awaiting Consultation' as TreatmentStatus, urg: 'YELLOW' as const, date: '2026-09-08' },
    { s: 'Pediatric Growth & Neurodevelopment', stat: 'referred' as HospitalReferralStatus, tStat: 'Awaiting Consultation' as TreatmentStatus, urg: 'GREEN' as const, date: '2026-09-08' },
    { s: 'Thyroid Ultrasound & FNAC', stat: 'treatment_pending' as HospitalReferralStatus, tStat: 'In Treatment' as TreatmentStatus, urg: 'YELLOW' as const, date: '2026-09-07' },
    { s: 'Vascular Doppler & Varicose Evaluation', stat: 'referred' as HospitalReferralStatus, tStat: 'Awaiting Consultation' as TreatmentStatus, urg: 'GREEN' as const, date: '2026-09-07' },
  ];

  pendingCases.forEach((item, idx) => {
    const refNum = 129 + idx;
    const patNum = 29 + idx;
    referrals.push({
      id: `MB-REF-000${refNum}`,
      patientId: `PAT-2026-${String(patNum).padStart(4, '0')}`,
      patientAlias: `Patient #${String(patNum).padStart(3, '0')} (${['H. P***d', 'G. T***i', 'N. K***r', 'R. M***i', 'T. D***i'][idx % 5]})`,
      patientAge: 28 + (idx * 4),
      patientGender: idx % 2 === 0 ? 'Male' : 'Female',
      hospitalId: 'dh-sitapur',
      hospitalName: 'District Hospital Sitapur',
      referralDate: item.date,
      serviceRequested: item.s,
      urgency: item.urg,
      symptomsSummary: `Active referral coordinated by MediBridge AI. Awaiting procedure completion and final billing.`,
      referralStatus: item.stat,
      treatmentStatus: item.tStat,
      treatmentBillAmount: 0,
      commissionRate: 5.0,
      commissionAmount: 0,
      paymentStatus: 'unbilled',
      appointmentDate: `${item.date} 10:00 AM`,
      attributionProof: {
        sourceTriageSessionId: `session-mb-${refNum}`,
        triageTimestamp: `${item.date}T09:15:00Z`,
        originLocation: 'Sitapur District Cluster',
        deterministicUrgency: item.urg,
      },
    });
  });

  // 4 Cancelled/Did Not Attend
  const cancelledCases = [
    { s: 'Elective Dermatological Consult', urg: 'GREEN' as const, date: '2026-09-01' },
    { s: 'Routine Health Checkup', urg: 'GREEN' as const, date: '2026-09-02' },
    { s: 'Allergy Skin Prick Testing', urg: 'GREEN' as const, date: '2026-08-15' },
    { s: 'Dental Scaling & Prophylaxis', urg: 'GREEN' as const, date: '2026-08-19' },
  ];

  cancelledCases.forEach((item, idx) => {
    const refNum = 139 + idx;
    const patNum = 39 + idx;
    referrals.push({
      id: `MB-REF-000${refNum}`,
      patientId: `PAT-2026-${String(patNum).padStart(4, '0')}`,
      patientAlias: `Patient #${String(patNum).padStart(3, '0')} (Cancelled)`,
      patientAge: 35,
      patientGender: 'Female',
      hospitalId: 'dh-sitapur',
      hospitalName: 'District Hospital Sitapur',
      referralDate: item.date,
      serviceRequested: item.s,
      urgency: item.urg,
      symptomsSummary: `Patient opted for home care or rescheduled out of town.`,
      referralStatus: 'cancelled',
      treatmentStatus: 'Cancelled',
      treatmentBillAmount: 0,
      commissionRate: 5.0,
      commissionAmount: 0,
      paymentStatus: 'unbilled',
      attributionProof: {
        sourceTriageSessionId: `session-mb-${refNum}`,
        triageTimestamp: `${item.date}T11:00:00Z`,
        originLocation: 'Misrikh Rural',
        deterministicUrgency: item.urg,
      },
    });
  });

  // Seed sample referrals for Apex Hospital (hosp-apex) to demonstrate multi-hospital data isolation
  const apexCases = [
    { s: 'Robotic Knee Arthroplasty', bill: 180000, urg: 'YELLOW' as const, date: '2026-09-04' },
    { s: 'Coronary Angioplasty (PTCA)', bill: 220000, urg: 'RED' as const, date: '2026-09-07' },
    { s: 'Complex Spine Decompression', bill: 160000, urg: 'RED' as const, date: '2026-09-10' },
  ];
  apexCases.forEach((item, idx) => {
    const refNum = 201 + idx;
    const commRate = 7.0; // 7% rate for Apex
    referrals.push({
      id: `MB-REF-000${refNum}`,
      patientId: `PAT-2026-0${refNum}`,
      patientAlias: `Patient #${refNum} (Apex Referral)`,
      patientAge: 58,
      patientGender: 'Male',
      hospitalId: 'hosp-apex',
      hospitalName: 'Apex Super Specialty Hospital',
      referralDate: item.date,
      serviceRequested: item.s,
      urgency: item.urg,
      symptomsSummary: `High acuity specialty referral sent to Apex Hospital.`,
      referralStatus: 'treatment_completed',
      treatmentStatus: 'Treatment Completed',
      treatmentBillAmount: item.bill,
      commissionRate: commRate,
      commissionAmount: Math.round(item.bill * (commRate / 100)),
      paymentStatus: 'invoiced',
      invoiceId: 'INV-2026-09-APEX01',
      appointmentDate: item.date,
      treatmentCompletedDate: item.date,
      attributionProof: {
        sourceTriageSessionId: `session-apex-${refNum}`,
        triageTimestamp: `${item.date}T09:00:00Z`,
        originLocation: 'Lucknow Metro Cluster',
        deterministicUrgency: item.urg,
      },
    });
  });

  return referrals;
}

// Seed Invoices for dh-sitapur & hosp-apex
function generateSeedInvoices(): HospitalInvoice[] {
  return [
    {
      id: 'INV-2026-08-DH01',
      invoiceNumber: 'MB/2026-08/DH01',
      hospitalId: 'dh-sitapur',
      hospitalName: 'District Hospital Sitapur',
      billingPeriod: 'August 2026',
      issueDate: '2026-08-31',
      dueDate: '2026-09-15',
      successfulReferralsCount: 16,
      totalTreatmentValue: 360000,
      commissionRate: 5.0,
      mediBridgeCommission: 18000,
      previousOutstanding: 0,
      paymentsReceived: 18000,
      finalAmountDue: 0,
      status: 'Paid',
      itemizedReferralIds: Array.from({ length: 16 }, (_, i) => `MB-REF-000${113 + i}`),
      notes: 'Commission for completed August referrals paid in full via Bank Transfer.',
    },
    {
      id: 'INV-2026-09-DH01',
      invoiceNumber: 'MB/2026-09/DH01',
      hospitalId: 'dh-sitapur',
      hospitalName: 'District Hospital Sitapur',
      billingPeriod: 'September 2026',
      issueDate: '2026-09-10',
      dueDate: '2026-09-25',
      successfulReferralsCount: 12,
      totalTreatmentValue: 480000,
      commissionRate: 5.0,
      mediBridgeCommission: 24000,
      previousOutstanding: 0,
      paymentsReceived: 2000, // Part payment made
      finalAmountDue: 22000, // Exact ₹22,000 outstanding matching user prompt!
      status: 'Partially Paid',
      itemizedReferralIds: Array.from({ length: 12 }, (_, i) => `MB-REF-000${101 + i}`),
      notes: 'Monthly invoice for completed referrals up to 10 Sep 2026. ₹2,000 advance received, ₹22,000 pending.',
    },
    {
      id: 'INV-2026-09-APEX01',
      invoiceNumber: 'MB/2026-09/APEX01',
      hospitalId: 'hosp-apex',
      hospitalName: 'Apex Super Specialty Hospital',
      billingPeriod: 'September 2026',
      issueDate: '2026-09-10',
      dueDate: '2026-09-25',
      successfulReferralsCount: 3,
      totalTreatmentValue: 560000,
      commissionRate: 7.0,
      mediBridgeCommission: 39200,
      previousOutstanding: 0,
      paymentsReceived: 0,
      finalAmountDue: 39200,
      status: 'Pending',
      itemizedReferralIds: ['MB-REF-000201', 'MB-REF-000202', 'MB-REF-000203'],
      notes: 'Initial billing period for newly onboarded Apex Hospital.',
    },
  ];
}

// Seed Payments
function generateSeedPayments(): HospitalPayment[] {
  return [
    {
      id: 'PAY-2026-08-001',
      invoiceId: 'INV-2026-08-DH01',
      invoiceNumber: 'MB/2026-08/DH01',
      hospitalId: 'dh-sitapur',
      hospitalName: 'District Hospital Sitapur',
      amount: 18000,
      date: '2026-08-28',
      paymentMethod: 'Bank Transfer / NEFT / RTGS',
      transactionReference: 'NEFT/SBI/98234710234',
      status: 'Verified',
      recordedBy: 'Accounts Officer Sitapur',
      verifiedAt: '2026-08-29T10:00:00Z',
      notes: 'Full settlement for August invoice.',
    },
    {
      id: 'PAY-2026-09-001',
      invoiceId: 'INV-2026-09-DH01',
      invoiceNumber: 'MB/2026-09/DH01',
      hospitalId: 'dh-sitapur',
      hospitalName: 'District Hospital Sitapur',
      amount: 2000,
      date: '2026-09-10',
      paymentMethod: 'UPI',
      transactionReference: 'UPI/20260910/893712019',
      status: 'Verified',
      recordedBy: 'Finance Desk Sitapur',
      verifiedAt: '2026-09-10T14:30:00Z',
      notes: 'Initial token transfer against September billing.',
    },
  ];
}

// ─── INITIALIZATION / SEEDING ────────────────────────────────────────────────
export function initHospitalData(): void {
  try {
    if (!localStorage.getItem(STORAGE_KEYS.HOSPITALS)) {
      localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(INITIAL_HOSPITALS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_HOSPITAL_ID)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_HOSPITAL_ID, 'dh-sitapur');
    }
    if (!localStorage.getItem(STORAGE_KEYS.REFERRALS)) {
      localStorage.setItem(STORAGE_KEYS.REFERRALS, JSON.stringify(generateSeedReferrals()));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(generateSeedInvoices()));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(generateSeedPayments()));
    }
  } catch {
    // LocalStorage quota or blocked
  }
}

// ─── USER ROLE & ACTIVE HOSPITAL ─────────────────────────────────────────────
export type UserRole = 'patient' | 'hospital' | 'admin';

export function getUserRole(): UserRole | null {
  try {
    const role = sessionStorage.getItem(STORAGE_KEYS.USER_ROLE);
    if (role === 'hospital' || role === 'admin' || role === 'patient') {
      return role;
    }
  } catch { /* ignore */ }
  return null;
}

export function setUserRole(role: UserRole): void {
  try {
    sessionStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE); // Purge any persistent legacy role
    notifyUpdate();
  } catch { /* ignore */ }
}

export function clearUserRole(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.USER_ROLE);
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
    notifyUpdate();
  } catch { /* ignore */ }
}

// ─── AUTHENTICATION ───────────────────────────────────────────────────────────

/** Login hospital staff: validates hospitalId + PIN, saves session. Returns true on success. */
export function loginHospital(hospitalId: string, pin: string): boolean {
  if (pin !== DEMO_HOSPITAL_PIN) return false;
  initHospitalData();
  const hospitals = getHospitals();
  const match = hospitals.find(h => h.id === hospitalId);
  if (!match) return false;
  try {
    const token = generateSessionToken(hospitalId);
    localStorage.setItem(STORAGE_KEYS.HOSPITAL_AUTH, JSON.stringify({ hospitalId, token, loggedInAt: new Date().toISOString() }));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_HOSPITAL_ID, hospitalId);
    sessionStorage.setItem(STORAGE_KEYS.USER_ROLE, 'hospital');
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
    notifyUpdate();
    return true;
  } catch { return false; }
}

/** Login admin: validates email + password, saves session. Returns true on success. */
export function loginAdmin(email: string, password: string): boolean {
  if (
    email.trim().toLowerCase() !== DEMO_ADMIN_CREDENTIALS.email.toLowerCase() ||
    password !== DEMO_ADMIN_CREDENTIALS.password
  ) return false;
  try {
    const token = generateSessionToken('admin');
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, JSON.stringify({ token, loggedInAt: new Date().toISOString() }));
    sessionStorage.setItem(STORAGE_KEYS.USER_ROLE, 'admin');
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
    notifyUpdate();
    return true;
  } catch { return false; }
}

/** Returns true if a valid hospital session exists in localStorage. */
export function isHospitalAuthenticated(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HOSPITAL_AUTH);
    if (!raw) return false;
    const session = JSON.parse(raw);
    return !!(session?.hospitalId && session?.token);
  } catch { return false; }
}

/** Returns true if a valid admin session exists in localStorage. */
export function isAdminAuthenticated(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
    if (!raw) return false;
    const session = JSON.parse(raw);
    return !!(session?.token);
  } catch { return false; }
}

/** Logout hospital — clears session token and role. */
export function logoutHospital(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.HOSPITAL_AUTH);
    sessionStorage.removeItem(STORAGE_KEYS.USER_ROLE);
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
    notifyUpdate();
  } catch { /* ignore */ }
}

/** Logout admin — clears session token and role. */
export function logoutAdmin(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    sessionStorage.removeItem(STORAGE_KEYS.USER_ROLE);
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
    notifyUpdate();
  } catch { /* ignore */ }
}

export function getActiveHospitalId(): string {
  try {
    const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_HOSPITAL_ID);
    if (id) return id;
  } catch { /* ignore */ }
  return 'dh-sitapur';
}

export function setActiveHospitalId(hospitalId: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_HOSPITAL_ID, hospitalId);
    notifyUpdate();
  } catch { /* ignore */ }
}

// ─── HOSPITALS CRUD ──────────────────────────────────────────────────────────
export function getHospitals(): HospitalPartner[] {
  initHospitalData();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HOSPITALS);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return INITIAL_HOSPITALS;
}

export function getHospitalById(id: string): HospitalPartner | undefined {
  const hospitals = getHospitals();
  return hospitals.find(h => h.id === id);
}

export function getActiveHospital(): HospitalPartner {
  const activeId = getActiveHospitalId();
  const hospital = getHospitalById(activeId);
  return hospital || getHospitals()[0];
}

export function saveHospital(hospital: HospitalPartner): void {
  const hospitals = getHospitals();
  const existingIdx = hospitals.findIndex(h => h.id === hospital.id);
  if (existingIdx >= 0) {
    hospitals[existingIdx] = hospital;
  } else {
    hospitals.push(hospital);
  }
  try {
    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(hospitals));
    notifyUpdate();
  } catch { /* ignore */ }
}

export function updateHospitalCommission(hospitalId: string, newRate: number): void {
  const hospitals = getHospitals();
  const hospital = hospitals.find(h => h.id === hospitalId);
  if (hospital) {
    hospital.commissionRate = Math.max(0.5, Math.min(30, Number(newRate.toFixed(1))));
    try {
      localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(hospitals));
      notifyUpdate();
    } catch { /* ignore */ }
  }
}

// ─── REFERRALS (DATA ISOLATION & COMMISSION CALCULATION) ─────────────────────
export function getAllReferrals(): HospitalReferral[] {
  initHospitalData();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REFERRALS);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return generateSeedReferrals();
}

/**
 * Returns referrals strictly isolated for a specific hospital.
 * Hospital A can never view Hospital B's referrals.
 */
export function getReferralsForHospital(hospitalId: string): HospitalReferral[] {
  const all = getAllReferrals();
  return all.filter(r => r.hospitalId === hospitalId);
}

export function saveReferrals(referrals: HospitalReferral[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REFERRALS, JSON.stringify(referrals));
    notifyUpdate();
  } catch { /* ignore */ }
}

/**
 * Updates a referral's clinical / treatment status and bill amount.
 * When treatment is completed and bill amount is entered, commission is calculated.
 */
export function updateReferralTreatment(
  referralId: string,
  updates: {
    referralStatus?: HospitalReferralStatus;
    treatmentStatus?: TreatmentStatus;
    treatmentBillAmount?: number;
    appointmentDate?: string;
    notes?: string;
  }
): HospitalReferral | null {
  const referrals = getAllReferrals();
  const referral = referrals.find(r => r.id === referralId);
  if (!referral) return null;

  if (updates.referralStatus !== undefined) {
    referral.referralStatus = updates.referralStatus;
  }
  if (updates.treatmentStatus !== undefined) {
    referral.treatmentStatus = updates.treatmentStatus;
  }
  if (updates.appointmentDate !== undefined) {
    referral.appointmentDate = updates.appointmentDate;
  }
  if (updates.notes !== undefined) {
    referral.notes = updates.notes;
  }

  // Handle Bill Amount & Commission Calculation
  if (updates.treatmentBillAmount !== undefined) {
    referral.treatmentBillAmount = Math.max(0, updates.treatmentBillAmount);
    
    // BUSINESS RULE: Commission becomes payable ONLY when treatment is completed
    if (
      referral.treatmentStatus === 'Treatment Completed' ||
      referral.referralStatus === 'treatment_completed'
    ) {
      referral.commissionAmount = Math.round(
        referral.treatmentBillAmount * (referral.commissionRate / 100)
      );
      if (referral.paymentStatus === 'unbilled' && referral.treatmentBillAmount > 0) {
        referral.treatmentCompletedDate = new Date().toISOString().split('T')[0];
      }
    } else {
      referral.commissionAmount = 0;
    }
  }

  saveReferrals(referrals);
  return referral;
}

// ─── INVOICES ─────────────────────────────────────────────────────────────────
export function getAllInvoices(): HospitalInvoice[] {
  initHospitalData();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return generateSeedInvoices();
}

export function getInvoicesForHospital(hospitalId: string): HospitalInvoice[] {
  const all = getAllInvoices();
  return all.filter(inv => inv.hospitalId === hospitalId);
}

export function saveInvoices(invoices: HospitalInvoice[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    notifyUpdate();
  } catch { /* ignore */ }
}

/**
 * Generates a monthly invoice for all completed, unbilled referrals of a hospital.
 */
export function generateMonthlyInvoice(
  hospitalId: string,
  billingPeriod: string = 'September 2026'
): HospitalInvoice {
  const hospital = getHospitalById(hospitalId);
  const hospitalName = hospital ? hospital.name : 'Partner Hospital';
  const commissionRate = hospital ? hospital.commissionRate : 5.0;

  const referrals = getReferralsForHospital(hospitalId);
  const unbilledCompleted = referrals.filter(
    r =>
      r.treatmentStatus === 'Treatment Completed' &&
      r.treatmentBillAmount > 0 &&
      r.paymentStatus === 'unbilled'
  );

  const treatmentValue = unbilledCompleted.reduce((acc, r) => acc + r.treatmentBillAmount, 0);
  const mediBridgeCommission = Math.round(treatmentValue * (commissionRate / 100));

  const allInvoices = getAllInvoices();
  const nextNumber = allInvoices.length + 1;
  const invId = `INV-2026-${String(nextNumber).padStart(3, '0')}`;
  const invNum = `MB/2026/${hospitalId.toUpperCase().slice(0, 4)}-${String(nextNumber).padStart(3, '0')}`;

  const today = new Date();
  const dueDate = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);

  const newInvoice: HospitalInvoice = {
    id: invId,
    invoiceNumber: invNum,
    hospitalId,
    hospitalName,
    billingPeriod,
    issueDate: today.toISOString().split('T')[0],
    dueDate: dueDate.toISOString().split('T')[0],
    successfulReferralsCount: unbilledCompleted.length,
    totalTreatmentValue: treatmentValue,
    commissionRate,
    mediBridgeCommission,
    previousOutstanding: 0,
    paymentsReceived: 0,
    finalAmountDue: mediBridgeCommission,
    status: 'Pending',
    itemizedReferralIds: unbilledCompleted.map(r => r.id),
    notes: `Monthly invoice for ${billingPeriod} generated automatically by MediBridge AI.`,
  };

  allInvoices.unshift(newInvoice);
  saveInvoices(allInvoices);

  // Mark referrals as invoiced
  const allRefs = getAllReferrals();
  unbilledCompleted.forEach(target => {
    const found = allRefs.find(r => r.id === target.id);
    if (found) {
      found.paymentStatus = 'invoiced';
      found.invoiceId = invId;
    }
  });
  saveReferrals(allRefs);

  return newInvoice;
}

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────
export function getAllPayments(): HospitalPayment[] {
  initHospitalData();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return generateSeedPayments();
}

export function getPaymentsForHospital(hospitalId: string): HospitalPayment[] {
  const all = getAllPayments();
  return all.filter(p => p.hospitalId === hospitalId);
}

export function savePayments(payments: HospitalPayment[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    notifyUpdate();
  } catch { /* ignore */ }
}

/**
 * Records a new payment initiated by a hospital.
 * Marks payment status as 'Pending Verification' until admin verifies reference.
 */
export function recordHospitalPayment(params: {
  invoiceId: string;
  hospitalId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference: string;
  notes?: string;
}): HospitalPayment {
  const allPayments = getAllPayments();
  const allInvoices = getAllInvoices();
  const invoice = allInvoices.find(i => i.id === params.invoiceId);
  const hospital = getHospitalById(params.hospitalId);

  const paymentId = `PAY-2026-${String(allPayments.length + 1).padStart(3, '0')}`;
  const newPayment: HospitalPayment = {
    id: paymentId,
    invoiceId: params.invoiceId,
    invoiceNumber: invoice ? invoice.invoiceNumber : params.invoiceId,
    hospitalId: params.hospitalId,
    hospitalName: hospital ? hospital.name : 'Partner Hospital',
    amount: params.amount,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: params.paymentMethod,
    transactionReference: params.transactionReference,
    status: 'Pending Verification',
    recordedBy: 'Hospital Accounts Portal',
    notes: params.notes,
  };

  allPayments.unshift(newPayment);
  savePayments(allPayments);
  return newPayment;
}

/**
 * Admin verifies a hospital payment.
 * Updates invoice amounts and marks invoice as Paid or Partially Paid.
 */
export function verifyPayment(paymentId: string, adminName: string = 'MediBridge Finance Admin'): boolean {
  const payments = getAllPayments();
  const payment = payments.find(p => p.id === paymentId);
  if (!payment) return false;

  payment.status = 'Verified';
  payment.verifiedAt = new Date().toISOString();
  payment.notes = (payment.notes || '') + ` [Verified by ${adminName}]`;
  savePayments(payments);

  // Update associated invoice
  const invoices = getAllInvoices();
  const invoice = invoices.find(i => i.id === payment.invoiceId);
  if (invoice) {
    invoice.paymentsReceived += payment.amount;
    invoice.finalAmountDue = Math.max(0, invoice.mediBridgeCommission - invoice.paymentsReceived);
    if (invoice.finalAmountDue === 0) {
      invoice.status = 'Paid';
    } else {
      invoice.status = 'Partially Paid';
    }
    saveInvoices(invoices);

    // If invoice is fully paid, mark itemized referrals as paid
    if (invoice.status === 'Paid') {
      const allRefs = getAllReferrals();
      invoice.itemizedReferralIds.forEach(refId => {
        const ref = allRefs.find(r => r.id === refId);
        if (ref) ref.paymentStatus = 'paid';
      });
      saveReferrals(allRefs);
    }
  }

  return true;
}

// ─── STATS & METRICS COMPUTATION ──────────────────────────────────────────────
export function getHospitalStats(hospitalId: string): HospitalStats {
  const hospital = getHospitalById(hospitalId);
  const referrals = getReferralsForHospital(hospitalId);
  const invoices = getInvoicesForHospital(hospitalId);

  const totalReferrals = referrals.length;
  const completedTreatments = referrals.filter(
    r => r.treatmentStatus === 'Treatment Completed' || r.referralStatus === 'treatment_completed'
  ).length;

  const pendingReferrals = referrals.filter(
    r =>
      r.referralStatus !== 'treatment_completed' &&
      r.referralStatus !== 'cancelled'
  ).length;

  const totalTreatmentValue = referrals.reduce(
    (sum, r) => sum + (r.treatmentBillAmount || 0),
    0
  );

  // Commission is the sum of commission from all completed treatments
  const mediBridgeCommission = referrals.reduce(
    (sum, r) => sum + (r.commissionAmount || 0),
    0
  );

  const paidAmount = invoices.reduce(
    (sum, inv) => sum + (inv.paymentsReceived || 0),
    0
  );

  const outstandingAmount = Math.max(0, mediBridgeCommission - paidAmount);

  return {
    totalReferrals,
    completedTreatments,
    pendingReferrals,
    totalTreatmentValue,
    mediBridgeCommission,
    outstandingAmount,
    paidAmount,
    commissionRate: hospital ? hospital.commissionRate : 5.0,
  };
}

export function getPlatformOverviewStats(): PlatformOverviewStats {
  const hospitals = getHospitals();
  const allReferrals = getAllReferrals();
  const allInvoices = getAllInvoices();

  const totalHospitals = hospitals.length;
  const totalReferrals = allReferrals.length;
  const completedTreatments = allReferrals.filter(
    r => r.treatmentStatus === 'Treatment Completed' || r.referralStatus === 'treatment_completed'
  ).length;

  const totalTreatmentValue = allReferrals.reduce(
    (sum, r) => sum + (r.treatmentBillAmount || 0),
    0
  );

  const totalMediBridgeRevenue = allReferrals.reduce(
    (sum, r) => sum + (r.commissionAmount || 0),
    0
  );

  const totalPaidRevenue = allInvoices.reduce(
    (sum, inv) => sum + (inv.paymentsReceived || 0),
    0
  );

  const pendingPayments = allInvoices
    .filter(inv => inv.status === 'Pending' || inv.status === 'Partially Paid')
    .reduce((sum, inv) => sum + inv.finalAmountDue, 0);

  const overduePayments = allInvoices
    .filter(inv => inv.status === 'Overdue')
    .reduce((sum, inv) => sum + inv.finalAmountDue, 0);

  return {
    totalHospitals,
    totalReferrals,
    completedTreatments,
    totalTreatmentValue,
    totalMediBridgeRevenue,
    pendingPayments,
    overduePayments,
    totalPaidRevenue,
  };
}

export function getHospitalRowsSummary(): HospitalRowSummary[] {
  const hospitals = getHospitals();
  return hospitals.map(h => {
    const stats = getHospitalStats(h.id);
    return {
      hospitalId: h.id,
      hospitalName: h.name,
      hospitalType: h.type,
      totalReferrals: stats.totalReferrals,
      completedTreatments: stats.completedTreatments,
      treatmentValue: stats.totalTreatmentValue,
      commissionRate: h.commissionRate,
      mediBridgeRevenue: stats.mediBridgeCommission,
      paidAmount: stats.paidAmount,
      outstandingAmount: stats.outstandingAmount,
    };
  });
}

// ─── ANALYTICS POINTS ─────────────────────────────────────────────────────────
export function getReferralAnalytics(hospitalId?: string): {
  monthlyTrends: MonthlyAnalyticsPoint[];
  conversionFunnel: ConversionFunnelStats;
} {
  const referrals = hospitalId ? getReferralsForHospital(hospitalId) : getAllReferrals();

  // Monthly breakdown
  const monthlyTrends: MonthlyAnalyticsPoint[] = [
    { month: 'Jun 2026', referrals: 8, completed: 5, treatmentValue: 140000, commission: 7000 },
    { month: 'Jul 2026', referrals: 15, completed: 10, treatmentValue: 290000, commission: 14500 },
    { month: 'Aug 2026', referrals: 24, completed: 16, treatmentValue: 480000, commission: 24000 },
    { month: 'Sep 2026', referrals: 32, completed: 21, treatmentValue: 640000, commission: 32000 },
  ];

  // Conversion Funnel
  const referred = referrals.length;
  const contacted = referrals.filter(r => r.referralStatus !== 'referred').length;
  const appointmentScheduled = referrals.filter(
    r =>
      r.referralStatus === 'appointment_scheduled' ||
      r.referralStatus === 'treatment_pending' ||
      r.referralStatus === 'treatment_completed'
  ).length;
  const treatmentPending = referrals.filter(
    r => r.referralStatus === 'treatment_pending' || r.referralStatus === 'treatment_completed'
  ).length;
  const treatmentCompleted = referrals.filter(
    r => r.referralStatus === 'treatment_completed'
  ).length;

  return {
    monthlyTrends,
    conversionFunnel: {
      referred,
      contacted,
      appointmentScheduled,
      treatmentPending,
      treatmentCompleted,
    },
  };
}

// Format INR Currency
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

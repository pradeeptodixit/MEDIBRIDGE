/**
 * MediBridge AI — Hospital Partner & Referral Commission Types
 *
 * Models the complete hospital B2B loop:
 * Referral Attribution -> Hospital Intake -> Appointment -> Treatment Completed ->
 * Bill Amount Entry -> Commission Calculation -> Monthly Invoicing -> Payment Tracking
 */

export type HospitalType =
  | 'district_hospital'
  | 'medical_college'
  | 'private_multispecialty'
  | 'chc'
  | 'specialty_centre';

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  upiId?: string;
}

export interface HospitalPartner {
  id: string; // e.g. 'dh-sitapur', 'hosp-apex'
  name: string;
  type: HospitalType;
  district: string;
  state: string;
  address: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  commissionRate: number; // e.g. 5 for 5%, configurable per hospital
  bankDetails: BankDetails;
  activeStatus: 'active' | 'inactive' | 'pending_verification';
  joinedDate: string;
}

export type HospitalReferralStatus =
  | 'referred'
  | 'contacted'
  | 'appointment_scheduled'
  | 'treatment_pending'
  | 'treatment_completed'
  | 'cancelled';

export type TreatmentStatus =
  | 'Awaiting Consultation'
  | 'In Treatment'
  | 'Treatment Completed'
  | 'Discharged'
  | 'Cancelled';

export type ReferralPaymentStatus =
  | 'unbilled'
  | 'invoiced'
  | 'paid'
  | 'pending_payment';

export interface HospitalReferral {
  id: string; // Unique referral attribution code, e.g. 'MB-REF-000124'
  patientId: string; // Internal patient ID
  patientAlias: string; // Privacy protected, e.g. 'Patient #042 (R. S***a)'
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  hospitalId: string;
  hospitalName: string;
  referralDate: string; // ISO date string
  serviceRequested: string; // e.g. 'Cardiology Evaluation', 'Orthopedic Surgery'
  urgency: 'RED' | 'YELLOW' | 'GREEN';
  symptomsSummary: string;

  // Status Lifecycle
  referralStatus: HospitalReferralStatus;
  treatmentStatus: TreatmentStatus;

  // Financials & Commission
  treatmentBillAmount: number; // Entered by hospital upon completion
  commissionRate: number; // Inherited from hospital agreement at time of referral
  commissionAmount: number; // Calculated: billAmount * (commissionRate / 100)
  paymentStatus: ReferralPaymentStatus;
  invoiceId?: string;

  // Timestamps
  appointmentDate?: string;
  treatmentCompletedDate?: string;
  notes?: string;

  // Attribution Data
  attributionProof: {
    sourceTriageSessionId: string;
    triageTimestamp: string;
    originLocation?: string;
    deterministicUrgency: 'RED' | 'YELLOW' | 'GREEN';
  };
}

export type InvoiceStatus = 'Pending' | 'Partially Paid' | 'Paid' | 'Overdue';

export interface HospitalInvoice {
  id: string; // e.g. 'INV-2026-09-001'
  invoiceNumber: string;
  hospitalId: string;
  hospitalName: string;
  billingPeriod: string; // e.g. 'September 2026'
  issueDate: string;
  dueDate: string;

  // Quantities & Calculations
  successfulReferralsCount: number;
  totalTreatmentValue: number;
  commissionRate: number; // Weighted or prevailing %
  mediBridgeCommission: number;
  previousOutstanding: number;
  paymentsReceived: number;
  finalAmountDue: number;

  status: InvoiceStatus;
  itemizedReferralIds: string[];
  notes?: string;
}

export type PaymentMethod =
  | 'UPI'
  | 'Bank Transfer / NEFT / RTGS'
  | 'Razorpay'
  | 'Direct Debit';

export type PaymentStatus = 'Verified' | 'Pending Verification' | 'Failed';

export interface HospitalPayment {
  id: string; // e.g. 'PAY-2026-001'
  invoiceId: string;
  invoiceNumber: string;
  hospitalId: string;
  hospitalName: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  transactionReference: string; // e.g. UTR / payment ID
  status: PaymentStatus;
  recordedBy: string;
  verifiedAt?: string;
  notes?: string;
}

export interface HospitalStats {
  totalReferrals: number;
  completedTreatments: number;
  pendingReferrals: number;
  totalTreatmentValue: number;
  mediBridgeCommission: number;
  outstandingAmount: number;
  paidAmount: number;
  commissionRate: number;
}

export interface PlatformOverviewStats {
  totalHospitals: number;
  totalReferrals: number;
  completedTreatments: number;
  totalTreatmentValue: number;
  totalMediBridgeRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  totalPaidRevenue: number;
}

export interface HospitalRowSummary {
  hospitalId: string;
  hospitalName: string;
  hospitalType: HospitalType;
  totalReferrals: number;
  completedTreatments: number;
  treatmentValue: number;
  commissionRate: number;
  mediBridgeRevenue: number;
  paidAmount: number;
  outstandingAmount: number;
}

export interface MonthlyAnalyticsPoint {
  month: string;
  referrals: number;
  completed: number;
  treatmentValue: number;
  commission: number;
}

export interface ConversionFunnelStats {
  referred: number;
  contacted: number;
  appointmentScheduled: number;
  treatmentPending: number;
  treatmentCompleted: number;
}

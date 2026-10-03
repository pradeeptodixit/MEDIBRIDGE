// Re-export Core Referral & Facility Types
export * from './referral';

// Assessment & AI Types
export type UrgencyLevel = 'GREEN' | 'YELLOW' | 'RED';
export type Language = 'en' | 'hi';
export type InformationCompleteness = 'high' | 'moderate' | 'limited';
export type CareFor = 'myself' | 'parent' | 'child' | 'someone_else';
export type AISource = 'groq' | 'fallback';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface FollowUpQuestion {
  id: string;
  question: string;
  questionHi: string;
  answer?: string;
}

export interface AIResponse {
  urgencyLevel: UrgencyLevel;
  informationCompleteness: InformationCompleteness;

  // Summary
  summary: string;
  summaryHi: string;

  // Explainable AI — why this recommendation?
  reasoningFactors: string[];
  reasoningFactorsHi: string[];

  // Next steps (primary)
  nextSteps: string[];
  nextStepsHi: string[];

  // Backward compat aliases (same data)
  immediateActions: string[];
  immediateActionsHi: string[];

  // Warning signs
  warningSigns: string[];
  warningSignsHi: string[];

  // Backward compat aliases
  warningSignsToWatch: string[];
  warningSignsToWatchHi: string[];

  // Recommended action
  recommendedNextStep: string;
  recommendedNextStepHi: string;

  // Doctor-Ready Summary (AI-generated)
  doctorSummary: string;
  doctorSummaryHi: string;

  // Follow-up questions (AI-generated)
  followUpQuestions: FollowUpQuestion[];

  // Disclaimer
  disclaimer: string;
}

export interface AssessmentSession {
  id: string;
  patientName: string;
  age: string;
  gender: string;
  careFor: CareFor;
  careAccessContext?: string; // At home, Sub-centre, PHC, Other
  symptoms: string;
  language: Language;
  messages: Message[];
  followUpAnswers: FollowUpQuestion[];
  aiResponse?: AIResponse;
  aiSource?: AISource;       // 'groq' | 'fallback' — never hide this from user
  aiFallbackReason?: string; // Why fallback was used (if applicable)
  referralId?: string;       // Linked closed-loop referral ID if generated
  familyMemberId?: string;   // Linked family circle member ID
  startTime: Date;
  endTime?: Date;
}

export interface HealthReport {
  id: string;
  familyMemberId?: string;
  patientName: string;
  age: string;
  gender: string;
  careFor: CareFor;
  careAccessContext?: string;
  symptoms: string;
  followUpAnswers: FollowUpQuestion[];
  urgencyLevel: UrgencyLevel;
  informationCompleteness: InformationCompleteness;
  summary: string;
  reasoningFactors: string[];
  nextSteps: string[];
  immediateActions: string[];
  warningSigns: string[];
  warningSignsToWatch: string[];
  recommendedNextStep: string;
  doctorSummary: string;
  aiSource: AISource;          // 'groq' | 'fallback'
  aiFallbackReason?: string;
  referralId?: string;
  timestamp: Date;
}

// Health Timeline / Care Journey
export interface HealthTimelineEntry {
  id: string;
  date: Date;
  symptoms: string;
  urgencyLevel: UrgencyLevel;
  summary: string;
  patientName: string;
  careFor: CareFor;
  aiSource?: AISource;
  referralId?: string;
  careAccessContext?: string;
}

// Resource Types
export interface HealthGuide {
  id: string;
  title: string;
  titleHi: string;
  category: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  descriptionHi: string;
  steps: string[];
  stepsHi: string[];
  warnings: string[];
  warningsHi: string[];
  tags: string[];
}

// Care Navigation
export interface CareFacility {
  id: string;
  type: 'government' | 'clinic' | 'teleconsult' | 'emergency';
  name: string;
  nameHi: string;
  costCategory: 'free' | 'low' | 'moderate' | 'high';
  costRange?: string;
  costRangeHi?: string;
  distance?: string;
  isOpen?: boolean;
  phone?: string;
  isDemoData: true; // Always marked as demo
}

// Demo Case
export interface DemoCase {
  id: string;
  label: string;
  labelHi: string;
  icon: string;
  color: string;
  symptoms: string;
  patientName: string;
  age: string;
  gender: string;
  expectedOutcome: UrgencyLevel;
  scenario: string;
}

// Toast
export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

// Accessibility
export interface AccessibilitySettings {
  largeText: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

// ─── Government Schemes Types ──────────────────────────────────────────────────
export type SchemeCategory =
  | 'insurance'
  | 'maternal'
  | 'child'
  | 'nutrition'
  | 'elderly'
  | 'disability'
  | 'general';

export interface GovernmentScheme {
  id: string;
  name: string;
  nameHi: string;
  ministry: string;
  category: SchemeCategory;
  description: string;
  descriptionHi: string;
  benefit: string;
  benefitHi: string;
  coverageAmount?: string;
  eligibility: {
    minAge?: number;
    maxAge?: number;
    gender?: 'male' | 'female' | 'any';
    incomeCategory?: Array<'BPL' | 'APL' | 'EWS' | 'middle'>;
    conditions?: string[];
    pregnancyRequired?: boolean;
    states?: string[];
  };
  whyRecommended?: string;
  whyRecommendedHi?: string;
  applicationSteps: string[];
  applicationStepsHi: string[];
  documentsRequired?: string[];
  documentsRequiredHi?: string[];
  helplineNumber?: string;
  website?: string;
  icon: string;
  color: string;
}

export interface SchemeEligibilityProfile {
  age: number;
  gender: string;
  state: string;
  incomeCategory: 'BPL' | 'APL' | 'EWS' | 'middle';
  isPregnant?: boolean;
  hasChildUnder5?: boolean;
  chronicConditions?: string[];
}

export interface SchemeMatchResult {
  scheme: GovernmentScheme;
  matchScore: number; // 0–100
  matchReasons: string[];
  matchReasonsHi: string[];
}

// ─── Village Health Intelligence Network (VHIN) Types ─────────────────────────
export type VillageRiskLevel = 'STABLE' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type SanitationType = 'open' | 'basic' | 'improved';
export type WaterSourceType = 'river' | 'well' | 'tap' | 'borewell' | 'tanker';
export type NutritionStatus = 'normal' | 'mild_mam' | 'moderate_sam' | 'severe_sam';

export interface HouseholdMember {
  id: string;
  name: string;
  age: number;
  gender: string;
  symptoms: string;
  urgencyLevel?: UrgencyLevel;
  isPregnant?: boolean;
  trimester?: 1 | 2 | 3;
  nutritionStatus?: NutritionStatus;
  vaccinationUpToDate?: boolean;
  chronicConditions?: string[];
  riskScore: number; // 0–100
  followUpRequired: boolean;
  followUpStatus?: 'pending' | 'visited' | 'referred';
}

export interface HouseholdSurvey {
  id: string;
  villageId: string;
  householdHead: string;
  address: string;
  surveyedAt: string;
  surveyedBy: string; // ASHA Worker
  members: HouseholdMember[];
  waterSource: WaterSourceType;
  sanitationType: SanitationType;
  householdRiskScore: number; // 0–100
  recommendations: string[];
  synced: boolean;
}

export interface VillageProfile {
  id: string;
  name: string;
  district: string;
  state: string;
  population: number;
  households: number;
  ashWorkerName: string;
  ashWorkerPhone: string;
  surveysCompleted: number;
  lastSurveyDate?: string;
  healthScore: number; // 0–100
  riskLevel: VillageRiskLevel;
  bhrsScore: number; // 0–100 Bharat Health Readiness Score
  pregnantWomen: number;
  childrenUnder5: number;
  vaccinationCoverage: number; // %
  commonSymptoms: Array<{ symptom: string; count: number; trend: 'up' | 'down' | 'stable' }>;
  highRiskCount: number;
  pendingFollowUps: number;
  surveys: HouseholdSurvey[];
}

// ─── Bharat Health Readiness Score (BHRS) Types ───────────────────────────────
export interface BHRSResult {
  score: number; // 0–100
  status: 'Healthy' | 'Moderate' | 'Vulnerable' | 'Critical';
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  breakdown: {
    accessibility: number; // /25
    diseaseRiskControl: number; // /25
    vaccinationCoverage: number; // /20
    emergencyPreparedness: number; // /15
    maternalHealth: number; // /15
  };
  recommendations: string[];
  recommendationsHi: string[];
}

export interface ImpactDashboardData {
  totalAssessments: number;
  highRiskCases: number;
  emergencyCases: number;
  villagesCovered: number;
  schemesMatched: number;
  citizensHelped: number;
  avgBhrsScore: number;
  recentAlerts: Array<{
    id: string;
    type: 'outbreak' | 'emergency' | 'milestone' | 'scheme';
    title: string;
    titleHi: string;
    location: string;
    timestamp: string;
    severity: 'info' | 'warning' | 'critical' | 'success';
  }>;
}

// ─── Sentinel Intelligence Types ──────────────────────────────────────────────
export type SentinelSeverity = 'WATCH' | 'HIGH' | 'CRITICAL';
export type SentinelSource = 'village_trend' | 'referral_bottleneck' | 'facility_load' | 'patient_risk';

export interface EarlyWarningAlert {
  id: string;
  source: SentinelSource;
  villageId?: string;
  villageName?: string;
  severity: SentinelSeverity;
  title: string;           // e.g. "Fever-like symptoms increasing"
  description: string;     // e.g. "14 this week — 40% above baseline"
  evidence: string[];      // explainable bullet points
  metric: string;          // symptom/signal name
  currentValue: number;    // this period count
  baselineValue: number;   // expected baseline
  changePercent: number;   // % change
  recommendedAction: string;
  recommendedActionHi?: string;
  assignedRole: 'asha' | 'phc' | 'district';
  createdAt: string;       // ISO
  isDemoData: boolean;
}

export interface HealthTrendPoint {
  label: string;   // e.g. "Week 1"
  value: number;
  isBaseline?: boolean;
}

export interface VillageHealthTrend {
  villageId: string;
  villageName: string;
  symptom: string;
  currentCount: number;
  baselineCount: number;
  changePercent: number;
  trendDirection: 'up' | 'down' | 'stable';
  severity: SentinelSeverity | 'STABLE';
  dataPoints: HealthTrendPoint[];
  minEvidenceThreshold: number;  // minimum count to generate alert
  hasMinimumEvidence: boolean;   // true only if currentCount >= threshold
  isDemoData: boolean;
}

// ─── Facility Matching Types ───────────────────────────────────────────────────
export interface FacilityCapabilityScore {
  urgencyFit: number;          // 0-25
  capabilityMatch: number;     // 0-25
  diagnosticAvailability: number; // 0-20
  emergencyCapability: number; // 0-15
  distanceScore: number;       // 0-10
  loadScore: number;           // 0-5 (lower load = higher score)
  total: number;               // 0-100
}

export interface FacilityRecommendation {
  facilityId: string;
  facilityName: string;
  facilityType: 'sub_centre' | 'phc' | 'chc' | 'district_hospital' | 'specialty';
  score: FacilityCapabilityScore;
  distanceKm?: number;
  matchingCapabilities: string[];  // ✓ reasons
  missingCapabilities: string[];   // ✗ gaps
  reasons: string[];               // explainable why recommended
  urgencyFitLabel: string;         // e.g. "Appropriate for YELLOW urgency"
  isDemoData: true;
}

// ─── Command Center Types ──────────────────────────────────────────────────────
export type CommandActionSeverity = 'info' | 'warning' | 'high' | 'critical';
export type CommandActionActor = 'asha' | 'phc' | 'district' | 'system';
export type DataProvenance = 'patient_entered' | 'prototype_synthetic' | 'rule_based' | 'ai_assisted' | 'safety_fallback' | 'external_map';

export interface CommandCenterAction {
  id: string;
  severity: CommandActionSeverity;
  title: string;
  description: string;
  location?: string;
  recommendedAction: string;
  actor: CommandActionActor;
  ctaLabel: string;
  ctaPath: string;
  provenance: DataProvenance;
  createdAt: string;
}

export interface CommandCenterMetric {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  severity?: 'ok' | 'warning' | 'critical';
  provenance: DataProvenance;
  description: string;
}

// ─── Family & Longitudinal Health Types ───────────────────────────────────────
export * from './family';

// ─── Hospital Partner & Commission Types ───────────────────────────────────────
export * from './hospital';



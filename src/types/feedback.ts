/**
 * Hospital Experience Feedback — Type Definitions
 * MediBridge AI — Patient Satisfaction / Service Feedback
 *
 * IMPORTANT: This measures PATIENT EXPERIENCE, not clinical quality.
 */

export type WaitTimeRating = 'short' | 'acceptable' | 'long';

export interface HospitalFeedback {
  /** Unique feedback record ID */
  id: string;
  /** The referral this feedback is associated with */
  referralId: string;
  /** Patient/user identifier (from referral.patientId) */
  patientId: string;
  /** Facility this feedback is for (from referral.destinationFacilityId) */
  facilityId: string;
  /** Facility display name */
  facilityName: string;
  /** 1–5 overall experience rating */
  overallRating: 1 | 2 | 3 | 4 | 5;
  /** Perceived waiting time */
  waitTime: WaitTimeRating;
  /** 1–5 communication satisfaction */
  communicationRating: 1 | 2 | 3 | 4 | 5;
  /** 1–5 cleanliness satisfaction */
  cleanlinessRating: 1 | 2 | 3 | 4 | 5;
  /** 1–5 care experience satisfaction (NOT clinical quality) */
  careExperienceRating: 1 | 2 | 3 | 4 | 5;
  /** Optional free-text comment */
  comment?: string;
  /** Whether patient would recommend this facility */
  wouldRecommend: boolean;
  /** ISO timestamp of submission */
  submittedAt: string;
  /** Always true — marks prototype/demo data */
  isPrototypeData: boolean;
}

/** Aggregated statistics for a facility's patient experience */
export interface FacilityFeedbackStats {
  facilityId: string;
  facilityName: string;
  totalResponses: number;
  averageOverallRating: number;
  averageCommunicationRating: number;
  averageCleanlinessRating: number;
  averageCareExperienceRating: number;
  recommendationPercentage: number;
  waitTimeDistribution: {
    short: number;
    acceptable: number;
    long: number;
  };
}

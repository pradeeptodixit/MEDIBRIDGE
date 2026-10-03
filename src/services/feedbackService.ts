/**
 * Feedback Service — Hospital Experience Feedback
 * MediBridge AI
 *
 * Centralises all localStorage operations for patient experience feedback.
 * Follows the same pattern as referralService.ts.
 */

import type { HospitalFeedback, FacilityFeedbackStats, WaitTimeRating } from '../types/feedback';

const FEEDBACK_STORAGE_KEY = 'medibridge_feedback';
const FEEDBACK_COUNTER_KEY = 'mb_feedback_counter';

// ─── ID Generator ─────────────────────────────────────────────────────────────
function getNextFeedbackId(): string {
  let counter = 1;
  try {
    const raw = localStorage.getItem(FEEDBACK_COUNTER_KEY);
    if (raw) {
      counter = parseInt(raw, 10) + 1;
    }
  } catch {
    counter = 1;
  }
  localStorage.setItem(FEEDBACK_COUNTER_KEY, String(counter));
  return `FB-2026-${String(counter).padStart(4, '0')}`;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function getAllFeedback(): HospitalFeedback[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HospitalFeedback[];
  } catch {
    return [];
  }
}

function saveFeedback(feedbackList: HospitalFeedback[]): void {
  try {
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedbackList));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('medibridge:feedback_updated', { detail: feedbackList }));
    }
  } catch {
    // Silent fail for storage quota issues
  }
}

/** Submit new feedback. Returns the saved record. */
export function submitFeedback(params: Omit<HospitalFeedback, 'id' | 'submittedAt' | 'isPrototypeData'>): HospitalFeedback {
  const record: HospitalFeedback = {
    ...params,
    id: getNextFeedbackId(),
    submittedAt: new Date().toISOString(),
    isPrototypeData: true,
  };

  const existing = getAllFeedback();
  saveFeedback([record, ...existing]);
  return record;
}

/** Check whether feedback has already been submitted for a given referralId. */
export function hasFeedbackForReferral(referralId: string): boolean {
  return getAllFeedback().some(f => f.referralId === referralId);
}

/** Get feedback record for a specific referral (if it exists). */
export function getFeedbackForReferral(referralId: string): HospitalFeedback | undefined {
  return getAllFeedback().find(f => f.referralId === referralId);
}

/** Get all feedback records for a specific facility. */
export function getFeedbackForFacility(facilityId: string): HospitalFeedback[] {
  return getAllFeedback().filter(f => f.facilityId === facilityId);
}

// ─── Aggregation ──────────────────────────────────────────────────────────────

/** Calculate aggregated patient experience statistics for a facility. */
export function getFacilityFeedbackStats(
  facilityId: string,
  facilityName: string
): FacilityFeedbackStats {
  const records = getFeedbackForFacility(facilityId);

  if (records.length === 0) {
    return {
      facilityId,
      facilityName,
      totalResponses: 0,
      averageOverallRating: 0,
      averageCommunicationRating: 0,
      averageCleanlinessRating: 0,
      averageCareExperienceRating: 0,
      recommendationPercentage: 0,
      waitTimeDistribution: { short: 0, acceptable: 0, long: 0 },
    };
  }

  const avg = (vals: number[]): number => {
    if (vals.length === 0) return 0;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  };

  const waitTimeDist: Record<WaitTimeRating, number> = { short: 0, acceptable: 0, long: 0 };
  records.forEach(r => {
    waitTimeDist[r.waitTime] = (waitTimeDist[r.waitTime] || 0) + 1;
  });

  const recommendCount = records.filter(r => r.wouldRecommend).length;

  return {
    facilityId,
    facilityName,
    totalResponses: records.length,
    averageOverallRating: avg(records.map(r => r.overallRating)),
    averageCommunicationRating: avg(records.map(r => r.communicationRating)),
    averageCleanlinessRating: avg(records.map(r => r.cleanlinessRating)),
    averageCareExperienceRating: avg(records.map(r => r.careExperienceRating)),
    recommendationPercentage: Math.round((recommendCount / records.length) * 100),
    waitTimeDistribution: waitTimeDist,
  };
}

/** Get stats for all unique facilities that have at least one feedback record. */
export function getAllFacilityFeedbackStats(): FacilityFeedbackStats[] {
  const all = getAllFeedback();
  const seen = new Map<string, string>();
  all.forEach(f => seen.set(f.facilityId, f.facilityName));
  return Array.from(seen.entries()).map(([id, name]) => getFacilityFeedbackStats(id, name));
}

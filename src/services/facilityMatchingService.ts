/**
 * Scores nearby public healthcare facilities based on patient urgency,
 * required services, distance, and current facility load.
 * Uses prototype facility data for demonstration.
 */

import type {
  FacilityRecommendation,
  FacilityCapabilityScore,
} from '../types';
import type { FacilityCapability } from '../types/referral';
import type { FacilityLoadResult } from './sentinelService';
import type { UrgencyLevel } from '../types';

// Prototype facility records for demonstration

export const PROTOTYPE_FACILITIES: FacilityCapability[] = [
  {
    facilityId: 'phc-rampur',
    facilityName: 'PHC Rampur Kalan',
    facilityType: 'phc',
    district: 'Sitapur',
    state: 'Uttar Pradesh',
    capabilities: {
      generalOPD: 'available',
      doctor: 'available',
      diagnostics: 'limited',   // basic CBC, RDT
      pharmacy: 'available',
      specialist: 'unavailable',
      maternity: 'available',
      emergency: 'limited',
    },
    isDemoData: true,
  },
  {
    facilityId: 'chc-sitapur',
    facilityName: 'CHC Sitapur Block',
    facilityType: 'chc',
    district: 'Sitapur',
    state: 'Uttar Pradesh',
    capabilities: {
      generalOPD: 'available',
      doctor: 'available',
      diagnostics: 'available',  // x-ray, ultrasound, lab
      pharmacy: 'available',
      specialist: 'limited',     // visiting
      maternity: 'available',
      emergency: 'available',
    },
    isDemoData: true,
  },
  {
    facilityId: 'dh-sitapur',
    facilityName: 'Sitapur District Hospital',
    facilityType: 'district_hospital',
    district: 'Sitapur',
    state: 'Uttar Pradesh',
    capabilities: {
      generalOPD: 'available',
      doctor: 'available',
      diagnostics: 'available',
      pharmacy: 'available',
      specialist: 'available',
      maternity: 'available',
      emergency: 'available',
    },
    isDemoData: true,
  },
  {
    facilityId: 'phc-madhavpur',
    facilityName: 'PHC Madhavpur',
    facilityType: 'phc',
    district: 'Barmer',
    state: 'Rajasthan',
    capabilities: {
      generalOPD: 'available',
      doctor: 'available',
      diagnostics: 'limited',
      pharmacy: 'available',
      specialist: 'unavailable',
      maternity: 'limited',
      emergency: 'limited',
    },
    isDemoData: true,
  },
  {
    facilityId: 'chc-barmer',
    facilityName: 'CHC Barmer',
    facilityType: 'chc',
    district: 'Barmer',
    state: 'Rajasthan',
    capabilities: {
      generalOPD: 'available',
      doctor: 'available',
      diagnostics: 'available',
      pharmacy: 'available',
      specialist: 'limited',
      maternity: 'available',
      emergency: 'available',
    },
    isDemoData: true,
  },
  {
    facilityId: 'dh-darbhanga',
    facilityName: 'Darbhanga District Hospital',
    facilityType: 'district_hospital',
    district: 'Darbhanga',
    state: 'Bihar',
    capabilities: {
      generalOPD: 'available',
      doctor: 'available',
      diagnostics: 'available',
      pharmacy: 'available',
      specialist: 'available',
      maternity: 'available',
      emergency: 'available',
    },
    isDemoData: true,
  },
];

// ─── Prototype distance data (synthetic) ─────────────────────────────────────
const FACILITY_DISTANCES_KM: Record<string, number> = {
  'phc-rampur': 2.4,
  'chc-sitapur': 8.1,
  'dh-sitapur': 14.6,
  'phc-madhavpur': 3.2,
  'chc-barmer': 11.5,
  'dh-darbhanga': 19.2,
};

// ─── Scoring Engine ───────────────────────────────────────────────────────────

/**
 * Scores urgency fit — does the facility type match the urgency?
 * GREEN → sub_centre or PHC adequate
 * YELLOW → PHC or CHC recommended
 * RED → CHC or District Hospital required
 */
function scoreUrgencyFit(urgency: UrgencyLevel, facilityType: FacilityCapability['facilityType']): {
  score: number;
  label: string;
} {
  const map: Record<UrgencyLevel, Record<FacilityCapability['facilityType'], number>> = {
    GREEN: { sub_centre: 25, phc: 25, chc: 20, district_hospital: 15, specialty: 10 },
    YELLOW: { sub_centre: 10, phc: 25, chc: 25, district_hospital: 20, specialty: 15 },
    RED: { sub_centre: 0, phc: 5, chc: 20, district_hospital: 25, specialty: 25 },
  };

  const labels: Record<UrgencyLevel, Record<FacilityCapability['facilityType'], string>> = {
    GREEN: {
      sub_centre: 'Appropriate for GREEN urgency',
      phc: 'Appropriate for GREEN urgency',
      chc: 'Adequate for GREEN urgency (may be overkill)',
      district_hospital: 'May be excessive for GREEN urgency',
      specialty: 'Not recommended for GREEN urgency',
    },
    YELLOW: {
      sub_centre: 'Insufficient for YELLOW urgency',
      phc: 'Appropriate for YELLOW urgency',
      chc: 'Appropriate for YELLOW urgency',
      district_hospital: 'Adequate for YELLOW urgency',
      specialty: 'Consider lower-level facility first',
    },
    RED: {
      sub_centre: 'Insufficient for RED emergency',
      phc: 'Insufficient for RED emergency',
      chc: 'Adequate for RED emergency',
      district_hospital: 'Appropriate for RED emergency',
      specialty: 'Appropriate for RED emergency',
    },
  };

  return {
    score: map[urgency][facilityType],
    label: labels[urgency][facilityType],
  };
}

/**
 * Scores a facility against urgency, requirements, and current load.
 * Returns full explainable scoring breakdown.
 */
export function scoreFacility(
  facility: FacilityCapability,
  urgency: UrgencyLevel,
  needsMaternity: boolean,
  needsSpecialist: boolean,
  facilityLoads: FacilityLoadResult[]
): { score: FacilityCapabilityScore; reasons: string[]; matchingCaps: string[]; missingCaps: string[] } {
  const matching: string[] = [];
  const missing: string[] = [];
  const reasons: string[] = [];

  // 1. Urgency fit (0-25)
  const urgencyResult = scoreUrgencyFit(urgency, facility.facilityType);
  if (urgencyResult.score >= 20) matching.push('Urgency-appropriate facility');
  else if (urgencyResult.score < 10) missing.push('Not recommended for this urgency level');
  reasons.push(urgencyResult.label);

  // 2. Capability match (0-25)
  let capabilityMatch = 0;
  if (facility.capabilities.generalOPD === 'available') {
    capabilityMatch += 10;
    matching.push('General OPD available');
  } else {
    missing.push('General OPD limited or unavailable');
  }
  if (facility.capabilities.doctor === 'available') {
    capabilityMatch += 15;
    matching.push('Medical Officer available');
  } else if (facility.capabilities.doctor === 'limited') {
    capabilityMatch += 7;
  } else {
    missing.push('No resident doctor');
  }

  if (needsMaternity) {
    if (facility.capabilities.maternity === 'available') {
      capabilityMatch = Math.min(25, capabilityMatch + 5);
      matching.push('Maternity care available');
    } else {
      missing.push('Maternity care not available');
    }
  }

  if (needsSpecialist) {
    if (facility.capabilities.specialist === 'available') {
      capabilityMatch = Math.min(25, capabilityMatch + 5);
      matching.push('Specialist available');
    } else if (facility.capabilities.specialist === 'limited') {
      capabilityMatch = Math.min(25, capabilityMatch + 2);
    } else {
      missing.push('Specialist not available');
    }
  }

  // 3. Diagnostics (0-20)
  const diagnosticScore = facility.capabilities.diagnostics === 'available' ? 20
    : facility.capabilities.diagnostics === 'limited' ? 10
    : 0;
  if (diagnosticScore === 20) matching.push('Full diagnostic support available');
  else if (diagnosticScore === 10) matching.push('Basic diagnostics available');
  else missing.push('No diagnostic support');

  // 4. Emergency (0-15)
  const emergencyScore = facility.capabilities.emergency === 'available' ? 15
    : facility.capabilities.emergency === 'limited' ? 7
    : 0;
  if (urgency === 'RED' && emergencyScore >= 15) matching.push('Emergency/trauma capability available');
  else if (urgency === 'RED' && emergencyScore < 15) missing.push('Limited emergency capability');

  // 5. Distance (0-10)
  const distKm = FACILITY_DISTANCES_KM[facility.facilityId] ?? 10;
  const distanceScore = distKm <= 3 ? 10 : distKm <= 7 ? 8 : distKm <= 12 ? 5 : distKm <= 20 ? 3 : 1;
  reasons.push(`${distKm.toFixed(1)} km from patient — prototype distance estimate`);

  // 6. Load score (0-5)
  const load = facilityLoads.find(l => l.facilityId === facility.facilityId);
  const loadScore = !load ? 5 : load.loadLevel === 'low' ? 5 : load.loadLevel === 'moderate' ? 3 : 1;
  if (load && load.loadLevel === 'high') missing.push('Currently high case volume');

  const total = urgencyResult.score + capabilityMatch + diagnosticScore + emergencyScore + distanceScore + loadScore;

  return {
    score: {
      urgencyFit: urgencyResult.score,
      capabilityMatch,
      diagnosticAvailability: diagnosticScore,
      emergencyCapability: emergencyScore,
      distanceScore,
      loadScore,
      total: Math.min(100, total),
    },
    reasons,
    matchingCaps: matching,
    missingCaps: missing,
  };
}

/**
 * Main entry point: scores all prototype facilities and returns ranked recommendations.
 * Inputs include urgency, symptom keywords, and current referral load.
 *
 * @returns FacilityRecommendation[] sorted by total score descending
 */
export function recommendFacilities(
  urgency: UrgencyLevel,
  symptoms: string,
  facilityLoads: FacilityLoadResult[] = [],
  limit = 3
): FacilityRecommendation[] {
  const symptomsLower = symptoms.toLowerCase();
  const needsMaternity = /pregnan|antenatal|anc|trimester|maternal|delivery|labour/i.test(symptomsLower);
  const needsSpecialist = urgency === 'RED' || /specialist|cardio|ortho|neuro|pediatric|child/i.test(symptomsLower);

  const scored: FacilityRecommendation[] = PROTOTYPE_FACILITIES.map(facility => {
    const { score, reasons, matchingCaps, missingCaps } = scoreFacility(
      facility,
      urgency,
      needsMaternity,
      needsSpecialist,
      facilityLoads
    );

    const distKm = FACILITY_DISTANCES_KM[facility.facilityId];
    const urgencyResult = scoreUrgencyFit(urgency, facility.facilityType);

    return {
      facilityId: facility.facilityId,
      facilityName: facility.facilityName,
      facilityType: facility.facilityType,
      score,
      distanceKm: distKm,
      matchingCapabilities: matchingCaps,
      missingCapabilities: missingCaps,
      reasons,
      urgencyFitLabel: urgencyResult.label,
      isDemoData: true,
    };
  });

  // Sort by score descending, take top N
  return scored
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, limit);
}

/**
 * Helper: returns the top recommended facility for a given urgency + symptoms.
 */
export function getTopFacilityRecommendation(
  urgency: UrgencyLevel,
  symptoms: string,
  facilityLoads: FacilityLoadResult[] = []
): FacilityRecommendation | null {
  const results = recommendFacilities(urgency, symptoms, facilityLoads, 1);
  return results[0] ?? null;
}

/**
 * Human-readable facility type label.
 */
export function facilityTypeLabel(type: FacilityCapability['facilityType']): string {
  const labels: Record<FacilityCapability['facilityType'], string> = {
    sub_centre: 'Sub-Centre',
    phc: 'Primary Health Centre (PHC)',
    chc: 'Community Health Centre (CHC)',
    district_hospital: 'District Hospital',
    specialty: 'Specialty Hospital',
  };
  return labels[type] ?? type;
}

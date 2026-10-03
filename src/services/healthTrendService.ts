/**
 * Health trend calculation based on weekly symptom counts.
 * Compares current counts against historical baselines using minimum sample
 * thresholds to avoid false alerts on small counts.
 */

import type { VillageHealthTrend, HealthTrendPoint, SentinelSeverity } from '../types';
import type { VillageProfile } from '../types';

// Thresholds for trend detection

/**
 * Minimum absolute count required before any alert is raised.
 * Prevents alerts from 1→2 case changes (100% increase, but tiny sample).
 */
const MIN_EVIDENCE_THRESHOLD = 5;

/**
 * Percentage change thresholds relative to baseline.
 * These are configurable — not medical outbreak criteria.
 */
const TREND_THRESHOLDS = {
  WATCH: 20,    // 20%+ above baseline → WATCH
  HIGH: 40,     // 40%+ above baseline → HIGH
  CRITICAL: 70, // 70%+ above baseline → CRITICAL (still requires verification)
} as const;

/**
 * Per-symptom baseline estimates from village health surveillance patterns.
 * These are prototype synthetic baselines — not real epidemiological data.
 */
const SYMPTOM_BASELINES: Record<string, number> = {
  'Viral Fever': 10,
  'Fever': 10,
  'High Fever with Chills': 8,
  'Malaria-like Fever': 6,
  'Cough & Cold': 8,
  'Seasonal Flu': 9,
  'Watery Diarrhea': 5,
  'Diarrhea': 5,
  'Severe Bodyache': 6,
  'Joint Pain': 6,
  'Skin Infection': 7,
  'Seasonal Allergy': 8,
  'Eye Irritation': 4,
  'Backache': 5,
  'Hypertension monitoring': 10,
  'Mild Acidity': 6,
};

// ─── Core Trend Calculation ───────────────────────────────────────────────────

export interface TrendResult {
  changePercent: number;
  direction: 'up' | 'down' | 'stable';
  severity: SentinelSeverity | 'STABLE';
  hasMinimumEvidence: boolean;
  minEvidenceThreshold: number;
}

/**
 * Calculates trend between current value and baseline.
 * Returns STABLE if below minimum evidence threshold regardless of % change.
 */
export function calculateTrend(
  currentValue: number,
  baselineValue: number,
  minEvidence: number = MIN_EVIDENCE_THRESHOLD
): TrendResult {
  const hasMinimumEvidence = currentValue >= minEvidence && baselineValue >= 1;

  if (!hasMinimumEvidence) {
    return {
      changePercent: 0,
      direction: 'stable',
      severity: 'STABLE',
      hasMinimumEvidence: false,
      minEvidenceThreshold: minEvidence,
    };
  }

  const changePercent = Math.round(((currentValue - baselineValue) / baselineValue) * 100);
  const absChange = Math.abs(changePercent);

  const direction: 'up' | 'down' | 'stable' =
    changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable';

  let severity: SentinelSeverity | 'STABLE' = 'STABLE';
  if (direction === 'up') {
    if (absChange >= TREND_THRESHOLDS.CRITICAL) severity = 'CRITICAL';
    else if (absChange >= TREND_THRESHOLDS.HIGH) severity = 'HIGH';
    else if (absChange >= TREND_THRESHOLDS.WATCH) severity = 'WATCH';
  }

  return {
    changePercent,
    direction,
    severity,
    hasMinimumEvidence: true,
    minEvidenceThreshold: minEvidence,
  };
}

/**
 * Gets the prototype synthetic baseline for a known symptom.
 * Returns a conservative default if not in the map.
 */
export function getSymptomBaseline(symptomName: string): number {
  // Try direct match
  if (SYMPTOM_BASELINES[symptomName] !== undefined) {
    return SYMPTOM_BASELINES[symptomName];
  }
  // Try partial match (case-insensitive)
  const lower = symptomName.toLowerCase();
  for (const [key, val] of Object.entries(SYMPTOM_BASELINES)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return val;
    }
  }
  // Conservative default: no alert without explicit baseline
  return 10;
}

/**
 * Generates health trend analysis for a village.
 * Only raises alerts for symptoms with sufficient evidence.
 */
export function analyzeVillageTrends(village: VillageProfile): VillageHealthTrend[] {
  return village.commonSymptoms.map(symptomEntry => {
    const baseline = getSymptomBaseline(symptomEntry.symptom);
    const trend = calculateTrend(symptomEntry.count, baseline);

    // Synthetic weekly data points for visualization (prototype)
    const dataPoints: HealthTrendPoint[] = [
      { label: 'Week -3', value: Math.round(baseline * 0.9), isBaseline: true },
      { label: 'Week -2', value: Math.round(baseline * 1.0), isBaseline: true },
      { label: 'Week -1', value: Math.round(baseline * 1.05), isBaseline: false },
      { label: 'This Week', value: symptomEntry.count, isBaseline: false },
    ];

    return {
      villageId: village.id,
      villageName: village.name,
      symptom: symptomEntry.symptom,
      currentCount: symptomEntry.count,
      baselineCount: baseline,
      changePercent: trend.changePercent,
      trendDirection: symptomEntry.trend === 'up' ? 'up' : symptomEntry.trend === 'down' ? 'down' : 'stable',
      severity: trend.severity,
      dataPoints,
      minEvidenceThreshold: trend.minEvidenceThreshold,
      hasMinimumEvidence: trend.hasMinimumEvidence,
      isDemoData: true,
    };
  });
}

/**
 * Returns only trends that have crossed alert thresholds.
 * Used by Sentinel to determine which signals to surface.
 */
export function getSignificantTrends(village: VillageProfile): VillageHealthTrend[] {
  const all = analyzeVillageTrends(village);
  return all.filter(t =>
    t.hasMinimumEvidence &&
    t.trendDirection === 'up' &&
    t.severity !== 'STABLE'
  );
}

/**
 * Returns a human-readable description of a trend change.
 * Safe language — never implies disease.
 */
export function describeTrendChange(trend: VillageHealthTrend): string {
  if (!trend.hasMinimumEvidence) {
    return `${trend.currentCount} reported cases — insufficient data for trend analysis`;
  }
  if (trend.changePercent > 0) {
    return `${trend.currentCount} reported this week — ${trend.changePercent}% above baseline (${trend.baselineCount} typical)`;
  }
  if (trend.changePercent < 0) {
    return `${trend.currentCount} reported this week — ${Math.abs(trend.changePercent)}% below baseline (improving)`;
  }
  return `${trend.currentCount} reported this week — consistent with baseline (${trend.baselineCount} typical)`;
}

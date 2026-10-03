/**
 * Sentinel Service
 *
 * Combines village health survey data, referral queues, and facility workloads
 * to flag symptom increases and care bottlenecks for ASHA workers and PHC staff.
 */

import type {
  EarlyWarningAlert,
  SentinelSeverity,
  CommandCenterAction,
  CommandActionSeverity,
} from '../types';
import type { VillageProfile } from '../types';
import type { Referral } from '../types/referral';
import { getSignificantTrends, describeTrendChange } from './healthTrendService';

// Village trend alert helpers
export function generateEarlyWarningAlerts(
  villages: VillageProfile[],
  _referrals: Referral[] = []
): EarlyWarningAlert[] {
  const alerts: EarlyWarningAlert[] = [];

  for (const village of villages) {
    const significantTrends = getSignificantTrends(village);

    for (const trend of significantTrends) {
      // Build explainable evidence bullets
      const evidence: string[] = [
        `${trend.currentCount} symptom reports this week vs. baseline of ${trend.baselineCount}`,
        `${trend.changePercent}% above baseline over observed period`,
        `${village.highRiskCount} high-risk households identified in village`,
      ];

      if (village.pendingFollowUps > 0) {
        evidence.push(`${village.pendingFollowUps} ASHA follow-up visits pending`);
      }
      if (village.riskLevel === 'CRITICAL' || village.riskLevel === 'HIGH') {
        evidence.push(`Village risk tier: ${village.riskLevel}`);
      }

      // Active related referrals from this village
      const villageReferrals = _referrals.filter(
        r => r.originVillageId === village.id && !['completed'].includes(r.status)
      );
      if (villageReferrals.length > 0) {
        evidence.push(`${villageReferrals.length} active referral(s) linked to this village`);
      }

      const severityToAction: Record<SentinelSeverity, { action: string; actor: EarlyWarningAlert['assignedRole'] }> = {
        WATCH: {
          action: 'ASHA worker verification recommended within 72 hours',
          actor: 'asha',
        },
        HIGH: {
          action: 'ASHA household verification + PHC Medical Officer review within 24 hours',
          actor: 'asha',
        },
        CRITICAL: {
          action: 'Immediate PHC escalation + district health administration notification',
          actor: 'phc',
        },
      };

      const actionInfo = severityToAction[trend.severity as SentinelSeverity];

      alerts.push({
        id: `sentinel-${village.id}-${trend.symptom.replace(/\s+/g, '-').toLowerCase()}`,
        source: 'village_trend',
        villageId: village.id,
        villageName: village.name,
        severity: trend.severity as SentinelSeverity,
        title: `${trend.symptom} reports increasing`,
        description: describeTrendChange(trend),
        evidence,
        metric: trend.symptom,
        currentValue: trend.currentCount,
        baselineValue: trend.baselineCount,
        changePercent: trend.changePercent,
        recommendedAction: actionInfo.action,
        recommendedActionHi: undefined,
        assignedRole: actionInfo.actor,
        createdAt: new Date().toISOString(),
        isDemoData: true,
      });
    }
  }

  // Sort by severity: CRITICAL > HIGH > WATCH
  const severityOrder: Record<SentinelSeverity, number> = { CRITICAL: 3, HIGH: 2, WATCH: 1 };
  alerts.sort((a, b) => (severityOrder[b.severity] ?? 0) - (severityOrder[a.severity] ?? 0));

  return alerts;
}

// ─── Referral Bottleneck Analysis ─────────────────────────────────────────────

export interface ReferralBottleneckResult {
  stuckStage: string;
  stuckCount: number;
  description: string;
  severity: CommandActionSeverity;
}

/**
 * Identifies where in the referral pipeline cases are getting stuck.
 * Returns the stage with the most overdue/stalled cases.
 */
export function calculateReferralBottleneck(referrals: Referral[]): ReferralBottleneckResult | null {
  if (referrals.length === 0) return null;

  const stageCounts: Record<string, number> = {};
  for (const r of referrals) {
    if (['completed', 'overdue'].includes(r.status)) continue;
    stageCounts[r.status] = (stageCounts[r.status] ?? 0) + 1;
  }

  let maxStage = '';
  let maxCount = 0;
  for (const [stage, count] of Object.entries(stageCounts)) {
    if (count > maxCount) {
      maxCount = count;
      maxStage = stage;
    }
  }

  if (!maxStage || maxCount === 0) return null;

  const stageLabels: Record<string, string> = {
    created: 'Referral Created (Awaiting Acceptance)',
    accepted: 'Accepted (Awaiting Scheduling)',
    scheduled: 'Scheduled (Awaiting Consultation)',
    consultation: 'Consultation (Awaiting Diagnostics)',
    diagnostic: 'Diagnostics (Awaiting Results)',
    specialist: 'Specialist Escalation',
    follow_up: 'ASHA Follow-Up Pending',
  };

  const severity: CommandActionSeverity =
    maxStage === 'created' && maxCount >= 3 ? 'high'
    : maxStage === 'overdue' ? 'critical'
    : maxCount >= 4 ? 'warning'
    : 'info';

  return {
    stuckStage: stageLabels[maxStage] ?? maxStage,
    stuckCount: maxCount,
    description: `${maxCount} referral(s) stalled at: ${stageLabels[maxStage] ?? maxStage}`,
    severity,
  };
}

// ─── Facility Load Calculation ─────────────────────────────────────────────────

export interface FacilityLoadResult {
  facilityId: string;
  facilityName: string;
  facilityType: string;
  activeReferrals: number;
  overdueReferrals: number;
  loadLevel: 'low' | 'moderate' | 'high';
}

/**
 * Calculates load per facility based on active/overdue referrals.
 * Used by facility matching to factor in current capacity.
 */
export function calculateFacilityLoad(referrals: Referral[]): FacilityLoadResult[] {
  const facilityMap = new Map<string, FacilityLoadResult>();

  for (const r of referrals) {
    const key = r.destinationFacilityId;
    if (!facilityMap.has(key)) {
      facilityMap.set(key, {
        facilityId: r.destinationFacilityId,
        facilityName: r.destinationFacilityName,
        facilityType: r.destinationFacilityType,
        activeReferrals: 0,
        overdueReferrals: 0,
        loadLevel: 'low',
      });
    }
    const entry = facilityMap.get(key)!;
    if (!['completed'].includes(r.status)) entry.activeReferrals++;
    if (r.status === 'overdue') entry.overdueReferrals++;
  }

  return Array.from(facilityMap.values()).map(f => ({
    ...f,
    loadLevel: f.activeReferrals >= 5 ? 'high' : f.activeReferrals >= 3 ? 'moderate' : 'low',
  }));
}

// ─── Command Center Action Queue ───────────────────────────────────────────────

/**
 * Generates the actionable items shown in the Command Center action queue.
 * Combines village alerts, overdue referrals, and facility load concerns.
 */
export function generateCommandCenterActions(
  villages: VillageProfile[],
  referrals: Referral[]
): CommandCenterAction[] {
  const actions: CommandCenterAction[] = [];
  const now = new Date().toISOString();

  // 1. Village early warning alerts → actions
  const sentinelAlerts = generateEarlyWarningAlerts(villages, referrals);
  for (const alert of sentinelAlerts) {
    actions.push({
      id: `action-${alert.id}`,
      severity: alert.severity === 'CRITICAL' ? 'critical' : alert.severity === 'HIGH' ? 'high' : 'warning',
      title: `Village health trend detected`,
      description: `${alert.villageName}: ${alert.title} — ${alert.description}`,
      location: alert.villageName,
      recommendedAction: alert.recommendedAction,
      actor: alert.assignedRole === 'asha' ? 'asha' : 'phc',
      ctaLabel: 'Review Village',
      ctaPath: '/village-health',
      provenance: 'rule_based',
      createdAt: now,
    });
  }

  // 2. Overdue referrals → actions
  const overdue = referrals.filter(r => r.status === 'overdue');
  for (const r of overdue) {
    actions.push({
      id: `action-overdue-${r.id}`,
      severity: 'critical',
      title: `Referral overdue: ${r.id}`,
      description: `${r.patientName} — ${r.reason}`,
      location: r.originVillageName,
      recommendedAction: 'PHC Medical Officer to acknowledge and advance referral immediately',
      actor: 'phc',
      ctaLabel: 'Open PHC Desk',
      ctaPath: '/facility',
      provenance: 'rule_based',
      createdAt: now,
    });
  }

  // 3. High pending follow-ups
  const highPendingVillages = villages.filter(v => v.pendingFollowUps >= 4);
  for (const v of highPendingVillages) {
    actions.push({
      id: `action-followup-${v.id}`,
      severity: 'warning',
      title: `Multiple follow-ups pending`,
      description: `${v.name}: ${v.pendingFollowUps} ASHA follow-up visits overdue`,
      location: v.name,
      recommendedAction: `${v.ashWorkerName} to prioritize pending household visits`,
      actor: 'asha',
      ctaLabel: 'Open ASHA Hub',
      ctaPath: '/village-health',
      provenance: 'rule_based',
      createdAt: now,
    });
  }

  // 4. Referral bottleneck
  const bottleneck = calculateReferralBottleneck(referrals);
  if (bottleneck && bottleneck.stuckCount >= 2) {
    actions.push({
      id: 'action-bottleneck',
      severity: bottleneck.severity,
      title: `Referral pipeline bottleneck`,
      description: bottleneck.description,
      recommendedAction: 'PHC Care Desk to advance stalled referrals',
      actor: 'phc',
      ctaLabel: 'PHC Care Desk',
      ctaPath: '/facility',
      provenance: 'rule_based',
      createdAt: now,
    });
  }

  // Sort by severity
  const sev: Record<string, number> = { critical: 4, high: 3, warning: 2, info: 1 };
  actions.sort((a, b) => (sev[b.severity] ?? 0) - (sev[a.severity] ?? 0));

  return actions;
}

// ─── Village Risk Summary ──────────────────────────────────────────────────────

export interface VillageRiskSummary {
  villageId: string;
  villageName: string;
  district: string;
  state: string;
  riskLevel: VillageProfile['riskLevel'];
  activeReferrals: number;
  overdueReferrals: number;
  highRiskHouseholds: number;
  pendingFollowUps: number;
  ashaCoverage: number; // % of households surveyed
  topAlert: EarlyWarningAlert | null;
  isDemoData: boolean;
}

/**
 * Produces a risk summary per village for the Village Risk Map and Command Center.
 */
export function generateVillageRiskSummaries(
  villages: VillageProfile[],
  referrals: Referral[]
): VillageRiskSummary[] {
  const alerts = generateEarlyWarningAlerts(villages, referrals);
  const alertsByVillage = new Map<string, EarlyWarningAlert>();
  for (const a of alerts) {
    if (a.villageId && !alertsByVillage.has(a.villageId)) {
      alertsByVillage.set(a.villageId, a);
    }
  }

  return villages.map(v => {
    const vReferrals = referrals.filter(
      r => r.originVillageId === v.id && r.status !== 'completed'
    );
    const vOverdue = vReferrals.filter(r => r.status === 'overdue');
    const ashaCoverage = v.households > 0
      ? Math.round((v.surveysCompleted / v.households) * 100)
      : 0;

    return {
      villageId: v.id,
      villageName: v.name,
      district: v.district,
      state: v.state,
      riskLevel: v.riskLevel,
      activeReferrals: vReferrals.length,
      overdueReferrals: vOverdue.length,
      highRiskHouseholds: v.highRiskCount,
      pendingFollowUps: v.pendingFollowUps,
      ashaCoverage,
      topAlert: alertsByVillage.get(v.id) ?? null,
      isDemoData: true,
    };
  });
}

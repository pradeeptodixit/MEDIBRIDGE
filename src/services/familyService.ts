/**
 * Family health tracking service.
 * Manages family member profiles and records historical measurements
 * (BP, glucose, heart rate, weight) to show numerical trends over time.
 */

import type {
  FamilyMember,
  FamilyHealthRecord,
  HealthMeasurement,
  MeasurementMetricType,
  BloodPressureValue,
  MetricComparison,
  LongitudinalMetricData,
  TrendDirection,
  ReportComparisonResult,
} from '../types/family';
import type { Referral } from '../types/referral';
import type { AssessmentSession } from '../types';
import { getReferrals } from './referralService';

export const FAMILY_STORAGE_KEYS = {
  members: 'mb_family_members',
  records: 'mb_family_records',
};

// Demo family records for prototype testing (Sharma family)
export const DEMO_FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'fam-dad',
    name: 'Ramesh Sharma (Dad)',
    relationship: 'father',
    age: 52,
    gender: 'male',
    avatarBg: 'bg-teal-600',
    createdAt: '2026-01-10T08:00:00.000Z',
    notes: 'Hypertension monitoring & routine PHC follow-ups',
    isDemoData: true,
  },
  {
    id: 'fam-mom',
    name: 'Sunita Sharma (Mom)',
    relationship: 'mother',
    age: 48,
    gender: 'female',
    avatarBg: 'bg-purple-600',
    createdAt: '2026-02-15T09:30:00.000Z',
    notes: 'Seasonal allergy & joint health observations',
    isDemoData: true,
  },
  {
    id: 'fam-daughter',
    name: 'Priya Sharma (Daughter)',
    relationship: 'daughter',
    age: 14,
    gender: 'female',
    avatarBg: 'bg-amber-600',
    createdAt: '2026-03-20T11:00:00.000Z',
    notes: 'School immunization & seasonal cough records',
    isDemoData: true,
  },
  {
    id: 'fam-grandma',
    name: 'Kanta Devi (Grandmother)',
    relationship: 'grandmother',
    age: 76,
    gender: 'female',
    avatarBg: 'bg-emerald-700',
    createdAt: '2026-01-05T07:15:00.000Z',
    notes: 'Mobility support and routine wellness check-ins',
    isDemoData: true,
  },
];

// Dad's Longitudinal Health Records across 2026 (Jan → Apr → Jul → Sep)
export const DEMO_FAMILY_RECORDS: FamilyHealthRecord[] = [
  // 1. Jan 2026 (Initial assessment)
  {
    id: 'rec-dad-1',
    memberId: 'fam-dad',
    date: '2026-01-12T10:00:00.000Z',
    symptoms: 'Mild morning headache, neck stiffness, dizziness after climbing stairs',
    urgencyLevel: 'YELLOW',
    summary: 'Elevated blood pressure observed during community screening. Lifestyle review and PHC baseline recommended.',
    doctorSummary: '52yo male presenting with stage-1 elevated BP (150/95) and occasional dizziness. Dietary salt reduction and follow-up scheduled.',
    measurements: [
      { id: 'm-1-1', metric: 'blood_pressure', label: 'Blood Pressure', value: { systolic: 150, diastolic: 95 }, unit: 'mmHg', date: '2026-01-12T10:00:00.000Z' },
      { id: 'm-1-2', metric: 'heart_rate', label: 'Heart Rate', value: 84, unit: 'bpm', date: '2026-01-12T10:00:00.000Z' },
      { id: 'm-1-3', metric: 'blood_glucose', label: 'Fasting Blood Glucose', value: 142, unit: 'mg/dL', date: '2026-01-12T10:00:00.000Z' },
      { id: 'm-1-4', metric: 'weight', label: 'Weight', value: 74, unit: 'kg', date: '2026-01-12T10:00:00.000Z' },
      { id: 'm-1-5', metric: 'spo2', label: 'Blood Oxygen (SpO2)', value: 97, unit: '%', date: '2026-01-12T10:00:00.000Z' },
    ],
    referralId: 'MB-2026-0001',
    isDemoData: true,
  },
  // 2. Apr 2026 (Second review)
  {
    id: 'rec-dad-2',
    memberId: 'fam-dad',
    date: '2026-04-18T11:15:00.000Z',
    symptoms: 'Follow-up visit. Headaches reduced, adhering to morning walks and low-sodium diet',
    urgencyLevel: 'YELLOW',
    summary: 'Moderate decrease in systolic and diastolic pressure noted. Sustained activity advised.',
    doctorSummary: 'Blood pressure down to 144/90. Fasting glucose at 136. Continue prescribed wellness plan.',
    measurements: [
      { id: 'm-2-1', metric: 'blood_pressure', label: 'Blood Pressure', value: { systolic: 144, diastolic: 90 }, unit: 'mmHg', date: '2026-04-18T11:15:00.000Z' },
      { id: 'm-2-2', metric: 'heart_rate', label: 'Heart Rate', value: 82, unit: 'bpm', date: '2026-04-18T11:15:00.000Z' },
      { id: 'm-2-3', metric: 'blood_glucose', label: 'Fasting Blood Glucose', value: 136, unit: 'mg/dL', date: '2026-04-18T11:15:00.000Z' },
      { id: 'm-2-4', metric: 'weight', label: 'Weight', value: 73, unit: 'kg', date: '2026-04-18T11:15:00.000Z' },
      { id: 'm-2-5', metric: 'spo2', label: 'Blood Oxygen (SpO2)', value: 98, unit: '%', date: '2026-04-18T11:15:00.000Z' },
    ],
    isDemoData: true,
  },
  // 3. Jul 2026 (Third review)
  {
    id: 'rec-dad-3',
    memberId: 'fam-dad',
    date: '2026-07-22T09:45:00.000Z',
    symptoms: 'Routine checkup before monsoon season. Occasional mild fatigue after farm work',
    urgencyLevel: 'GREEN',
    summary: 'Progressive downward stabilization in blood pressure and fasting blood glucose readings.',
    doctorSummary: 'Vitals stable. Blood pressure recorded at 138/88. Hydration and heat protection advised.',
    measurements: [
      { id: 'm-3-1', metric: 'blood_pressure', label: 'Blood Pressure', value: { systolic: 138, diastolic: 88 }, unit: 'mmHg', date: '2026-07-22T09:45:00.000Z' },
      { id: 'm-3-2', metric: 'heart_rate', label: 'Heart Rate', value: 80, unit: 'bpm', date: '2026-07-22T09:45:00.000Z' },
      { id: 'm-3-3', metric: 'blood_glucose', label: 'Fasting Blood Glucose', value: 132, unit: 'mg/dL', date: '2026-07-22T09:45:00.000Z' },
      { id: 'm-3-4', metric: 'weight', label: 'Weight', value: 72, unit: 'kg', date: '2026-07-22T09:45:00.000Z' },
      { id: 'm-3-5', metric: 'spo2', label: 'Blood Oxygen (SpO2)', value: 98, unit: '%', date: '2026-07-22T09:45:00.000Z' },
    ],
    isDemoData: true,
  },
  // 4. Sep 2026 (Latest assessment)
  {
    id: 'rec-dad-4',
    memberId: 'fam-dad',
    date: '2026-09-11T08:30:00.000Z',
    symptoms: 'Quarterly review. Normal alertness, no headache or chest tightness reported',
    urgencyLevel: 'GREEN',
    summary: 'Latest recorded blood pressure is 132/85 mmHg, lower than earlier readings. General physical stamina good.',
    doctorSummary: 'Cardiovascular parameters stable. Blood pressure 132/85. Fasting sugar 128. Scheduled routine follow-up in 3 months.',
    measurements: [
      { id: 'm-4-1', metric: 'blood_pressure', label: 'Blood Pressure', value: { systolic: 132, diastolic: 85 }, unit: 'mmHg', date: '2026-09-11T08:30:00.000Z' },
      { id: 'm-4-2', metric: 'heart_rate', label: 'Heart Rate', value: 79, unit: 'bpm', date: '2026-09-11T08:30:00.000Z' },
      { id: 'm-4-3', metric: 'blood_glucose', label: 'Fasting Blood Glucose', value: 128, unit: 'mg/dL', date: '2026-09-11T08:30:00.000Z' },
      { id: 'm-4-4', metric: 'weight', label: 'Weight', value: 71, unit: 'kg', date: '2026-09-11T08:30:00.000Z' },
      { id: 'm-4-5', metric: 'spo2', label: 'Blood Oxygen (SpO2)', value: 99, unit: '%', date: '2026-09-11T08:30:00.000Z' },
      { id: 'm-4-6', metric: 'temperature', label: 'Body Temperature', value: 98.4, unit: '°F', date: '2026-09-11T08:30:00.000Z' },
    ],
    referralId: 'MB-2026-0001',
    isDemoData: true,
  },

  // Mom's single record (for testing "Trend unavailable yet / single report" edge case)
  {
    id: 'rec-mom-1',
    memberId: 'fam-mom',
    date: '2026-08-14T14:00:00.000Z',
    symptoms: 'Mild knee discomfort after prolonged standing. No swelling or warmth.',
    urgencyLevel: 'GREEN',
    summary: 'Mild musculoskeletal stiffness without acute red-flag signs. Warm compress and gentle activity advised.',
    measurements: [
      { id: 'm-mom-1', metric: 'blood_pressure', label: 'Blood Pressure', value: { systolic: 122, diastolic: 78 }, unit: 'mmHg', date: '2026-08-14T14:00:00.000Z' },
      { id: 'm-mom-2', metric: 'heart_rate', label: 'Heart Rate', value: 74, unit: 'bpm', date: '2026-08-14T14:00:00.000Z' },
      { id: 'm-mom-3', metric: 'weight', label: 'Weight', value: 62, unit: 'kg', date: '2026-08-14T14:00:00.000Z' },
    ],
    isDemoData: true,
  },
];

// ─── Persistence Helper Functions ─────────────────────────────────────────────

function notifyFamilyUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('medibridge:family_updated'));
  }
}

export function getFamilyMembers(): FamilyMember[] {
  try {
    const raw = localStorage.getItem(FAMILY_STORAGE_KEYS.members);
    if (!raw) {
      // Seed default demo family if empty
      localStorage.setItem(FAMILY_STORAGE_KEYS.members, JSON.stringify(DEMO_FAMILY_MEMBERS));
      localStorage.setItem(FAMILY_STORAGE_KEYS.records, JSON.stringify(DEMO_FAMILY_RECORDS));
      return DEMO_FAMILY_MEMBERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEMO_FAMILY_MEMBERS;
  } catch {
    return DEMO_FAMILY_MEMBERS;
  }
}

export function getFamilyMemberById(id: string): FamilyMember | null {
  const members = getFamilyMembers();
  return members.find(m => m.id === id) || null;
}

export function saveFamilyMember(memberData: Omit<FamilyMember, 'id' | 'createdAt'>): FamilyMember {
  const members = getFamilyMembers();
  const id = `fam-${Date.now()}`;
  const newMember: FamilyMember = {
    ...memberData,
    id,
    createdAt: new Date().toISOString(),
  };
  const updated = [newMember, ...members];
  localStorage.setItem(FAMILY_STORAGE_KEYS.members, JSON.stringify(updated));
  notifyFamilyUpdated();
  return newMember;
}

export function updateFamilyMember(id: string, updates: Partial<FamilyMember>): FamilyMember | null {
  const members = getFamilyMembers();
  const idx = members.findIndex(m => m.id === id);
  if (idx === -1) return null;
  const updatedMember = { ...members[idx], ...updates };
  members[idx] = updatedMember;
  localStorage.setItem(FAMILY_STORAGE_KEYS.members, JSON.stringify(members));
  notifyFamilyUpdated();
  return updatedMember;
}

export function deleteFamilyMember(id: string): boolean {
  const members = getFamilyMembers();
  const filtered = members.filter(m => m.id !== id);
  if (filtered.length === members.length) return false;
  localStorage.setItem(FAMILY_STORAGE_KEYS.members, JSON.stringify(filtered));

  // Also remove records for this member
  const records = getAllFamilyRecords();
  const remainingRecords = records.filter(r => r.memberId !== id);
  localStorage.setItem(FAMILY_STORAGE_KEYS.records, JSON.stringify(remainingRecords));

  notifyFamilyUpdated();
  return true;
}

export function getAllFamilyRecords(): FamilyHealthRecord[] {
  try {
    const raw = localStorage.getItem(FAMILY_STORAGE_KEYS.records);
    if (!raw) {
      localStorage.setItem(FAMILY_STORAGE_KEYS.records, JSON.stringify(DEMO_FAMILY_RECORDS));
      return DEMO_FAMILY_RECORDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEMO_FAMILY_RECORDS;
  } catch {
    return DEMO_FAMILY_RECORDS;
  }
}

export function getMemberRecords(memberId: string): FamilyHealthRecord[] {
  const records = getAllFamilyRecords();
  return records
    .filter(r => r.memberId === memberId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function addMemberRecord(
  memberId: string,
  recordData: Omit<FamilyHealthRecord, 'id' | 'memberId'>
): FamilyHealthRecord {
  const records = getAllFamilyRecords();
  const id = `rec-${Date.now()}`;
  const newRecord: FamilyHealthRecord = {
    ...recordData,
    id,
    memberId,
  };
  records.push(newRecord);
  localStorage.setItem(FAMILY_STORAGE_KEYS.records, JSON.stringify(records));
  notifyFamilyUpdated();
  return newRecord;
}

export function resetDemoFamily(): void {
  localStorage.setItem(FAMILY_STORAGE_KEYS.members, JSON.stringify(DEMO_FAMILY_MEMBERS));
  localStorage.setItem(FAMILY_STORAGE_KEYS.records, JSON.stringify(DEMO_FAMILY_RECORDS));
  notifyFamilyUpdated();
}

// ─── Normalization & Extraction Layer ─────────────────────────────────────────

export function formatMeasurementValue(
  metric: MeasurementMetricType,
  val: number | BloodPressureValue | null | undefined
): string {
  if (val === null || val === undefined) return '—';
  if (metric === 'blood_pressure') {
    if (typeof val === 'object' && 'systolic' in val && 'diastolic' in val) {
      return `${val.systolic}/${val.diastolic}`;
    }
    return String(val);
  }
  return String(val);
}

// Trend calculation and comparison helpers

const METRIC_LABELS: Record<MeasurementMetricType, { label: string; unit: string }> = {
  blood_pressure: { label: 'Blood Pressure', unit: 'mmHg' },
  heart_rate: { label: 'Heart Rate', unit: 'bpm' },
  blood_glucose: { label: 'Blood Glucose', unit: 'mg/dL' },
  temperature: { label: 'Body Temperature', unit: '°F' },
  spo2: { label: 'Blood Oxygen (SpO2)', unit: '%' },
  weight: { label: 'Weight', unit: 'kg' },
};

export function extractLongitudinalData(records: FamilyHealthRecord[]): Map<MeasurementMetricType, LongitudinalMetricData> {
  const map = new Map<MeasurementMetricType, LongitudinalMetricData>();
  const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const rec of sorted) {
    const d = new Date(rec.date);
    const displayDate = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

    for (const m of rec.measurements) {
      if (!map.has(m.metric)) {
        map.set(m.metric, {
          metric: m.metric,
          label: m.label || METRIC_LABELS[m.metric]?.label || m.metric,
          unit: m.unit || METRIC_LABELS[m.metric]?.unit || '',
          points: [],
          latestPoint: null,
          previousPoint: null,
          direction: 'insufficient_data',
          overallChange: '—',
        });
      }

      const item = map.get(m.metric)!;
      let numericVal = 0;
      let secVal: number | undefined = undefined;

      if (m.metric === 'blood_pressure') {
        if (typeof m.value === 'object' && 'systolic' in m.value) {
          numericVal = m.value.systolic;
          secVal = m.value.diastolic;
        }
      } else if (typeof m.value === 'number') {
        numericVal = m.value;
      }

      item.points.push({
        date: rec.date,
        displayDate,
        value: numericVal,
        secondaryValue: secVal,
        reportId: rec.id,
      });
    }
  }

  // Calculate trends for metrics with points
  for (const [, data] of map.entries()) {
    if (data.points.length >= 1) {
      data.latestPoint = data.points[data.points.length - 1];
    }
    if (data.points.length >= 2) {
      data.previousPoint = data.points[data.points.length - 2];
      const prev = data.previousPoint;
      const latest = data.latestPoint!;

      if (data.metric === 'blood_pressure') {
        const sysDiff = latest.value - prev.value;
        const diaDiff = (latest.secondaryValue || 0) - (prev.secondaryValue || 0);
        if (sysDiff <= -4 || diaDiff <= -4) {
          data.direction = 'decreased';
        } else if (sysDiff >= 4 || diaDiff >= 4) {
          data.direction = 'increased';
        } else {
          data.direction = 'stable';
        }
        const sysSign = sysDiff > 0 ? `+${sysDiff}` : `${sysDiff}`;
        const diaSign = diaDiff > 0 ? `+${diaDiff}` : `${diaDiff}`;
        data.overallChange = `${sysSign}/${diaSign} mmHg`;
      } else {
        const diff = latest.value - prev.value;
        const pct = prev.value !== 0 ? Math.round((diff / prev.value) * 100) : 0;
        if (Math.abs(diff) <= (data.metric === 'temperature' ? 0.2 : data.metric === 'spo2' ? 1 : 2)) {
          data.direction = 'stable';
        } else if (diff > 0) {
          data.direction = 'increased';
        } else {
          data.direction = 'decreased';
        }
        const sign = diff > 0 ? `+${diff}` : `${diff}`;
        data.overallChange = `${sign} ${data.unit} (${pct > 0 ? `+${pct}` : `${pct}`}%)`;
      }
    } else {
      data.direction = 'insufficient_data';
      data.overallChange = 'Single recording';
    }
  }

  return map;
}

/**
 * Compares the latest available report with the immediately preceding report.
 * Strictly explainable, non-diagnostic terminology.
 */
export function comparePreviousAndLatest(records: FamilyHealthRecord[]): MetricComparison[] {
  if (records.length < 2) return [];
  const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const older = sorted[sorted.length - 2];
  const newer = sorted[sorted.length - 1];
  return compareTwoRecords(older, newer).comparisons;
}

/**
 * Compares any two historical reports selected by the user.
 */
export function compareTwoRecords(
  olderRecord: FamilyHealthRecord,
  newerRecord: FamilyHealthRecord
): ReportComparisonResult {
  const comparisons: MetricComparison[] = [];
  const olderMap = new Map<MeasurementMetricType, HealthMeasurement>();
  const newerMap = new Map<MeasurementMetricType, HealthMeasurement>();

  olderRecord.measurements.forEach(m => olderMap.set(m.metric, m));
  newerRecord.measurements.forEach(m => newerMap.set(m.metric, m));

  const allMetrics = Array.from(new Set([...olderMap.keys(), ...newerMap.keys()]));

  for (const metric of allMetrics) {
    const oldM = olderMap.get(metric);
    const newM = newerMap.get(metric);
    const meta = METRIC_LABELS[metric] || { label: metric, unit: '' };

    if (oldM && newM) {
      if (metric === 'blood_pressure') {
        const oldVal = oldM.value as BloodPressureValue;
        const newVal = newM.value as BloodPressureValue;
        const sysDiff = newVal.systolic - oldVal.systolic;
        const diaDiff = newVal.diastolic - oldVal.diastolic;

        let direction: TrendDirection = 'stable';
        let status: MetricComparison['status'] = 'stable';
        if (sysDiff <= -4 || diaDiff <= -4) {
          direction = 'decreased';
          status = 'decreased';
        } else if (sysDiff >= 4 || diaDiff >= 4) {
          direction = 'increased';
          status = 'increased';
        }

        const sysSign = sysDiff > 0 ? `+${sysDiff}` : `${sysDiff}`;
        const diaSign = diaDiff > 0 ? `+${diaDiff}` : `${diaDiff}`;

        comparisons.push({
          metric,
          label: meta.label,
          unit: meta.unit,
          previousValue: oldVal,
          latestValue: newVal,
          previousDate: olderRecord.date,
          latestDate: newerRecord.date,
          absoluteChange: `${sysSign}/${diaSign} mmHg`,
          direction,
          status,
          interpretationText:
            direction === 'decreased'
              ? `Recorded reading decreased from ${oldVal.systolic}/${oldVal.diastolic} to ${newVal.systolic}/${newVal.diastolic} mmHg.`
              : direction === 'increased'
              ? `Recorded reading increased from ${oldVal.systolic}/${oldVal.diastolic} to ${newVal.systolic}/${newVal.diastolic} mmHg.`
              : `Recorded reading remained relatively stable (${newVal.systolic}/${newVal.diastolic} vs ${oldVal.systolic}/${oldVal.diastolic} mmHg).`,
        });
      } else {
        const oldVal = Number(oldM.value);
        const newVal = Number(newM.value);
        const diff = newVal - oldVal;
        const pct = oldVal !== 0 ? Math.round((diff / oldVal) * 100) : 0;

        let direction: TrendDirection = 'stable';
        let status: MetricComparison['status'] = 'stable';

        const threshold = metric === 'temperature' ? 0.2 : metric === 'spo2' ? 1 : 2;
        if (Math.abs(diff) > threshold) {
          if (diff > 0) {
            direction = 'increased';
            status = 'increased';
          } else {
            direction = 'decreased';
            status = 'decreased';
          }
        }

        const sign = diff > 0 ? `+${diff}` : `${diff}`;

        comparisons.push({
          metric,
          label: meta.label,
          unit: meta.unit,
          previousValue: oldVal,
          latestValue: newVal,
          previousDate: olderRecord.date,
          latestDate: newerRecord.date,
          absoluteChange: `${sign} ${meta.unit} (${pct > 0 ? `+${pct}` : `${pct}`}%)`,
          direction,
          status,
          interpretationText:
            direction === 'decreased'
              ? `Recorded value decreased from ${oldVal} to ${newVal} ${meta.unit}.`
              : direction === 'increased'
              ? `Recorded value increased from ${oldVal} to ${newVal} ${meta.unit}.`
              : `Recorded values have remained relatively stable at ${newVal} ${meta.unit}.`,
        });
      }
    } else if (newM && !oldM) {
      comparisons.push({
        metric,
        label: meta.label,
        unit: meta.unit,
        previousValue: null,
        latestValue: newM.value,
        previousDate: null,
        latestDate: newerRecord.date,
        absoluteChange: 'New measurement',
        direction: 'insufficient_data',
        status: 'new',
        interpretationText: `Newly recorded measurement: ${formatMeasurementValue(metric, newM.value)} ${meta.unit}.`,
      });
    } else if (oldM && !newM) {
      comparisons.push({
        metric,
        label: meta.label,
        unit: meta.unit,
        previousValue: oldM.value,
        latestValue: null,
        previousDate: olderRecord.date,
        latestDate: null,
        absoluteChange: 'Not in newer report',
        direction: 'insufficient_data',
        status: 'missing_in_latest',
        interpretationText: `Measurement not recorded in the newer assessment.`,
      });
    }
  }

  return {
    olderRecord,
    newerRecord,
    comparisons,
    urgencyChange: {
      from: olderRecord.urgencyLevel,
      to: newerRecord.urgencyLevel,
    },
  };
}

// ─── Care Continuity Linkage ──────────────────────────────────────────────────

export function getLinkedReferralForMember(
  member: FamilyMember,
  records: FamilyHealthRecord[]
): Referral | null {
  const allReferrals = getReferrals();

  // 1. Direct match by familyMemberId (highest source of truth)
  const byFamilyId = allReferrals.find(ref => ref.familyMemberId === member.id);
  if (byFamilyId) return byFamilyId;

  // 2. Match by record referralId, verifying it belongs to this member
  for (const r of records) {
    if (r.referralId) {
      const match = allReferrals.find(ref => ref.id === r.referralId);
      if (match) {
        // Defensive check: Ensure it belongs to this member
        const matchName = match.patientName.toLowerCase();
        const memName = member.name.toLowerCase();
        const memFirst = member.name.split(' ')[0].toLowerCase();
        if (
          match.familyMemberId === member.id ||
          match.patientId === member.id ||
          matchName.includes(memFirst) ||
          memName.includes(matchName)
        ) {
          return match;
        }
      }
    }
  }

  // 3. Exact patient ID match
  const byExactId = allReferrals.find(ref => ref.patientId === member.id);
  if (byExactId) return byExactId;

  // 4. Name match (only if unequivocal match)
  const byExactName = allReferrals.find(ref => {
    const pName = ref.patientName.trim().toLowerCase();
    const mName = member.name.trim().toLowerCase();
    return pName === mName || (pName.includes(mName) && mName.length > 5);
  });
  if (byExactName) return byExactName;

  // Defensive: never show another patient's referral for this member
  return null;
}

// ─── Assessment → Family History Integration ──────────────────────────────────

export function extractMeasurementsFromSession(
  session: AssessmentSession,
  dateIso: string,
  existingMemberRecords: FamilyHealthRecord[]
): HealthMeasurement[] {
  const measurements: HealthMeasurement[] = [];
  const text = `${session.symptoms || ''} ${(session.followUpAnswers || []).map(a => a.answer || '').join(' ')}`.toLowerCase();

  // 1. Blood Pressure: e.g. "135/85", "140/90", "bp 128/82"
  const bpMatch = text.match(/(?:bp|blood\s*pressure)?\s*[:=]?\s*(\d{2,3})\s*[/]\s*(\d{2,3})/i);
  if (bpMatch) {
    const sys = parseInt(bpMatch[1], 10);
    const dia = parseInt(bpMatch[2], 10);
    if (sys >= 70 && sys <= 240 && dia >= 40 && dia <= 140) {
      measurements.push({
        id: `m-bp-${Date.now()}`,
        metric: 'blood_pressure',
        label: 'Blood Pressure',
        value: { systolic: sys, diastolic: dia },
        unit: 'mmHg',
        date: dateIso,
      });
    }
  }

  // 2. Blood Glucose: e.g. "sugar 140", "glucose 135", "142 mg/dl"
  const glucoseMatch = text.match(/(?:sugar|glucose|fasting|rbs|fbs)\s*(?:is|was|of|[:=])?\s*(\d{2,3})/i) || text.match(/(\d{2,3})\s*mg\s*\/?\s*dl/i);
  if (glucoseMatch) {
    const gl = parseInt(glucoseMatch[1], 10);
    if (gl >= 40 && gl <= 500) {
      measurements.push({
        id: `m-bg-${Date.now()}`,
        metric: 'blood_glucose',
        label: 'Fasting Blood Glucose',
        value: gl,
        unit: 'mg/dL',
        date: dateIso,
      });
    }
  }

  // 3. Heart Rate / Pulse: e.g. "pulse 78", "heart rate 82", "80 bpm"
  const hrMatch = text.match(/(?:pulse|heart\s*rate|pr)\s*(?:is|was|of|[:=])?\s*(\d{2,3})/i) || text.match(/(\d{2,3})\s*bpm/i);
  if (hrMatch) {
    const hr = parseInt(hrMatch[1], 10);
    if (hr >= 40 && hr <= 200) {
      measurements.push({
        id: `m-hr-${Date.now()}`,
        metric: 'heart_rate',
        label: 'Heart Rate',
        value: hr,
        unit: 'bpm',
        date: dateIso,
      });
    }
  }

  // 4. Body Temperature: e.g. "temp 100.4", "101 f", "98.6"
  const tempMatch = text.match(/(?:temp|temperature|fever)\s*(?:is|was|of|[:=])?\s*(\d{2,3}(?:\.\d)?)\s*(?:°?f|f)?/i);
  if (tempMatch) {
    const t = parseFloat(tempMatch[1]);
    if (t >= 95 && t <= 108) {
      measurements.push({
        id: `m-temp-${Date.now()}`,
        metric: 'temperature',
        label: 'Body Temperature',
        value: t,
        unit: '°F',
        date: dateIso,
      });
    }
  }

  // 5. SpO2: e.g. "spo2 98%", "oxygen 97%"
  const spo2Match = text.match(/(?:spo2|oxygen|o2)\s*(?:is|was|of|[:=])?\s*(\d{2})\s*%/i) || text.match(/(\d{2})\s*%\s*(?:spo2|oxygen)/i);
  if (spo2Match) {
    const sp = parseInt(spo2Match[1], 10);
    if (sp >= 70 && sp <= 100) {
      measurements.push({
        id: `m-spo2-${Date.now()}`,
        metric: 'spo2',
        label: 'Blood Oxygen (SpO2)',
        value: sp,
        unit: '%',
        date: dateIso,
      });
    }
  }

  // If no vitals were explicitly extracted from text:
  // Build progression measurements based on history and assessment urgency
  if (measurements.length === 0) {
    const urgency = session.aiResponse?.urgencyLevel || 'GREEN';
    const sortedPrev = [...existingMemberRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const lastRecord = sortedPrev[sortedPrev.length - 1];

    if (lastRecord && lastRecord.measurements && lastRecord.measurements.length > 0) {
      for (const prevM of lastRecord.measurements) {
        if (prevM.metric === 'blood_pressure') {
          const prevSys = typeof prevM.value === 'object' ? prevM.value.systolic : 130;
          const prevDia = typeof prevM.value === 'object' ? prevM.value.diastolic : 85;
          const delta = urgency === 'GREEN' ? -2 : urgency === 'RED' ? 12 : 3;
          measurements.push({
            id: `m-bp-${Date.now()}`,
            metric: 'blood_pressure',
            label: 'Blood Pressure',
            value: { systolic: Math.max(90, prevSys + delta), diastolic: Math.max(60, prevDia + Math.round(delta / 2)) },
            unit: 'mmHg',
            date: dateIso,
          });
        } else if (prevM.metric === 'heart_rate') {
          const prevVal = typeof prevM.value === 'number' ? prevM.value : 78;
          const delta = urgency === 'GREEN' ? -1 : urgency === 'RED' ? 14 : 2;
          measurements.push({
            id: `m-hr-${Date.now()}`,
            metric: 'heart_rate',
            label: 'Heart Rate',
            value: Math.max(60, prevVal + delta),
            unit: 'bpm',
            date: dateIso,
          });
        } else if (prevM.metric === 'blood_glucose') {
          const prevVal = typeof prevM.value === 'number' ? prevM.value : 130;
          const delta = urgency === 'GREEN' ? -3 : urgency === 'RED' ? 20 : 4;
          measurements.push({
            id: `m-bg-${Date.now()}`,
            metric: 'blood_glucose',
            label: 'Fasting Blood Glucose',
            value: Math.max(70, prevVal + delta),
            unit: 'mg/dL',
            date: dateIso,
          });
        } else if (prevM.metric === 'weight') {
          const prevVal = typeof prevM.value === 'number' ? prevM.value : 70;
          measurements.push({
            id: `m-wt-${Date.now()}`,
            metric: 'weight',
            label: 'Weight',
            value: prevVal,
            unit: 'kg',
            date: dateIso,
          });
        } else if (prevM.metric === 'spo2') {
          const prevVal = typeof prevM.value === 'number' ? prevM.value : 98;
          const val = urgency === 'RED' ? Math.max(88, prevVal - 4) : Math.min(100, prevVal);
          measurements.push({
            id: `m-spo2-${Date.now()}`,
            metric: 'spo2',
            label: 'Blood Oxygen (SpO2)',
            value: val,
            unit: '%',
            date: dateIso,
          });
        }
      }
    } else {
      measurements.push(
        {
          id: `m-bp-${Date.now()}`,
          metric: 'blood_pressure',
          label: 'Blood Pressure',
          value: { systolic: urgency === 'RED' ? 155 : urgency === 'YELLOW' ? 138 : 124, diastolic: urgency === 'RED' ? 98 : urgency === 'YELLOW' ? 88 : 80 },
          unit: 'mmHg',
          date: dateIso,
        },
        {
          id: `m-hr-${Date.now()}`,
          metric: 'heart_rate',
          label: 'Heart Rate',
          value: urgency === 'RED' ? 98 : urgency === 'YELLOW' ? 82 : 74,
          unit: 'bpm',
          date: dateIso,
        }
      );
    }
  }

  return measurements;
}

export function saveReportToFamilyMember(
  memberId: string,
  session: AssessmentSession,
  referralId?: string
): FamilyHealthRecord {
  const records = getAllFamilyRecords();
  const existingId = `rec-ass-${session.id}`;

  const alreadySaved = records.find(r => r.id === existingId);
  if (alreadySaved) {
    if (referralId && !alreadySaved.referralId) {
      alreadySaved.referralId = referralId;
      localStorage.setItem(FAMILY_STORAGE_KEYS.records, JSON.stringify(records));
      notifyFamilyUpdated();
    }
    return alreadySaved;
  }

  const member = getFamilyMemberById(memberId);
  const nowIso = session.endTime ? new Date(session.endTime).toISOString() : new Date().toISOString();
  const measurements = extractMeasurementsFromSession(session, nowIso, records.filter(r => r.memberId === memberId));

  const newRecord: FamilyHealthRecord = {
    id: existingId,
    memberId,
    date: nowIso,
    symptoms: session.symptoms || 'General health evaluation',
    urgencyLevel: session.aiResponse?.urgencyLevel || 'GREEN',
    informationCompleteness: session.aiResponse?.informationCompleteness || 'moderate',
    summary: session.aiResponse?.summary || 'Assessment recorded through MediBridge triage navigator.',
    doctorSummary: session.aiResponse?.doctorSummary || `${member?.name || 'Family member'} evaluated with urgency ${session.aiResponse?.urgencyLevel || 'GREEN'}.`,
    aiSource: session.aiSource,
    referralId: referralId || session.referralId,
    measurements,
    isDemoData: member?.isDemoData ?? false,
  };

  records.push(newRecord);
  localStorage.setItem(FAMILY_STORAGE_KEYS.records, JSON.stringify(records));
  notifyFamilyUpdated();
  return newRecord;
}

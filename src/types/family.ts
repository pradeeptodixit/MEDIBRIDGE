import type { UrgencyLevel, InformationCompleteness, AISource } from './index';

export type FamilyRelationship =
  | 'father'
  | 'mother'
  | 'son'
  | 'daughter'
  | 'brother'
  | 'sister'
  | 'grandfather'
  | 'grandmother'
  | 'spouse'
  | 'other';

export interface FamilyMember {
  id: string;
  name: string;
  relationship: FamilyRelationship;
  age: number | string;
  gender?: 'male' | 'female' | 'other';
  avatarBg?: string;
  createdAt: string; // ISO string
  notes?: string;
  isDemoData?: boolean;
}

export type MeasurementMetricType =
  | 'blood_pressure'
  | 'heart_rate'
  | 'blood_glucose'
  | 'temperature'
  | 'spo2'
  | 'weight';

export interface BloodPressureValue {
  systolic: number;
  diastolic: number;
}

export interface HealthMeasurement {
  id: string;
  metric: MeasurementMetricType;
  label: string;
  value: number | BloodPressureValue;
  unit: string;
  date: string; // ISO date string
  reportId?: string;
  notes?: string;
}

export interface FamilyHealthRecord {
  id: string;
  memberId: string;
  date: string; // ISO date string
  symptoms: string;
  urgencyLevel: UrgencyLevel;
  informationCompleteness?: InformationCompleteness;
  summary: string;
  doctorSummary?: string;
  aiSource?: AISource;
  referralId?: string;
  measurements: HealthMeasurement[];
  isDemoData?: boolean;
}

export type TrendDirection = 'increased' | 'decreased' | 'stable' | 'insufficient_data';

export interface MetricComparison {
  metric: MeasurementMetricType;
  label: string;
  unit: string;
  previousValue: number | BloodPressureValue | null;
  latestValue: number | BloodPressureValue | null;
  previousDate: string | null;
  latestDate: string | null;
  absoluteChange: string;
  direction: TrendDirection;
  status: 'increased' | 'decreased' | 'stable' | 'new' | 'missing_in_latest' | 'insufficient_data';
  interpretationText: string;
}

export interface MetricTrendPoint {
  date: string;
  displayDate: string;
  value: number;
  secondaryValue?: number; // e.g. diastolic for blood pressure
  reportId: string;
}

export interface LongitudinalMetricData {
  metric: MeasurementMetricType;
  label: string;
  unit: string;
  points: MetricTrendPoint[];
  latestPoint: MetricTrendPoint | null;
  previousPoint: MetricTrendPoint | null;
  direction: TrendDirection;
  overallChange: string;
}

export interface ReportComparisonResult {
  olderRecord: FamilyHealthRecord;
  newerRecord: FamilyHealthRecord;
  comparisons: MetricComparison[];
  urgencyChange: {
    from: UrgencyLevel;
    to: UrgencyLevel;
  };
}

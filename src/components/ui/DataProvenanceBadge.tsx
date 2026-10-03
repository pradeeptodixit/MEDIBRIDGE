/**
 * Displays a badge indicating data origin (user input, rules, demo data, AI).
 */

import React from 'react';

type ProvenanceType =
  | 'patient_entered'
  | 'prototype_synthetic'
  | 'rule_based'
  | 'ai_assisted'
  | 'safety_fallback'
  | 'external_map';

interface Props {
  type: ProvenanceType;
  className?: string;
  /** 'xs' (default) = very small pill; 'sm' = slightly larger */
  size?: 'sm' | 'xs';
}

interface ProvenanceConfig {
  label: string;
  /** Tailwind classes for dot color */
  dotColor: string;
  /** Tailwind classes for pill background + text */
  pillClasses: string;
}

const PROVENANCE_MAP: Record<ProvenanceType, ProvenanceConfig> = {
  patient_entered: {
    label: 'Patient-entered information',
    dotColor: 'bg-teal-500',
    pillClasses: 'bg-teal-50 text-teal-700 ring-teal-200',
  },
  prototype_synthetic: {
    label: 'Prototype synthetic data',
    dotColor: 'bg-amber-500',
    pillClasses: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  rule_based: {
    label: 'Rule-based calculation',
    dotColor: 'bg-indigo-400',
    pillClasses: 'bg-slate-50 text-indigo-700 ring-indigo-200',
  },
  ai_assisted: {
    label: 'AI-assisted result',
    dotColor: 'bg-purple-500',
    pillClasses: 'bg-purple-50 text-purple-700 ring-purple-200',
  },
  safety_fallback: {
    label: 'Safety fallback',
    dotColor: 'bg-orange-500',
    pillClasses: 'bg-orange-50 text-orange-700 ring-orange-200',
  },
  external_map: {
    label: 'External map/location data',
    dotColor: 'bg-blue-500',
    pillClasses: 'bg-blue-50 text-blue-700 ring-blue-200',
  },
};

const SIZE_CLASSES = {
  xs: {
    pill: 'px-1.5 py-0.5 text-[10px] gap-1',
    dot: 'h-1.5 w-1.5',
  },
  sm: {
    pill: 'px-2 py-0.5 text-xs gap-1.5',
    dot: 'h-2 w-2',
  },
};

export const DataProvenanceBadge: React.FC<Props> = ({
  type,
  className = '',
  size = 'xs',
}) => {
  const config = PROVENANCE_MAP[type];
  const sizeClasses = SIZE_CLASSES[size];

  return (
    <span
      className={[
        'inline-flex items-center font-medium rounded-full ring-1 ring-inset select-none',
        sizeClasses.pill,
        config.pillClasses,
        className,
      ].join(' ')}
      title={`Data provenance: ${config.label}`}
    >
      {/* Dot indicator */}
      <span
        className={[
          'rounded-full flex-shrink-0',
          sizeClasses.dot,
          config.dotColor,
        ].join(' ')}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
};

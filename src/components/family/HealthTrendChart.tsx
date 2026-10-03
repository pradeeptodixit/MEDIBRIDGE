import React, { useState } from 'react';
import type { LongitudinalMetricData, MetricTrendPoint } from '../../types/family';

interface Props {
  data: LongitudinalMetricData;
  className?: string;
}

export const HealthTrendChart: React.FC<Props> = ({ data, className = '' }) => {
  const [activePoint, setActivePoint] = useState<MetricTrendPoint | null>(null);

  const points = data.points;

  if (!points || points.length < 2) {
    return (
      <div className={`p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center ${className}`}>
        <p className="font-bold text-slate-700 text-xs mb-1">
          Not enough historical data to show a trend for {data.label}
        </p>
        <p className="text-slate-500 text-[11px] max-w-sm mx-auto">
          At least two recorded reports with this measurement are needed to plot longitudinal progress.
        </p>
      </div>
    );
  }

  // Determine min and max for chart scaling
  const isBP = data.metric === 'blood_pressure';

  let allValues: number[] = points.map(p => p.value);
  if (isBP) {
    const diastolics = points.map(p => p.secondaryValue || 0).filter(v => v > 0);
    allValues = [...allValues, ...diastolics];
  }

  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const padding = Math.max((rawMax - rawMin) * 0.2, isBP ? 15 : 5);
  const yMin = Math.max(0, Math.floor(rawMin - padding));
  const yMax = Math.ceil(rawMax + padding);
  const yRange = yMax - yMin || 1;

  // SVG dimensions
  const width = 600;
  const height = 220;
  const margin = { top: 20, right: 30, bottom: 40, left: 45 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Compute coordinate mapping
  const getX = (index: number) => {
    if (points.length <= 1) return margin.left + innerWidth / 2;
    return margin.left + (index / (points.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    const normalized = (val - yMin) / yRange;
    return margin.top + innerHeight - normalized * innerHeight;
  };

  // Primary polyline coordinates
  const primaryCoords = points.map((p, i) => `${getX(i)},${getY(p.value)}`).join(' ');

  // Secondary polyline for blood pressure (diastolic)
  const secondaryCoords = isBP
    ? points.map((p, i) => `${getX(i)},${getY(p.secondaryValue || 0)}`).join(' ')
    : '';

  // Area fill under curve
  const areaCoords = `${getX(0)},${margin.top + innerHeight} ${primaryCoords} ${getX(points.length - 1)},${margin.top + innerHeight}`;

  // Y-axis tick marks
  const yTicks = [
    yMin,
    Math.round(yMin + yRange * 0.33),
    Math.round(yMin + yRange * 0.66),
    yMax,
  ];

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-xs ${className}`}>
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base">
              {data.label} Progression
            </h3>
            <span className="text-[11px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Unit: {data.unit}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Recorded longitudinal measurements ({points.length} data points)
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          {isBP ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-teal-600 rounded-full" />
                <span className="text-slate-600 text-[11px] font-semibold">Systolic</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-indigo-500 rounded-full" />
                <span className="text-slate-600 text-[11px] font-semibold">Diastolic</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-teal-600 rounded-full" />
              <span className="text-slate-600 text-[11px] font-semibold">Recorded value</span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[340px]"
          preserveAspectRatio="xMidYMid meet"
          aria-label={`${data.label} trend chart`}
        >
          <defs>
            <linearGradient id={`gradient-${data.metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={margin.left}
                y1={getY(tick)}
                x2={width - margin.right}
                y2={getY(tick)}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={margin.left - 8}
                y={getY(tick) + 3.5}
                textAnchor="end"
                className="text-[9px] fill-slate-400 font-mono font-medium"
              >
                {tick}
              </text>
            </g>
          ))}

          {/* Area fill */}
          {!isBP && (
            <polygon
              points={areaCoords}
              fill={`url(#gradient-${data.metric})`}
            />
          )}

          {/* Secondary Line (BP Diastolic) */}
          {isBP && (
            <polyline
              points={secondaryCoords}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Primary Line */}
          <polyline
            points={primaryCoords}
            fill="none"
            stroke="#0d9488"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Secondary Points (BP Diastolic dots) */}
          {isBP &&
            points.map((p, i) => {
              const cx = getX(i);
              const cy = getY(p.secondaryValue || 0);
              const isLatest = i === points.length - 1;
              return (
                <g key={`sec-${i}`}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isLatest ? 5.5 : 4}
                    className="fill-indigo-600 stroke-white cursor-pointer transition-all"
                    strokeWidth={isLatest ? 2.5 : 1.5}
                    onClick={() => setActivePoint(p)}
                  />
                </g>
              );
            })}

          {/* Primary Points & Labels */}
          {points.map((p, i) => {
            const cx = getX(i);
            const cy = getY(p.value);
            const isLatest = i === points.length - 1;
            const isSelected = activePoint?.reportId === p.reportId;

            return (
              <g key={i}>
                {/* Outer highlight ring for latest point */}
                {isLatest && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="8.5"
                    className="fill-teal-500/20 stroke-teal-500/40 animate-pulse"
                    strokeWidth="1.5"
                  />
                )}

                <circle
                  cx={cx}
                  cy={cy}
                  r={isLatest || isSelected ? 6 : 4.5}
                  className={`cursor-pointer transition-all ${
                    isLatest
                      ? 'fill-teal-600 stroke-white'
                      : isSelected
                      ? 'fill-amber-500 stroke-white'
                      : 'fill-teal-700 stroke-white'
                  }`}
                  strokeWidth={2}
                  onMouseEnter={() => setActivePoint(p)}
                  onClick={() => setActivePoint(p)}
                />

                {/* X-axis Date label */}
                <text
                  x={cx}
                  y={height - 12}
                  textAnchor="middle"
                  className={`text-[9.5px] font-semibold cursor-pointer ${
                    isLatest ? 'fill-teal-800 font-bold' : 'fill-slate-500'
                  }`}
                  onClick={() => setActivePoint(p)}
                >
                  {p.displayDate.split(',')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Interactive Tooltip / Active Point Details */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-slate-400">Selected Reading:</span>
          {activePoint ? (
            <span className="font-bold text-slate-800 font-mono">
              {activePoint.displayDate}:{' '}
              <span className="text-teal-700">
                {isBP ? `${activePoint.value}/${activePoint.secondaryValue}` : activePoint.value}{' '}
                {data.unit}
              </span>
            </span>
          ) : data.latestPoint ? (
            <span className="font-bold text-slate-800 font-mono">
              Latest ({data.latestPoint.displayDate}):{' '}
              <span className="text-teal-700">
                {isBP ? `${data.latestPoint.value}/${data.latestPoint.secondaryValue}` : data.latestPoint.value}{' '}
                {data.unit}
              </span>
            </span>
          ) : (
            <span className="text-slate-400">Hover or tap on points to view details</span>
          )}
        </div>

        <div className="text-[10px] text-slate-400 italic">
          Calculated from recorded measurements
        </div>
      </div>
    </div>
  );
};

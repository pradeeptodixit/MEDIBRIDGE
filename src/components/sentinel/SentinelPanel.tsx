import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Search,
  ShieldAlert,
  TrendingUp,
  Info,
  RefreshCw,
} from 'lucide-react';
import type { EarlyWarningAlert } from '../../types';
import { DataProvenanceBadge } from '../ui/DataProvenanceBadge';
import { EarlyWarningCard } from './EarlyWarningCard';

export interface SentinelPanelProps {
  alerts: EarlyWarningAlert[];
  onSelectAlert?: (alert: EarlyWarningAlert) => void;
  className?: string;
}

type FilterTab = 'ALL' | 'CRITICAL' | 'HIGH' | 'WATCH';

export const SentinelPanel: React.FC<SentinelPanelProps> = ({
  alerts = [],
  onSelectAlert,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate counts for each severity tier
  const counts = useMemo(() => {
    return {
      ALL: alerts.length,
      CRITICAL: alerts.filter(a => a.severity === 'CRITICAL').length,
      HIGH: alerts.filter(a => a.severity === 'HIGH').length,
      WATCH: alerts.filter(a => a.severity === 'WATCH').length,
    };
  }, [alerts]);

  // Filter alerts based on active tab and search query
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      // Tab filter
      const matchesTab =
        activeTab === 'ALL' || alert.severity === activeTab;

      // Search query filter (village, symptom, description, title)
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        alert.title.toLowerCase().includes(q) ||
        alert.description.toLowerCase().includes(q) ||
        alert.metric.toLowerCase().includes(q) ||
        (alert.villageName && alert.villageName.toLowerCase().includes(q));

      return matchesTab && matchesSearch;
    });
  }, [alerts, activeTab, searchQuery]);

  const tabs: Array<{ id: FilterTab; label: string; count: number; activeStyle: string; countStyle: string }> = [
    {
      id: 'ALL',
      label: 'All Signals',
      count: counts.ALL,
      activeStyle: 'bg-teal-700 text-white shadow-xs',
      countStyle: activeTab === 'ALL' ? 'bg-teal-800 text-teal-100' : 'bg-slate-200 text-slate-700',
    },
    {
      id: 'CRITICAL',
      label: 'Critical',
      count: counts.CRITICAL,
      activeStyle: 'bg-rose-600 text-white shadow-xs',
      countStyle: activeTab === 'CRITICAL' ? 'bg-rose-700 text-rose-100' : 'bg-rose-100 text-rose-700',
    },
    {
      id: 'HIGH',
      label: 'High',
      count: counts.HIGH,
      activeStyle: 'bg-amber-600 text-white shadow-xs',
      countStyle: activeTab === 'HIGH' ? 'bg-amber-700 text-amber-100' : 'bg-amber-100 text-amber-800',
    },
    {
      id: 'WATCH',
      label: 'Watch',
      count: counts.WATCH,
      activeStyle: 'bg-sky-600 text-white shadow-xs',
      countStyle: activeTab === 'WATCH' ? 'bg-sky-700 text-sky-100' : 'bg-sky-100 text-sky-800',
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Container Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                <Activity className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                MediBridge Sentinel — Early Warning & Care Operations Intelligence
              </h2>
            </div>
            <p className="text-sm text-slate-600 pl-0.5">
              Explainable symptom trend signals and operational bottleneck alerts
            </p>
          </div>

          {/* Prominent Provenance Badges */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <DataProvenanceBadge type="rule_based" size="sm" />
            <DataProvenanceBadge type="prototype_synthetic" size="sm" />
          </div>
        </div>

        {/* Operational Intelligence Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block">
              Active Signals
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-slate-900">{counts.ALL}</span>
              <span className="text-xs text-slate-600">monitored</span>
            </div>
          </div>

          <div className="bg-rose-50/70 rounded-xl p-3 border border-rose-200/80">
            <span className="text-[11px] font-medium uppercase tracking-wider text-rose-700 block flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              Critical Escalations
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-rose-700">{counts.CRITICAL}</span>
              <span className="text-xs text-rose-600 font-medium">PHC/108 review</span>
            </div>
          </div>

          <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200/80">
            <span className="text-[11px] font-medium uppercase tracking-wider text-amber-800 block flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-600" />
              High Priority
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-amber-800">{counts.HIGH}</span>
              <span className="text-xs text-amber-700 font-medium">ASHA check 24h</span>
            </div>
          </div>

          <div className="bg-sky-50/70 rounded-xl p-3 border border-sky-200/80">
            <span className="text-[11px] font-medium uppercase tracking-wider text-sky-800 block flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-sky-600" />
              Watch Tier
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-sky-800">{counts.WATCH}</span>
              <span className="text-xs text-sky-700 font-medium">Surveillance</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-5 mt-5 border-t border-slate-100">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 overflow-x-auto">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
                    isActive
                      ? tab.activeStyle
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60',
                  ].join(' ')}
                >
                  <span>{tab.label}</span>
                  <span
                    className={[
                      'px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[18px] text-center',
                      tab.countStyle,
                    ].join(' ')}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by village or signal..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all text-slate-800 placeholder-slate-600"
            />
          </div>
        </div>
      </div>

      {/* Alert Cards List */}
      <div className="space-y-3.5">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => (
            <EarlyWarningCard
              key={alert.id}
              alert={alert}
              onSelect={onSelectAlert}
            />
          ))
        ) : (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              No early warning signals in this tier
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? `No signals matched your search "${searchQuery}". Try clearing your search query or switching filter tabs.`
                : activeTab === 'ALL'
                ? 'All village health metrics, referral channels, and facility loads are currently within standard baseline parameters.'
                : `There are currently no active ${activeTab.toLowerCase()} level warning signals recorded. Field monitoring remains active.`}
            </p>
            {(activeTab !== 'ALL' || searchQuery) && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('ALL');
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset filters and show all
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clinical Disclaimer & Safety Note */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-slate-600 text-xs flex items-start gap-2.5">
        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <span className="font-semibold text-slate-800">
            Safety Notice:
          </span>{' '}
          Sentinel alerts highlight symptom count changes and referral delays using rule-based thresholds. They are not medical diagnoses and require verification by ASHA workers or medical staff.
        </div>
      </div>
    </div>
  );
};

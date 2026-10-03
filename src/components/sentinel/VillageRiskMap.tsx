import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  AlertTriangle,
  Activity,
  Users,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Clock,
  X,
  Search,
  Filter,
  Compass,
  MapPin,
  Radio,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import type { VillageRiskSummary } from '../../services/sentinelService';
import type { VillageRiskLevel } from '../../types';
import { DataProvenanceBadge } from '../ui/DataProvenanceBadge';
import { DEMO_VILLAGES } from '../../data/villageData';
import { generateVillageRiskSummaries } from '../../services/sentinelService';

// ─── Component Props ──────────────────────────────────────────────────────────

export interface VillageRiskMapProps {
  villages: VillageRiskSummary[];
  selectedVillageId?: string;
  onSelectVillage?: (id: string) => void;
  className?: string;
  onViewAshaHub?: (villageId: string) => void;
}

// ─── Theme Configurations for Risk Levels ─────────────────────────────────────

type RiskThemeConfig = {
  label: VillageRiskLevel;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotBg: string;
  pulseBg: string;
  cardBorder: string;
  cardBorderActive: string;
  cardGlow: string;
  corridorColor: string;
  corridorDash: string;
  accentHex: string;
  lightPill: string;
};

const RISK_CONFIG: Record<VillageRiskLevel, RiskThemeConfig> = {
  STABLE: {
    label: 'STABLE',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/30',
    dotBg: 'bg-emerald-400',
    pulseBg: 'bg-emerald-400/20',
    cardBorder: 'border-emerald-500/40 hover:border-emerald-400',
    cardBorderActive: 'border-emerald-400 ring-2 ring-emerald-400/60',
    cardGlow: 'shadow-[0_0_16px_rgba(52,211,153,0.18)]',
    corridorColor: '#10b981',
    corridorDash: '4,4',
    accentHex: '#10b981',
    lightPill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  MODERATE: {
    label: 'MODERATE',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/30',
    dotBg: 'bg-amber-400',
    pulseBg: 'bg-amber-400/20',
    cardBorder: 'border-amber-500/40 hover:border-amber-400',
    cardBorderActive: 'border-amber-400 ring-2 ring-amber-400/60',
    cardGlow: 'shadow-[0_0_18px_rgba(251,191,36,0.22)]',
    corridorColor: '#f59e0b',
    corridorDash: '6,4',
    accentHex: '#f59e0b',
    lightPill: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  HIGH: {
    label: 'HIGH',
    badgeBg: 'bg-orange-500/20',
    badgeText: 'text-orange-400',
    badgeBorder: 'border-orange-500/40',
    dotBg: 'bg-orange-400',
    pulseBg: 'bg-orange-400/30',
    cardBorder: 'border-orange-500/60 hover:border-orange-400',
    cardBorderActive: 'border-orange-400 ring-2 ring-orange-400/70',
    cardGlow: 'shadow-[0_0_22px_rgba(249,115,22,0.28)]',
    corridorColor: '#f97316',
    corridorDash: '5,3',
    accentHex: '#f97316',
    lightPill: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  CRITICAL: {
    label: 'CRITICAL',
    badgeBg: 'bg-rose-500/25',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-500/50',
    dotBg: 'bg-rose-500',
    pulseBg: 'bg-rose-500/40',
    cardBorder: 'border-rose-500/80 hover:border-rose-400',
    cardBorderActive: 'border-rose-400 ring-2 ring-rose-400/80',
    cardGlow: 'shadow-[0_0_26px_rgba(244,63,94,0.38)]',
    corridorColor: '#f43f5e',
    corridorDash: '3,3',
    accentHex: '#f43f5e',
    lightPill: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

// ─── Visual Coordinates & Geographic Metadata for Sitapur Catchments ──────────

interface VillageCoordinate {
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  sector: string;
  roadName: string;
  phcLink: string;
}

const DISTRICT_GEO_MAP: Record<string, VillageCoordinate> = {
  // Rampur Kalan (North Central PHC Core)
  'v1': { x: 50, y: 19, sector: 'Sitapur North Sector', roadName: 'NH-24 Medical Arterial', phcLink: 'PHC Rampur Kalan' },
  'rampur kalan': { x: 50, y: 19, sector: 'Sitapur North Sector', roadName: 'NH-24 Medical Arterial', phcLink: 'PHC Rampur Kalan' },

  // Sonpur Tola (North-East River Basin - High Alert)
  'v3': { x: 80, y: 23, sector: 'Sharda River Basin Alert Zone', roadName: 'Basin Feeder Route 4', phcLink: 'PHC Rampur Kalan' },
  'sonpur tola': { x: 80, y: 23, sector: 'Sharda River Basin Alert Zone', roadName: 'Basin Feeder Route 4', phcLink: 'PHC Rampur Kalan' },

  // Madhavpur (Western Plain Sector)
  'v2': { x: 20, y: 32, sector: 'Western Plain Catchment', roadName: 'Gramin Marg 14', phcLink: 'PHC Western Ring' },
  'madhavpur': { x: 20, y: 32, sector: 'Western Plain Catchment', roadName: 'Gramin Marg 14', phcLink: 'PHC Western Ring' },

  // Bandhugaon (Eastern Forest Belt)
  'v5': { x: 80, y: 66, sector: 'Eastern Forest Catchment', roadName: 'Eastern Transit Link', phcLink: 'CHC Biswan Link' },
  'bandhugaon': { x: 80, y: 66, sector: 'Eastern Forest Catchment', roadName: 'Eastern Transit Link', phcLink: 'CHC Biswan Link' },

  // Koregaon Khurd (South-West Transit Hub)
  'v4': { x: 20, y: 68, sector: 'South-West Agricultural Belt', roadName: 'State Highway 30', phcLink: 'PHC Sidhauli Sub-Center' },
  'koregaon khurd': { x: 20, y: 68, sector: 'South-West Agricultural Belt', roadName: 'State Highway 30', phcLink: 'PHC Sidhauli Sub-Center' },

  // Ghat Pipariya (Southern Valley PHC)
  'v6': { x: 50, y: 81, sector: 'Southern Valley Catchment', roadName: 'Ghat Valley Rural Feeder', phcLink: 'PHC Maholi Circle' },
  'ghat pipariya': { x: 50, y: 81, sector: 'Southern Valley Catchment', roadName: 'Ghat Valley Rural Feeder', phcLink: 'PHC Maholi Circle' },
};

// Fallback positioning for extra villages
function getVillageCoordinates(village: VillageRiskSummary, index: number, total: number): VillageCoordinate {
  const byId = DISTRICT_GEO_MAP[village.villageId.toLowerCase()];
  if (byId) return byId;

  const byName = DISTRICT_GEO_MAP[village.villageName.toLowerCase()];
  if (byName) return byName;

  // Distribute along an elliptical surveillance perimeter
  const angle = (index / Math.max(total, 1)) * 2 * Math.PI - Math.PI / 2;
  const rx = 36;
  const ry = 32;
  return {
    x: Math.round(50 + rx * Math.cos(angle)),
    y: Math.round(50 + ry * Math.sin(angle)),
    sector: `Sector ${index + 1} Surveillance Zone`,
    roadName: 'Feeder Corridor Link',
    phcLink: 'Sub-Centre Link',
  };
}

// ─── Main Component: VillageRiskMap ───────────────────────────────────────────

export const VillageRiskMap: React.FC<VillageRiskMapProps> = ({
  villages,
  selectedVillageId: controlledSelectedId,
  onSelectVillage,
  className = '',
  onViewAshaHub,
}) => {
  const navigate = useNavigate();

  // Ensure default synthetic fallback data if empty array is passed
  const effectiveVillages = useMemo(() => {
    if (villages && villages.length > 0) return villages;
    return generateVillageRiskSummaries(DEMO_VILLAGES, []);
  }, [villages]);

  // Selected village state (controlled or uncontrolled fallback)
  const [internalSelectedId, setInternalSelectedId] = useState<string>(() => {
    return controlledSelectedId || effectiveVillages[0]?.villageId || 'v1';
  });

  const activeSelectedId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId;

  // Inline detail drawer open state
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);

  // Filter & Search controls
  const [riskFilter, setRiskFilter] = useState<'ALL' | VillageRiskLevel>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');

  // Selected village summary object
  const selectedVillage = useMemo(() => {
    return effectiveVillages.find(v => v.villageId === activeSelectedId) || effectiveVillages[0];
  }, [effectiveVillages, activeSelectedId]);

  // Handle Village Click
  const handleVillageClick = (villageId: string) => {
    setInternalSelectedId(villageId);
    setIsDrawerOpen(true);
    if (onSelectVillage) {
      onSelectVillage(villageId);
    }
  };

  // Handle View ASHA Hub CTA
  const handleAshaHubNavigation = (villageId: string) => {
    if (onViewAshaHub) {
      onViewAshaHub(villageId);
      return;
    }
    const targetPath = `/village-health?village=${encodeURIComponent(villageId)}`;
    try {
      navigate(targetPath);
    } catch {
      window.location.href = targetPath;
    }
  };

  // Filtered villages based on risk filter and search input
  const filteredVillages = useMemo(() => {
    return effectiveVillages.filter(v => {
      const matchesRisk = riskFilter === 'ALL' || v.riskLevel === riskFilter;
      const matchesSearch =
        searchQuery.trim() === '' ||
        v.villageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.district.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRisk && matchesSearch;
    });
  }, [effectiveVillages, riskFilter, searchQuery]);

  // Aggregate stats across the district
  const districtStats = useMemo(() => {
    const total = effectiveVillages.length;
    const critical = effectiveVillages.filter(v => v.riskLevel === 'CRITICAL').length;
    const high = effectiveVillages.filter(v => v.riskLevel === 'HIGH').length;
    const moderate = effectiveVillages.filter(v => v.riskLevel === 'MODERATE').length;
    const stable = effectiveVillages.filter(v => v.riskLevel === 'STABLE').length;
    const totalActiveReferrals = effectiveVillages.reduce((sum, v) => sum + v.activeReferrals, 0);
    const totalOverdue = effectiveVillages.reduce((sum, v) => sum + v.overdueReferrals, 0);
    const avgAshaCov = total > 0
      ? Math.round(effectiveVillages.reduce((sum, v) => sum + v.ashaCoverage, 0) / total)
      : 0;

    return {
      total,
      critical,
      high,
      moderate,
      stable,
      totalActiveReferrals,
      totalOverdue,
      avgAshaCov,
    };
  }, [effectiveVillages]);

  // Center Hospital Hub coordinates
  const centralHub = { x: 50, y: 50 };

  return (
    <div className={`w-full flex flex-col gap-4 font-sans ${className}`}>
      {/* ── Top Bar / Command Header ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
              <Radio className="w-3 h-3 text-teal-600 animate-pulse" />
              District Surveillance Grid
            </span>
            <DataProvenanceBadge type="prototype_synthetic" size="xs" />
            <DataProvenanceBadge type="rule_based" size="xs" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            Sitapur Catchment Risk Map
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time algorithmic risk stratification across rural PHCs, Sub-Centres, and ASHA field rosters.
          </p>
        </div>

        {/* View mode toggle & Quick actions */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'map'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-teal-600" />
              Map Canvas
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              Grid Cards ({districtStats.total})
            </button>
          </div>
        </div>
      </div>

      {/* ── District Surveillance KPI Bar ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Villages</div>
            <div className="text-xl font-bold text-slate-900">{districtStats.total} Villages</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Critical Alerts</div>
            <div className="text-xl font-bold text-rose-600">
              {districtStats.critical} <span className="text-xs font-normal text-slate-500">village</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-700 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">High Risk Tiers</div>
            <div className="text-xl font-bold text-orange-600">
              {districtStats.high} <span className="text-xs font-normal text-slate-500">villages</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Active Referrals</div>
            <div className="text-xl font-bold text-indigo-700">
              {districtStats.totalActiveReferrals}{' '}
              {districtStats.totalOverdue > 0 && (
                <span className="text-xs font-bold text-rose-600">({districtStats.totalOverdue} overdue)</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">ASHA Coverage</div>
            <div className="text-xl font-bold text-emerald-700">{districtStats.avgAshaCov}% Avg</div>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Risk level chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </span>

          <button
            type="button"
            onClick={() => setRiskFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              riskFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({districtStats.total})
          </button>

          <button
            type="button"
            onClick={() => setRiskFilter('CRITICAL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              riskFilter === 'CRITICAL'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Critical ({districtStats.critical})
          </button>

          <button
            type="button"
            onClick={() => setRiskFilter('HIGH')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              riskFilter === 'HIGH'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            High ({districtStats.high})
          </button>

          <button
            type="button"
            onClick={() => setRiskFilter('MODERATE')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              riskFilter === 'MODERATE'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Moderate ({districtStats.moderate})
          </button>

          <button
            type="button"
            onClick={() => setRiskFilter('STABLE')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              riskFilter === 'STABLE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Stable ({districtStats.stable})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] flex-1 sm:flex-initial">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search village or district..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── Main Map Canvas / Grid Container with Inline Drawer ─────────────── */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        {viewMode === 'map' ? (
          <div className="relative w-full min-h-[680px] lg:min-h-[720px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 select-none overflow-hidden">
            {/* ── SVG Graphic Layer: Transit Corridors, Waterway & Radar Rings ─ */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <defs>
                {/* Tactical grid background pattern */}
                <pattern id="tactical-grid" width="5" height="5" patternUnits="userSpaceOnUse">
                  <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(51, 65, 85, 0.25)" strokeWidth="0.2" />
                </pattern>

                {/* Corridor Gradients */}
                <linearGradient id="critical-corridor" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity="0.2" />
                </linearGradient>

                <linearGradient id="river-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.08" />
                  <stop offset="50%" stopColor="#0284c7" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#0369a1" stopOpacity="0.06" />
                </linearGradient>

                {/* Radar beacon filter */}
                <filter id="glow-beacon" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Dotted Tactical Grid */}
              <rect width="100%" height="100%" fill="url(#tactical-grid)" />

              {/* Sharda River Basin Stylized Corridor */}
              <path
                d="M 68 0 Q 78 20, 72 45 T 84 80 T 92 100"
                fill="none"
                stroke="url(#river-gradient)"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M 68 0 Q 78 20, 72 45 T 84 80 T 92 100"
                fill="none"
                stroke="rgba(6, 182, 212, 0.35)"
                strokeWidth="0.5"
                strokeDasharray="2,3"
              />

              {/* District Boundary Contour line */}
              <path
                d="M 8 14 C 30 6, 70 8, 92 12 C 96 35, 94 68, 90 90 C 70 95, 30 94, 10 88 C 6 62, 5 35, 8 14 Z"
                fill="none"
                stroke="rgba(148, 163, 184, 0.15)"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />

              {/* Surveillance Radar Rings centered at DH */}
              <circle
                cx={centralHub.x}
                cy={centralHub.y}
                r="16"
                fill="none"
                stroke="rgba(20, 184, 166, 0.16)"
                strokeWidth="0.4"
                strokeDasharray="1.5,2.5"
              />
              <circle
                cx={centralHub.x}
                cy={centralHub.y}
                r="30"
                fill="none"
                stroke="rgba(20, 184, 166, 0.1)"
                strokeWidth="0.3"
                strokeDasharray="2,4"
              />
              <circle
                cx={centralHub.x}
                cy={centralHub.y}
                r="42"
                fill="none"
                stroke="rgba(20, 184, 166, 0.06)"
                strokeWidth="0.3"
              />

              {/* Feeder Corridor between Sonpur Tola and Rampur Kalan */}
              <line
                x1="80"
                y1="23"
                x2="50"
                y2="19"
                stroke="rgba(244, 63, 94, 0.35)"
                strokeWidth="0.4"
                strokeDasharray="1.5,2"
              />

              {/* Dynamic Referral Transit Corridors from Villages to Central DH Hub */}
              {effectiveVillages.map((v, i) => {
                const coord = getVillageCoordinates(v, i, effectiveVillages.length);
                const theme = RISK_CONFIG[v.riskLevel];
                const isCritical = v.riskLevel === 'CRITICAL';
                const isSelected = v.villageId === activeSelectedId;

                return (
                  <g key={`corridor-${v.villageId}`}>
                    {/* Shadow Corridor Line */}
                    <line
                      x1={coord.x}
                      y1={coord.y}
                      x2={centralHub.x}
                      y2={centralHub.y}
                      stroke={theme.corridorColor}
                      strokeWidth={isSelected ? '0.9' : isCritical ? '0.75' : '0.4'}
                      strokeDasharray={isSelected ? '2,2' : theme.corridorDash}
                      strokeOpacity={isSelected ? 0.9 : isCritical ? 0.8 : 0.4}
                    />

                    {/* Animated Pulse Beacon on Critical Route */}
                    {isCritical && (
                      <circle
                        cx={(coord.x + centralHub.x) / 2}
                        cy={(coord.y + centralHub.y) / 2}
                        r="0.8"
                        fill="#f43f5e"
                        filter="url(#glow-beacon)"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* ── River Basin Watermark Label ─────────────────────────────── */}
            <div className="absolute right-6 top-6 pointer-events-none text-right hidden sm:block">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-500/40 font-semibold block">
                River Basin Catchment
              </span>
              <span className="text-[11px] font-mono text-cyan-400/60 block">Sharda Feeder Zone</span>
            </div>

            {/* ── Central District Hospital / Command Hub Node ─────────────── */}
            <div
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-default"
              style={{ left: `${centralHub.x}%`, top: `${centralHub.y}%` }}
            >
              <div className="relative group flex flex-col items-center">
                {/* Central radar glow */}
                <div className="absolute -inset-3 rounded-full bg-teal-500/20 blur-md animate-pulse" />
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border-2 border-teal-400/80 shadow-[0_0_24px_rgba(20,184,166,0.35)] flex items-center justify-center text-teal-300 relative z-10 transition-transform group-hover:scale-110">
                  <Building2 className="w-6 h-6 text-teal-400" />
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-teal-500 flex items-center justify-center text-[8px] font-bold text-slate-950">
                    +
                  </span>
                </div>

                <div className="mt-2 text-center bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full border border-teal-500/30 shadow-lg">
                  <div className="text-[11px] font-bold text-teal-300 whitespace-nowrap flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                    Sitapur District Hospital
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                    Referral Hub · 108 Command
                  </div>
                </div>
              </div>
            </div>

            {/* ── Village Interactive Nodes Layer ─────────────────────────── */}
            {filteredVillages.map((village, idx) => {
              const coord = getVillageCoordinates(village, idx, filteredVillages.length);
              const theme = RISK_CONFIG[village.riskLevel];
              const isSelected = village.villageId === activeSelectedId;
              const hasAlert = Boolean(village.topAlert);

              return (
                <div
                  key={village.villageId}
                  onClick={() => handleVillageClick(village.villageId)}
                  className={`absolute z-30 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                    isSelected ? 'scale-105 z-40' : 'hover:scale-102 hover:z-35'
                  }`}
                  style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
                >
                  {/* Village Node Card */}
                  <div
                    className={`relative rounded-xl backdrop-blur-md p-2.5 sm:p-3 min-w-[190px] sm:min-w-[210px] max-w-[240px] border transition-all ${
                      isSelected
                        ? `bg-slate-900/95 ${theme.cardBorderActive} ${theme.cardGlow}`
                        : `bg-slate-900/90 ${theme.cardBorder} shadow-lg`
                    }`}
                  >
                    {/* Alert Beacon on CRITICAL / HIGH */}
                    {(village.riskLevel === 'CRITICAL' || village.riskLevel === 'HIGH') && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.pulseBg} opacity-75`} />
                        <span className={`relative inline-flex rounded-full h-4 w-4 ${theme.dotBg} items-center justify-center text-[9px] text-white font-bold`}>
                          !
                        </span>
                      </span>
                    )}

                    {/* Node Header: Status dot, Name, Risk Pill */}
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${theme.dotBg} ${village.riskLevel === 'CRITICAL' ? 'animate-pulse' : ''}`} />
                        <span className="text-xs font-bold text-slate-100 truncate tracking-tight">
                          {village.villageName}
                        </span>
                      </div>

                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border shrink-0 ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
                      >
                        {village.riskLevel}
                      </span>
                    </div>

                    {/* Sector / PHC Tag */}
                    <div className="text-[10px] text-slate-400 flex items-center justify-between mb-2">
                      <span className="truncate">{coord.sector}</span>
                      <span className="font-mono text-[9px] text-slate-500 ml-1 shrink-0">Sitapur</span>
                    </div>

                    {/* Indicators Strip: Active Referrals, Overdue, ASHA Cov */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-800 text-[10px]">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400">Referrals</span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-200">{village.activeReferrals} act</span>
                          {village.overdueReferrals > 0 && (
                            <span className="text-[9px] font-bold text-rose-400 bg-rose-950/60 px-1 rounded border border-rose-900/60">
                              {village.overdueReferrals} ovd
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400">ASHA Cov</span>
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-400 rounded-full"
                              style={{ width: `${Math.min(100, village.ashaCoverage)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[9px] font-bold text-teal-300">
                            {village.ashaCoverage}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Top Trend Alert Indicator */}
                    <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-1">
                      {hasAlert && village.topAlert ? (
                        <div className="flex items-center gap-1 text-[10px] text-amber-300 font-semibold truncate">
                          <TrendingUp className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">
                            {village.topAlert.metric}: {village.topAlert.changePercent > 0 ? '+' : ''}
                            {village.topAlert.changePercent}%
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>Baseline stable</span>
                        </div>
                      )}

                      <span className="text-[9px] text-slate-500 group-hover:text-slate-300 shrink-0 font-semibold flex items-center">
                        Inspect <ChevronRight className="w-2.5 h-2.5 ml-0.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* ── Map Canvas Legend & Info Box ────────────────────────────── */}
            <div className="absolute left-4 bottom-4 z-20 bg-slate-900/90 backdrop-blur-md rounded-xl p-3 border border-slate-800 text-white shadow-xl max-w-xs hidden sm:block">
              <div className="text-[11px] font-bold text-slate-200 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-teal-400" />
                  Corridor Legend
                </span>
                <span className="text-[9px] font-mono text-slate-500">NH-24 Public Ring</span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-300">STABLE (Low Risk)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-slate-300">MODERATE (Watch)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  <span className="text-slate-300">HIGH (Review)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-rose-400 font-bold">CRITICAL (Escalate)</span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800 text-[9px] text-slate-400 flex items-center justify-between">
                <span>Central: District Hospital 108 Hub</span>
                <span className="text-cyan-400">Feeder Routes: Active</span>
              </div>
            </div>
          </div>
        ) : (
          /* ── Grid Cards View Mode ───────────────────────────────────────── */
          <div className="p-4 sm:p-6 bg-slate-950 min-h-[500px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVillages.map((v, i) => {
                const theme = RISK_CONFIG[v.riskLevel];
                const isSelected = v.villageId === activeSelectedId;
                const coord = getVillageCoordinates(v, i, filteredVillages.length);

                return (
                  <div
                    key={v.villageId}
                    onClick={() => handleVillageClick(v.villageId)}
                    className={`rounded-xl p-4 cursor-pointer transition-all border ${
                      isSelected
                        ? `bg-slate-900 ${theme.cardBorderActive} ${theme.cardGlow}`
                        : `bg-slate-900/80 ${theme.cardBorder} hover:bg-slate-900`
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${theme.dotBg}`} />
                          <h3 className="text-base font-bold text-white tracking-tight">{v.villageName}</h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{coord.sector} · Sitapur</p>
                      </div>

                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
                      >
                        {v.riskLevel}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400">Active Referrals</div>
                        <div className="font-bold text-slate-200">
                          {v.activeReferrals}{' '}
                          {v.overdueReferrals > 0 && (
                            <span className="text-rose-400 text-[10px] font-bold">({v.overdueReferrals} overdue)</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400">ASHA Coverage</div>
                        <div className="font-bold text-teal-400">{v.ashaCoverage}% Surveyed</div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400">High Risk HH</div>
                        <div className="font-bold text-amber-400">{v.highRiskHouseholds} homes</div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400">Pending Follow-up</div>
                        <div className="font-bold text-slate-300">{v.pendingFollowUps} visits</div>
                      </div>
                    </div>

                    {v.topAlert ? (
                      <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 flex items-center justify-between">
                        <span className="truncate flex items-center gap-1.5 font-medium">
                          <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          {v.topAlert.metric}: {v.topAlert.changePercent > 0 ? '+' : ''}
                          {v.topAlert.changePercent}% vs baseline
                        </span>
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider shrink-0 ml-1">
                          {v.topAlert.severity}
                        </span>
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>No acute symptom spikes reported</span>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <span className="text-slate-400 text-[11px]">Primary link: {coord.phcLink}</span>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleVillageClick(v.villageId);
                        }}
                        className="text-teal-400 font-semibold hover:text-teal-300 flex items-center gap-1"
                      >
                        Inspect <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Inline Detail Drawer ────────────────────────────────────────── */}
        <AnimatePresence>
          {isDrawerOpen && selectedVillage && (
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 240 }}
              className="absolute right-0 top-0 bottom-0 z-50 w-full sm:w-[420px] bg-slate-900/98 backdrop-blur-xl border-l border-slate-800 text-white shadow-2xl flex flex-col overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-3 sticky top-0 bg-slate-900/98 backdrop-blur-md z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                        RISK_CONFIG[selectedVillage.riskLevel].badgeBg
                      } ${RISK_CONFIG[selectedVillage.riskLevel].badgeText} ${
                        RISK_CONFIG[selectedVillage.riskLevel].badgeBorder
                      }`}
                    >
                      {selectedVillage.riskLevel} TIER
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: {selectedVillage.villageId.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white tracking-tight">{selectedVillage.villageName}</h3>
                  <p className="text-xs text-slate-400">
                    {selectedVillage.district} District · {selectedVillage.state}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Close detail drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body Content */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col gap-4 text-xs">
                {/* Surveillance Provenance Tags */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <DataProvenanceBadge type="prototype_synthetic" size="xs" />
                  <DataProvenanceBadge type="rule_based" size="xs" />
                </div>

                {/* Key Metrics Grid (4 cards) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Active Referrals</span>
                      <Activity className="w-3.5 h-3.5 text-teal-400" />
                    </div>
                    <div className="text-xl font-bold text-slate-100 mt-1">
                      {selectedVillage.activeReferrals}
                    </div>
                    {selectedVillage.overdueReferrals > 0 ? (
                      <div className="text-[10px] font-bold text-rose-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-rose-400" />
                        {selectedVillage.overdueReferrals} overdue for consult
                      </div>
                    ) : (
                      <div className="text-[10px] text-emerald-400 mt-0.5">0 overdue cases</div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 flex items-center justify-between">
                      <span>ASHA Coverage</span>
                      <Users className="w-3.5 h-3.5 text-teal-400" />
                    </div>
                    <div className="text-xl font-bold text-teal-300 mt-1">
                      {selectedVillage.ashaCoverage}%
                    </div>
                    <div className="mt-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-400 rounded-full"
                        style={{ width: `${Math.min(100, selectedVillage.ashaCoverage)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 flex items-center justify-between">
                      <span>High Risk HH</span>
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="text-xl font-bold text-amber-300 mt-1">
                      {selectedVillage.highRiskHouseholds}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Households flagged</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Pending Follow-ups</span>
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="text-xl font-bold text-indigo-300 mt-1">
                      {selectedVillage.pendingFollowUps}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">ASHA visits queued</div>
                  </div>
                </div>

                {/* Early Warning Alert Box */}
                <div className="rounded-xl border p-3.5 bg-slate-950/80 border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-teal-400" />
                      Early Warning Health Signal
                    </span>
                    {selectedVillage.topAlert ? (
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                          selectedVillage.topAlert.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        }`}
                      >
                        {selectedVillage.topAlert.severity} ALERT
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        NORMAL
                      </span>
                    )}
                  </div>

                  {selectedVillage.topAlert ? (
                    <div className="space-y-2">
                      <div className="font-bold text-slate-100 text-sm">
                        {selectedVillage.topAlert.title}
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        {selectedVillage.topAlert.description}
                      </p>

                      {/* Evidence points */}
                      {selectedVillage.topAlert.evidence && selectedVillage.topAlert.evidence.length > 0 && (
                        <div className="pt-2 border-t border-slate-800">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Evidence Basis (ASHA Field Data)
                          </span>
                          <ul className="mt-1 space-y-1 text-[11px] text-slate-300">
                            {selectedVillage.topAlert.evidence.map((ev, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-teal-400 shrink-0">•</span>
                                <span>{ev}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action recommendation */}
                      <div className="p-2.5 rounded-lg bg-teal-950/40 border border-teal-800/50 mt-2">
                        <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider mb-0.5">
                          Recommended Action (Human In The Loop)
                        </div>
                        <div className="text-slate-200 text-xs">
                          {selectedVillage.topAlert.recommendedAction}
                        </div>
                        <div className="text-[10px] text-teal-300 mt-1 font-mono">
                          Assigned to: {selectedVillage.topAlert.assignedRole.toUpperCase()} Medical Review
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-center text-slate-400 text-xs">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
                      <p className="font-semibold text-slate-200">Routine Surveillance Normal</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        No symptom spikes exceeding evidence thresholds detected.
                      </p>
                    </div>
                  )}
                </div>

                {/* Facility & Corridor Network Linkage */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Health Network Corridor
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Assigned Primary Center:</span>
                    <span className="font-semibold text-white">PHC Rampur Kalan</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Emergency Ambulance Route:</span>
                    <span className="font-semibold text-teal-300">108 Sitapur Corridor</span>
                  </div>
                </div>

                {/* Clinical Disclaimer */}
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 text-[10px] text-slate-400 leading-relaxed">
                  <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>
                    Sentinel surveillance detects statistical symptom reporting trends to prioritize ASHA field
                    visits and PHC Medical Officer review. Does not constitute medical diagnosis.
                  </span>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/98 sticky bottom-0 z-10 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleAshaHubNavigation(selectedVillage.villageId)}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30 transition-all active:scale-98 cursor-pointer"
                >
                  <Building2 className="w-4 h-4" />
                  View ASHA Hub
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full py-2 px-3 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  Back to Full Map Canvas
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VillageRiskMap;

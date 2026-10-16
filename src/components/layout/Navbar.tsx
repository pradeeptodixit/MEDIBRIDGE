import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Menu,
  X,
  Activity,
  Zap,
  Building2,
  BarChart3,
  Sparkles,
  Clock,
  Stethoscope,
  ChevronDown,
  Users,
  FileText,
  BookOpen,
  Info,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { DemoModePanel } from '../ui/DemoModePanel';
import { MediBridgeLogo } from '../ui/MediBridgeLogo';
import { clearUserRole } from '../../services/hospitalPartnerService';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

interface OperationItem {
  to: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
}

const MAIN_NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: <Heart size={14} /> },
  { to: '/family', label: 'Family', icon: <Users size={14} /> },
  { to: '/assessment', label: 'Triage', icon: <Activity size={14} /> },
  { to: '/care-journey', label: 'Care Journey', icon: <Clock size={14} /> },
  { to: '/schemes', label: 'Schemes', icon: <FileText size={14} /> },
];

const OPERATIONS_ITEMS: OperationItem[] = [
  {
    to: '/village-health',
    label: 'ASHA Field Hub',
    desc: 'Community & frontline health',
    icon: <Building2 size={16} />,
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-50 border-teal-200/80',
  },
  {
    to: '/facility-matching',
    label: 'Facility Matching',
    desc: 'Explainable PHC / CHC scoring',
    icon: <Sparkles size={16} />,
    iconColor: 'text-sky-600',
    iconBg: 'bg-sky-50 border-sky-200/80',
  },
  {
    to: '/facility',
    label: 'PHC Care Desk',
    desc: 'Referral & care coordination',
    icon: <Stethoscope size={16} />,
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50 border-violet-200/80',
  },
  {
    to: '/impact',
    label: 'Command Center',
    desc: 'Health operations & signals',
    icon: <BarChart3 size={16} />,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50 border-indigo-200/80',
  },
];

const SECONDARY_LINKS = [
  { to: '/hospital', label: 'Hospital Dashboard', icon: <Building2 size={14} /> },
  { to: '/admin', label: 'Platform Admin', icon: <Shield size={14} /> },
  { to: '/schemes', label: 'Government Schemes', icon: <FileText size={14} /> },
  { to: '/resources', label: 'First-Aid Resources', icon: <BookOpen size={14} /> },
  { to: '/about', label: 'About', icon: <Info size={14} /> },
];

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [operationsOpen, setOperationsOpen] = useState(false);
  const [showDemoPanel, setShowDemoPanel] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const operationsRef = useRef<HTMLLIElement>(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Scroll elevation listener
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside and escape key listener for dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (operationsRef.current && !operationsRef.current.contains(e.target as Node)) {
        setOperationsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOperationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Active route checking
  const isHomeActive = pathname === '/';
  const isFamilyActive = pathname.startsWith('/family');
  const isTriageActive = pathname === '/assessment';
  const isCareJourneyActive = pathname.startsWith('/care-journey');
  const isOperationsActive = OPERATIONS_ITEMS.some(item => pathname.startsWith(item.to));

  const isNavActive = (path: string) => {
    if (path === '/') return isHomeActive;
    if (path === '/family') return isFamilyActive;
    if (path === '/assessment') return isTriageActive;
    if (path === '/care-journey') return isCareJourneyActive;
    return pathname.startsWith(path);
  };

  return (
    <header
      className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md transition-all duration-200 ${
        isScrolled
          ? 'border-b border-slate-200/90 shadow-xs'
          : 'border-b border-slate-200/60 shadow-2xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav
          className="flex items-center justify-between h-16"
          aria-label="Main navigation"
        >
          {/* ─── LEFT: BRANDING ─── */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-xl"
            aria-label="MediBridge AI Home"
          >
            <MediBridgeLogo animated />
            <div className="flex items-baseline gap-1">
              <span className="font-display font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                MediBridge
              </span>
              <span className="text-teal-600 font-extrabold text-sm sm:text-base tracking-wide">
                AI
              </span>
            </div>
          </Link>

          {/* ─── CENTER: MAIN NAVIGATION (Clean, unified hierarchy) ─── */}
          <ul className="hidden lg:flex items-center gap-1 xl:gap-1.5" role="list">
            {MAIN_NAV_ITEMS.map(item => {
              const active = isNavActive(item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200/80 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className={active ? 'text-teal-700' : 'text-slate-400 group-hover:text-slate-600'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}

            {/* Operations Dropdown */}
            <li className="relative" ref={operationsRef}>
              <button
                type="button"
                onClick={() => setOperationsOpen(!operationsOpen)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  isOperationsActive
                    ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                }`}
                aria-haspopup="true"
                aria-expanded={operationsOpen}
                id="operations-menu-btn"
              >
                <span className={isOperationsActive ? 'text-teal-700' : 'text-slate-400'}>
                  <Building2 size={14} />
                </span>
                <span>Operations</span>
                <ChevronDown
                  size={12}
                  className={`text-slate-400 transition-transform duration-200 ${
                    operationsOpen ? 'rotate-180 text-teal-700' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              <AnimatePresence>
                {operationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 focus:outline-none"
                    role="menu"
                    aria-labelledby="operations-menu-btn"
                  >
                    <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Operations Management
                    </div>
                    <div className="space-y-1">
                      {OPERATIONS_ITEMS.map(item => {
                        const active = pathname.startsWith(item.to);
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setOperationsOpen(false)}
                            className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                              active
                                ? 'bg-teal-50/90 text-slate-900 border border-teal-200/70'
                                : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-transparent'
                            }`}
                            role="menuitem"
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${item.iconBg} ${item.iconColor}`}
                            >
                              {item.icon}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {item.label}
                                </span>
                                {active && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                                {item.desc}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          </ul>

          {/* ─── RIGHT: ACTIONS (Emergency, Demo, Start Triage) ─── */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {/* 0. Role Switcher Pill */}
            <button
              type="button"
              onClick={() => {
                clearUserRole();
                navigate('/role-select');
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 cursor-pointer"
              title="Current: Patient View. Click to switch to Hospital or Admin"
            >
              <span>🧑</span>
              <span className="font-bold">Patient</span>
              <span className="text-[10px] text-slate-400 font-normal">Switch</span>
            </button>

            {/* 1. Emergency Safety Button (Compact, visible, distinct) */}
            <Link
              to="/emergency"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100/90 border border-rose-200/80 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              aria-label="108 Emergency Escalation"
            >
              <Zap size={13} className="text-rose-600 fill-rose-600/20" />
              <span>Emergency</span>
              <span className="text-[10px] font-extrabold px-1 rounded bg-rose-200/60 text-rose-900">
                108
              </span>
            </Link>

            {/* 2. Demo Scenarios (Secondary action) */}
            <button
              type="button"
              onClick={() => setShowDemoPanel(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/70 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              title="Open Demo Scenarios for evaluation"
              id="nav-load-demo"
            >
              <Sparkles size={13} className="text-amber-500" />
              <span>Demo</span>
            </button>

            {/* 3. Primary CTA: Start Triage (Dominant, elegant) */}
            <button
              type="button"
              onClick={() => navigate('/assessment')}
              className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              id="nav-start-assessment"
            >
              <span>Start Triage</span>
              <ArrowRight size={13} className="opacity-80" />
            </button>
          </div>

          {/* ─── MOBILE: HAMBURGER TOGGLE BUTTON ─── */}
          <button
            type="button"
            className="lg:hidden p-2 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </div>

      {/* ─── MOBILE DRAWER ─── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="lg:hidden bg-white border-t border-slate-100 shadow-lg max-h-[85vh] overflow-y-auto"
          >
            <div className="px-4 py-4 space-y-4">
              {/* Main Navigation Links */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1">
                  Main Navigation
                </p>
                <ul className="space-y-1" role="list">
                  {MAIN_NAV_ITEMS.map(item => {
                    const active = isNavActive(item.to);
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                            active
                              ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200/80'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className={active ? 'text-teal-600' : 'text-slate-400'}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Operations Section */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1">
                  Operations
                </p>
                <ul className="space-y-1" role="list">
                  {OPERATIONS_ITEMS.map(item => {
                    const active = pathname.startsWith(item.to);
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm transition-colors ${
                            active
                              ? 'bg-teal-50/80 text-slate-900 font-semibold border border-teal-200/70'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${item.iconBg} ${item.iconColor}`}
                          >
                            {item.icon}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{item.label}</div>
                            <div className="text-[11px] text-slate-500">{item.desc}</div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Secondary Information Links */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1">
                  Resources
                </p>
                <ul className="grid grid-cols-3 gap-1" role="list">
                  {SECONDARY_LINKS.map(item => (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex flex-col items-center text-center p-2 rounded-xl text-[11px] text-slate-600 hover:text-teal-700 hover:bg-slate-50 transition-colors"
                      >
                        <span className="mb-1 text-slate-400">{item.icon}</span>
                        <span className="truncate w-full">{item.label.split(' ')[0]}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons Stack */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    clearUserRole();
                    navigate('/role-select');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
                >
                  <span>🧑 Currently Patient — Switch Role</span>
                </button>

                <Link
                  to="/emergency"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                >
                  <Zap size={14} className="text-rose-600 fill-rose-600/20" />
                  <span>108 Emergency Escalation</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowDemoPanel(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition-colors"
                >
                  <Sparkles size={14} className="text-amber-600" />
                  <span>Demo Scenarios</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/assessment');
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs"
                >
                  <span>Start Triage</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo Mode Modal */}
      <DemoModePanel isOpen={showDemoPanel} onClose={() => setShowDemoPanel(false)} />
    </header>
  );
};
import React from 'react';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  TrendingUp,
  FileText,
  CreditCard,
  Building2,
  Settings,
  Percent,
} from 'lucide-react';
import { getActiveHospital } from '../../services/hospitalPartnerService';

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  badgeColor?: string;
}

interface HospitalSidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  pendingReferralsCount?: number;
  unbilledTreatmentsCount?: number;
}

export const HospitalSidebar: React.FC<HospitalSidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingReferralsCount = 0,
  unbilledTreatmentsCount = 0,
}) => {
  const activeHospital = getActiveHospital();

  const NAV_ITEMS: SidebarItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard size={18} />,
    },
    {
      id: 'referrals',
      label: 'Referrals',
      icon: <Users size={18} />,
      badge: pendingReferralsCount > 0 ? pendingReferralsCount : undefined,
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
    },
    {
      id: 'treatments',
      label: 'Treatments',
      icon: <Stethoscope size={18} />,
      badge: unbilledTreatmentsCount > 0 ? `${unbilledTreatmentsCount} billable` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'revenue',
      label: 'Revenue',
      icon: <TrendingUp size={18} />,
    },
    {
      id: 'invoices',
      label: 'Invoices',
      icon: <FileText size={18} />,
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: <CreditCard size={18} />,
    },
    {
      id: 'profile',
      label: 'Hospital Profile',
      icon: <Building2 size={18} />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={18} />,
    },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-6">
        {/* Hospital Card Summary */}
        <div className="bg-gradient-to-br from-slate-900 to-sky-950 text-white p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
              Active Hospital
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
              {activeHospital.commissionRate}%
            </span>
          </div>
          <h3 className="font-bold text-sm leading-snug truncate text-white">
            {activeHospital.name}
          </h3>
          <p className="text-[11px] text-slate-300 mt-0.5">
            {activeHospital.district}, {activeHospital.state}
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-50 text-sky-900 font-bold border border-sky-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-sky-600' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor || 'bg-slate-100 text-slate-700'}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Commission Policy Note */}
      <div className="p-4 m-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] mb-1">
          <Percent size={13} className="text-emerald-600" />
          <span>Commission Rule</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          MediBridge commission is only payable on completed treatments once final bill is recorded.
        </p>
      </div>
    </aside>
  );
};
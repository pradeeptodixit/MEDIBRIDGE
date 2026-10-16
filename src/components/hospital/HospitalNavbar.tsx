import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronDown,
  Percent,
  LogOut,
  Shield,
} from 'lucide-react';
import { MediBridgeLogo } from '../ui/MediBridgeLogo';
import {
  getHospitals,
  getActiveHospital,
  setActiveHospitalId,
  setUserRole,
  logoutHospital,
  isAdminAuthenticated,
} from '../../services/hospitalPartnerService';

export const HospitalNavbar: React.FC = () => {
  const navigate = useNavigate();
  const hospitals = getHospitals();
  const activeHospital = getActiveHospital();
  const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);

  const handleSwitchHospital = (id: string) => {
    setActiveHospitalId(id);
    setShowHospitalDropdown(false);
  };

  const handleSwitchToPatient = () => {
    setUserRole('patient');
    navigate('/');
  };

  const handleSwitchToAdmin = () => {
    if (isAdminAuthenticated()) {
      setUserRole('admin');
      navigate('/admin');
    } else {
      navigate('/admin-login');
    }
  };

  const handleLogout = () => {
    logoutHospital();
    navigate('/hospital-login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: MediBridge Brand & Partner Tag */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <MediBridgeLogo animated size={28} />
              <div className="flex items-baseline gap-1">
                <span className="font-display font-black text-slate-900 text-base sm:text-lg tracking-tight">
                  MediBridge
                </span>
                <span className="text-sky-600 font-extrabold text-sm sm:text-base tracking-wide">
                  PARTNER
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline-block text-slate-300 font-light">|</span>

            {/* Hospital Account Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowHospitalDropdown(!showHospitalDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
                title="Switch hospital account to verify multi-tenant data isolation"
              >
                <Building2 size={16} className="text-sky-600 shrink-0" />
                <div className="hidden sm:block">
                  <div className="font-bold text-xs text-slate-900 leading-tight truncate max-w-[200px]">
                    {activeHospital.name}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span>Agreement:</span>
                    <span className="font-bold text-sky-700">{activeHospital.commissionRate}% comm.</span>
                  </div>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {/* Hospital Account Dropdown */}
              {showHospitalDropdown && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50">
                  <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Switch Hospital (Isolated Accounts)
                  </div>
                  <div className="space-y-1 mt-1">
                    {hospitals.map(h => (
                      <button
                        key={h.id}
                        onClick={() => handleSwitchHospital(h.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          h.id === activeHospital.id
                            ? 'bg-sky-50 text-sky-900 font-bold border border-sky-200'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <div className="truncate font-semibold">{h.name}</div>
                          <div className="text-[10px] text-slate-400">{h.district}</div>
                        </div>
                        <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                          {h.commissionRate}%
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Commission Policy Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <Percent size={13} className="text-emerald-600" />
              <span>{activeHospital.commissionRate}% Treatment Commission</span>
            </div>

            {/* Switch to Patient Button */}
            <button
              onClick={handleSwitchToPatient}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-semibold text-xs transition-colors cursor-pointer"
              title="Open Patient Portal (Citizen Triage & Records)"
            >
              <span>🧑</span>
              <span className="hidden sm:inline">Patient Portal</span>
            </button>

            {/* Switch to Admin Button */}
            <button
              onClick={handleSwitchToAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              title="Open MediBridge Platform Admin"
            >
              <Shield size={13} className="text-slate-600" />
              <span className="hidden sm:inline">Platform Admin</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Sign out of Hospital Partner Portal"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
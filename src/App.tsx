import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { FloatingEmergencyButton } from './components/ui/FloatingEmergencyButton';
import { ToastContainer } from './components/ui/Toast';
import { LiteModeBanner } from './components/ui/LiteModeBanner';
import { useToast } from './hooks/useToast';
import { isHospitalAuthenticated, isAdminAuthenticated, setUserRole } from './services/hospitalPartnerService';

// Ensure any stale legacy role in localStorage is removed on load
try {
  localStorage.removeItem('mb_user_role');
} catch {}

// Lazy-loaded pages for performance
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const AssessmentPage = lazy(() => import('./pages/AssessmentPage').then(m => ({ default: m.AssessmentPage })));
const ReportPage = lazy(() => import('./pages/ReportPage').then(m => ({ default: m.ReportPage })));
const EmergencyPage = lazy(() => import('./pages/EmergencyPage').then(m => ({ default: m.EmergencyPage })));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage').then(m => ({ default: m.ResourcesPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const TimelinePage = lazy(() => import('./pages/TimelinePage').then(m => ({ default: m.TimelinePage })));
const VillageHealthPage = lazy(() => import('./pages/VillageHealthPage').then(m => ({ default: m.VillageHealthPage })));
const FacilityDashboardPage = lazy(() => import('./pages/FacilityDashboardPage').then(m => ({ default: m.FacilityDashboardPage })));
const SchemesPage = lazy(() => import('./pages/SchemesPage').then(m => ({ default: m.SchemesPage })));
const ImpactDashboardPage = lazy(() => import('./pages/ImpactDashboardPage').then(m => ({ default: m.ImpactDashboardPage })));
const FamilyPage = lazy(() => import('./pages/FamilyPage').then(m => ({ default: m.FamilyPage })));
const FamilyMemberJourneyPage = lazy(() => import('./pages/FamilyMemberJourneyPage').then(m => ({ default: m.FamilyMemberJourneyPage })));
const FacilityPage = lazy(() => import('./pages/FacilityPage').then(m => ({ default: m.FacilityPage })));

// Auth-guarded portal pages
const HospitalAuthGuard = lazy(() => import('./components/hospital/HospitalAuthGuard').then(m => ({ default: m.HospitalAuthGuard })));
const AdminAuthGuard = lazy(() => import('./components/hospital/AdminAuthGuard').then(m => ({ default: m.AdminAuthGuard })));

// Login pages
const HospitalLoginPage = lazy(() => import('./pages/HospitalLoginPage').then(m => ({ default: m.HospitalLoginPage })));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));

// Role selection
const RoleSelectionScreen = lazy(() => import('./components/ui/RoleSelectionScreen').then(m => ({ default: m.RoleSelectionScreen })));

// Loading skeleton
const PageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"
        style={{ borderWidth: '3px' }}
      />
      <p className="text-slate-500 text-sm font-medium">Loading MediBridge AI...</p>
    </div>
  </div>
);

// Page transition wrapper
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

// Smart Root Handler: Welcomes first-time visitors with Role Selection, or serves LandingPage
const HomeOrRoleSelect: React.FC = () => {
  const [role, setRole] = React.useState<string | null>(() => {
    try {
      return sessionStorage.getItem('mb_user_role');
    } catch {
      return null;
    }
  });

  React.useEffect(() => {
    const handleUpdate = () => {
      try {
        setRole(sessionStorage.getItem('mb_user_role'));
      } catch {}
    };
    window.addEventListener('medibridge:hospital_data_updated', handleUpdate);
    return () => window.removeEventListener('medibridge:hospital_data_updated', handleUpdate);
  }, []);

  if (!role) {
    return (
      <RoleSelectionScreen
        onSelectRole={selectedRole => {
          setUserRole(selectedRole);
          setRole(selectedRole);
        }}
      />
    );
  }

  // After role selection, if hospital/admin → go to login (auth guard will redirect appropriately)
  if (role === 'hospital') {
    return isHospitalAuthenticated()
      ? <Navigate to="/hospital" replace />
      : <Navigate to="/hospital-login" replace />;
  }

  if (role === 'admin') {
    return isAdminAuthenticated()
      ? <Navigate to="/admin" replace />
      : <Navigate to="/admin-login" replace />;
  }

  return (
    <PageTransition>
      <LandingPage />
    </PageTransition>
  );
};

// Routes with transitions
const AppRoutes: React.FC = () => {
  const location = useLocation();
  const isEmergency = location.pathname === '/emergency';
  const isIsolatedPortal =
    location.pathname.startsWith('/hospital') ||
    location.pathname.startsWith('/admin') ||
    location.pathname === '/role-select';

  const [currentRole, setCurrentRole] = React.useState<string | null>(() => {
    try {
      return sessionStorage.getItem('mb_user_role');
    } catch {
      return null;
    }
  });

  React.useEffect(() => {
    const handleUpdate = () => {
      try {
        setCurrentRole(sessionStorage.getItem('mb_user_role'));
      } catch {}
    };
    window.addEventListener('medibridge:hospital_data_updated', handleUpdate);
    return () => window.removeEventListener('medibridge:hospital_data_updated', handleUpdate);
  }, []);

  // Check if root should display role screen (no patient header/footer in that case)
  const isInitialRoleSelect = location.pathname === '/' && !currentRole;

  const showPatientChrome = !isEmergency && !isIsolatedPortal && !isInitialRoleSelect;

  return (
    <div className="flex flex-col min-h-screen">
      {showPatientChrome && <LiteModeBanner />}
      {showPatientChrome && <Navbar />}

      <main className="flex-1" role="main" id="main-content">
        <Suspense fallback={<PageSkeleton />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* Role Selection Screen */}
              <Route
                path="/role-select"
                element={
                  <RoleSelectionScreen
                    onSelectRole={(r) => {
                      setUserRole(r);
                      if (r === 'hospital') window.location.href = '/hospital-login';
                      else if (r === 'admin') window.location.href = '/admin-login';
                      else window.location.href = '/';
                    }}
                  />
                }
              />

              {/* Hospital Partner — login + guarded dashboard */}
              <Route path="/hospital-login" element={<HospitalLoginPage />} />
              <Route path="/hospital" element={<HospitalAuthGuard />} />

              {/* MediBridge Platform Admin — login + guarded dashboard */}
              <Route path="/admin-login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminAuthGuard />} />

              {/* Root / Patient Home */}
              <Route path="/" element={<HomeOrRoleSelect />} />

              {/* Existing Patient Routes — UNTOUCHED */}
              <Route path="/assessment" element={<PageTransition><AssessmentPage /></PageTransition>} />
              <Route path="/care-journey" element={<PageTransition><TimelinePage /></PageTransition>} />
              <Route path="/timeline" element={<Navigate to="/care-journey" replace />} />
              <Route path="/family" element={<PageTransition><FamilyPage /></PageTransition>} />
              <Route path="/family/:memberId" element={<PageTransition><FamilyMemberJourneyPage /></PageTransition>} />
              <Route path="/village-health" element={<PageTransition><VillageHealthPage /></PageTransition>} />
              <Route path="/facility" element={<PageTransition><FacilityDashboardPage /></PageTransition>} />
              <Route path="/facility-matching" element={<PageTransition><FacilityPage /></PageTransition>} />
              <Route path="/impact" element={<PageTransition><ImpactDashboardPage /></PageTransition>} />
              <Route path="/report" element={<PageTransition><ReportPage /></PageTransition>} />
              <Route path="/schemes" element={<PageTransition><SchemesPage /></PageTransition>} />
              <Route path="/emergency" element={<PageTransition><EmergencyPage /></PageTransition>} />
              <Route path="/resources" element={<PageTransition><ResourcesPage /></PageTransition>} />
              <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
              <Route path="*" element={
                <PageTransition>
                  <div className="min-h-[60vh] flex items-center justify-center flex-col gap-4 px-4">
                    <div className="text-6xl">🏥</div>
                    <h1 className="font-display font-black text-3xl text-slate-900">Page Not Found</h1>
                    <p className="text-slate-500">This page doesn't exist. Let's get you back on track.</p>
                    <a href="/" className="bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-700 transition-colors">
                      Back to Home
                    </a>
                  </div>
                </PageTransition>
              } />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>

      {showPatientChrome && <Footer />}
      {showPatientChrome && <FloatingEmergencyButton />}
    </div>
  );
};

function App() {
  const { toasts, removeToast } = useToast();

  return (
    <BrowserRouter>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 bg-teal-600 text-white px-4 py-2 rounded-lg z-[9999]">
        Skip to main content
      </a>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;

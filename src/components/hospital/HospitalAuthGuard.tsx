import React from 'react';
import { Navigate } from 'react-router-dom';
import { isHospitalAuthenticated } from '../../services/hospitalPartnerService';
import { HospitalDashboardPage } from '../../pages/HospitalDashboardPage';

/** Guards the /hospital route — redirects to /hospital-login if no session exists. */
export const HospitalAuthGuard: React.FC = () => {
  if (!isHospitalAuthenticated()) {
    return <Navigate to="/hospital-login" replace />;
  }
  return <HospitalDashboardPage />;
};

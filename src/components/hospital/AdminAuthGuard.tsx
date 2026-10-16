import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAdminAuthenticated } from '../../services/hospitalPartnerService';
import { AdminDashboardPage } from '../../pages/AdminDashboardPage';

/** Guards the /admin route — redirects to /admin-login if no session exists. */
export const AdminAuthGuard: React.FC = () => {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin-login" replace />;
  }
  return <AdminDashboardPage />;
};
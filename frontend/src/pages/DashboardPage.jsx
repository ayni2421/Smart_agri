/**
 * DashboardPage — role-aware entry point
 *
 * Routes each user to the dashboard built for their role.
 * Admins go directly to /admin.
 */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

import FarmerDashboard    from './dashboards/FarmerDashboard';
import SupplierDashboard  from './dashboards/SupplierDashboard';
import BuyerDashboard     from './dashboards/BuyerDashboard';
import AgentDashboard     from './dashboards/AgentDashboard';
import TransporterDashboard from './dashboards/TransporterDashboard';
import ReviewerDashboard  from './dashboards/ReviewerDashboard';

const ROLE_DASHBOARD = {
  farmer:        FarmerDashboard,
  supplier:      SupplierDashboard,
  buyer:         BuyerDashboard,
  agent:         AgentDashboard,
  transporter:   TransporterDashboard,
  data_reviewer: ReviewerDashboard,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  // Redirect admin straight into the admin panel
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  if (!user) return null;
  if (user.role === 'admin') return null; // navigating away

  const RoleDashboard = ROLE_DASHBOARD[user.role];

  if (!RoleDashboard) {
    // Fallback for any unexpected role
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: 24, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Manrope, sans-serif' }}>Welcome, {user.firstName}</h2>
        <p style={{ color: '#6b7280' }}>Role: <strong>{user.role}</strong></p>
        <p style={{ color: '#6b7280', fontSize: 13 }}>No dashboard is configured for this role yet.</p>
      </div>
    );
  }

  return <RoleDashboard />;
}

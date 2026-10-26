import React, { createContext, useContext, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { authApi } from './services/api';

// ── Auth Context ──────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('samic_token');
    if (token) {
      authApi.me()
        .then((res) => setUser(res.data.user))
        .catch(() => localStorage.removeItem('samic_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('samic_token', token);
    setUser(userData);
  };

  const logout = async () => {
    await authApi.logout().catch(() => {});
    localStorage.removeItem('samic_token');
    setUser(null);
    // RootRoute re-renders automatically and shows LandingPage
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// ── Protected Route ───────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div style={{ padding: 40 }}>
        Access denied. Required role: {roles.join(', ')}.
      </div>
    );
  }
  return children;
};

// ── Lazy page imports ─────────────────────────────────────────────────────────
const LandingPage   = React.lazy(() => import('./pages/LandingPage'));
const LoginPage     = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage  = React.lazy(() => import('./pages/RegisterPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const PricesPage    = React.lazy(() => import('./pages/PricesPage'));
const OrdersPage    = React.lazy(() => import('./pages/OrdersPage'));
const InventoryPage = React.lazy(() => import('./pages/InventoryPage'));
const AnomaliesPage = React.lazy(() => import('./pages/AnomaliesPage'));
const ProfilePage   = React.lazy(() => import('./pages/ProfilePage'));

// ── Admin panel (full layout + sub-pages) ─────────────────────────────────────
const AdminLayout      = React.lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard   = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers       = React.lazy(() => import('./pages/admin/AdminUsers'));
const AdminPrices      = React.lazy(() => import('./pages/admin/AdminPrices'));
const AdminCommodities = React.lazy(() => import('./pages/admin/AdminCommodities'));
const AdminInventory   = React.lazy(() => import('./pages/admin/AdminInventory'));
const AdminOrders      = React.lazy(() => import('./pages/admin/AdminOrders'));
const AdminDeliveries  = React.lazy(() => import('./pages/admin/AdminDeliveries'));
const AdminAnomalies   = React.lazy(() => import('./pages/admin/AdminAnomalies'));
const AdminReports     = React.lazy(() => import('./pages/admin/AdminReports'));
const AdminProfile     = React.lazy(() => import('./pages/admin/AdminProfile'));
const AdminMarkets     = React.lazy(() => import('./pages/admin/AdminMarkets'));
const AdminRoles       = React.lazy(() => import('./pages/admin/AdminRoles'));
const AdminAudit       = React.lazy(() => import('./pages/admin/AdminAudit'));
const AdminSettings    = React.lazy(() => import('./pages/admin/AdminSettings'));

// ── Root: landing for guests, dashboard for authenticated users ───────────────
const RootRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>;
  return user ? <DashboardPage /> : <LandingPage />;
};

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <React.Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>}>
        <Routes>
          {/* Public */}
          <Route path="/"          element={<RootRoute />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/register"  element={<RegisterPage />} />

          {/* Protected — any authenticated role */}
          <Route path="/prices"    element={<ProtectedRoute><PricesPage /></ProtectedRoute>} />
          <Route path="/profile"   element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Protected — specific roles */}
          <Route path="/orders"
            element={
              <ProtectedRoute roles={['buyer', 'supplier', 'admin']}>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route path="/inventory"
            element={
              <ProtectedRoute roles={['supplier', 'agent', 'admin']}>
                <InventoryPage />
              </ProtectedRoute>
            }
          />
          <Route path="/anomalies"
            element={
              <ProtectedRoute roles={['data_reviewer', 'admin']}>
                <AnomaliesPage />
              </ProtectedRoute>
            }
          />

          {/* ── Admin panel — full layout with sidebar ── */}
          <Route path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index          element={<AdminDashboard />} />
            <Route path="users"       element={<AdminUsers />} />
            <Route path="prices"      element={<AdminPrices />} />
            <Route path="commodities" element={<AdminCommodities />} />
            <Route path="markets"     element={<AdminMarkets />} />
            <Route path="inventory"   element={<AdminInventory />} />
            <Route path="orders"      element={<AdminOrders />} />
            <Route path="deliveries"  element={<AdminDeliveries />} />
            <Route path="anomalies"   element={<AdminAnomalies />} />
            <Route path="reports"     element={<AdminReports />} />
            <Route path="roles"       element={<AdminRoles />} />
            <Route path="audit"       element={<AdminAudit />} />
            <Route path="settings"    element={<AdminSettings />} />
            <Route path="profile"     element={<AdminProfile />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    </AuthProvider>
  );
}

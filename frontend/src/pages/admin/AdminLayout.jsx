import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import {
  LayoutDashboard, Users, ShoppingBag, BarChart3,
  Package, Truck, AlertTriangle, FileBarChart, Shield,
  ScrollText, Settings, Bell, Search, ChevronRight,
  LogOut, Menu, X, Wheat, Sprout, MapPin,
} from 'lucide-react';
import './AdminLayout.css';
import './AdminDialogs.css';

const NAV = [
  {
    label: 'MAIN',
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    ],
  },
  {
    label: 'PEOPLE',
    items: [
      { to: '/admin/users', icon: Users, label: 'User Management' },
    ],
  },
  {
    label: 'MARKET INTELLIGENCE',
    items: [
      { to: '/admin/prices',      icon: BarChart3,      label: 'Market Prices' },
      { to: '/admin/commodities', icon: Wheat,          label: 'Commodities' },
      { to: '/admin/markets',     icon: MapPin,         label: 'Markets' },
      { to: '/admin/anomalies',   icon: AlertTriangle,  label: 'Anomaly Review', badge: 'alert' },
    ],
  },
  {
    label: 'SUPPLY CHAIN',
    items: [
      { to: '/admin/inventory',  icon: Package, label: 'Inventory' },
      { to: '/admin/orders',     icon: ShoppingBag, label: 'Orders' },
      { to: '/admin/deliveries', icon: Truck,   label: 'Deliveries' },
    ],
  },
  {
    label: 'PLATFORM',
    items: [
      { to: '/admin/reports', icon: FileBarChart, label: 'Reports & Analytics' },
      { to: '/admin/roles',   icon: Shield,       label: 'Roles & Permissions' },
      { to: '/admin/audit',   icon: ScrollText,   label: 'Audit Logs' },
      { to: '/admin/settings',icon: Settings,     label: 'System Settings' },
    ],
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="adm-shell">
      {/* ── Sidebar ── */}
      <aside className={`adm-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="adm-sidebar-head">
          <Link to="/admin" className="adm-brand">
            <span className="adm-brand-icon"><Sprout size={20} strokeWidth={2.3} /></span>
            <span className="adm-brand-text">AgriMarket<small>Admin Panel</small></span>
          </Link>
          <button className="adm-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <X size={18} />
          </button>
        </div>

        <nav className="adm-nav" aria-label="Admin navigation">
          {NAV.map((group) => (
            <div className="adm-nav-group" key={group.label}>
              <span className="adm-nav-group-label">{group.label}</span>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    className={({ isActive }) => `adm-nav-item ${isActive ? 'is-active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={17} strokeWidth={1.8} />
                    <span>{item.label}</span>
                    {item.badge === 'alert' && <span className="adm-nav-badge" aria-label="Needs attention" />}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="adm-sidebar-foot">
          <NavLink to="/admin/profile" className="adm-user-chip" onClick={() => setSidebarOpen(false)}>
            <div className="adm-avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
            <div className="adm-user-info">
              <strong>{user?.firstName} {user?.lastName}</strong>
              <small>{user?.role}</small>
            </div>
            <ChevronRight size={14} style={{ color: 'rgba(255,255,255,.35)', flexShrink: 0 }} />
          </NavLink>
          <button className="adm-user-menu-item adm-user-menu-danger adm-signout-btn" onClick={handleLogout}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Overlay for mobile ── */}
      {sidebarOpen && (
        <div className="adm-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      {/* ── Main area ── */}
      <div className="adm-main">
        <header className="adm-topbar">
          <button className="adm-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
            <Menu size={20} />
          </button>

          <div className="adm-search-wrap">
            <Search size={15} className="adm-search-icon" />
            <input className="adm-search" type="search" placeholder="Search users, orders, prices…" aria-label="Search" />
          </div>

          <div className="adm-topbar-right">
            <Link to="/admin/anomalies" className="adm-icon-btn" aria-label="Alerts">
              <Bell size={18} />
              <span className="adm-notif-dot" aria-hidden="true" />
            </Link>
            <div className="adm-topbar-user">
              <div className="adm-avatar adm-avatar-sm">{user?.firstName?.[0]}</div>
              <span>{user?.firstName}</span>
            </div>
          </div>
        </header>

        <div className="adm-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

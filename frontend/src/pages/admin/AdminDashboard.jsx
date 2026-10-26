import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Users, Sprout, ShoppingBag, BarChart3, TrendingUp, TrendingDown,
  Package, AlertTriangle, Clock, CheckCircle2, XCircle, ArrowRight,
  RefreshCw, Activity,
} from 'lucide-react';
import {
  userApi, orderApi, inventoryApi, priceApi,
  anomalyApi, reportApi,
} from '../../services/api';
import './AdminDashboard.css';

// ── Helpers ───────────────────────────────────────────────────────────────

const STATUS_BADGE = {
  draft:          'adm-badge-gray',
  pending:        'adm-badge-yellow',
  accepted:       'adm-badge-blue',
  confirmed:      'adm-badge-blue',
  in_fulfillment: 'adm-badge-teal',
  delivered:      'adm-badge-teal',
  completed:      'adm-badge-green',
  rejected:       'adm-badge-red',
  cancelled:      'adm-badge-red',
  disputed:       'adm-badge-orange',
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-ET', { day: '2-digit', month: 'short' }) : '—';

// Commodity colors for chart
const COMMODITY_COLORS = { Teff: '#245c3a', Wheat: '#f59e0b', Maize: '#3b82f6' };

// ── KPI Card ──────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, iconBg, trend }) {
  return (
    <div className="adm-card adm-kpi">
      <div className="adm-kpi-top">
        <span className="adm-kpi-label">{label}</span>
        <span className="adm-kpi-icon" style={{ background: iconBg }}>
          <Icon size={18} color="#fff" strokeWidth={1.8} />
        </span>
      </div>
      <div className="adm-kpi-val">{value ?? <span className="adm-kpi-skeleton" />}</div>
      <div className="adm-kpi-sub">
        {trend > 0 && <TrendingUp size={12} className="adm-kpi-up" />}
        {trend < 0 && <TrendingDown size={12} className="adm-kpi-down" />}
        <span>{sub}</span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [priceCommodity, setPriceCommodity] = useState('');
  const [priceMarket, setPriceMarket]       = useState('');

  // ── Data fetches ─────────────────────────────────────────────────────────

  const { data: usersData } = useQuery({
    queryKey: ['admin-users-summary'],
    queryFn: () => userApi.list({ limit: 1 }).then(r => r.data),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['admin-orders-recent'],
    queryFn: () => orderApi.list({ limit: 8, page: 1 }).then(r => r.data),
  });

  const { data: pendingOrders } = useQuery({
    queryKey: ['admin-orders-pending'],
    queryFn: () => orderApi.list({ status: 'pending', limit: 1 }).then(r => r.data),
  });

  const { data: inventoryData } = useQuery({
    queryKey: ['admin-inventory'],
    queryFn: () => inventoryApi.list().then(r => r.data),
  });

  const { data: anomalyData } = useQuery({
    queryKey: ['admin-anomalies'],
    queryFn: () => anomalyApi.list({ limit: 5 }).then(r => r.data),
  });

  const { data: pricesData } = useQuery({
    queryKey: ['admin-prices-chart', priceCommodity, priceMarket],
    queryFn: () => priceApi.list({
      commodity: priceCommodity || undefined,
      market: priceMarket || undefined,
      reviewStatus: 'approved',
      limit: 60,
    }).then(r => r.data),
  });

  const { data: supplyDemandData } = useQuery({
    queryKey: ['admin-supply-demand'],
    queryFn: () => reportApi.supplyDemand({ commodity: '' }).then(r => r.data).catch(() => null),
  });

  // ── Derived values ────────────────────────────────────────────────────────

  const totalUsers    = usersData?.total ?? '—';
  const totalOrders   = ordersData?.total ?? '—';
  const pendingCount  = pendingOrders?.total ?? '—';
  const flaggedCount  = anomalyData?.total ?? '—';

  // Low stock: < 500 kg available
  const lowStock = inventoryData?.inventory?.filter(i => i.availableQuantityKg < 500) ?? [];

  // Build chart data from price observations — group by week
  const chartData = React.useMemo(() => {
    if (!pricesData?.observations?.length) return [];
    const grouped = {};
    pricesData.observations.forEach(obs => {
      const week = new Date(obs.observationDate);
      week.setDate(week.getDate() - week.getDay());
      const key = week.toISOString().slice(0, 10);
      const name = obs.commodity?.name || 'Unknown';
      if (!grouped[key]) grouped[key] = { date: key };
      grouped[key][name] = parseFloat((obs.pricePerKg * 100).toFixed(0)); // ETB/quintal
    });
    return Object.values(grouped)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-20);
  }, [pricesData]);

  // Order status breakdown for bar chart
  const orderStatusData = React.useMemo(() => {
    if (!ordersData?.orders) return [];
    const counts = {};
    ordersData.orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [ordersData]);

  return (
    <div>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Dashboard</h1>
          <p className="adm-page-subtitle">AgriMarket platform overview — real-time data from your database</p>
        </div>
        <div className="adm-page-actions">
          <span className="adm-live-pill"><Activity size={12} /> Live</span>
        </div>
      </div>

      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <div className="adm-kpi-grid">
        <KpiCard label="Total Users"      value={totalUsers}    sub="All registered accounts"   icon={Users}       iconBg="#245c3a" />
        <KpiCard label="Total Orders"     value={totalOrders}   sub={`${pendingCount} pending`} icon={ShoppingBag} iconBg="#3b82f6" />
        <KpiCard label="Flagged Prices"   value={flaggedCount}  sub="Awaiting review"           icon={AlertTriangle} iconBg="#f59e0b" trend={flaggedCount > 0 ? 1 : 0} />
        <KpiCard label="Low Stock Items"  value={lowStock.length} sub="Below 500 kg threshold"  icon={Package}     iconBg={lowStock.length > 0 ? '#dc3545' : '#22c55e'} />
      </div>

      {/* ── Price trend chart + Order status ─────────────────────────────── */}
      <div className="adm-grid-2-1">
        <div className="adm-card">
          <div className="adm-card-head">
            <span className="adm-card-title">Commodity Price Trends</span>
            <div className="adm-card-head-actions">
              <span className="adm-badge adm-badge-gray adm-synth-note">Synthetic seed data</span>
            </div>
          </div>
          <div className="adm-card-body" style={{ paddingTop: 0 }}>
            {chartData.length === 0 ? (
              <div className="adm-empty">No approved price observations found.</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    {Object.entries(COMMODITY_COLORS).map(([name, color]) => (
                      <linearGradient key={name} id={`grad-${name}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={color} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2ed" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}`} unit=" ETB" width={65} />
                  <Tooltip
                    formatter={(v, name) => [`${v} ETB/qq`, name]}
                    labelFormatter={l => `Week of ${l}`}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e8ebe4' }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  {Object.entries(COMMODITY_COLORS).map(([name, color]) => (
                    <Area key={name} type="monotone" dataKey={name}
                      stroke={color} strokeWidth={2}
                      fill={`url(#grad-${name})`}
                      dot={false} connectNulls />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Order status breakdown */}
        <div className="adm-card">
          <div className="adm-card-head">
            <span className="adm-card-title">Order Status</span>
            <Link to="/admin/orders" className="adm-link-sm">View all <ArrowRight size={12} /></Link>
          </div>
          <div className="adm-card-body" style={{ paddingTop: 8 }}>
            {orderStatusData.length === 0 ? (
              <div className="adm-empty">No orders found.</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={orderStatusData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f2ed" vertical={false} />
                    <XAxis dataKey="status" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#245c3a" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="adm-status-list">
                  {orderStatusData.map(({ status, count }) => (
                    <div key={status} className="adm-status-row">
                      <span className={`adm-badge ${STATUS_BADGE[status] || 'adm-badge-gray'}`}>{status}</span>
                      <strong>{count}</strong>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent orders + Anomaly alerts ───────────────────────────────── */}
      <div className="adm-grid-2">
        {/* Recent orders */}
        <div className="adm-card">
          <div className="adm-card-head">
            <span className="adm-card-title">Recent Orders</span>
            <Link to="/admin/orders" className="adm-link-sm">View all <ArrowRight size={12} /></Link>
          </div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Commodity</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {!ordersData?.orders?.length && (
                  <tr><td colSpan={4} className="adm-empty">No orders yet.</td></tr>
                )}
                {ordersData?.orders?.slice(0, 7).map(order => (
                  <tr key={order._id}>
                    <td>
                      <Link to={`/admin/orders`} className="adm-text-link">
                        {order.orderNumber}
                      </Link>
                      <div className="adm-sub-text">{order.buyer?.firstName} {order.buyer?.lastName}</div>
                    </td>
                    <td>{order.commodity?.name || '—'}</td>
                    <td>
                      <span className={`adm-badge ${STATUS_BADGE[order.status] || 'adm-badge-gray'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="adm-muted-text">{fmtDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Anomaly alerts */}
        <div className="adm-card">
          <div className="adm-card-head">
            <span className="adm-card-title">
              <AlertTriangle size={14} style={{ color: '#f59e0b', marginRight: 6 }} />
              Flagged Price Observations
            </span>
            <Link to="/admin/anomalies" className="adm-link-sm">Review <ArrowRight size={12} /></Link>
          </div>
          <div>
            {!anomalyData?.observations?.length && (
              <div className="adm-empty" style={{ padding: '32px 20px' }}>
                <CheckCircle2 size={28} color="#22c55e" style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                No flagged observations pending review.
              </div>
            )}
            {anomalyData?.observations?.slice(0, 5).map(obs => (
              <div key={obs._id} className="adm-alert-row">
                <div className="adm-alert-dot" />
                <div className="adm-alert-body">
                  <strong>{obs.commodity?.name} — {obs.market?.name}</strong>
                  <span>{(obs.pricePerKg * 100).toFixed(0)} ETB/qq</span>
                </div>
                <div className="adm-alert-meta">
                  <span className="adm-badge adm-badge-yellow">flagged</span>
                  <span className="adm-muted-text">{fmtDate(obs.flaggedAt)}</span>
                </div>
              </div>
            ))}
            {anomalyData?.observations?.length > 0 && (
              <div style={{ padding: '10px 16px' }}>
                <Link to="/admin/anomalies" className="adm-btn adm-btn-warn" style={{ width: '100%', justifyContent: 'center' }}>
                  Review {anomalyData.total} flagged records
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Low stock alerts + Pending approvals ─────────────────────────── */}
      <div className="adm-grid-2">
        {/* Low stock */}
        <div className="adm-card">
          <div className="adm-card-head">
            <span className="adm-card-title">Inventory Alerts</span>
            <Link to="/admin/inventory" className="adm-link-sm">Manage <ArrowRight size={12} /></Link>
          </div>
          {lowStock.length === 0 ? (
            <div className="adm-empty">
              <CheckCircle2 size={24} color="#22c55e" style={{ margin: '0 auto 8px', display: 'block' }} />
              All inventory levels are above threshold.
            </div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>Commodity</th><th>Supplier</th><th>Available</th><th>Status</th></tr></thead>
                <tbody>
                  {lowStock.slice(0, 5).map(inv => (
                    <tr key={inv._id}>
                      <td>{inv.commodity?.name || '—'}</td>
                      <td className="adm-muted-text">{inv.supplier?.firstName} {inv.supplier?.lastName}</td>
                      <td><strong>{(inv.availableQuantityKg / 100).toFixed(1)} qq</strong></td>
                      <td>
                        <span className={`adm-badge ${inv.availableQuantityKg < 100 ? 'adm-badge-red' : 'adm-badge-yellow'}`}>
                          {inv.availableQuantityKg < 100 ? 'critical' : 'low'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending orders needing attention */}
        <div className="adm-card">
          <div className="adm-card-head">
            <span className="adm-card-title">Pending Approvals</span>
            <Link to="/admin/users?status=pending_approval" className="adm-link-sm">View users <ArrowRight size={12} /></Link>
          </div>
          <div className="adm-pending-list">
            <div className="adm-pending-item">
              <div className="adm-pending-icon" style={{ background: '#fef9c3', color: '#854d0e' }}>
                <Clock size={16} />
              </div>
              <div className="adm-pending-body">
                <strong>Pending orders</strong>
                <span>{pendingCount} orders awaiting supplier response</span>
              </div>
              <Link to="/admin/orders?status=pending" className="adm-btn adm-btn-secondary adm-btn-sm">
                View
              </Link>
            </div>
            <div className="adm-pending-item">
              <div className="adm-pending-icon" style={{ background: '#dbeafe', color: '#1e40af' }}>
                <Users size={16} />
              </div>
              <div className="adm-pending-body">
                <strong>User approvals</strong>
                <span>Farmer registrations pending admin review</span>
              </div>
              <Link to="/admin/users?status=pending_approval" className="adm-btn adm-btn-secondary adm-btn-sm">
                View
              </Link>
            </div>
            <div className="adm-pending-item">
              <div className="adm-pending-icon" style={{ background: '#dcfce7', color: '#166534' }}>
                <AlertTriangle size={16} />
              </div>
              <div className="adm-pending-body">
                <strong>Price reviews</strong>
                <span>{flaggedCount} flagged observations awaiting review</span>
              </div>
              <Link to="/admin/anomalies" className="adm-btn adm-btn-secondary adm-btn-sm">
                Review
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

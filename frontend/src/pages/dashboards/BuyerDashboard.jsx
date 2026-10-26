import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderApi, priceApi, notificationApi } from '../../services/api';
import { useAuth } from '../../App';
import { ShoppingBag, TrendingUp, Bell, ChevronRight, Plus, Info, Search } from 'lucide-react';

const STATUS_COLOR = {
  draft: '#9ca3af', pending: '#f59e0b', accepted: '#3b82f6', confirmed: '#3b82f6',
  in_fulfillment: '#8b5cf6', delivered: '#10b981', completed: '#22c55e',
  rejected: '#ef4444', cancelled: '#9ca3af', disputed: '#f97316',
};

export default function BuyerDashboard() {
  const { user } = useAuth();

  const { data: ordersData } = useQuery({
    queryKey: ['buyer-orders'],
    queryFn: () => orderApi.list({ limit: 6 }).then(r => r.data),
  });

  const { data: pricesData } = useQuery({
    queryKey: ['buyer-prices'],
    queryFn: () => priceApi.list({ reviewStatus: 'approved', limit: 5 }).then(r => r.data),
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list().then(r => r.data),
  });

  const orders  = ordersData?.orders ?? [];
  const prices  = pricesData?.observations ?? [];
  const unread  = notifData?.notifications?.filter(n => !n.isRead) ?? [];
  const active  = orders.filter(o => !['completed', 'cancelled', 'rejected'].includes(o.status)).length;

  return (
    <div style={pg}>
      <div style={hdr}>
        <div>
          <h1 style={ttl}>Welcome, {user?.firstName} 👋</h1>
          <p style={sub}>{user?.region ? `${user.region} · ` : ''}Buyer</p>
        </div>
        <Link to="/profile" style={{ textDecoration: 'none' }}>
          <div style={av}>{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
        </Link>
      </div>

      {/* Stats */}
      <div style={sRow}>
        {[
          { icon: <ShoppingBag size={18} color="#245c3a" />, label: 'My orders', value: ordersData?.total ?? '—', sub: `${active} active`, bg: '#e8f5ec' },
          { icon: <TrendingUp size={18} color="#3b82f6" />, label: 'Price observations', value: pricesData?.total ?? '—', sub: 'approved in market', bg: '#dbeafe' },
          { icon: <Bell size={18} color="#f59e0b" />, label: 'Notifications', value: unread.length, sub: 'unread', bg: '#fef9c3' },
        ].map((s, i) => (
          <div key={i} style={{ ...stat, background: s.bg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{s.label}</span>
              <div style={icn}>{s.icon}</div>
            </div>
            <div style={val}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <Link to="/orders" style={{ ...action, background: '#245c3a', color: '#fff', textDecoration: 'none' }}>
          <Plus size={16} /> New order
        </Link>
        <Link to="/prices" style={{ ...action, background: '#f0fdf4', color: '#245c3a', border: '1px solid #86efac', textDecoration: 'none' }}>
          <Search size={16} /> Browse prices
        </Link>
      </div>

      {/* My orders */}
      <div style={card}>
        <div style={ch}>
          <span style={ct}><ShoppingBag size={14} style={{ marginRight: 6 }} />My Orders</span>
          <Link to="/orders" style={va}>View all <ChevronRight size={12} /></Link>
        </div>
        {orders.length === 0 ? (
          <div style={{ display: 'flex', gap: 10, padding: 16, color: '#6b7280', fontSize: 12, lineHeight: 1.6 }}>
            <Info size={16} color="#9ca3af" style={{ flexShrink: 0, marginTop: 1 }} />
            No orders yet. Browse prices and create your first procurement order.
          </div>
        ) : orders.map((o, i) => (
          <div key={o._id} style={{ ...row, borderBottom: i < orders.length - 1 ? '1px solid #f0f2ed' : 'none' }}>
            <div style={ci}><ShoppingBag size={16} color="#245c3a" /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 12 }}>{o.orderNumber}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                {o.commodity?.name} · {o.quantityKg ? (o.quantityKg/100).toFixed(1) : '—'} qq
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: (STATUS_COLOR[o.status] || '#9ca3af') + '22', color: STATUS_COLOR[o.status] || '#6b7280' }}>
                {o.status}
              </span>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>
                {new Date(o.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent market prices */}
      <div style={card}>
        <div style={ch}>
          <span style={ct}><TrendingUp size={14} style={{ marginRight: 6 }} />Recent Market Prices</span>
          <Link to="/prices" style={va}>View all <ChevronRight size={12} /></Link>
        </div>
        {prices.length === 0 ? (
          <div style={{ padding: '16px', color: '#6b7280', fontSize: 12 }}>No approved prices available yet.</div>
        ) : prices.map((obs, i) => (
          <div key={obs._id} style={{ ...row, borderBottom: i < prices.length - 1 ? '1px solid #f0f2ed' : 'none' }}>
            <div style={{ ...ci, background: '#eff6ff' }}>
              <TrendingUp size={15} color="#3b82f6" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{obs.commodity?.name}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{obs.market?.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#245c3a' }}>
                {(obs.pricePerKg * 100).toFixed(0)} ETB
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>per quintal</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const pg   = { maxWidth: 700, margin: '0 auto', padding: '24px 16px 80px', fontFamily: 'DM Sans, system-ui, sans-serif' };
const hdr  = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 };
const ttl  = { fontSize: '1.4rem', fontWeight: 800, color: '#111827', margin: 0, fontFamily: 'Manrope, sans-serif' };
const sub  = { fontSize: 12, color: '#6b7280', margin: '4px 0 0' };
const av   = { width: 42, height: 42, borderRadius: '50%', background: '#245c3a', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700, textTransform: 'uppercase' };
const sRow = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 };
const stat = { borderRadius: 12, padding: '14px 14px 12px' };
const icn  = { width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.6)', display: 'grid', placeItems: 'center' };
const val  = { fontSize: 24, fontWeight: 800, fontFamily: 'Manrope, sans-serif', letterSpacing: '-1px', color: '#111827', margin: '4px 0 2px' };
const card = { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: 16, overflow: 'hidden' };
const ch   = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: '1px solid #f0f2ed', flexWrap: 'wrap', gap: 8 };
const ct   = { display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, color: '#111827' };
const va   = { display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: '#245c3a', textDecoration: 'none' };
const row  = { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' };
const ci   = { width: 36, height: 36, borderRadius: 8, background: '#f0fdf4', display: 'grid', placeItems: 'center', flexShrink: 0 };
const action = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 13 };

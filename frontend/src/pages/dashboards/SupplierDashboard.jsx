import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi, orderApi, notificationApi } from '../../services/api';
import { useAuth } from '../../App';
import { Package, ShoppingBag, Bell, ChevronRight, Plus, Info, Truck } from 'lucide-react';

const STATUS_COLOR = {
  pending: '#f59e0b', accepted: '#3b82f6', confirmed: '#3b82f6',
  in_fulfillment: '#8b5cf6', delivered: '#10b981', completed: '#22c55e',
  rejected: '#ef4444', cancelled: '#9ca3af', disputed: '#f97316',
};

export default function SupplierDashboard() {
  const { user } = useAuth();

  const { data: inventoryData } = useQuery({
    queryKey: ['supplier-inventory'],
    queryFn: () => inventoryApi.list().then(r => r.data),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['supplier-orders'],
    queryFn: () => orderApi.list({ limit: 6 }).then(r => r.data),
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list().then(r => r.data),
  });

  const inventory   = inventoryData?.inventory ?? [];
  const orders      = ordersData?.orders ?? [];
  const unread      = notifData?.notifications?.filter(n => !n.isRead) ?? [];
  const pending     = orders.filter(o => o.status === 'pending').length;
  const totalStock  = inventory.reduce((s, i) => s + (i.availableQuantityKg || 0), 0);

  return (
    <div style={pg}>
      <div style={hdr}>
        <div>
          <h1 style={ttl}>Welcome, {user?.firstName} 👋</h1>
          <p style={sub}>{user?.region ? `${user.region} · ` : ''}Supplier</p>
        </div>
        <Link to="/profile" style={{ textDecoration: 'none' }}>
          <div style={av}>{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
        </Link>
      </div>

      {/* Stats */}
      <div style={sRow}>
        {[
          { icon: <Package size={18} color="#245c3a" />, label: 'Total stock', value: `${(totalStock/100).toFixed(0)} qq`, sub: `${inventory.length} item${inventory.length !== 1 ? 's' : ''}`, bg: '#e8f5ec' },
          { icon: <ShoppingBag size={18} color="#3b82f6" />, label: 'Incoming orders', value: ordersData?.total ?? '—', sub: `${pending} pending`, bg: '#dbeafe' },
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

      {/* Inventory */}
      <div style={card}>
        <div style={ch}>
          <span style={ct}><Package size={14} style={{ marginRight: 6 }} />My Inventory</span>
          <Link to="/inventory" style={va}>
            {inventory.length === 0 ? <><Plus size={12} /> Add inventory</> : <>View all <ChevronRight size={12} /></>}
          </Link>
        </div>
        {inventory.length === 0 ? (
          <Empty text="No inventory yet. Add your available produce so buyers can find you." />
        ) : inventory.slice(0, 4).map((inv, i) => (
          <div key={inv._id} style={{ ...row, borderBottom: i < Math.min(inventory.length, 4) - 1 ? '1px solid #f0f2ed' : 'none' }}>
            <div style={ci}><Package size={16} color="#245c3a" /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{inv.commodity?.name}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{inv.market?.name || '—'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{(inv.availableQuantityKg / 100).toFixed(1)} qq</div>
              {inv.askPricePerKg && <div style={{ fontSize: 10, color: '#9ca3af' }}>{(inv.askPricePerKg * 100).toFixed(0)} ETB/qq</div>}
            </div>
            <span style={{ ...badge, background: inv.isActive ? '#dcfce7' : '#f3f4f6', color: inv.isActive ? '#166534' : '#6b7280' }}>
              {inv.isActive ? 'active' : 'inactive'}
            </span>
          </div>
        ))}
      </div>

      {/* Orders */}
      <div style={card}>
        <div style={ch}>
          <span style={ct}><ShoppingBag size={14} style={{ marginRight: 6 }} />Recent Orders</span>
          <Link to="/orders" style={va}>View all <ChevronRight size={12} /></Link>
        </div>
        {orders.length === 0 ? (
          <Empty text="No orders yet. Once buyers send procurement requests they will appear here." />
        ) : orders.slice(0, 5).map((o, i) => (
          <div key={o._id} style={{ ...row, borderBottom: i < Math.min(orders.length, 5) - 1 ? '1px solid #f0f2ed' : 'none' }}>
            <div style={ci}><ShoppingBag size={16} color="#3b82f6" /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 12 }}>{o.orderNumber}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{o.commodity?.name} · {(o.quantityKg/100).toFixed(1)} qq</div>
            </div>
            <span style={{ ...badge, background: (STATUS_COLOR[o.status] || '#9ca3af') + '22', color: STATUS_COLOR[o.status] || '#6b7280' }}>
              {o.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: 16, color: '#6b7280', fontSize: 12, lineHeight: 1.6 }}>
      <Info size={16} color="#9ca3af" style={{ flexShrink: 0, marginTop: 1 }} />{text}
    </div>
  );
}

const pg = { maxWidth: 700, margin: '0 auto', padding: '24px 16px 80px', fontFamily: 'DM Sans, system-ui, sans-serif' };
const hdr = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 };
const ttl = { fontSize: '1.4rem', fontWeight: 800, color: '#111827', margin: 0, fontFamily: 'Manrope, sans-serif' };
const sub = { fontSize: 12, color: '#6b7280', margin: '4px 0 0' };
const av  = { width: 42, height: 42, borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700, textTransform: 'uppercase' };
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
const badge = { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, flexShrink: 0 };

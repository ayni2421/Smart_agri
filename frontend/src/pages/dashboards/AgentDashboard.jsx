import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { priceApi, inventoryApi, anomalyApi } from '../../services/api';
import { useAuth } from '../../App';
import { BarChart3, Package, AlertTriangle, ChevronRight, Plus, Info } from 'lucide-react';

export default function AgentDashboard() {
  const { user } = useAuth();

  const { data: pricesData } = useQuery({
    queryKey: ['agent-prices'],
    queryFn: () => priceApi.list({ limit: 5 }).then(r => r.data),
  });

  const { data: inventoryData } = useQuery({
    queryKey: ['agent-inventory'],
    queryFn: () => inventoryApi.list({ limit: 5 }).then(r => r.data),
  });

  const prices     = pricesData?.observations ?? [];
  const inventory  = inventoryData?.inventory ?? [];
  const flagged    = prices.filter(p => p.isFlagged).length;
  const pending    = prices.filter(p => p.reviewStatus === 'pending_review').length;

  const REVIEW_BADGE = { approved: '#dcfce7:#166534', pending_review: '#fef9c3:#854d0e', flagged: '#fee2e2:#991b1b', rejected: '#fee2e2:#991b1b' };

  return (
    <div style={pg}>
      <div style={hdr}>
        <div>
          <h1 style={ttl}>Welcome, {user?.firstName} 👋</h1>
          <p style={sub}>{user?.region ? `${user.region} · ` : ''}Agent</p>
        </div>
        <Link to="/profile" style={{ textDecoration: 'none' }}>
          <div style={{ ...av, background: '#8b5cf6' }}>{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
        </Link>
      </div>

      <div style={sRow}>
        {[
          { icon: <BarChart3 size={18} color="#245c3a" />, label: 'Submitted prices', value: pricesData?.total ?? '—', sub: `${pending} pending review`, bg: '#e8f5ec' },
          { icon: <Package size={18} color="#3b82f6" />, label: 'Inventory records', value: inventoryData?.inventory?.length ?? '—', sub: 'on behalf of farmers', bg: '#dbeafe' },
          { icon: <AlertTriangle size={18} color="#f59e0b" />, label: 'Flagged submissions', value: flagged, sub: 'need attention', bg: '#fef9c3' },
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
        <Link to="/prices" style={{ ...action, background: '#245c3a', color: '#fff', textDecoration: 'none' }}>
          <Plus size={16} /> Submit price
        </Link>
        <Link to="/inventory" style={{ ...action, background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', textDecoration: 'none' }}>
          <Plus size={16} /> Add inventory
        </Link>
      </div>

      {/* Recent price submissions */}
      <div style={card}>
        <div style={ch}>
          <span style={ct}><BarChart3 size={14} style={{ marginRight: 6 }} />My Recent Price Submissions</span>
          <Link to="/prices" style={va}>View all <ChevronRight size={12} /></Link>
        </div>
        {prices.length === 0 ? (
          <div style={empty}><Info size={16} color="#9ca3af" style={{ flexShrink: 0 }} />No price observations submitted yet. Submit a price for a commodity and market.</div>
        ) : prices.map((obs, i) => {
          const [bg, col] = (REVIEW_BADGE[obs.reviewStatus] || '#f3f4f6:#374151').split(':');
          return (
            <div key={obs._id} style={{ ...row, borderBottom: i < prices.length - 1 ? '1px solid #f0f2ed' : 'none' }}>
              <div style={ci}><BarChart3 size={15} color="#245c3a" /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{obs.commodity?.name}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{obs.market?.name} · {new Date(obs.observationDate).toLocaleDateString()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#245c3a' }}>{(obs.pricePerKg * 100).toFixed(0)} ETB/qq</div>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 100, background: bg, color: col }}>
                  {obs.reviewStatus?.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inventory records */}
      <div style={card}>
        <div style={ch}>
          <span style={ct}><Package size={14} style={{ marginRight: 6 }} />Inventory Records</span>
          <Link to="/inventory" style={va}>Manage <ChevronRight size={12} /></Link>
        </div>
        {inventory.length === 0 ? (
          <div style={empty}><Info size={16} color="#9ca3af" style={{ flexShrink: 0 }} />No inventory records yet. Add produce availability for farmers you represent.</div>
        ) : inventory.map((inv, i) => (
          <div key={inv._id} style={{ ...row, borderBottom: i < inventory.length - 1 ? '1px solid #f0f2ed' : 'none' }}>
            <div style={ci}><Package size={15} color="#3b82f6" /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{inv.commodity?.name}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{inv.market?.name || '—'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{(inv.availableQuantityKg / 100).toFixed(1)} qq</div>
              {inv.askPricePerKg && <div style={{ fontSize: 10, color: '#9ca3af' }}>{(inv.askPricePerKg * 100).toFixed(0)} ETB/qq</div>}
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
const av   = { width: 42, height: 42, borderRadius: '50%', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700, textTransform: 'uppercase' };
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
const empty = { display: 'flex', gap: 10, padding: 16, color: '#6b7280', fontSize: 12, lineHeight: 1.6, alignItems: 'flex-start' };
const action = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 13 };

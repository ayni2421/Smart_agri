import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryApi } from '../../services/api';
import { useAuth } from '../../App';
import { Truck, CheckCircle2, Clock, XCircle, ChevronRight, Info } from 'lucide-react';

const STATUS = {
  assigned:   { color: '#f59e0b', bg: '#fef9c3', label: 'Assigned' },
  in_transit: { color: '#3b82f6', bg: '#dbeafe', label: 'In transit' },
  delivered:  { color: '#22c55e', bg: '#dcfce7', label: 'Delivered' },
  failed:     { color: '#ef4444', bg: '#fee2e2', label: 'Failed' },
  cancelled:  { color: '#9ca3af', bg: '#f3f4f6', label: 'Cancelled' },
};

const TRANSITIONS = { assigned: 'in_transit', in_transit: 'delivered' };
const TRANSITION_LABEL = { in_transit: 'Mark in transit', delivered: 'Mark delivered' };

export default function TransporterDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['transporter-deliveries'],
    queryFn: () => deliveryApi.list().then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => deliveryApi.updateStatus(id, { status }),
    onSuccess: () => qc.invalidateQueries(['transporter-deliveries']),
  });

  const deliveries = data?.deliveries ?? [];
  const active     = deliveries.filter(d => ['assigned', 'in_transit'].includes(d.status));
  const completed  = deliveries.filter(d => d.status === 'delivered').length;

  return (
    <div style={pg}>
      <div style={hdr}>
        <div>
          <h1 style={ttl}>Welcome, {user?.firstName} 👋</h1>
          <p style={sub}>{user?.region ? `${user.region} · ` : ''}Transporter</p>
        </div>
        <Link to="/profile" style={{ textDecoration: 'none' }}>
          <div style={{ ...av, background: '#0891b2' }}>{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
        </Link>
      </div>

      {/* Stats */}
      <div style={sRow}>
        {[
          { icon: <Truck size={18} color="#245c3a" />,         label: 'Total deliveries',  value: deliveries.length, sub: 'assigned to me',   bg: '#e8f5ec' },
          { icon: <Clock size={18} color="#f59e0b" />,         label: 'Active',            value: active.length,    sub: 'in progress',       bg: '#fef9c3' },
          { icon: <CheckCircle2 size={18} color="#22c55e" />,  label: 'Completed',         value: completed,        sub: 'delivered',         bg: '#dcfce7' },
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

      {/* Active deliveries */}
      <div style={card}>
        <div style={ch}>
          <span style={ct}><Truck size={14} style={{ marginRight: 6 }} />Active Deliveries</span>
        </div>
        {isLoading && <div style={{ padding: 16, color: '#6b7280', fontSize: 12 }}>Loading…</div>}
        {!isLoading && active.length === 0 && (
          <div style={empty}><Info size={16} color="#9ca3af" style={{ flexShrink: 0 }} />No active deliveries assigned to you right now.</div>
        )}
        {active.map((d, i) => {
          const s = STATUS[d.status] || STATUS.assigned;
          const next = TRANSITIONS[d.status];
          return (
            <div key={d._id} style={{ ...row, borderBottom: i < active.length - 1 ? '1px solid #f0f2ed' : 'none', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ ...ci, background: s.bg }}><Truck size={16} color={s.color} /></div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Order {d.order?.orderNumber || '—'}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>To: {d.deliveryLocation}</div>
                {d.scheduledDate && (
                  <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                    Scheduled: {new Date(d.scheduledDate).toLocaleDateString()}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100, background: s.bg, color: s.color }}>{s.label}</span>
                {next && (
                  <button
                    onClick={() => updateMutation.mutate({ id: d._id, status: next })}
                    disabled={updateMutation.isLoading}
                    style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 7, background: '#245c3a', color: '#fff', border: 'none', cursor: 'pointer' }}
                  >
                    {TRANSITION_LABEL[next]}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* History */}
      {completed > 0 && (
        <div style={card}>
          <div style={ch}>
            <span style={ct}><CheckCircle2 size={14} style={{ marginRight: 6 }} />Completed Deliveries</span>
          </div>
          {deliveries.filter(d => d.status === 'delivered').slice(0, 4).map((d, i) => (
            <div key={d._id} style={{ ...row, borderBottom: i < Math.min(completed, 4) - 1 ? '1px solid #f0f2ed' : 'none' }}>
              <div style={{ ...ci, background: '#dcfce7' }}><CheckCircle2 size={15} color="#22c55e" /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 12 }}>Order {d.order?.orderNumber || '—'}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{d.deliveryLocation}</div>
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>
                {d.actualDeliveryDate ? new Date(d.actualDeliveryDate).toLocaleDateString() : 'Delivered'}
              </div>
            </div>
          ))}
        </div>
      )}
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
const ch   = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: '1px solid #f0f2ed' };
const ct   = { display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, color: '#111827' };
const row  = { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' };
const ci   = { width: 36, height: 36, borderRadius: 8, display: 'grid', placeItems: 'center', flexShrink: 0 };
const empty = { display: 'flex', gap: 10, padding: 16, color: '#6b7280', fontSize: 12, lineHeight: 1.6, alignItems: 'flex-start' };

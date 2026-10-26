import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { anomalyApi, priceApi } from '../../services/api';
import { useAuth } from '../../App';
import { AlertTriangle, CheckCircle2, XCircle, RotateCcw, Info } from 'lucide-react';

export default function ReviewerDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['reviewer-flagged'],
    queryFn: () => anomalyApi.list({ limit: 10 }).then(r => r.data),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, decision }) => priceApi.review(id, { decision }),
    onSuccess: () => qc.invalidateQueries(['reviewer-flagged']),
  });

  const flagged = data?.observations ?? [];

  return (
    <div style={pg}>
      <div style={hdr}>
        <div>
          <h1 style={ttl}>Welcome, {user?.firstName} 👋</h1>
          <p style={sub}>{user?.region ? `${user.region} · ` : ''}Data Reviewer</p>
        </div>
        <Link to="/profile" style={{ textDecoration: 'none' }}>
          <div style={{ ...av, background: '#7c3aed' }}>{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
        </Link>
      </div>

      {/* Stats */}
      <div style={sRow}>
        <div style={{ ...stat, background: data?.total > 0 ? '#fef9c3' : '#dcfce7', gridColumn: 'span 3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {data?.total > 0
              ? <AlertTriangle size={28} color="#f59e0b" />
              : <CheckCircle2 size={28} color="#22c55e" />}
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Manrope, sans-serif', color: '#111827' }}>
                {data?.total ?? '—'} flagged observation{data?.total !== 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                {data?.total > 0 ? 'Awaiting your review' : 'All clear — no pending reviews'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flagged list */}
      <div style={card}>
        <div style={ch}>
          <span style={ct}><AlertTriangle size={14} style={{ marginRight: 6, color: '#f59e0b' }} />Flagged Price Observations</span>
          <Link to="/anomalies" style={va}>View all</Link>
        </div>

        {isLoading && <div style={{ padding: 16, color: '#6b7280', fontSize: 12 }}>Loading…</div>}

        {!isLoading && flagged.length === 0 && (
          <div style={empty}>
            <CheckCircle2 size={20} color="#22c55e" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: 13, color: '#166534' }}>All clear</strong>
              <div style={{ marginTop: 2 }}>No flagged observations are pending review at the moment.</div>
            </div>
          </div>
        )}

        {flagged.map((obs, i) => (
          <div key={obs._id} style={{ padding: '14px 16px', borderBottom: i < flagged.length - 1 ? '1px solid #f0f2ed' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 13 }}>{obs.commodity?.name}</strong>
                <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 8 }}>{obs.market?.name}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#245c3a' }}>
                {(obs.pricePerKg * 100).toFixed(0)} ETB/qq
              </div>
            </div>

            {obs.flagReason && (
              <div style={{ fontSize: 11, color: '#92400e', background: '#fef9c3', padding: '4px 8px', borderRadius: 5, marginBottom: 10 }}>
                ⚠ {obs.flagReason}
              </div>
            )}

            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              <button
                onClick={() => reviewMutation.mutate({ id: obs._id, decision: 'approved' })}
                disabled={reviewMutation.isLoading}
                style={btnGreen}>
                <CheckCircle2 size={12} /> Approve
              </button>
              <button
                onClick={() => reviewMutation.mutate({ id: obs._id, decision: 'rejected' })}
                disabled={reviewMutation.isLoading}
                style={btnRed}>
                <XCircle size={12} /> Reject
              </button>
              <button
                onClick={() => reviewMutation.mutate({ id: obs._id, decision: 'correction_requested' })}
                disabled={reviewMutation.isLoading}
                style={btnAmber}>
                <RotateCcw size={12} /> Request correction
              </button>
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
const stat = { borderRadius: 12, padding: '16px' };
const card = { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: 16, overflow: 'hidden' };
const ch   = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: '1px solid #f0f2ed' };
const ct   = { display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, color: '#111827' };
const va   = { display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: '#245c3a', textDecoration: 'none' };
const empty = { display: 'flex', gap: 12, padding: '20px 16px', color: '#6b7280', fontSize: 12, lineHeight: 1.6, alignItems: 'flex-start' };
const btnBase = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700 };
const btnGreen = { ...btnBase, background: '#dcfce7', color: '#166534' };
const btnRed   = { ...btnBase, background: '#fee2e2', color: '#991b1b' };
const btnAmber = { ...btnBase, background: '#fef9c3', color: '#854d0e' };

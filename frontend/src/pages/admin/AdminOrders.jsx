import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../../services/api';
import { ChevronLeft, ChevronRight, Eye, ArrowRight } from 'lucide-react';

const ORDER_STATES = ['draft','pending','accepted','rejected','confirmed','in_fulfillment','delivered','completed','cancelled','disputed'];

const STATUS_BADGE = {
  draft: 'adm-badge-gray', pending: 'adm-badge-yellow', accepted: 'adm-badge-blue',
  confirmed: 'adm-badge-blue', in_fulfillment: 'adm-badge-teal', delivered: 'adm-badge-teal',
  completed: 'adm-badge-green', rejected: 'adm-badge-red', cancelled: 'adm-badge-red',
  disputed: 'adm-badge-orange',
};

const ALLOWED_ADMIN_TRANSITIONS = {
  draft: ['pending','cancelled'], pending: ['accepted','rejected','cancelled'],
  accepted: ['confirmed','cancelled','disputed'], confirmed: ['in_fulfillment','disputed'],
  in_fulfillment: ['delivered','disputed'], delivered: ['completed','disputed'],
  disputed: ['completed','cancelled'],
};

export default function AdminOrders() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]   = useState(1);
  const [detail, setDetail] = useState(null);
  const [transition, setTransition] = useState(null);
  const LIMIT = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, page],
    queryFn: () => orderApi.list({ status: statusFilter || undefined, page, limit: LIMIT }).then(r => r.data),
  });

  const { data: detailData } = useQuery({
    queryKey: ['admin-order-detail', detail],
    queryFn: () => orderApi.get(detail).then(r => r.data),
    enabled: !!detail,
  });

  const transitionMutation = useMutation({
    mutationFn: ({ id, status, reason }) => orderApi.transition(id, { status, transitionReason: reason }),
    onSuccess: () => { qc.invalidateQueries(['admin-orders']); qc.invalidateQueries(['admin-order-detail', detail]); setTransition(null); },
  });

  const orders  = data?.orders ?? [];
  const total   = data?.total  ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Order Management</h1>
          <p className="adm-page-subtitle">{total} orders total</p>
        </div>
        <div className="adm-page-actions">
          <select className="adm-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {ORDER_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Order #</th><th>Commodity</th><th>Buyer</th><th>Supplier</th><th>Qty (qq)</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="adm-loading">Loading…</td></tr>}
              {!isLoading && orders.length === 0 && <tr><td colSpan={8} className="adm-empty">No orders found.</td></tr>}
              {orders.map(order => (
                <tr key={order._id}>
                  <td><strong style={{ fontSize:12 }}>{order.orderNumber}</strong></td>
                  <td>{order.commodity?.name || '—'}</td>
                  <td style={{ fontSize:11 }}>{order.buyer?.firstName} {order.buyer?.lastName}</td>
                  <td style={{ fontSize:11 }}>{order.supplier?.firstName || '—'}</td>
                  <td>{order.quantityKg ? (order.quantityKg/100).toFixed(1) : '—'}</td>
                  <td><span className={`adm-badge ${STATUS_BADGE[order.status]||'adm-badge-gray'}`}>{order.status}</span></td>
                  <td style={{ fontSize:11, color:'var(--adm-muted)' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="adm-table-actions">
                      <button className="adm-btn adm-btn-secondary adm-btn-sm adm-btn-icon"
                        onClick={() => setDetail(order._id)} title="View details">
                        <Eye size={12} />
                      </button>
                      {(ALLOWED_ADMIN_TRANSITIONS[order.status]?.length > 0) && (
                        <button className="adm-btn adm-btn-secondary adm-btn-sm"
                          onClick={() => setTransition({ order })}>
                          Transition
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid var(--adm-border)' }}>
            <span style={{ fontSize:11, color:'var(--adm-muted)' }}>Page {page} of {totalPages}</span>
            <div style={{ display:'flex', gap:6 }}>
              <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setPage(p => p-1)} disabled={page===1}><ChevronLeft size={13} /></button>
              <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setPage(p => p+1)} disabled={page>=totalPages}><ChevronRight size={13} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Order detail drawer */}
      {detail && detailData && (
        <div className="adm-dialog-overlay" onClick={() => setDetail(null)}>
          <div className="adm-dialog adm-dialog-wide" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom:16 }}>Order {detailData.order?.orderNumber}</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, fontSize:12 }}>
              {[
                ['Status', <span className={`adm-badge ${STATUS_BADGE[detailData.order?.status]}`}>{detailData.order?.status}</span>],
                ['Commodity', detailData.order?.commodity?.name],
                ['Buyer', `${detailData.order?.buyer?.firstName} ${detailData.order?.buyer?.lastName}`],
                ['Supplier', detailData.order?.supplier ? `${detailData.order.supplier.firstName} ${detailData.order.supplier.lastName}` : '—'],
                ['Quantity', detailData.order?.quantityKg ? `${(detailData.order.quantityKg/100).toFixed(2)} qq` : '—'],
                ['Delivery location', detailData.order?.deliveryLocation || '—'],
              ].map(([label, val]) => (
                <div key={label}><div style={{ color:'var(--adm-muted)', fontSize:10, marginBottom:2 }}>{label}</div><div>{val}</div></div>
              ))}
            </div>
            <div style={{ marginTop:16 }}>
              <div style={{ fontSize:10, color:'var(--adm-muted)', marginBottom:6, fontWeight:700 }}>STATE HISTORY</div>
              {detailData.order?.stateHistory?.slice(-5).map((h, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, padding:'5px 0', borderBottom:'1px solid var(--adm-border)' }}>
                  <span style={{ color:'var(--adm-muted)' }}>{h.fromState}</span>
                  <ArrowRight size={11} />
                  <span style={{ fontWeight:600 }}>{h.toState}</span>
                  <span style={{ marginLeft:'auto', color:'var(--adm-muted)' }}>{new Date(h.timestamp).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
            <button className="adm-btn adm-btn-secondary" style={{ marginTop:16 }} onClick={() => setDetail(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Transition dialog */}
      {transition && (
        <div className="adm-dialog-overlay">
          <div className="adm-dialog">
            <h3>Transition Order {transition.order.orderNumber}</h3>
            <p style={{ fontSize:12, color:'var(--adm-muted)', marginTop:8 }}>Current status: <strong>{transition.order.status}</strong></p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:16 }}>
              {(ALLOWED_ADMIN_TRANSITIONS[transition.order.status] || []).map(target => (
                <button key={target}
                  className={`adm-btn ${target==='cancelled'||target==='rejected'?'adm-btn-danger':'adm-btn-secondary'}`}
                  onClick={() => transitionMutation.mutate({ id: transition.order._id, status: target, reason: 'Admin action' })}
                  disabled={transitionMutation.isLoading}>
                  → {target}
                </button>
              ))}
            </div>
            <button className="adm-btn adm-btn-secondary" style={{ marginTop:12 }} onClick={() => setTransition(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

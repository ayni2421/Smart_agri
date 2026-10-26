import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi, commodityApi, marketApi } from '../services/api';
import { useAuth } from '../App';

const STATUS_COLORS = {
  draft: 'badge-gray', pending: 'badge-yellow', accepted: 'badge-blue',
  rejected: 'badge-red', confirmed: 'badge-blue', in_fulfillment: 'badge-blue',
  delivered: 'badge-green', completed: 'badge-green',
  cancelled: 'badge-gray', disputed: 'badge-red',
};

const ALLOWED_TRANSITIONS = {
  buyer: { draft: ['pending', 'cancelled'], pending: ['cancelled'], accepted: ['confirmed', 'cancelled', 'disputed'], delivered: ['completed', 'disputed'] },
  supplier: { pending: ['accepted', 'rejected'], confirmed: ['in_fulfillment'], accepted: ['disputed'] },
  transporter: { in_fulfillment: ['delivered'] },
  admin: { disputed: ['completed', 'cancelled'] },
};

export default function OrdersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ commodity: '', market: '', submittedQuantity: '', submittedUnit: 'quintal', deliveryLocation: '', notes: '' });
  const [createError, setCreateError] = useState('');

  const { data: commodities } = useQuery({ queryKey: ['commodities'], queryFn: () => commodityApi.list().then(r => r.data.commodities) });
  const { data: markets } = useQuery({ queryKey: ['markets'], queryFn: () => marketApi.list().then(r => r.data.markets) });
  const { data, isLoading } = useQuery({ queryKey: ['orders'], queryFn: () => orderApi.list().then(r => r.data) });

  const createMutation = useMutation({
    mutationFn: (data) => orderApi.create(data),
    onSuccess: () => { qc.invalidateQueries(['orders']); setShowCreate(false); setCreateForm({ commodity: '', market: '', submittedQuantity: '', submittedUnit: 'quintal', deliveryLocation: '', notes: '' }); },
    onError: (err) => setCreateError(err.response?.data?.error || 'Failed to create order.'),
  });

  const transitionMutation = useMutation({
    mutationFn: ({ id, status, reason }) => orderApi.transition(id, { status, transitionReason: reason }),
    onSuccess: () => qc.invalidateQueries(['orders']),
  });

  const allowed = ALLOWED_TRANSITIONS[user?.role] || {};

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: 'var(--color-primary)' }}>Procurement Orders</h2>
        {user?.role === 'buyer' && (
          <button className="btn-primary" onClick={() => setShowCreate(true)}>+ New Order</button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>New Procurement Request</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label>Commodity *</label>
              <select value={createForm.commodity} onChange={e => setCreateForm({ ...createForm, commodity: e.target.value })}>
                <option value="">Select commodity</option>
                {commodities?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label>Market</label>
              <select value={createForm.market} onChange={e => setCreateForm({ ...createForm, market: e.target.value })}>
                <option value="">Any market</option>
                {markets?.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label>Quantity *</label>
              <input type="number" min="0.001" step="0.01" value={createForm.submittedQuantity}
                onChange={e => setCreateForm({ ...createForm, submittedQuantity: e.target.value })} />
            </div>
            <div>
              <label>Unit *</label>
              <select value={createForm.submittedUnit} onChange={e => setCreateForm({ ...createForm, submittedUnit: e.target.value })}>
                <option value="quintal">Quintal (100 kg)</option>
                <option value="kg">kg</option>
                <option value="tonne">Metric tonne</option>
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label>Delivery location</label>
              <input type="text" value={createForm.deliveryLocation}
                onChange={e => setCreateForm({ ...createForm, deliveryLocation: e.target.value })} />
            </div>
          </div>
          {createError && <p className="error-msg">{createError}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn-primary" onClick={() => createMutation.mutate(createForm)} disabled={createMutation.isLoading}>
              {createMutation.isLoading ? 'Creating…' : 'Create order'}
            </button>
            <button className="btn-secondary" onClick={() => { setShowCreate(false); setCreateError(''); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Orders list */}
      {isLoading && <p style={{ color: 'var(--color-text-muted)' }}>Loading orders…</p>}
      {data?.orders?.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>No orders found.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data?.orders?.map((order) => (
          <div key={order._id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <strong>{order.orderNumber}</strong>
                <span className={`badge ${STATUS_COLORS[order.status] || 'badge-gray'}`} style={{ marginLeft: 8 }}>
                  {order.status}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {new Date(order.createdAt).toLocaleDateString()}
              </div>
            </div>
            <p style={{ margin: '8px 0 4px', fontSize: '0.9rem' }}>
              <strong>{order.commodity?.name}</strong> — {order.submittedQuantity} {order.submittedUnit}
              {order.market && <span style={{ color: 'var(--color-text-muted)' }}> @ {order.market.name}</span>}
            </p>
            {order.deliveryLocation && (
              <p style={{ margin: '2px 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Delivery: {order.deliveryLocation}
              </p>
            )}

            {/* Available transitions */}
            {allowed[order.status] && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {allowed[order.status].map((target) => (
                  <button
                    key={target}
                    className={target === 'cancelled' || target === 'rejected' ? 'btn-danger' : 'btn-primary'}
                    style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                    onClick={() => transitionMutation.mutate({ id: order._id, status: target })}
                    disabled={transitionMutation.isLoading}
                  >
                    → {target}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, commodityApi, marketApi } from '../services/api';

export default function InventoryPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ commodity: '', market: '', submittedQuantity: '', submittedUnit: 'quintal', submittedAskPrice: '', harvestDate: '', storageLocation: '' });
  const [formError, setFormError] = useState('');

  const { data: commodities } = useQuery({ queryKey: ['commodities'], queryFn: () => commodityApi.list().then(r => r.data.commodities) });
  const { data: markets } = useQuery({ queryKey: ['markets'], queryFn: () => marketApi.list().then(r => r.data.markets) });
  const { data, isLoading } = useQuery({ queryKey: ['inventory'], queryFn: () => inventoryApi.list().then(r => r.data) });

  const createMutation = useMutation({
    mutationFn: (d) => inventoryApi.create(d),
    onSuccess: () => { qc.invalidateQueries(['inventory']); setShowForm(false); },
    onError: (err) => setFormError(err.response?.data?.error || 'Failed to create record.'),
  });

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: 'var(--color-primary)' }}>Inventory</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add inventory</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>New inventory record</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[['commodity', 'Commodity', commodities, (c) => c.name], ['market', 'Market', markets, (m) => m.name]].map(([field, label, opts, getName]) => (
              <div key={field}>
                <label>{label}</label>
                <select value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}>
                  <option value="">Select {label.toLowerCase()}</option>
                  {opts?.map(o => <option key={o._id} value={o._id}>{getName(o)}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label>Available quantity *</label>
              <input type="number" min="0" value={form.submittedQuantity} onChange={e => setForm({ ...form, submittedQuantity: e.target.value })} />
            </div>
            <div>
              <label>Unit</label>
              <select value={form.submittedUnit} onChange={e => setForm({ ...form, submittedUnit: e.target.value })}>
                <option value="quintal">Quintal (100 kg)</option>
                <option value="kg">kg</option>
                <option value="tonne">Tonne</option>
              </select>
            </div>
            <div>
              <label>Ask price (ETB per unit)</label>
              <input type="number" min="0" value={form.submittedAskPrice} onChange={e => setForm({ ...form, submittedAskPrice: e.target.value })} />
            </div>
            <div>
              <label>Harvest date</label>
              <input type="date" value={form.harvestDate} onChange={e => setForm({ ...form, harvestDate: e.target.value })} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label>Storage location</label>
              <input type="text" value={form.storageLocation} onChange={e => setForm({ ...form, storageLocation: e.target.value })} />
            </div>
          </div>
          {formError && <p className="error-msg">{formError}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn-primary" onClick={() => createMutation.mutate(form)} disabled={createMutation.isLoading}>
              {createMutation.isLoading ? 'Saving…' : 'Save record'}
            </button>
            <button className="btn-secondary" onClick={() => { setShowForm(false); setFormError(''); }}>Cancel</button>
          </div>
        </div>
      )}

      {isLoading && <p>Loading inventory…</p>}
      {data?.inventory?.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>No inventory records found.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {data?.inventory?.map(rec => (
          <div key={rec._id} className="card">
            <strong>{rec.commodity?.name}</strong>
            <p style={{ margin: '4px 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{rec.market?.name || 'No market specified'}</p>
            <p style={{ margin: '4px 0' }}>
              Available: <strong>{(rec.availableQuantityKg / 100).toFixed(2)} quintal</strong>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}> ({rec.availableQuantityKg} kg)</span>
            </p>
            {rec.askPricePerKg && (
              <p style={{ margin: '4px 0', fontSize: '0.85rem' }}>
                Ask price: {(rec.askPricePerKg * 100).toFixed(2)} ETB/quintal
              </p>
            )}
            <span className={`badge ${rec.isActive ? 'badge-green' : 'badge-gray'}`}>
              {rec.isActive ? 'active' : 'inactive'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

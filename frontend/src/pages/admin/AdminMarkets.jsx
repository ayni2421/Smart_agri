import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketApi } from '../../services/api';
import { RegionSelect } from '../../utils/ethiopianRegions.jsx';
import { PlusCircle, Pencil, PowerOff } from 'lucide-react';

const EMPTY_FORM = {
  name: '', region: '', zone: '', woreda: '', town: '',
  latitude: '', longitude: '', description: '',
};

export default function AdminMarkets() {
  const qc = useQueryClient();
  const [showForm,          setShowForm]          = useState(false);
  const [editTarget,        setEditTarget]        = useState(null);
  const [form,              setForm]              = useState(EMPTY_FORM);
  const [err,               setErr]               = useState('');
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['markets-admin'],
    queryFn: () => marketApi.list().then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (d) => editTarget ? marketApi.update(editTarget._id, d) : marketApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries(['markets-admin']);
      qc.invalidateQueries(['markets']);
      setShowForm(false);
      setEditTarget(null);
      setForm(EMPTY_FORM);
      setErr('');
    },
    onError: (e) => setErr(e.response?.data?.error || e.response?.data?.fields?.[0]?.message || 'Failed to save market.'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => marketApi.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries(['markets-admin']);
      qc.invalidateQueries(['markets']);
      setConfirmDeactivate(null);
    },
  });

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setErr('');
    setShowForm(true);
  };

  const openEdit = (m) => {
    setEditTarget(m);
    setForm({
      name:        m.name        || '',
      region:      m.region      || '',
      zone:        m.zone        || '',
      woreda:      m.woreda      || '',
      town:        m.town        || '',
      latitude:    m.latitude    != null ? String(m.latitude)  : '',
      longitude:   m.longitude   != null ? String(m.longitude) : '',
      description: m.description || '',
    });
    setErr('');
    setShowForm(true);
  };

  const handleSave = () => {
    const payload = {
      ...form,
      latitude:  form.latitude  !== '' ? parseFloat(form.latitude)  : undefined,
      longitude: form.longitude !== '' ? parseFloat(form.longitude) : undefined,
    };
    saveMutation.mutate(payload);
  };

  const markets = data?.markets ?? [];

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Market Management</h1>
          <p className="adm-page-subtitle">{markets.length} active markets</p>
        </div>
        <button className="adm-btn adm-btn-primary" onClick={openCreate}>
          <PlusCircle size={14} /> Add market
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="adm-card adm-mb16" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
            {editTarget ? 'Edit market' : 'New market'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {/* Market name */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={lbl}>Market name <span style={req}>*</span></label>
              <input className="adm-input" style={{ width: '100%' }}
                placeholder="e.g. Debre Markos Market"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>

            {/* Town */}
            <div>
              <label style={lbl}>Town / City</label>
              <input className="adm-input" style={{ width: '100%' }}
                placeholder="e.g. Debre Markos"
                value={form.town}
                onChange={e => setForm({ ...form, town: e.target.value })} />
            </div>

            {/* Region dropdown */}
            <div>
              <label style={lbl}>Region <span style={req}>*</span></label>
              <RegionSelect
                className="adm-select"
                style={{ width: '100%' }}
                value={form.region}
                onChange={e => setForm({ ...form, region: e.target.value })}
                required
              />
            </div>

            {/* Zone */}
            <div>
              <label style={lbl}>Zone</label>
              <input className="adm-input" style={{ width: '100%' }}
                placeholder="e.g. East Gojjam"
                value={form.zone}
                onChange={e => setForm({ ...form, zone: e.target.value })} />
            </div>

            {/* Woreda */}
            <div>
              <label style={lbl}>Woreda</label>
              <input className="adm-input" style={{ width: '100%' }}
                placeholder="e.g. Debre Markos"
                value={form.woreda}
                onChange={e => setForm({ ...form, woreda: e.target.value })} />
            </div>

            {/* Coordinates */}
            <div>
              <label style={lbl}>Latitude</label>
              <input className="adm-input" style={{ width: '100%' }}
                type="number" step="0.0001" placeholder="e.g. 10.3380"
                value={form.latitude}
                onChange={e => setForm({ ...form, latitude: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>Longitude</label>
              <input className="adm-input" style={{ width: '100%' }}
                type="number" step="0.0001" placeholder="e.g. 37.7336"
                value={form.longitude}
                onChange={e => setForm({ ...form, longitude: e.target.value })} />
            </div>

            {/* Description */}
            <div style={{ gridColumn: 'span 3' }}>
              <label style={lbl}>Description</label>
              <input className="adm-input" style={{ width: '100%' }}
                placeholder="Optional notes about this market"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>

          {err && (
            <p style={{ color: 'var(--adm-danger)', fontSize: 11, marginTop: 8 }}>{err}</p>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              className="adm-btn adm-btn-primary"
              onClick={handleSave}
              disabled={saveMutation.isLoading}
            >
              {saveMutation.isLoading ? 'Saving…' : editTarget ? 'Save changes' : 'Create market'}
            </button>
            <button
              className="adm-btn adm-btn-secondary"
              onClick={() => { setShowForm(false); setErr(''); }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Markets table */}
      <div className="adm-card">
        {isLoading ? (
          <div className="adm-loading">Loading markets…</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Market name</th>
                  <th>Region</th>
                  <th>Zone</th>
                  <th>Town</th>
                  <th>Coordinates</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {markets.length === 0 && (
                  <tr>
                    <td colSpan={7} className="adm-empty">No markets found.</td>
                  </tr>
                )}
                {markets.map(m => (
                  <tr key={m._id}>
                    <td><strong style={{ fontSize: 12 }}>{m.name}</strong></td>
                    <td style={{ fontSize: 11 }}>{m.region}</td>
                    <td style={{ fontSize: 11, color: 'var(--adm-muted)' }}>{m.zone || '—'}</td>
                    <td style={{ fontSize: 11, color: 'var(--adm-muted)' }}>{m.town || '—'}</td>
                    <td style={{ fontSize: 10, color: 'var(--adm-muted)' }}>
                      {m.latitude != null && m.longitude != null
                        ? `${m.latitude.toFixed(4)}, ${m.longitude.toFixed(4)}`
                        : '—'}
                    </td>
                    <td>
                      <span className={`adm-badge ${m.isActive ? 'adm-badge-green' : 'adm-badge-gray'}`}>
                        {m.isActive ? 'active' : 'inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="adm-table-actions">
                        <button
                          className="adm-btn adm-btn-secondary adm-btn-sm adm-btn-icon"
                          onClick={() => openEdit(m)}
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                        {m.isActive && (
                          <button
                            className="adm-btn adm-btn-danger adm-btn-sm adm-btn-icon"
                            onClick={() => setConfirmDeactivate(m)}
                            title="Deactivate"
                          >
                            <PowerOff size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      {confirmDeactivate && (
        <div className="adm-dialog-overlay">
          <div className="adm-dialog">
            <h3>Deactivate {confirmDeactivate.name}?</h3>
            <p style={{ fontSize: 12, color: 'var(--adm-muted)', marginTop: 8 }}>
              Historical price records linked to this market will be retained.
              The market will no longer appear in new price submissions.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                className="adm-btn adm-btn-danger"
                onClick={() => deactivateMutation.mutate(confirmDeactivate._id)}
                disabled={deactivateMutation.isLoading}
              >
                {deactivateMutation.isLoading ? 'Deactivating…' : 'Deactivate'}
              </button>
              <button
                className="adm-btn adm-btn-secondary"
                onClick={() => setConfirmDeactivate(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Shared inline label styles
const lbl = { display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4, color: '#374151' };
const req = { color: 'var(--adm-danger)' };

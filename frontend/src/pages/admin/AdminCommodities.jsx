import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commodityApi } from '../../services/api';
import { PlusCircle, Pencil, PowerOff } from 'lucide-react';

export default function AdminCommodities() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ name:'', nameAmharic:'', category:'cereal', defaultDisplayUnit:'quintal' });
  const [err, setErr] = useState('');
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);

  const { data } = useQuery({ queryKey:['commodities-admin'], queryFn: () => commodityApi.list().then(r=>r.data) });

  const createMutation = useMutation({
    mutationFn: (d) => editTarget ? commodityApi.update(editTarget._id, d) : commodityApi.create(d),
    onSuccess: () => { qc.invalidateQueries(['commodities-admin']); qc.invalidateQueries(['commodities']); setShowForm(false); setEditTarget(null); setForm({ name:'', nameAmharic:'', category:'cereal', defaultDisplayUnit:'quintal' }); },
    onError: (e) => setErr(e.response?.data?.error || 'Failed.'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => commodityApi.deactivate(id),
    onSuccess: () => { qc.invalidateQueries(['commodities-admin']); qc.invalidateQueries(['commodities']); setConfirmDeactivate(null); },
  });

  const openEdit = (c) => { setEditTarget(c); setForm({ name:c.name, nameAmharic:c.nameAmharic||'', category:c.category||'cereal', defaultDisplayUnit:c.defaultDisplayUnit||'quintal' }); setShowForm(true); };

  return (
    <div>
      <div className="adm-page-header">
        <div><h1 className="adm-page-title">Commodity Management</h1><p className="adm-page-subtitle">Manage tracked agricultural commodities</p></div>
        <button className="adm-btn adm-btn-primary" onClick={() => { setEditTarget(null); setForm({ name:'', nameAmharic:'', category:'cereal', defaultDisplayUnit:'quintal' }); setShowForm(true); }}>
          <PlusCircle size={14} /> Add commodity
        </button>
      </div>

      {showForm && (
        <div className="adm-card adm-mb16" style={{ padding:20 }}>
          <h3 style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>{editTarget ? 'Edit' : 'New'} Commodity</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12 }}>
            {[['name','Name (English)'],['nameAmharic','Amharic name'],['category','Category']].map(([f,l]) => (
              <div key={f}><label style={{ display:'block', fontSize:11, fontWeight:600, marginBottom:4 }}>{l}</label>
              <input className="adm-input" style={{ width:'100%' }} value={form[f]} onChange={e => setForm({...form,[f]:e.target.value})} /></div>
            ))}
            <div><label style={{ display:'block', fontSize:11, fontWeight:600, marginBottom:4 }}>Default unit</label>
            <select className="adm-select" style={{ width:'100%' }} value={form.defaultDisplayUnit} onChange={e => setForm({...form,defaultDisplayUnit:e.target.value})}>
              <option value="quintal">Quintal</option><option value="kg">kg</option><option value="tonne">Tonne</option>
            </select></div>
          </div>
          {err && <p style={{ color:'var(--adm-danger)', fontSize:11, marginTop:8 }}>{err}</p>}
          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <button className="adm-btn adm-btn-primary" onClick={() => createMutation.mutate(form)} disabled={createMutation.isLoading}>
              {createMutation.isLoading ? 'Saving…' : 'Save'}
            </button>
            <button className="adm-btn adm-btn-secondary" onClick={() => { setShowForm(false); setErr(''); }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Name</th><th>Amharic</th><th>Category</th><th>Default unit</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {(data?.commodities || []).map(c => (
                <tr key={c._id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.nameAmharic || '—'}</td>
                  <td>{c.category || '—'}</td>
                  <td><span className="adm-badge adm-badge-blue">{c.defaultDisplayUnit}</span></td>
                  <td><span className={`adm-badge ${c.isActive ? 'adm-badge-green' : 'adm-badge-gray'}`}>{c.isActive ? 'active' : 'inactive'}</span></td>
                  <td>
                    <div className="adm-table-actions">
                      <button className="adm-btn adm-btn-secondary adm-btn-sm adm-btn-icon" onClick={() => openEdit(c)}><Pencil size={12}/></button>
                      {c.isActive && <button className="adm-btn adm-btn-danger adm-btn-sm adm-btn-icon" onClick={() => setConfirmDeactivate(c)} title="Deactivate"><PowerOff size={12}/></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDeactivate && (
        <div className="adm-dialog-overlay">
          <div className="adm-dialog">
            <h3>Deactivate {confirmDeactivate.name}?</h3>
            <p style={{ fontSize:12, color:'var(--adm-muted)', marginTop:8 }}>Historical price records will be retained (FR-COM-05). This only hides the commodity from new submissions.</p>
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <button className="adm-btn adm-btn-danger" onClick={() => deactivateMutation.mutate(confirmDeactivate._id)}>Deactivate</button>
              <button className="adm-btn adm-btn-secondary" onClick={() => setConfirmDeactivate(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

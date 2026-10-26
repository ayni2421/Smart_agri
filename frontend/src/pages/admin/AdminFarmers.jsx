import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../services/api';
import { CheckCircle2 } from 'lucide-react';

export default function AdminFarmers() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-farmers', statusFilter],
    queryFn: () => userApi.list({ role: 'farmer', status: statusFilter||undefined, limit: 50 }).then(r=>r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => userApi.setStatus(id, status),
    onSuccess: () => qc.invalidateQueries(['admin-farmers']),
  });

  const farmers = data?.users ?? [];
  const STATUS_BADGE = { active:'adm-badge-green', pending_approval:'adm-badge-yellow', suspended:'adm-badge-red', deactivated:'adm-badge-gray' };

  return (
    <div>
      <div className="adm-page-header">
        <div><h1 className="adm-page-title">Farmer Management</h1><p className="adm-page-subtitle">{data?.total ?? 0} registered farmers</p></div>
        <div className="adm-page-actions">
          <select className="adm-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {['pending_approval','active','suspended'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Name</th><th>Email</th><th>Region</th><th>Status</th><th>Registered</th><th>Actions</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="adm-loading">Loading…</td></tr>}
              {!isLoading && farmers.length === 0 && <tr><td colSpan={6} className="adm-empty">No farmers found.</td></tr>}
              {farmers.map(f => (
                <tr key={f._id}>
                  <td><strong style={{ fontSize:12 }}>{f.firstName} {f.lastName}</strong></td>
                  <td style={{ fontSize:11, color:'var(--adm-muted)' }}>{f.email}</td>
                  <td style={{ fontSize:11 }}>{f.region || '—'}</td>
                  <td><span className={`adm-badge ${STATUS_BADGE[f.status]||'adm-badge-gray'}`}>{f.status?.replace('_',' ')}</span></td>
                  <td style={{ fontSize:11, color:'var(--adm-muted)' }}>{new Date(f.createdAt).toLocaleDateString()}</td>
                  <td>
                    {f.status === 'pending_approval' && (
                      <button className="adm-btn adm-btn-secondary adm-btn-sm"
                        onClick={() => statusMutation.mutate({ id: f._id, status: 'active' })}>
                        <CheckCircle2 size={12}/> Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

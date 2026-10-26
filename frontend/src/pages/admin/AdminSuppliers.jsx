import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../services/api';
import { CheckCircle2, Ban } from 'lucide-react';

export default function AdminSuppliers() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-suppliers', statusFilter],
    queryFn: () => userApi.list({ role: 'supplier', status: statusFilter||undefined, limit: 50 }).then(r=>r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => userApi.setStatus(id, status),
    onSuccess: () => qc.invalidateQueries(['admin-suppliers']),
  });

  const suppliers = data?.users ?? [];
  const STATUS_BADGE = { active:'adm-badge-green', pending_approval:'adm-badge-yellow', suspended:'adm-badge-red', deactivated:'adm-badge-gray' };

  return (
    <div>
      <div className="adm-page-header">
        <div><h1 className="adm-page-title">Supplier Management</h1><p className="adm-page-subtitle">{data?.total ?? 0} supplier accounts</p></div>
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
            <thead><tr><th>Name</th><th>Email</th><th>Region</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="adm-loading">Loading…</td></tr>}
              {!isLoading && suppliers.length === 0 && <tr><td colSpan={6} className="adm-empty">No suppliers found.</td></tr>}
              {suppliers.map(s => (
                <tr key={s._id}>
                  <td><strong style={{ fontSize:12 }}>{s.firstName} {s.lastName}</strong></td>
                  <td style={{ fontSize:11, color:'var(--adm-muted)' }}>{s.email}</td>
                  <td style={{ fontSize:11 }}>{s.region || '—'}</td>
                  <td><span className={`adm-badge ${STATUS_BADGE[s.status]||'adm-badge-gray'}`}>{s.status?.replace('_',' ')}</span></td>
                  <td style={{ fontSize:11, color:'var(--adm-muted)' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="adm-table-actions">
                      {s.status === 'pending_approval' && (
                        <button className="adm-btn adm-btn-secondary adm-btn-sm"
                          onClick={() => statusMutation.mutate({ id: s._id, status: 'active' })}>
                          <CheckCircle2 size={12}/> Approve
                        </button>
                      )}
                      {s.status === 'active' && (
                        <button className="adm-btn adm-btn-danger adm-btn-sm"
                          onClick={() => statusMutation.mutate({ id: s._id, status: 'suspended' })}>
                          <Ban size={12}/> Suspend
                        </button>
                      )}
                    </div>
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

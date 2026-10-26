import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../services/api';

const STATUS_COLORS = { active: 'badge-green', pending_approval: 'badge-yellow', suspended: 'badge-red', deactivated: 'badge-gray' };

export default function AdminPage() {
  const qc = useQueryClient();
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', roleFilter, statusFilter],
    queryFn: () => userApi.list({ role: roleFilter, status: statusFilter }).then(r => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => userApi.setStatus(id, status),
    onSuccess: () => qc.invalidateQueries(['users']),
  });

  const ROLES = ['', 'farmer', 'agent', 'buyer', 'supplier', 'transporter', 'data_reviewer', 'admin'];
  const STATUSES = ['', 'pending_approval', 'active', 'suspended', 'deactivated'];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
      <h2 style={{ color: 'var(--color-primary)' }}>User Management</h2>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div>
            <label>Filter by role</label>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r || 'All roles'}</option>)}
            </select>
          </div>
          <div>
            <label>Filter by status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
            </select>
          </div>
        </div>
      </div>

      {isLoading && <p>Loading users…</p>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
              {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '8px 12px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.users?.map(user => (
              <tr key={user._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '8px 12px' }}>{user.firstName} {user.lastName}</td>
                <td style={{ padding: '8px 12px', color: 'var(--color-text-muted)' }}>{user.email}</td>
                <td style={{ padding: '8px 12px' }}>{user.role}</td>
                <td style={{ padding: '8px 12px' }}>
                  <span className={`badge ${STATUS_COLORS[user.status] || 'badge-gray'}`}>{user.status}</span>
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {user.status === 'pending_approval' && (
                      <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                        onClick={() => statusMutation.mutate({ id: user._id, status: 'active' })}>
                        Approve
                      </button>
                    )}
                    {user.status === 'active' && (
                      <button className="btn-danger" style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                        onClick={() => statusMutation.mutate({ id: user._id, status: 'suspended' })}>
                        Suspend
                      </button>
                    )}
                    {user.status === 'suspended' && (
                      <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                        onClick={() => statusMutation.mutate({ id: user._id, status: 'active' })}>
                        Reactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data?.total !== undefined && (
        <p style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          {data.total} users total
        </p>
      )}
    </div>
  );
}

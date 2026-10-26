import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../services/api';
import { RegionSelect } from '../../utils/ethiopianRegions.jsx';
import { UserPlus, Search, Ban, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

// All roles in the platform — used for tabs and the create form
const ALL_ROLES = ['farmer', 'agent', 'buyer', 'supplier', 'transporter', 'data_reviewer', 'admin'];

const ROLE_TABS = [
  { value: '',              label: 'All users' },
  { value: 'farmer',        label: 'Farmers' },
  { value: 'agent',         label: 'Agents' },
  { value: 'buyer',         label: 'Buyers' },
  { value: 'supplier',      label: 'Suppliers' },
  { value: 'transporter',   label: 'Transporters' },
  { value: 'data_reviewer', label: 'Reviewers' },
  { value: 'admin',         label: 'Admins' },
];

const STATUS_FILTER = ['', 'pending_approval', 'active', 'suspended', 'deactivated'];

const STATUS_BADGE = {
  active:           'adm-badge-green',
  pending_approval: 'adm-badge-yellow',
  suspended:        'adm-badge-red',
  deactivated:      'adm-badge-gray',
};

const EMPTY_FORM = { firstName: '', lastName: '', email: '', password: '', role: 'agent', region: '', phone: '' };

const LIMIT = 15;

export default function AdminUsers() {
  const qc = useQueryClient();

  // Filters
  const [roleTab,      setRoleTab]      = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(1);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [formError,  setFormError]  = useState('');

  // Confirm dialog
  const [confirm, setConfirm] = useState(null); // { userId, action, name }

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', roleTab, statusFilter, page],
    queryFn: () =>
      userApi.list({
        role:   roleTab      || undefined,
        status: statusFilter || undefined,
        page,
        limit:  LIMIT,
      }).then(r => r.data),
    keepPreviousData: true,
  });

  // Per-role counts for tab badges
  const { data: countData } = useQuery({
    queryKey: ['admin-users-counts'],
    queryFn: async () => {
      const results = await Promise.all(
        ALL_ROLES.map(r =>
          userApi.list({ role: r, limit: 1 }).then(res => ({ role: r, total: res.data.total }))
        )
      );
      const all = await userApi.list({ limit: 1 }).then(res => res.data.total);
      return { all, byRole: Object.fromEntries(results.map(r => [r.role, r.total])) };
    },
    staleTime: 10000,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => userApi.setStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries(['admin-users']);
      qc.invalidateQueries(['admin-users-counts']);
      setConfirm(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: (d) => userApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries(['admin-users']);
      qc.invalidateQueries(['admin-users-counts']);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      setFormError('');
    },
    onError: (e) => setFormError(e.response?.data?.error || 'Failed to create user.'),
  });

  // ── Derived ────────────────────────────────────────────────────────────────
  const users      = data?.users ?? [];
  const total      = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  // Client-side search on the current page
  const filtered = search.trim()
    ? users.filter(u =>
        `${u.firstName} ${u.lastName} ${u.email} ${u.region || ''}`
          .toLowerCase()
          .includes(search.toLowerCase()))
    : users;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const switchTab = (role) => {
    setRoleTab(role);
    setPage(1);
    setSearch('');
  };

  const tabCount = (role) => {
    if (!countData) return null;
    return role === '' ? countData.all : countData.byRole[role] ?? 0;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page header */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">User Management</h1>
          <p className="adm-page-subtitle">
            Farmers, agents, buyers, suppliers, transporters and reviewers are all users.
            Use the tabs below to filter by role.
          </p>
        </div>
        <div className="adm-page-actions">
          <button className="adm-btn adm-btn-primary" onClick={() => setShowCreate(true)}>
            <UserPlus size={14} /> Create user
          </button>
        </div>
      </div>

      {/* Role tabs */}
      <div className="adm-role-tabs">
        {ROLE_TABS.map(tab => (
          <button
            key={tab.value}
            className={`adm-role-tab ${roleTab === tab.value ? 'is-active' : ''}`}
            onClick={() => switchTab(tab.value)}
          >
            {tab.label}
            {tabCount(tab.value) !== null && (
              <span className="adm-tab-count">{tabCount(tab.value)}</span>
            )}
          </button>
        ))}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="adm-card adm-mb16" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Create user account</h3>
          <p style={{ fontSize: 11, color: 'var(--adm-muted)', marginBottom: 16 }}>
            Admin-created accounts are active immediately regardless of role.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[['firstName', 'First name'], ['lastName', 'Last name'], ['email', 'Email']].map(([f, l]) => (
              <div key={f}>
                <label style={lbl}>{l} *</label>
                <input className="adm-input" style={{ width: '100%' }}
                  type={f === 'email' ? 'email' : 'text'}
                  value={form[f]}
                  onChange={e => setForm({ ...form, [f]: e.target.value })} />
              </div>
            ))}

            <div>
              <label style={lbl}>Password *</label>
              <input className="adm-input" style={{ width: '100%' }}
                type="password" placeholder="Min 8 characters"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>

            <div>
              <label style={lbl}>Phone</label>
              <input className="adm-input" style={{ width: '100%' }}
                type="tel" placeholder="+251 9…"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>

            <div>
              <label style={lbl}>Role *</label>
              <select className="adm-select" style={{ width: '100%' }}
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}>
                {ALL_ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: 'span 3' }}>
              <label style={lbl}>Region / City Administration</label>
              <RegionSelect
                className="adm-select"
                style={{ width: '100%', maxWidth: 400 }}
                value={form.region}
                onChange={e => setForm({ ...form, region: e.target.value })}
              />
            </div>
          </div>

          {formError && (
            <p style={{ color: 'var(--adm-danger)', fontSize: 11, marginTop: 8 }}>{formError}</p>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="adm-btn adm-btn-primary"
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isLoading}>
              {createMutation.isLoading ? 'Creating…' : 'Create account'}
            </button>
            <button className="adm-btn adm-btn-secondary"
              onClick={() => { setShowCreate(false); setFormError(''); setForm(EMPTY_FORM); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters bar */}
      <div className="adm-card adm-mb16" style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--adm-muted)', pointerEvents: 'none' }} />
            <input className="adm-input" style={{ width: '100%', paddingLeft: 28 }}
              placeholder="Search name, email or region…"
              value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>

          <select className="adm-select" value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            {STATUS_FILTER.map(s => (
              <option key={s} value={s}>{s || 'All statuses'}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users table */}
      <div className="adm-card">
        {isLoading ? (
          <div className="adm-loading">Loading…</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Region</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="adm-empty">
                      {search ? 'No users match your search.' : 'No users found.'}
                    </td>
                  </tr>
                )}
                {filtered.map(user => (
                  <tr key={user._id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>
                        {user.firstName} {user.lastName}
                      </div>
                      {user.phone && (
                        <div style={{ fontSize: 10, color: 'var(--adm-muted)' }}>{user.phone}</div>
                      )}
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--adm-muted)' }}>{user.email}</td>
                    <td>
                      <span className="adm-badge adm-badge-blue">{user.role}</span>
                    </td>
                    <td style={{ fontSize: 11 }}>{user.region || '—'}</td>
                    <td>
                      <span className={`adm-badge ${STATUS_BADGE[user.status] || 'adm-badge-gray'}`}>
                        {user.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--adm-muted)' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="adm-table-actions">
                        {user.status === 'pending_approval' && (
                          <button className="adm-btn adm-btn-secondary adm-btn-sm"
                            onClick={() => setConfirm({ userId: user._id, action: 'active', name: `${user.firstName} ${user.lastName}`, label: 'approve' })}>
                            <CheckCircle2 size={12} /> Approve
                          </button>
                        )}
                        {user.status === 'active' && user.role !== 'admin' && (
                          <button className="adm-btn adm-btn-danger adm-btn-sm"
                            onClick={() => setConfirm({ userId: user._id, action: 'suspended', name: `${user.firstName} ${user.lastName}`, label: 'suspend' })}>
                            <Ban size={12} /> Suspend
                          </button>
                        )}
                        {user.status === 'suspended' && (
                          <button className="adm-btn adm-btn-secondary adm-btn-sm"
                            onClick={() => setConfirm({ userId: user._id, action: 'active', name: `${user.firstName} ${user.lastName}`, label: 'reactivate' })}>
                            <CheckCircle2 size={12} /> Reactivate
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--adm-border)' }}>
            <span style={{ fontSize: 11, color: 'var(--adm-muted)' }}>
              {total} total · page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="adm-btn adm-btn-secondary adm-btn-sm"
                onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                <ChevronLeft size={13} />
              </button>
              <button className="adm-btn adm-btn-secondary adm-btn-sm"
                onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      {confirm && (
        <div className="adm-dialog-overlay">
          <div className="adm-dialog">
            <h3 style={{ textTransform: 'capitalize' }}>{confirm.label} account?</h3>
            <p style={{ fontSize: 12, color: 'var(--adm-muted)', marginTop: 8 }}>
              This will {confirm.label} <strong>{confirm.name}</strong>.
              The change takes effect immediately.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="adm-btn adm-btn-secondary" onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button className="adm-btn adm-btn-primary"
                onClick={() => statusMutation.mutate({ id: confirm.userId, status: confirm.action })}
                disabled={statusMutation.isLoading}>
                {statusMutation.isLoading ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl = { display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4, color: '#374151' };

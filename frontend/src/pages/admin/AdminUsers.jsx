import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../services/api';
import api from '../../services/api';
import { RegionSelect } from '../../utils/ethiopianRegions.jsx';
import {
  UserPlus, Search, Ban, CheckCircle2, ChevronLeft, ChevronRight,
  Eye, Pencil, X, Clock, Users, AlertTriangle, UserCheck,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────
const ALL_ROLES = ['farmer', 'agent', 'buyer', 'supplier', 'transporter', 'data_reviewer', 'admin'];

const ROLE_TABS = [
  { value: '',              label: 'All users'    },
  { value: 'farmer',        label: 'Farmers'      },
  { value: 'agent',         label: 'Agents'       },
  { value: 'buyer',         label: 'Buyers'       },
  { value: 'supplier',      label: 'Suppliers'    },
  { value: 'transporter',   label: 'Transporters' },
  { value: 'data_reviewer', label: 'Reviewers'    },
  { value: 'admin',         label: 'Admins'       },
];

const STATUS_FILTER = ['', 'pending_approval', 'active', 'suspended', 'deactivated'];

const STATUS_BADGE = {
  active:           'adm-badge-green',
  pending_approval: 'adm-badge-yellow',
  suspended:        'adm-badge-red',
  deactivated:      'adm-badge-gray',
};

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', password: '',
  role: 'agent', region: '', phone: '',
};

const LIMIT = 15;

// ── User Detail Drawer ────────────────────────────────────────────────────
function UserDrawer({ userId, onClose, onAction }) {
  const [editMode,    setEditMode]    = useState(false);
  const [editForm,    setEditForm]    = useState(null);
  const [actionPanel, setActionPanel] = useState(null); // 'approve'|'suspend'|'reactivate'
  const [reason,      setReason]      = useState('');
  const qc = useQueryClient();

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user-detail', userId],
    queryFn: () => userApi.get(userId).then(r => r.data.user),
    onSuccess: (u) => setEditForm({
      firstName: u.firstName || '',
      lastName:  u.lastName  || '',
      phone:     u.phone     || '',
      region:    u.region    || '',
      woreda:    u.woreda    || '',
    }),
  });

  const { data: auditData } = useQuery({
    queryKey: ['user-audit', userId],
    queryFn: () => api.get('/audit', { params: { resourceType: 'User', limit: 10 } })
      .then(r => r.data.logs?.filter(l => String(l.resourceId) === userId) ?? []),
  });

  const editMutation = useMutation({
    mutationFn: (d) => userApi.updateProfile(userId, d),
    onSuccess: () => {
      qc.invalidateQueries(['user-detail', userId]);
      qc.invalidateQueries(['admin-users']);
      setEditMode(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, reason }) =>
      api.patch(`/users/${userId}/status`, { status, reason }),
    onSuccess: () => {
      qc.invalidateQueries(['user-detail', userId]);
      qc.invalidateQueries(['admin-users']);
      qc.invalidateQueries(['admin-users-counts']);
      setActionPanel(null);
      setReason('');
      onAction?.();
    },
  });

  const user = userData;

  return (
    <div className="adm-dialog-overlay" onClick={onClose}>
      <div
        className="adm-dialog adm-dialog-wide"
        style={{ maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>User details</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {isLoading && <div className="adm-loading">Loading…</div>}

        {user && (
          <>
            {/* Profile card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: 'var(--adm-cream)', borderRadius: 10, marginBottom: 16 }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--adm-forest-active)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 15 }}>
                  {user.firstName} {user.lastName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--adm-muted)', marginTop: 2 }}>{user.email}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <span className="adm-badge adm-badge-blue">{user.role}</span>
                  <span className={`adm-badge ${STATUS_BADGE[user.status] || 'adm-badge-gray'}`}>
                    {user.status?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Info rows */}
            {!editMode ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  {[
                    ['Phone',       user.phone   || '—'],
                    ['Region',      user.region  || '—'],
                    ['Woreda',      user.woreda  || '—'],
                    ['Registered',  new Date(user.createdAt).toLocaleString()],
                    ['Last login',  user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'],
                    ['User ID',     user._id],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--adm-border)', fontSize: 12 }}>
                      <span style={{ color: 'var(--adm-muted)', fontWeight: 600 }}>{label}</span>
                      <span style={{ maxWidth: '60%', textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
                    </div>
                  ))}
                </div>
                <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setEditMode(true)}>
                  <Pencil size={12} /> Edit profile
                </button>
              </>
            ) : (
              /* Edit form */
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  {[['firstName','First name'],['lastName','Last name'],['phone','Phone'],['woreda','Woreda']].map(([f,l]) => (
                    <div key={f}>
                      <label style={lbl}>{l}</label>
                      <input className="adm-input" style={{ width: '100%' }}
                        value={editForm[f]} onChange={e => setEditForm({ ...editForm, [f]: e.target.value })} />
                    </div>
                  ))}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={lbl}>Region</label>
                    <RegionSelect className="adm-select" style={{ width: '100%' }}
                      value={editForm.region} onChange={e => setEditForm({ ...editForm, region: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="adm-btn adm-btn-primary adm-btn-sm"
                    onClick={() => editMutation.mutate(editForm)}
                    disabled={editMutation.isLoading}>
                    {editMutation.isLoading ? 'Saving…' : 'Save'}
                  </button>
                  <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
                </div>
              </div>
            )}

            {/* ── Action panel ──────────────────────────────────────── */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--adm-border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-muted)', marginBottom: 10, letterSpacing: '0.5px' }}>
                ACCOUNT ACTIONS
              </div>

              {/* Approve */}
              {user.status === 'pending_approval' && actionPanel !== 'approve' && (
                <button className="adm-btn adm-btn-secondary adm-btn-sm" style={{ marginRight: 8 }}
                  onClick={() => setActionPanel('approve')}>
                  <CheckCircle2 size={12} /> Approve account
                </button>
              )}

              {/* Suspend */}
              {user.status === 'active' && user.role !== 'admin' && actionPanel !== 'suspend' && (
                <button className="adm-btn adm-btn-danger adm-btn-sm" style={{ marginRight: 8 }}
                  onClick={() => setActionPanel('suspend')}>
                  <Ban size={12} /> Suspend account
                </button>
              )}

              {/* Reactivate */}
              {user.status === 'suspended' && actionPanel !== 'reactivate' && (
                <button className="adm-btn adm-btn-secondary adm-btn-sm"
                  onClick={() => setActionPanel('reactivate')}>
                  <CheckCircle2 size={12} /> Reactivate account
                </button>
              )}

              {/* Action confirmation panel */}
              {actionPanel && (
                <div style={{ marginTop: 12, padding: 12, background: actionPanel === 'suspend' ? '#fef2f2' : '#f0fdf4', borderRadius: 8, border: `1px solid ${actionPanel === 'suspend' ? '#fecaca' : '#86efac'}` }}>
                  <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 8px', color: actionPanel === 'suspend' ? '#991b1b' : '#166534' }}>
                    {actionPanel === 'approve'    && `Approve ${user.firstName}'s account?`}
                    {actionPanel === 'suspend'    && `Suspend ${user.firstName}'s account?`}
                    {actionPanel === 'reactivate' && `Reactivate ${user.firstName}'s account?`}
                  </p>

                  {/* Reason — required for suspend, optional for others */}
                  <label style={lbl}>
                    {actionPanel === 'suspend' ? 'Reason (required)' : 'Note (optional)'}
                  </label>
                  <textarea
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--adm-border)', borderRadius: 6, fontSize: 12, resize: 'vertical', minHeight: 56, fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 10 }}
                    placeholder={actionPanel === 'suspend' ? 'Explain why this account is being suspended…' : 'Optional note…'}
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                  />

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className={`adm-btn adm-btn-sm ${actionPanel === 'suspend' ? 'adm-btn-danger' : 'adm-btn-primary'}`}
                      disabled={statusMutation.isLoading || (actionPanel === 'suspend' && !reason.trim())}
                      onClick={() => statusMutation.mutate({
                        status: actionPanel === 'suspend' ? 'suspended' : 'active',
                        reason,
                      })}
                    >
                      {statusMutation.isLoading ? 'Saving…' : 'Confirm'}
                    </button>
                    <button className="adm-btn adm-btn-secondary adm-btn-sm"
                      onClick={() => { setActionPanel(null); setReason(''); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Audit history for this user ────────────────────── */}
            {auditData && auditData.length > 0 && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--adm-border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-muted)', marginBottom: 10, letterSpacing: '0.5px' }}>
                  RECENT ACTIVITY
                </div>
                {auditData.map((log, i) => (
                  <div key={log._id} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: i < auditData.length - 1 ? '1px solid var(--adm-border)' : 'none', fontSize: 11 }}>
                    <Clock size={12} color="var(--adm-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>
                        {log.action}
                      </span>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <span style={{ color: 'var(--adm-muted)', marginLeft: 6 }}>
                          {JSON.stringify(log.details).slice(0, 60)}
                        </span>
                      )}
                    </div>
                    <span style={{ color: 'var(--adm-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function AdminUsers() {
  const qc = useQueryClient();

  const [roleTab,      setRoleTab]      = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(1);
  const [showCreate,   setShowCreate]   = useState(false);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [formError,    setFormError]    = useState('');
  const [drawerUserId, setDrawerUserId] = useState(null);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', roleTab, statusFilter, page],
    queryFn: () => userApi.list({
      role:   roleTab      || undefined,
      status: statusFilter || undefined,
      page,
      limit:  LIMIT,
    }).then(r => r.data),
    keepPreviousData: true,
  });

  // Summary counts for stat cards
  const { data: countData } = useQuery({
    queryKey: ['admin-users-counts'],
    queryFn: async () => {
      const [all, pending, suspended] = await Promise.all([
        userApi.list({ limit: 1 }).then(r => r.data.total),
        userApi.list({ status: 'pending_approval', limit: 1 }).then(r => r.data.total),
        userApi.list({ status: 'suspended', limit: 1 }).then(r => r.data.total),
      ]);
      const byRole = Object.fromEntries(
        await Promise.all(ALL_ROLES.map(r =>
          userApi.list({ role: r, limit: 1 }).then(res => [r, res.data.total])
        ))
      );
      return { all, pending, suspended, byRole };
    },
    staleTime: 15000,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
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

  // ── Derived ───────────────────────────────────────────────────────────────
  const users      = data?.users ?? [];
  const total      = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);
  const filtered   = search.trim()
    ? users.filter(u =>
        `${u.firstName} ${u.lastName} ${u.email} ${u.region || ''}`
          .toLowerCase().includes(search.toLowerCase()))
    : users;

  const switchTab = (role) => { setRoleTab(role); setPage(1); setSearch(''); };
  const tabCount  = (role) => role === '' ? countData?.all : countData?.byRole?.[role] ?? 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page header */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">User Management</h1>
          <p className="adm-page-subtitle">Manage accounts, roles, and access across all platform users</p>
        </div>
        <div className="adm-page-actions">
          <button className="adm-btn adm-btn-primary" onClick={() => setShowCreate(true)}>
            <UserPlus size={14} /> Create user
          </button>
        </div>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          {
            icon: <Users size={18} color="#245c3a" />,
            label: 'Total users',
            value: countData?.all ?? '—',
            sub: 'all roles',
            bg: '#e8f5ec',
            onClick: () => switchTab(''),
          },
          {
            icon: <Clock size={18} color="#f59e0b" />,
            label: 'Pending approval',
            value: countData?.pending ?? '—',
            sub: countData?.pending > 0 ? 'need review' : 'none pending',
            bg: countData?.pending > 0 ? '#fef9c3' : '#f9fafb',
            onClick: () => { switchTab(''); setStatusFilter('pending_approval'); },
          },
          {
            icon: <Ban size={18} color="#dc3545" />,
            label: 'Suspended',
            value: countData?.suspended ?? '—',
            sub: 'accounts blocked',
            bg: countData?.suspended > 0 ? '#fee2e2' : '#f9fafb',
            onClick: () => { switchTab(''); setStatusFilter('suspended'); },
          },
        ].map((s, i) => (
          <button
            key={i}
            onClick={s.onClick}
            style={{ ...statCard, background: s.bg, cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{s.label}</span>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.65)', display: 'grid', placeItems: 'center' }}>
                {s.icon}
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Manrope, sans-serif', letterSpacing: '-1px', color: '#111827', margin: '6px 0 2px' }}>
              {s.value}
            </div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>{s.sub}</div>
          </button>
        ))}
      </div>

      {/* ── Role tabs ─────────────────────────────────────────────────────── */}
      <div className="adm-role-tabs">
        {ROLE_TABS.map(tab => (
          <button
            key={tab.value}
            className={`adm-role-tab ${roleTab === tab.value ? 'is-active' : ''}`}
            onClick={() => switchTab(tab.value)}
          >
            {tab.label}
            {tabCount(tab.value) != null && (
              <span className="adm-tab-count">{tabCount(tab.value)}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Create form ───────────────────────────────────────────────────── */}
      {showCreate && (
        <div className="adm-card adm-mb16" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Create user account</h3>
          <p style={{ fontSize: 11, color: 'var(--adm-muted)', marginBottom: 16 }}>
            Admin-created accounts are active immediately. Self-registered buyers are also active immediately. All other self-registered roles require approval.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[['firstName','First name'],['lastName','Last name'],['email','Email']].map(([f,l]) => (
              <div key={f}>
                <label style={lbl}>{l} *</label>
                <input className="adm-input" style={{ width: '100%' }}
                  type={f === 'email' ? 'email' : 'text'}
                  value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} />
              </div>
            ))}
            <div>
              <label style={lbl}>Password *</label>
              <input className="adm-input" style={{ width: '100%' }} type="password" placeholder="Min 8 characters"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>Phone</label>
              <input className="adm-input" style={{ width: '100%' }} type="tel" placeholder="+251 9…"
                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>Role *</label>
              <select className="adm-select" style={{ width: '100%' }}
                value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                {ALL_ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 3' }}>
              <label style={lbl}>Region / City Administration</label>
              <RegionSelect className="adm-select" style={{ width: '100%', maxWidth: 400 }}
                value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} />
            </div>
          </div>
          {formError && <p style={{ color: 'var(--adm-danger)', fontSize: 11, marginTop: 8 }}>{formError}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="adm-btn adm-btn-primary"
              onClick={() => createMutation.mutate(form)} disabled={createMutation.isLoading}>
              {createMutation.isLoading ? 'Creating…' : 'Create account'}
            </button>
            <button className="adm-btn adm-btn-secondary"
              onClick={() => { setShowCreate(false); setFormError(''); setForm(EMPTY_FORM); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="adm-card adm-mb16" style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--adm-muted)', pointerEvents: 'none' }} />
            <input className="adm-input" style={{ width: '100%', paddingLeft: 28 }}
              placeholder="Search name, email or region…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="adm-select" value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            {STATUS_FILTER.map(s => (
              <option key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'All statuses'}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Users table ───────────────────────────────────────────────────── */}
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
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{user.firstName} {user.lastName}</div>
                      {user.phone && <div style={{ fontSize: 10, color: 'var(--adm-muted)' }}>{user.phone}</div>}
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--adm-muted)' }}>{user.email}</td>
                    <td><span className="adm-badge adm-badge-blue">{user.role.replace('_',' ')}</span></td>
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
                      {/* Review button — opens full detail drawer */}
                      <button
                        className="adm-btn adm-btn-secondary adm-btn-sm"
                        onClick={() => setDrawerUserId(user._id)}
                        title="Review user details"
                      >
                        <Eye size={12} /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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

      {/* ── User detail drawer ────────────────────────────────────────────── */}
      {drawerUserId && (
        <UserDrawer
          userId={drawerUserId}
          onClose={() => setDrawerUserId(null)}
          onAction={() => qc.invalidateQueries(['admin-users-counts'])}
        />
      )}
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────
const lbl = {
  display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4, color: '#374151',
};

const statCard = {
  padding: '16px',
  borderRadius: 12,
  border: '1px solid var(--adm-border)',
  boxShadow: 'var(--adm-shadow)',
};

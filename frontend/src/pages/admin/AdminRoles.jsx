import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../services/api';
import { Shield, Check, X, Pencil, ChevronDown, ChevronUp, Info } from 'lucide-react';

// ── What each role can do — for the reference matrix ─────────────────────
const ROLES = ['farmer','agent','buyer','supplier','transporter','data_reviewer','admin'];

const ROLE_DESCRIPTIONS = {
  farmer:        'Registers produce, views market prices. Data entered by agents on their behalf.',
  agent:         'Submits price observations and inventory on behalf of farmers they represent.',
  buyer:         'Browses prices, ranks suppliers, creates and tracks procurement orders.',
  supplier:      'Manages inventory, responds to orders, links to produce batches.',
  transporter:   'Receives delivery assignments, updates pickup and delivery status.',
  data_reviewer: 'Reviews flagged price observations, approves or rejects submissions.',
  admin:         'Full platform access — manages users, commodities, markets, and configuration.',
};

const PERMISSIONS = [
  { action: 'Self-register',               farmer:true,  agent:false, buyer:true,  supplier:false, transporter:false, data_reviewer:false, admin:false },
  { action: 'Submit price observations',   farmer:false, agent:true,  buyer:false, supplier:false, transporter:false, data_reviewer:false, admin:true  },
  { action: 'Review & approve prices',     farmer:false, agent:false, buyer:false, supplier:false, transporter:false, data_reviewer:true,  admin:true  },
  { action: 'Create procurement orders',   farmer:false, agent:false, buyer:true,  supplier:false, transporter:false, data_reviewer:false, admin:true  },
  { action: 'Accept / reject orders',      farmer:false, agent:false, buyer:false, supplier:true,  transporter:false, data_reviewer:false, admin:true  },
  { action: 'Manage inventory',            farmer:false, agent:true,  buyer:false, supplier:true,  transporter:false, data_reviewer:false, admin:true  },
  { action: 'Update delivery status',      farmer:false, agent:false, buyer:false, supplier:false, transporter:true,  data_reviewer:false, admin:true  },
  { action: 'View own orders',             farmer:false, agent:false, buyer:true,  supplier:true,  transporter:false, data_reviewer:false, admin:true  },
  { action: 'View all orders',             farmer:false, agent:false, buyer:false, supplier:false, transporter:false, data_reviewer:false, admin:true  },
  { action: 'Manage users & roles',        farmer:false, agent:false, buyer:false, supplier:false, transporter:false, data_reviewer:false, admin:true  },
  { action: 'View audit logs',             farmer:false, agent:false, buyer:false, supplier:false, transporter:false, data_reviewer:false, admin:true  },
  { action: 'Manage commodities & markets',farmer:false, agent:false, buyer:false, supplier:false, transporter:false, data_reviewer:false, admin:true  },
];

const ROLE_BADGE_COLOR = {
  farmer:'#dcfce7:#166534', agent:'#dbeafe:#1e40af', buyer:'#fef9c3:#854d0e',
  supplier:'#ccfbf1:#115e59', transporter:'#e0e7ff:#3730a3',
  data_reviewer:'#fce7f3:#9d174d', admin:'#fee2e2:#991b1b',
};

function RoleBadge({ role }) {
  const [bg, col] = (ROLE_BADGE_COLOR[role] || '#f3f4f6:#374151').split(':');
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:100, background:bg, color:col, whiteSpace:'nowrap' }}>
      {role.replace('_',' ')}
    </span>
  );
}

// ── Role assignment modal ─────────────────────────────────────────────────
function AssignRoleModal({ user, onClose, onSave, saving }) {
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [reviewScope,  setReviewScope]  = useState(user.reviewScope || { systemWide: true, markets: [], commodities: [] });

  return (
    <div className="adm-dialog-overlay">
      <div className="adm-dialog" style={{ maxWidth: 500 }}>
        <h3 style={{ marginBottom: 4 }}>Change role</h3>
        <p style={{ fontSize: 12, color: 'var(--adm-muted)', marginBottom: 20 }}>
          User: <strong>{user.firstName} {user.lastName}</strong> ({user.email})
        </p>

        {/* Current role */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--adm-muted)', marginBottom: 6, fontWeight: 600 }}>CURRENT ROLE</div>
          <RoleBadge role={user.role} />
        </div>

        {/* New role selector */}
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Assign new role</label>
          <select
            className="adm-select"
            style={{ width: '100%' }}
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
          >
            {ROLES.map(r => (
              <option key={r} value={r}>{r.replace('_', ' ')} — {ROLE_DESCRIPTIONS[r]}</option>
            ))}
          </select>
        </div>

        {/* Data reviewer scope — only shown when data_reviewer selected */}
        {selectedRole === 'data_reviewer' && (
          <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 8, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', marginBottom: 10 }}>
              DATA REVIEWER SCOPE
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={reviewScope.systemWide}
                onChange={e => setReviewScope({ ...reviewScope, systemWide: e.target.checked })}
              />
              System-wide access (can review all markets and commodities)
            </label>
            {!reviewScope.systemWide && (
              <p style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>
                Scoped access can be configured in detail from User Management → select user → Review Scope.
              </p>
            )}
          </div>
        )}

        {/* Warning if changing to admin */}
        {selectedRole === 'admin' && selectedRole !== user.role && (
          <div style={{ padding: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, marginBottom: 14, fontSize: 11, color: '#991b1b' }}>
            ⚠ Granting admin access gives this user full platform control including user management, audit logs, and system settings.
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="adm-btn adm-btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="adm-btn adm-btn-primary"
            disabled={saving || selectedRole === user.role}
            onClick={() => onSave(user._id, selectedRole, selectedRole === 'data_reviewer' ? reviewScope : null)}
          >
            {saving ? 'Saving…' : selectedRole === user.role ? 'No change' : `Assign ${selectedRole.replace('_',' ')}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function AdminRoles() {
  const qc = useQueryClient();
  const [matrixOpen,  setMatrixOpen]  = useState(false);
  const [editUser,    setEditUser]    = useState(null);
  const [roleFilter,  setRoleFilter]  = useState('');
  const [search,      setSearch]      = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['roles-users', roleFilter],
    queryFn: () => userApi.list({ role: roleFilter || undefined, limit: 50 }).then(r => r.data),
  });

  const roleMutation = useMutation({
    mutationFn: async ({ id, role, reviewScope }) => {
      // Update role by creating with the new role — use the status + profile endpoint
      await userApi.setStatus(id, 'active'); // keep active
      // We need to update the role field — add a setRole call
      return userApi.setRole(id, role, reviewScope);
    },
    onSuccess: () => {
      qc.invalidateQueries(['roles-users']);
      qc.invalidateQueries(['admin-users']);
      qc.invalidateQueries(['admin-users-counts']);
      setEditUser(null);
    },
  });

  const users      = data?.users ?? [];
  const total      = data?.total ?? 0;
  const filtered   = search.trim()
    ? users.filter(u => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase()))
    : users;

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Roles & Permissions</h1>
          <p className="adm-page-subtitle">Assign roles to users and view the platform permission matrix</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="adm-card adm-mb16" style={{ padding: 14, borderLeft: '4px solid var(--adm-leaf)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Info size={16} color="var(--adm-leaf)" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: 'var(--adm-muted)', margin: 0, lineHeight: 1.7 }}>
          Permissions are <strong>enforced on the backend</strong> (BR-11, NFR-SEC-03) — changing a role here takes effect immediately on the next request.
          Admins can assign any role except creating a second admin without care.
          The Data Reviewer role has an optional scope that limits which markets and commodities they can review.
        </p>
      </div>

      {/* Role descriptions */}
      <div className="adm-card adm-mb16">
        <div className="adm-card-head">
          <span className="adm-card-title">Role descriptions</span>
        </div>
        <div style={{ padding: '8px 0' }}>
          {ROLES.map(role => (
            <div key={role} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--adm-border)' }}>
              <RoleBadge role={role} />
              <span style={{ fontSize: 12, color: 'var(--adm-muted)', lineHeight: 1.6 }}>{ROLE_DESCRIPTIONS[role]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* User role assignment table */}
      <div className="adm-card adm-mb16">
        <div className="adm-card-head">
          <span className="adm-card-title">Assign roles to users</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="adm-input" placeholder="Search user…" value={search}
              onChange={e => setSearch(e.target.value)} style={{ width: 180 }} />
            <select className="adm-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">All roles</option>
              {ROLES.map(r => <option key={r} value={r}>{r.replace('_',' ')}</option>)}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="adm-loading">Loading users…</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Current role</th>
                  <th>Account status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="adm-empty">No users found.</td></tr>
                )}
                {filtered.map(user => (
                  <tr key={user._id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{user.firstName} {user.lastName}</div>
                      {user.region && <div style={{ fontSize: 10, color: 'var(--adm-muted)' }}>{user.region}</div>}
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--adm-muted)' }}>{user.email}</td>
                    <td><RoleBadge role={user.role} /></td>
                    <td>
                      <span className={`adm-badge ${user.status === 'active' ? 'adm-badge-green' : 'adm-badge-yellow'}`}>
                        {user.status?.replace('_',' ')}
                      </span>
                    </td>
                    <td>
                      <button
                        className="adm-btn adm-btn-secondary adm-btn-sm"
                        onClick={() => setEditUser(user)}
                      >
                        <Pencil size={12} /> Change role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '8px 16px', fontSize: 11, color: 'var(--adm-muted)', borderTop: '1px solid var(--adm-border)' }}>
          {total} user{total !== 1 ? 's' : ''} total
        </div>
      </div>

      {/* Permission matrix — collapsible */}
      <div className="adm-card">
        <button
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          onClick={() => setMatrixOpen(o => !o)}
        >
          <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--adm-text)' }}>
            Permission matrix (reference)
          </span>
          {matrixOpen ? <ChevronUp size={16} color="var(--adm-muted)" /> : <ChevronDown size={16} color="var(--adm-muted)" />}
        </button>

        {matrixOpen && (
          <div className="adm-table-wrap" style={{ borderTop: '1px solid var(--adm-border)' }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 200 }}>Permission</th>
                  {ROLES.map(r => (
                    <th key={r} style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {r.replace('_','\u00A0')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map(row => (
                  <tr key={row.action}>
                    <td style={{ fontSize: 12, fontWeight: 500 }}>{row.action}</td>
                    {ROLES.map(r => (
                      <td key={r} style={{ textAlign: 'center' }}>
                        {row[r]
                          ? <Check size={14} color="#22c55e" />
                          : <X    size={14} color="#e5e7eb" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '10px 16px', fontSize: 11, color: 'var(--adm-muted)', borderTop: '1px solid var(--adm-border)' }}>
              Permissions are enforced server-side and cannot be edited here. This matrix reflects the current backend configuration.
            </div>
          </div>
        )}
      </div>

      {/* Role assignment modal */}
      {editUser && (
        <AssignRoleModal
          user={editUser}
          onClose={() => setEditUser(null)}
          saving={roleMutation.isLoading}
          onSave={(id, role, reviewScope) => roleMutation.mutate({ id, role, reviewScope })}
        />
      )}
    </div>
  );
}

const lbl = { display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4, color: '#374151' };

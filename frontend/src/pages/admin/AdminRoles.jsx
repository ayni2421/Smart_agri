import React from 'react';
import { Shield, Check, X } from 'lucide-react';

const ROLES = ['farmer','agent','buyer','supplier','transporter','data_reviewer','admin'];

const PERMISSIONS = [
  { action: 'Self-register', farmer: true,  agent: false, buyer: true,  supplier: false, transporter: false, data_reviewer: false, admin: false },
  { action: 'Submit price observations', farmer: false, agent: true, buyer: false, supplier: false, transporter: false, data_reviewer: false, admin: true },
  { action: 'Review / approve prices', farmer: false, agent: false, buyer: false, supplier: false, transporter: false, data_reviewer: true, admin: true },
  { action: 'Create procurement orders', farmer: false, agent: false, buyer: true, supplier: false, transporter: false, data_reviewer: false, admin: true },
  { action: 'Accept / reject orders', farmer: false, agent: false, buyer: false, supplier: true, transporter: false, data_reviewer: false, admin: true },
  { action: 'Manage inventory', farmer: false, agent: true, buyer: false, supplier: true, transporter: false, data_reviewer: false, admin: true },
  { action: 'Update delivery status', farmer: false, agent: false, buyer: false, supplier: false, transporter: true, data_reviewer: false, admin: true },
  { action: 'View own orders', farmer: false, agent: false, buyer: true, supplier: true, transporter: false, data_reviewer: false, admin: true },
  { action: 'View all orders', farmer: false, agent: false, buyer: false, supplier: false, transporter: false, data_reviewer: false, admin: true },
  { action: 'Manage users', farmer: false, agent: false, buyer: false, supplier: false, transporter: false, data_reviewer: false, admin: true },
  { action: 'View audit logs', farmer: false, agent: false, buyer: false, supplier: false, transporter: false, data_reviewer: false, admin: true },
  { action: 'Manage commodities & markets', farmer: false, agent: false, buyer: false, supplier: false, transporter: false, data_reviewer: false, admin: true },
];

export default function AdminRoles() {
  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Roles & Permissions</h1>
          <p className="adm-page-subtitle">Platform RBAC matrix — enforced server-side (BR-11)</p>
        </div>
      </div>

      <div className="adm-card" style={{ marginBottom:16, padding:16, borderLeft:'4px solid var(--adm-leaf)' }}>
        <p style={{ fontSize:12, color:'var(--adm-muted)', margin:0, lineHeight:1.7 }}>
          All permissions in this table are enforced by the Express.js backend using JWT authentication and role-based
          middleware (NFR-SEC-03). Frontend role-gating is a secondary UX layer only. Role assignment to privileged
          accounts (agent, reviewer, transporter, admin) requires an existing admin to create the account (FR-AUTH-08).
        </p>
      </div>

      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th style={{ minWidth:200 }}>Permission</th>
                {ROLES.map(r => <th key={r} style={{ textAlign:'center' }}>{r.replace('_','\u00A0')}</th>)}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map(row => (
                <tr key={row.action}>
                  <td style={{ fontSize:12, fontWeight:500 }}>{row.action}</td>
                  {ROLES.map(r => (
                    <td key={r} style={{ textAlign:'center' }}>
                      {row[r]
                        ? <Check size={14} color="#22c55e" />
                        : <X    size={14} color="#e5e7eb" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

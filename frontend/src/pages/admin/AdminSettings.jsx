import React from 'react';
import { Settings, Database, Bell, Shield, ExternalLink } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div>
      <div className="adm-page-header">
        <div><h1 className="adm-page-title">System Settings</h1><p className="adm-page-subtitle">Platform configuration and feature status</p></div>
      </div>

      <div className="adm-grid-2">
        <div className="adm-card">
          <div className="adm-card-head"><span className="adm-card-title"><Database size={14} style={{ marginRight:6 }}/>Database & Data</span></div>
          <div className="adm-card-body">
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[
                { label:'MongoDB', value:'Connected', status:'green' },
                { label:'Seed data', value:'Synthetic (BR-03 compliant)', status:'blue' },
                { label:'Units', value:'Canonical storage: kg · Display: quintal, kg, tonne', status:'gray' },
              ].map(item => (
                <div key={item.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--adm-border)' }}>
                  <span style={{ fontSize:12, fontWeight:600 }}>{item.label}</span>
                  <span className={`adm-badge adm-badge-${item.status}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="adm-card">
          <div className="adm-card-head"><span className="adm-card-title"><Bell size={14} style={{ marginRight:6 }}/>Conditional Features</span></div>
          <div className="adm-card-body">
            <div style={{ fontSize:11, color:'var(--adm-muted)', marginBottom:12 }}>Features pending trigger conditions (SRS Section 2.6.1)</div>
            {[
              { label:'Price forecasting (FR-INT-10)', trigger:'12 months eligible data', status:'Not implemented' },
              { label:'Payment gateway (FR-PAY-05)', trigger:'Provider sandbox credentials', status:'Fallback active' },
              { label:'SMS notifications (FR-NOT-05)', trigger:'Provider confirmed', status:'Not implemented' },
              { label:'CSV export (FR-INT-09)', trigger:'Phase 4 design review', status:'Not implemented' },
            ].map(item => (
              <div key={item.label} style={{ padding:'10px 0', borderBottom:'1px solid var(--adm-border)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                  <strong style={{ fontSize:11 }}>{item.label}</strong>
                  <span className="adm-badge adm-badge-gray">{item.status}</span>
                </div>
                <div style={{ fontSize:10, color:'var(--adm-muted)' }}>Trigger: {item.trigger}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="adm-card">
          <div className="adm-card-head"><span className="adm-card-title"><Shield size={14} style={{ marginRight:6 }}/>Security</span></div>
          <div className="adm-card-body">
            {[
              { label:'Password hashing', value:'bcrypt (12 rounds)', ok:true },
              { label:'JWT authentication', value:'RS256 · 7 day expiry', ok:true },
              { label:'Rate limiting', value:'100 req/15min per IP', ok:true },
              { label:'Server-side RBAC', value:'All protected routes enforced', ok:true },
              { label:'Audit logging', value:'Enabled (NFR-AUD-01)', ok:true },
            ].map(item => (
              <div key={item.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'1px solid var(--adm-border)' }}>
                <span style={{ fontSize:12 }}>{item.label}</span>
                <span className={`adm-badge ${item.ok ? 'adm-badge-green' : 'adm-badge-red'}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="adm-card">
          <div className="adm-card-head"><span className="adm-card-title"><ExternalLink size={14} style={{ marginRight:6 }}/>API Documentation</span></div>
          <div className="adm-card-body">
            <p style={{ fontSize:12, color:'var(--adm-muted)', lineHeight:1.7, marginBottom:16 }}>
              The backend API is documented using OpenAPI specification (NFR-MNT-04). Open it in Swagger Editor or any OpenAPI viewer.
            </p>
            <a href="/docs/openapi.yaml" target="_blank" rel="noopener noreferrer" className="adm-btn adm-btn-secondary" style={{ display:'inline-flex' }}>
              <ExternalLink size={13}/> Open OpenAPI spec
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

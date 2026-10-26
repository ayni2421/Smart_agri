import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';

const fetchAudit = (params) => api.get('/audit', { params }).then(r => r.data);

export default function AdminAudit() {
  const [action,       setAction]       = useState('');
  const [resourceType, setResourceType] = useState('');
  const [page,         setPage]         = useState(1);
  const LIMIT = 25;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit', action, resourceType, page],
    queryFn: () => fetchAudit({ action: action||undefined, resourceType: resourceType||undefined, page, limit: LIMIT }),
  });

  const logs  = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  const RESOURCE_TYPES = ['User','Order','PriceObservation','Commodity','Market','Inventory','Delivery','Transaction'];

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Audit Logs</h1>
          <p className="adm-page-subtitle">{total} audit entries · read-only (FR-REP-06)</p>
        </div>
      </div>

      <div className="adm-card adm-mb16" style={{ padding:'12px 16px' }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <input className="adm-input" placeholder="Filter by action (e.g. order.transition)…"
            value={action} onChange={e => { setAction(e.target.value); setPage(1); }} style={{ minWidth:200 }} />
          <select className="adm-select" value={resourceType} onChange={e => { setResourceType(e.target.value); setPage(1); }}>
            <option value="">All resource types</option>
            {RESOURCE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Resource</th><th>Details</th></tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={5} className="adm-loading">Loading…</td></tr>}
              {!isLoading && logs.length === 0 && <tr><td colSpan={5} className="adm-empty">No audit entries found.</td></tr>}
              {logs.map(log => (
                <tr key={log._id}>
                  <td style={{ fontSize:10, color:'var(--adm-muted)', whiteSpace:'nowrap' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={{ fontSize:11 }}>
                    {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'System'}
                    {log.actorRole && <div style={{ fontSize:9, color:'var(--adm-muted)' }}>{log.actorRole}</div>}
                  </td>
                  <td>
                    <span className="adm-badge adm-badge-blue" style={{ fontFamily:'monospace' }}>{log.action}</span>
                  </td>
                  <td>
                    {log.resourceType && <span className="adm-badge adm-badge-gray">{log.resourceType}</span>}
                  </td>
                  <td style={{ fontSize:10, color:'var(--adm-muted)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {log.details ? JSON.stringify(log.details).slice(0, 80) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid var(--adm-border)' }}>
            <span style={{ fontSize:11, color:'var(--adm-muted)' }}>Page {page} of {totalPages}</span>
            <div style={{ display:'flex', gap:6 }}>
              <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setPage(p=>p-1)} disabled={page===1}><ChevronLeft size={13}/></button>
              <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setPage(p=>p+1)} disabled={page>=totalPages}><ChevronRight size={13}/></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

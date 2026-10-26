import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryApi } from '../../services/api';

const STATUS_BADGE = {
  assigned: 'adm-badge-yellow', in_transit: 'adm-badge-blue',
  delivered: 'adm-badge-green', failed: 'adm-badge-red', cancelled: 'adm-badge-gray',
};

const TRANSITIONS = { assigned: ['in_transit','cancelled'], in_transit: ['delivered','failed'] };

export default function AdminDeliveries() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-deliveries'],
    queryFn: () => deliveryApi.list().then(r=>r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => deliveryApi.updateStatus(id, { status, notes: 'Admin update' }),
    onSuccess: () => qc.invalidateQueries(['admin-deliveries']),
  });

  const deliveries = data?.deliveries ?? [];

  return (
    <div>
      <div className="adm-page-header">
        <div><h1 className="adm-page-title">Deliveries</h1><p className="adm-page-subtitle">{deliveries.length} delivery records</p></div>
      </div>
      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Order</th><th>Transporter</th><th>Destination</th><th>Status</th><th>Scheduled</th><th>Actions</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="adm-loading">Loading…</td></tr>}
              {!isLoading && deliveries.length === 0 && <tr><td colSpan={6} className="adm-empty">No deliveries found.</td></tr>}
              {deliveries.map(d => (
                <tr key={d._id}>
                  <td><strong style={{ fontSize:12 }}>{d.order?.orderNumber || '—'}</strong></td>
                  <td style={{ fontSize:11 }}>{d.transporter ? `${d.transporter.firstName} ${d.transporter.lastName}` : '—'}</td>
                  <td style={{ fontSize:11 }}>{d.deliveryLocation}</td>
                  <td><span className={`adm-badge ${STATUS_BADGE[d.status]||'adm-badge-gray'}`}>{d.status?.replace('_',' ')}</span></td>
                  <td style={{ fontSize:11, color:'var(--adm-muted)' }}>{d.scheduledDate ? new Date(d.scheduledDate).toLocaleDateString() : '—'}</td>
                  <td>
                    <div className="adm-table-actions">
                      {(TRANSITIONS[d.status]||[]).map(target => (
                        <button key={target} className="adm-btn adm-btn-secondary adm-btn-sm"
                          onClick={() => updateMutation.mutate({ id: d._id, status: target })}
                          disabled={updateMutation.isLoading}>
                          → {target.replace('_',' ')}
                        </button>
                      ))}
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

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { anomalyApi, priceApi } from '../../services/api';
import { CheckCircle2, XCircle, RotateCcw, AlertTriangle } from 'lucide-react';

export default function AdminAnomalies() {
  const qc = useQueryClient();
  const [reviewTarget, setReviewTarget] = useState(null);
  const [notes,        setNotes]        = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-anomalies-full'],
    queryFn: () => anomalyApi.list({ limit: 50 }).then(r=>r.data),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, decision }) => priceApi.review(id, { decision, reviewNotes: notes }),
    onSuccess: () => { qc.invalidateQueries(['admin-anomalies-full']); qc.invalidateQueries(['admin-anomalies']); setReviewTarget(null); setNotes(''); },
  });

  const obs = data?.observations ?? [];

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Intelligence & Anomalies</h1>
          <p className="adm-page-subtitle">{data?.total ?? 0} flagged observations pending review</p>
        </div>
      </div>

      {obs.length === 0 && !isLoading && (
        <div className="adm-card" style={{ padding:40, textAlign:'center' }}>
          <CheckCircle2 size={36} color="#22c55e" style={{ marginBottom:12 }} />
          <p style={{ fontSize:14, fontWeight:600, color:'var(--adm-text)' }}>All clear</p>
          <p style={{ fontSize:12, color:'var(--adm-muted)', marginTop:4 }}>No flagged observations awaiting review.</p>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {obs.map(o => (
          <div key={o._id} className="adm-card" style={{ borderLeft:'4px solid #f59e0b' }}>
            <div style={{ padding:'14px 18px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <AlertTriangle size={14} color="#f59e0b" />
                  <strong style={{ fontSize:13 }}>{o.commodity?.name} — {o.market?.name}</strong>
                  <span className="adm-badge adm-badge-orange">flagged</span>
                </div>
                <div style={{ fontSize:12, color:'var(--adm-muted)' }}>
                  Price: <strong>{(o.pricePerKg*100).toFixed(0)} ETB/qq</strong> ·
                  Date: {new Date(o.observationDate).toLocaleDateString()} ·
                  Source: {o.sourceType}
                </div>
                {o.flagReason && (
                  <div style={{ marginTop:6, fontSize:11, color:'#92400e', background:'#fffbeb', padding:'4px 8px', borderRadius:5, display:'inline-block' }}>
                    Rule: {o.reviewRuleTriggered} — {o.flagReason}
                  </div>
                )}
              </div>
              <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setReviewTarget(o)}>
                Review
              </button>
            </div>
          </div>
        ))}
      </div>

      {reviewTarget && (
        <div className="adm-dialog-overlay">
          <div className="adm-dialog">
            <h3>Review: {reviewTarget.commodity?.name}</h3>
            <div style={{ fontSize:12, padding:12, background:'var(--adm-cream)', borderRadius:8, margin:'12px 0' }}>
              <strong>{(reviewTarget.pricePerKg*100).toFixed(0)} ETB/qq</strong> at {reviewTarget.market?.name}<br/>
              <span style={{ color:'var(--adm-muted)' }}>Observation: {new Date(reviewTarget.observationDate).toLocaleDateString()}</span>
              {reviewTarget.flagReason && <div style={{ marginTop:4, color:'#92400e', fontSize:11 }}>⚠ {reviewTarget.flagReason}</div>}
            </div>
            <label style={{ fontSize:11, fontWeight:600, display:'block', marginBottom:4 }}>Review notes</label>
            <textarea style={{ width:'100%', padding:8, border:'1px solid var(--adm-border)', borderRadius:6, fontSize:12, resize:'vertical', minHeight:70 }}
              value={notes} onChange={e => setNotes(e.target.value)} placeholder="Document your review decision…" />
            <div style={{ display:'flex', gap:8, marginTop:14, flexWrap:'wrap' }}>
              <button className="adm-btn adm-btn-primary"
                onClick={() => reviewMutation.mutate({ id: reviewTarget._id, decision:'approved' })}>
                <CheckCircle2 size={13}/> Approve
              </button>
              <button className="adm-btn adm-btn-danger"
                onClick={() => reviewMutation.mutate({ id: reviewTarget._id, decision:'rejected' })}>
                <XCircle size={13}/> Reject
              </button>
              <button className="adm-btn adm-btn-warn"
                onClick={() => reviewMutation.mutate({ id: reviewTarget._id, decision:'correction_requested' })}>
                <RotateCcw size={13}/> Request correction
              </button>
              <button className="adm-btn adm-btn-secondary" onClick={() => setReviewTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

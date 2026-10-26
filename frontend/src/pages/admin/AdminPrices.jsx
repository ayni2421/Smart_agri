import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { priceApi, commodityApi, marketApi } from '../../services/api';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, RotateCcw, PlusCircle } from 'lucide-react';

const SOURCE_TYPES = ['verified','submitted','synthetic','imported','unverified'];
const REVIEW_STATUSES = ['pending_review','approved','rejected','flagged','correction_requested'];

const REVIEW_BADGE = {
  approved: 'adm-badge-green', pending_review: 'adm-badge-yellow',
  flagged: 'adm-badge-orange', rejected: 'adm-badge-red',
  correction_requested: 'adm-badge-blue',
};

const SOURCE_BADGE = {
  verified: 'adm-badge-green', submitted: 'adm-badge-blue',
  synthetic: 'adm-badge-gray', imported: 'adm-badge-teal', unverified: 'adm-badge-yellow',
};

export default function AdminPrices() {
  const qc = useQueryClient();
  const [commodity,     setCommodity]     = useState('');
  const [market,        setMarket]        = useState('');
  const [reviewStatus,  setReviewStatus]  = useState('');
  const [sourceType,    setSourceType]    = useState('');
  const [page,          setPage]          = useState(1);
  const [reviewTarget,  setReviewTarget]  = useState(null);
  const [reviewNotes,   setReviewNotes]   = useState('');
  const [showSubmit,    setShowSubmit]    = useState(false);
  const [submitForm,    setSubmitForm]    = useState({ commodity:'', market:'', submittedPrice:'', submittedUnit:'quintal', observationDate:'', sourceType:'submitted', sourceDescription:'' });
  const [submitErr,     setSubmitErr]     = useState('');
  const LIMIT = 20;

  const { data: commodities } = useQuery({ queryKey:['commodities'], queryFn: () => commodityApi.list().then(r=>r.data.commodities) });
  const { data: markets }     = useQuery({ queryKey:['markets'],     queryFn: () => marketApi.list().then(r=>r.data.markets) });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-prices', commodity, market, reviewStatus, sourceType, page],
    queryFn: () => priceApi.list({ commodity: commodity||undefined, market: market||undefined, reviewStatus: reviewStatus||undefined, sourceType: sourceType||undefined, page, limit: LIMIT }).then(r=>r.data),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, decision, notes }) => priceApi.review(id, { decision, reviewNotes: notes }),
    onSuccess: () => { qc.invalidateQueries(['admin-prices']); setReviewTarget(null); setReviewNotes(''); },
  });

  const submitMutation = useMutation({
    mutationFn: (d) => priceApi.submit(d),
    onSuccess: () => { qc.invalidateQueries(['admin-prices']); setShowSubmit(false); },
    onError: (e) => setSubmitErr(e.response?.data?.error || 'Submission failed.'),
  });

  const obs   = data?.observations ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Market Prices</h1>
          <p className="adm-page-subtitle">{total} observations</p>
        </div>
        <button className="adm-btn adm-btn-primary" onClick={() => setShowSubmit(true)}>
          <PlusCircle size={14} /> Submit observation
        </button>
      </div>

      {/* Submit form */}
      {showSubmit && (
        <div className="adm-card adm-mb16" style={{ padding:20 }}>
          <h3 style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>New Price Observation</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, marginBottom:4 }}>Commodity *</label>
              <select className="adm-select" style={{ width:'100%' }} value={submitForm.commodity} onChange={e => setSubmitForm({...submitForm, commodity:e.target.value})}>
                <option value="">Select…</option>
                {commodities?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, marginBottom:4 }}>Market *</label>
              <select className="adm-select" style={{ width:'100%' }} value={submitForm.market} onChange={e => setSubmitForm({...submitForm, market:e.target.value})}>
                <option value="">Select…</option>
                {markets?.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, marginBottom:4 }}>Price *</label>
              <input className="adm-input" style={{ width:'100%' }} type="number" min="0" placeholder="e.g. 4500" value={submitForm.submittedPrice} onChange={e => setSubmitForm({...submitForm, submittedPrice:e.target.value})} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, marginBottom:4 }}>Unit</label>
              <select className="adm-select" style={{ width:'100%' }} value={submitForm.submittedUnit} onChange={e => setSubmitForm({...submitForm, submittedUnit:e.target.value})}>
                <option value="quintal">Quintal (100 kg)</option>
                <option value="kg">kg</option>
                <option value="tonne">Tonne</option>
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, marginBottom:4 }}>Observation date *</label>
              <input className="adm-input" style={{ width:'100%' }} type="date" value={submitForm.observationDate} onChange={e => setSubmitForm({...submitForm, observationDate:e.target.value})} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, marginBottom:4 }}>Source type</label>
              <select className="adm-select" style={{ width:'100%' }} value={submitForm.sourceType} onChange={e => setSubmitForm({...submitForm, sourceType:e.target.value})}>
                {SOURCE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {submitErr && <p style={{ color:'var(--adm-danger)', fontSize:11, marginTop:8 }}>{submitErr}</p>}
          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <button className="adm-btn adm-btn-primary" onClick={() => submitMutation.mutate(submitForm)} disabled={submitMutation.isLoading}>
              {submitMutation.isLoading ? 'Submitting…' : 'Submit'}
            </button>
            <button className="adm-btn adm-btn-secondary" onClick={() => setShowSubmit(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="adm-card adm-mb16" style={{ padding:'12px 16px' }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <select className="adm-select" value={commodity} onChange={e => { setCommodity(e.target.value); setPage(1); }}>
            <option value="">All commodities</option>
            {commodities?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select className="adm-select" value={market} onChange={e => { setMarket(e.target.value); setPage(1); }}>
            <option value="">All markets</option>
            {markets?.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
          </select>
          <select className="adm-select" value={reviewStatus} onChange={e => { setReviewStatus(e.target.value); setPage(1); }}>
            <option value="">All review statuses</option>
            {REVIEW_STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
          <select className="adm-select" value={sourceType} onChange={e => { setSourceType(e.target.value); setPage(1); }}>
            <option value="">All source types</option>
            {SOURCE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Commodity</th><th>Market</th><th>Price (ETB/qq)</th><th>Date</th><th>Source</th><th>Review</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="adm-loading">Loading…</td></tr>}
              {!isLoading && obs.length === 0 && <tr><td colSpan={7} className="adm-empty">No observations match the current filters.</td></tr>}
              {obs.map(o => (
                <tr key={o._id}>
                  <td>{o.commodity?.name || '—'}</td>
                  <td style={{ fontSize:11 }}>{o.market?.name || '—'}</td>
                  <td><strong>{(o.pricePerKg*100).toFixed(0)}</strong></td>
                  <td style={{ fontSize:11, color:'var(--adm-muted)' }}>{new Date(o.observationDate).toLocaleDateString()}</td>
                  <td><span className={`adm-badge ${SOURCE_BADGE[o.sourceType]||'adm-badge-gray'}`}>{o.sourceType}</span></td>
                  <td><span className={`adm-badge ${REVIEW_BADGE[o.reviewStatus]||'adm-badge-gray'}`}>{o.reviewStatus?.replace('_',' ')}</span></td>
                  <td>
                    {['pending_review','flagged'].includes(o.reviewStatus) && (
                      <div className="adm-table-actions">
                        <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setReviewTarget(o)}>Review</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid var(--adm-border)' }}>
            <span style={{ fontSize:11, color:'var(--adm-muted)' }}>Page {page} of {totalPages} · {total} total</span>
            <div style={{ display:'flex', gap:6 }}>
              <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setPage(p=>p-1)} disabled={page===1}><ChevronLeft size={13}/></button>
              <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setPage(p=>p+1)} disabled={page>=totalPages}><ChevronRight size={13}/></button>
            </div>
          </div>
        )}
      </div>

      {/* Review dialog */}
      {reviewTarget && (
        <div className="adm-dialog-overlay">
          <div className="adm-dialog">
            <h3>Review Observation</h3>
            <div style={{ fontSize:12, margin:'12px 0', padding:12, background:'var(--adm-cream)', borderRadius:8 }}>
              <strong>{reviewTarget.commodity?.name}</strong> — {reviewTarget.market?.name}<br />
              <span style={{ color:'var(--adm-muted)' }}>{(reviewTarget.pricePerKg*100).toFixed(0)} ETB/qq · {reviewTarget.sourceType}</span>
              {reviewTarget.flagReason && <div style={{ marginTop:6, color:'#92400e', fontSize:11 }}>⚠ {reviewTarget.flagReason}</div>}
            </div>
            <label style={{ fontSize:11, fontWeight:600, display:'block', marginBottom:4 }}>Notes</label>
            <textarea style={{ width:'100%', padding:8, border:'1px solid var(--adm-border)', borderRadius:6, fontSize:12, resize:'vertical', minHeight:60 }}
              value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} />
            <div style={{ display:'flex', gap:8, marginTop:14 }}>
              <button className="adm-btn adm-btn-primary"
                onClick={() => reviewMutation.mutate({ id: reviewTarget._id, decision:'approved', notes: reviewNotes })}>
                <CheckCircle2 size={13} /> Approve
              </button>
              <button className="adm-btn adm-btn-danger"
                onClick={() => reviewMutation.mutate({ id: reviewTarget._id, decision:'rejected', notes: reviewNotes })}>
                <XCircle size={13} /> Reject
              </button>
              <button className="adm-btn adm-btn-warn"
                onClick={() => reviewMutation.mutate({ id: reviewTarget._id, decision:'correction_requested', notes: reviewNotes })}>
                <RotateCcw size={13} /> Request correction
              </button>
              <button className="adm-btn adm-btn-secondary" onClick={() => setReviewTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { anomalyApi, priceApi } from '../services/api';

export default function AnomaliesPage() {
  const qc = useQueryClient();
  const [reviewForm, setReviewForm] = useState({ id: null, decision: 'approved', reviewNotes: '' });

  const { data, isLoading, error } = useQuery({
    queryKey: ['anomalies'],
    queryFn: () => anomalyApi.list().then(r => r.data),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, decision, reviewNotes }) => priceApi.review(id, { decision, reviewNotes }),
    onSuccess: () => { qc.invalidateQueries(['anomalies']); setReviewForm({ id: null, decision: 'approved', reviewNotes: '' }); },
  });

  if (isLoading) return <div style={{ padding: 40 }}>Loading flagged observations…</div>;
  if (error) return <div style={{ padding: 40 }} className="error-msg">Failed to load anomalies.</div>;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 20px' }}>
      <h2 style={{ color: 'var(--color-primary)' }}>Flagged Price Observations</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
        FR-ANOM-03: A flagged observation is not automatically false — it requires review.
      </p>

      {data?.observations?.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)' }}>No flagged observations pending review.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data?.observations?.map((obs) => (
          <div key={obs._id} className="card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>{obs.commodity?.name}</strong> — {obs.market?.name}
                <span className="badge badge-red" style={{ marginLeft: 8 }}>FLAGGED</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {new Date(obs.observationDate).toLocaleDateString()}
              </span>
            </div>

            <p style={{ margin: '8px 0 4px', fontSize: '0.9rem' }}>
              Price: <strong>{obs.pricePerKg?.toFixed(4)} ETB/kg</strong>
              ({(obs.pricePerKg * 100).toFixed(2)} ETB/quintal)
              {obs.sourceType === 'synthetic' && <span className="synthetic-label" style={{ marginLeft: 8 }}>SYNTHETIC</span>}
            </p>

            {obs.flagReason && (
              <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'var(--color-danger)' }}>
                <strong>Flag reason:</strong> {obs.flagReason}
              </p>
            )}
            {obs.reviewRuleTriggered && (
              <p style={{ margin: '4px 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                Rules triggered: {obs.reviewRuleTriggered}
              </p>
            )}

            {/* Review form */}
            {reviewForm.id === obs._id ? (
              <div style={{ marginTop: 12, padding: 12, background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label>Decision</label>
                    <select value={reviewForm.decision} onChange={e => setReviewForm({ ...reviewForm, decision: e.target.value })}>
                      <option value="approved">Approve</option>
                      <option value="rejected">Reject</option>
                      <option value="correction_requested">Request correction</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label>Notes</label>
                  <textarea rows={2} value={reviewForm.reviewNotes}
                    onChange={e => setReviewForm({ ...reviewForm, reviewNotes: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-primary" style={{ fontSize: '0.85rem' }}
                    onClick={() => reviewMutation.mutate({ id: obs._id, ...reviewForm })}
                    disabled={reviewMutation.isLoading}>
                    {reviewMutation.isLoading ? 'Saving…' : 'Submit review'}
                  </button>
                  <button className="btn-secondary" style={{ fontSize: '0.85rem' }}
                    onClick={() => setReviewForm({ id: null, decision: 'approved', reviewNotes: '' })}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button className="btn-secondary" style={{ marginTop: 12, fontSize: '0.85rem' }}
                onClick={() => setReviewForm({ id: obs._id, decision: 'approved', reviewNotes: '' })}>
                Review this observation
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

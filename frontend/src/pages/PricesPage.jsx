import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { priceApi, commodityApi, marketApi } from '../services/api';
import { useAuth } from '../App';

const STATUS_BADGES = {
  approved: 'badge-green',
  pending_review: 'badge-yellow',
  flagged: 'badge-red',
  rejected: 'badge-red',
  correction_requested: 'badge-yellow',
};

export default function PricesPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ commodity: '', market: '', sourceType: '', reviewStatus: '', startDate: '', endDate: '' });
  const [page, setPage] = useState(1);

  const { data: commodities } = useQuery({ queryKey: ['commodities'], queryFn: () => commodityApi.list().then(r => r.data.commodities) });
  const { data: markets } = useQuery({ queryKey: ['markets'], queryFn: () => marketApi.list().then(r => r.data.markets) });

  const { data, isLoading, error } = useQuery({
    queryKey: ['prices', filters, page],
    queryFn: () => priceApi.list({ ...filters, page, limit: 30 }).then(r => r.data),
  });

  const handleFilter = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
      <h2 style={{ color: 'var(--color-primary)' }}>Market Price Observations</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
        FR-PRICE-03: Prices shown with commodity, market, unit, and observation date.
        FR-PRICE-05: Synthetic data is labeled.
      </p>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          <div>
            <label>Commodity</label>
            <select name="commodity" value={filters.commodity} onChange={handleFilter}>
              <option value="">All</option>
              {commodities?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label>Market</label>
            <select name="market" value={filters.market} onChange={handleFilter}>
              <option value="">All</option>
              {markets?.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label>Source type</label>
            <select name="sourceType" value={filters.sourceType} onChange={handleFilter}>
              <option value="">All</option>
              {['verified', 'submitted', 'synthetic', 'imported', 'unverified'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>Review status</label>
            <select name="reviewStatus" value={filters.reviewStatus} onChange={handleFilter}>
              <option value="">All</option>
              {['pending_review', 'approved', 'rejected', 'flagged', 'correction_requested'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>From date</label>
            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilter} />
          </div>
          <div>
            <label>To date</label>
            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilter} />
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading && <p style={{ color: 'var(--color-text-muted)' }}>Loading observations…</p>}
      {error && <p className="error-msg">Failed to load observations. Try again.</p>}
      {data && data.observations?.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)' }}>No observations match the current filters. (FR-PRICE-06)</p>
      )}

      {data?.observations?.length > 0 && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>Commodity</th>
                  <th style={{ padding: '8px 12px' }}>Market</th>
                  <th style={{ padding: '8px 12px' }}>Price (ETB/quintal)</th>
                  <th style={{ padding: '8px 12px' }}>Observation date</th>
                  <th style={{ padding: '8px 12px' }}>Source</th>
                  <th style={{ padding: '8px 12px' }}>Review status</th>
                </tr>
              </thead>
              <tbody>
                {data.observations.map((obs) => (
                  <tr key={obs._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '8px 12px' }}>{obs.commodity?.name}</td>
                    <td style={{ padding: '8px 12px' }}>{obs.market?.name} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>({obs.market?.region})</span></td>
                    <td style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums' }}>
                      {(obs.pricePerKg * 100).toFixed(2)}
                      {obs.sourceType === 'synthetic' && <span className="synthetic-label" style={{ marginLeft: 6 }}>SYNTHETIC</span>}
                    </td>
                    <td style={{ padding: '8px 12px' }}>{new Date(obs.observationDate).toLocaleDateString()}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--color-text-muted)' }}>{obs.sourceType}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className={`badge ${STATUS_BADGES[obs.reviewStatus] || 'badge-gray'}`}>
                        {obs.reviewStatus?.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              {data.total} observations total
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
              <span style={{ padding: '8px 12px', fontSize: '0.85rem' }}>Page {page}</span>
              <button className="btn-secondary" onClick={() => setPage(p => p + 1)} disabled={data.observations.length < 30}>Next →</button>
            </div>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 12 }}>
            FR-PRICE-07: These prices are historical observations, not guaranteed future prices.
          </p>
        </>
      )}
    </div>
  );
}

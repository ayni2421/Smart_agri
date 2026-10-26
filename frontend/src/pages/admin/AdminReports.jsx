import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportApi, commodityApi } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminReports() {
  const [selectedCommodity, setSelectedCommodity] = useState('');

  const { data: commodities } = useQuery({ queryKey:['commodities'], queryFn: () => commodityApi.list().then(r=>r.data.commodities) });

  const { data: marketSummary, isLoading: loadingMarket } = useQuery({
    queryKey: ['admin-report-market', selectedCommodity],
    queryFn: () => reportApi.marketSummary({ commodity: selectedCommodity||undefined }).then(r=>r.data),
  });

  const { data: supplyDemand, isLoading: loadingSD } = useQuery({
    queryKey: ['admin-report-sd', selectedCommodity],
    queryFn: () => selectedCommodity
      ? reportApi.supplyDemand({ commodity: selectedCommodity }).then(r=>r.data)
      : Promise.resolve(null),
    enabled: !!selectedCommodity,
  });

  const summaryRows = (marketSummary?.summary ?? []).map(row => ({
    label: `${row._id?.sourceType || 'all'}`,
    count: row.count,
    avg: row.avgPricePerKg ? (row.avgPricePerKg*100).toFixed(0) : 0,
    flagged: row.flaggedCount,
  }));

  return (
    <div>
      <div className="adm-page-header">
        <div><h1 className="adm-page-title">Reports & Analytics</h1><p className="adm-page-subtitle">Market summaries and supply-demand data</p></div>
        <div className="adm-page-actions">
          <select className="adm-select" value={selectedCommodity} onChange={e => setSelectedCommodity(e.target.value)}>
            <option value="">All commodities</option>
            {commodities?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="adm-grid-2">
        {/* Market summary chart */}
        <div className="adm-card">
          <div className="adm-card-head"><span className="adm-card-title">Price Observations by Source</span></div>
          <div className="adm-card-body">
            {loadingMarket ? <div className="adm-loading">Loading…</div> :
             summaryRows.length === 0 ? <div className="adm-empty">No market data available.</div> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={summaryRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2ed" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize:10 }} />
                  <YAxis tick={{ fontSize:10 }} />
                  <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
                  <Bar dataKey="count" fill="#245c3a" name="Total observations" radius={[4,4,0,0]} />
                  <Bar dataKey="flagged" fill="#f59e0b" name="Flagged" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
            <p style={{ fontSize:10, color:'var(--adm-muted)', marginTop:8 }}>
              FR-REP-03: Synthetic data is labeled via sourceType. Results reflect database records only.
            </p>
          </div>
        </div>

        {/* Supply vs demand */}
        <div className="adm-card">
          <div className="adm-card-head"><span className="adm-card-title">Supply vs Demand</span></div>
          <div className="adm-card-body">
            {!selectedCommodity ? (
              <div className="adm-empty">Select a commodity to view supply-demand summary.</div>
            ) : loadingSD ? (
              <div className="adm-loading">Loading…</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {[
                  { label:'Available supply', value: supplyDemand?.supply?.totalAvailableKg, unit:'kg', sub: `${supplyDemand?.supply?.supplierCount || 0} suppliers`, color:'#245c3a' },
                  { label:'Active demand', value: supplyDemand?.demand?.totalRequestedKg, unit:'kg', sub: `${supplyDemand?.demand?.orderCount || 0} active orders`, color:'#3b82f6' },
                ].map(row => (
                  <div key={row.label} style={{ padding:16, border:'1px solid var(--adm-border)', borderRadius:8 }}>
                    <div style={{ fontSize:11, color:'var(--adm-muted)', marginBottom:4 }}>{row.label}</div>
                    <div style={{ fontSize:24, fontWeight:800, color: row.color, fontFamily:'Manrope,sans-serif', letterSpacing:'-1px' }}>
                      {row.value != null ? row.value.toLocaleString() : '—'} <span style={{ fontSize:12, fontWeight:500 }}>{row.unit}</span>
                    </div>
                    <div style={{ fontSize:11, color:'var(--adm-muted)', marginTop:2 }}>{row.sub}</div>
                  </div>
                ))}
                <p style={{ fontSize:10, color:'var(--adm-muted)' }}>
                  FR-SD-05: Reflects recorded system data only, not all market activity.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary table */}
      {summaryRows.length > 0 && (
        <div className="adm-card">
          <div className="adm-card-head"><span className="adm-card-title">Observation Summary Table</span></div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Source type</th><th>Observations</th><th>Avg price (ETB/qq)</th><th>Flagged</th></tr></thead>
              <tbody>
                {summaryRows.map((r,i) => (
                  <tr key={i}>
                    <td><span className="adm-badge adm-badge-blue">{r.label}</span></td>
                    <td>{r.count}</td>
                    <td>{r.avg > 0 ? `${r.avg} ETB` : '—'}</td>
                    <td>{r.flagged > 0 ? <span className="adm-badge adm-badge-yellow">{r.flagged}</span> : '0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

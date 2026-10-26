import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi, commodityApi, marketApi } from '../../services/api';

export default function AdminInventory() {
  const [commodity, setCommodity] = useState('');
  const [market,    setMarket]    = useState('');

  const { data: commodities } = useQuery({ queryKey:['commodities'], queryFn: () => commodityApi.list().then(r=>r.data.commodities) });
  const { data: markets }     = useQuery({ queryKey:['markets'],     queryFn: () => marketApi.list().then(r=>r.data.markets) });
  const { data, isLoading }   = useQuery({
    queryKey: ['admin-inventory', commodity, market],
    queryFn: () => inventoryApi.list({ commodity: commodity||undefined, market: market||undefined }).then(r=>r.data),
  });

  const inventory = data?.inventory ?? [];
  const lowStock  = inventory.filter(i => i.availableQuantityKg < 500);

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Inventory Management</h1>
          <p className="adm-page-subtitle">{inventory.length} records · {lowStock.length} low stock</p>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="adm-error-msg" style={{ background:'#fffbeb', borderColor:'#fde68a', color:'#92400e' }}>
          ⚠ {lowStock.length} inventory record{lowStock.length>1?'s':''} below 500 kg threshold.
        </div>
      )}

      <div className="adm-card adm-mb16" style={{ padding:'12px 16px' }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <select className="adm-select" value={commodity} onChange={e => setCommodity(e.target.value)}>
            <option value="">All commodities</option>
            {commodities?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select className="adm-select" value={market} onChange={e => setMarket(e.target.value)}>
            <option value="">All markets</option>
            {markets?.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Commodity</th><th>Supplier</th><th>Market</th><th>Available (qq)</th><th>Ask price (ETB/qq)</th><th>Status</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="adm-loading">Loading…</td></tr>}
              {!isLoading && inventory.length === 0 && <tr><td colSpan={6} className="adm-empty">No inventory records found.</td></tr>}
              {inventory.map(inv => {
                const qq = (inv.availableQuantityKg / 100).toFixed(2);
                const isLow = inv.availableQuantityKg < 500;
                return (
                  <tr key={inv._id}>
                    <td><strong>{inv.commodity?.name}</strong></td>
                    <td style={{ fontSize:11 }}>{inv.supplier?.firstName} {inv.supplier?.lastName}</td>
                    <td style={{ fontSize:11 }}>{inv.market?.name || '—'}</td>
                    <td>
                      <strong style={{ color: isLow ? 'var(--adm-danger)' : 'inherit' }}>{qq}</strong>
                    </td>
                    <td>{inv.askPricePerKg ? `${(inv.askPricePerKg*100).toFixed(0)} ETB` : '—'}</td>
                    <td>
                      <span className={`adm-badge ${!inv.isActive ? 'adm-badge-gray' : isLow ? 'adm-badge-red' : 'adm-badge-green'}`}>
                        {!inv.isActive ? 'inactive' : isLow ? 'low stock' : 'in stock'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

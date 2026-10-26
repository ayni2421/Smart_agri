import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { priceApi, inventoryApi, notificationApi, commodityApi } from '../../services/api';
import { useAuth } from '../../App';
import {
  TrendingUp, Package, Bell, ChevronRight,
  Wheat, MapPin, ArrowUpRight, ArrowDownRight, Info,
} from 'lucide-react';

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [selectedCommodity, setSelectedCommodity] = useState('');

  // Commodities for filter
  const { data: commoditiesData } = useQuery({
    queryKey: ['commodities'],
    queryFn: () => commodityApi.list().then(r => r.data.commodities),
  });

  // Recent market prices (approved only — real data)
  const { data: pricesData, isLoading: loadingPrices } = useQuery({
    queryKey: ['farmer-prices', selectedCommodity],
    queryFn: () => priceApi.list({
      commodity: selectedCommodity || undefined,
      reviewStatus: 'approved',
      limit: 8,
    }).then(r => r.data),
  });

  // Farmer's own inventory (if any recorded by agent)
  const { data: inventoryData } = useQuery({
    queryKey: ['farmer-inventory'],
    queryFn: () => inventoryApi.list().then(r => r.data),
  });

  // Notifications
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list().then(r => r.data),
  });

  const prices    = pricesData?.observations ?? [];
  const inventory = inventoryData?.inventory ?? [];
  const notifs    = notifData?.notifications?.filter(n => !n.isRead) ?? [];

  return (
    <div style={styles.page}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Welcome, {user?.firstName} 👋</h1>
          <p style={styles.sub}>
            {user?.region ? `${user.region} · ` : ''}Farmer account
          </p>
        </div>
        <Link to="/profile" style={styles.avatarBtn}>
          <div style={styles.avatar}>{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
        </Link>
      </div>

      {/* ── Quick stats ────────────────────────────────────────────────── */}
      <div style={styles.statsRow}>
        <StatCard
          icon={<TrendingUp size={18} color="#245c3a" />}
          label="Price observations"
          value={pricesData?.total ?? '—'}
          sub="approved in database"
          bg="#e8f5ec"
        />
        <StatCard
          icon={<Package size={18} color="#3b82f6" />}
          label="Inventory records"
          value={inventory.length}
          sub="linked to your account"
          bg="#dbeafe"
        />
        <StatCard
          icon={<Bell size={18} color="#f59e0b" />}
          label="Notifications"
          value={notifs.length}
          sub="unread"
          bg="#fef9c3"
        />
      </div>

      {/* ── Market prices + commodity filter ──────────────────────────── */}
      <div style={styles.card}>
        <div style={styles.cardHead}>
          <span style={styles.cardTitle}><TrendingUp size={15} style={{ marginRight: 6 }} />Current Market Prices</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <select
              style={styles.select}
              value={selectedCommodity}
              onChange={e => setSelectedCommodity(e.target.value)}
            >
              <option value="">All commodities</option>
              {commoditiesData?.map(c => (
                <option key={c._id} value={c._id}>{c.name} ({c.nameAmharic})</option>
              ))}
            </select>
            <Link to="/prices" style={styles.viewAll}>
              View all <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {loadingPrices && <div style={styles.loading}>Loading prices…</div>}

        {!loadingPrices && prices.length === 0 && (
          <div style={styles.empty}>
            <Info size={18} color="#9ca3af" />
            <span>No approved price observations yet. Once an agent submits prices and they are reviewed, they will appear here.</span>
          </div>
        )}

        {prices.map((obs, i) => {
          const pricePerQq = (obs.pricePerKg * 100).toFixed(0);
          return (
            <div key={obs._id} style={{ ...styles.priceRow, borderBottom: i < prices.length - 1 ? '1px solid #f0f2ed' : 'none' }}>
              <div style={styles.commodityIcon}>
                <Wheat size={18} color="#245c3a" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {obs.commodity?.name}
                  {obs.commodity?.nameAmharic && (
                    <span style={{ color: '#6b7280', fontSize: 11, marginLeft: 6 }}>
                      {obs.commodity.nameAmharic}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <MapPin size={10} /> {obs.market?.name}
                  {obs.market?.region && ` · ${obs.market.region}`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#245c3a', fontFamily: 'Manrope, sans-serif' }}>
                  {parseInt(pricePerQq).toLocaleString()} ETB
                </div>
                <div style={{ fontSize: 10, color: '#9ca3af' }}>per quintal</div>
              </div>
              {obs.sourceType === 'synthetic' && (
                <span style={styles.synthTag}>DEMO</span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Inventory ─────────────────────────────────────────────────── */}
      <div style={styles.card}>
        <div style={styles.cardHead}>
          <span style={styles.cardTitle}><Package size={15} style={{ marginRight: 6 }} />My Produce / Inventory</span>
        </div>
        {inventory.length === 0 ? (
          <div style={styles.empty}>
            <Info size={18} color="#9ca3af" />
            <span>No inventory records linked to your account yet. An authorized agent can add inventory on your behalf.</span>
          </div>
        ) : (
          inventory.map((inv, i) => (
            <div key={inv._id} style={{ ...styles.priceRow, borderBottom: i < inventory.length - 1 ? '1px solid #f0f2ed' : 'none' }}>
              <div style={styles.commodityIcon}><Wheat size={18} color="#3b82f6" /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{inv.commodity?.name}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                  {inv.market?.name || 'No market specified'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1f2937' }}>
                  {(inv.availableQuantityKg / 100).toFixed(1)} quintal
                </div>
                {inv.askPricePerKg && (
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>
                    Ask: {(inv.askPricePerKg * 100).toFixed(0)} ETB/qq
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Notifications ─────────────────────────────────────────────── */}
      {notifs.length > 0 && (
        <div style={styles.card}>
          <div style={styles.cardHead}>
            <span style={styles.cardTitle}><Bell size={15} style={{ marginRight: 6 }} />Notifications</span>
          </div>
          {notifs.slice(0, 4).map((n, i) => (
            <div key={n._id} style={{ ...styles.priceRow, borderBottom: i < Math.min(notifs.length, 4) - 1 ? '1px solid #f0f2ed' : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0, marginTop: 4 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{n.title}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{n.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Platform note ─────────────────────────────────────────────── */}
      <div style={styles.note}>
        <Info size={13} />
        <span>Prices are submitted by authorized agents and reviewed for accuracy before being displayed. Prices labeled DEMO are synthetic test data.</span>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, bg }) {
  return (
    <div style={{ ...styles.stat, background: bg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{label}</span>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.6)', display: 'grid', placeItems: 'center' }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Manrope, sans-serif', letterSpacing: '-1px', color: '#111827', margin: '4px 0 2px' }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: '#6b7280' }}>{sub}</div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 700,
    margin: '0 auto',
    padding: '24px 16px 80px',
    fontFamily: 'DM Sans, system-ui, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: 800,
    color: '#111827',
    margin: 0,
    fontFamily: 'Manrope, sans-serif',
  },
  sub: { fontSize: 12, color: '#6b7280', margin: '4px 0 0' },
  avatarBtn: { textDecoration: 'none' },
  avatar: {
    width: 42, height: 42,
    borderRadius: '50%',
    background: '#245c3a',
    color: '#fff',
    display: 'grid',
    placeItems: 'center',
    fontSize: 14,
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    marginBottom: 16,
  },
  stat: {
    borderRadius: 12,
    padding: '14px 14px 12px',
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #e5e7eb',
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px 10px',
    borderBottom: '1px solid #f0f2ed',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 13,
    fontWeight: 700,
    color: '#111827',
  },
  select: {
    height: 32,
    padding: '0 8px',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    fontSize: 11,
    fontFamily: 'inherit',
    outline: 'none',
    background: '#f9fafb',
  },
  viewAll: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    fontSize: 11,
    fontWeight: 600,
    color: '#245c3a',
    textDecoration: 'none',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
  },
  commodityIcon: {
    width: 38, height: 38,
    borderRadius: 8,
    background: '#f0fdf4',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  },
  synthTag: {
    fontSize: 9,
    fontWeight: 700,
    color: '#92400e',
    background: '#fef3c7',
    padding: '2px 6px',
    borderRadius: 4,
    flexShrink: 0,
  },
  loading: {
    padding: '20px 16px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 13,
  },
  empty: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '16px',
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 1.6,
  },
  note: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '12px 14px',
    background: '#f9fafb',
    borderRadius: 8,
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 1.6,
  },
};

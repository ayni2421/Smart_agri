import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

// ── Ethiopian administrative regions with Amharic localization ─────────────
// Source: Federal Democratic Republic of Ethiopia official administrative divisions
const ETHIOPIAN_REGIONS = [
  { value: 'Addis Ababa',        label: 'Addis Ababa — አዲስ አበባ',        type: 'city' },
  { value: 'Dire Dawa',          label: 'Dire Dawa — ድሬ ዳዋ',            type: 'city' },
  { value: 'Afar',               label: 'Afar — አፋር',                   type: 'region' },
  { value: 'Amhara',             label: 'Amhara — አማራ',                 type: 'region' },
  { value: 'Benishangul-Gumuz',  label: 'Benishangul-Gumuz — ቤኒሻንጉል-ጉምዝ', type: 'region' },
  { value: 'Central Ethiopia',   label: 'Central Ethiopia — መካከለኛ ኢትዮጵያ', type: 'region' },
  { value: 'Gambela',            label: 'Gambela — ጋምቤላ',               type: 'region' },
  { value: 'Harari',             label: 'Harari — ሐረሪ',                 type: 'region' },
  { value: 'Oromia',             label: 'Oromia — ኦሮሚያ',               type: 'region' },
  { value: 'Sidama',             label: 'Sidama — ሲዳማ',                 type: 'region' },
  { value: 'Somali',             label: 'Somali — ሶማሌ',                 type: 'region' },
  { value: 'South Ethiopia',     label: 'South Ethiopia — ደቡብ ኢትዮጵያ',   type: 'region' },
  { value: 'Southwest Ethiopia', label: 'Southwest Ethiopia — ደቡብ ምዕራብ ኢትዮጵያ', type: 'region' },
  { value: 'Tigray',             label: 'Tigray — ትግራይ',               type: 'region' },
];

const ROLES = [
  { value: 'buyer',         label: 'Buyer',         desc: 'Search and purchase commodities',           approval: false },
  { value: 'farmer',        label: 'Farmer',         desc: 'List produce and track prices',             approval: true  },
  { value: 'supplier',      label: 'Supplier',       desc: 'Manage inventory and respond to orders',    approval: true  },
  { value: 'agent',         label: 'Agent',          desc: 'Submit market data on behalf of farmers',   approval: true  },
  { value: 'transporter',   label: 'Transporter',    desc: 'Accept and track deliveries',               approval: true  },
  { value: 'data_reviewer', label: 'Data Reviewer',  desc: 'Review and validate price submissions',     approval: true  },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm]             = useState({ firstName: '', lastName: '', email: '', password: '', role: 'buyer', region: '', phone: '' });
  const [error, setError]           = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess]       = useState('');
  const [loading, setLoading]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const selectedRole = ROLES.find(r => r.value === form.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setFieldErrors({}); setSuccess('');
    setLoading(true);
    try {
      const res = await authApi.register(form);
      if (res.data.token) {
        navigate('/', { replace: true });
      } else {
        setSuccess(res.data.message);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.fields) {
        const fe = {};
        data.fields.forEach((f) => { fe[f.field] = f.message; });
        setFieldErrors(fe);
      } else {
        setError(data?.error || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Success state — pending approval
  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '12px 0 8px' }}>
            Registration submitted
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            {success}
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: 8 }}>
            Once an administrator approves your account you can sign in.
          </p>
          <Link to="/login" style={styles.backLink}>Back to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={styles.logo}>🌾</div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '8px 0 4px', color: 'var(--color-primary)' }}>
            Create account
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
            Join the AgriMarket agricultural platform
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          {/* Name row */}
          <div style={styles.row2}>
            <div>
              <label htmlFor="firstName" style={styles.label}>
                First name <span style={styles.required}>*</span>
              </label>
              <input
                id="firstName" type="text" required autoComplete="given-name"
                style={{ ...styles.input, borderColor: fieldErrors.firstName ? 'var(--color-danger)' : undefined }}
                value={form.firstName}
                onChange={e => setForm({ ...form, firstName: e.target.value })}
              />
              {fieldErrors.firstName && <p style={styles.err}>{fieldErrors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="lastName" style={styles.label}>
                Last name <span style={styles.required}>*</span>
              </label>
              <input
                id="lastName" type="text" required autoComplete="family-name"
                style={{ ...styles.input, borderColor: fieldErrors.lastName ? 'var(--color-danger)' : undefined }}
                value={form.lastName}
                onChange={e => setForm({ ...form, lastName: e.target.value })}
              />
              {fieldErrors.lastName && <p style={styles.err}>{fieldErrors.lastName}</p>}
            </div>
          </div>

          {/* Email */}
          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>
              Email address <span style={styles.required}>*</span>
            </label>
            <input
              id="email" type="email" required autoComplete="email"
              style={{ ...styles.input, borderColor: fieldErrors.email ? 'var(--color-danger)' : undefined }}
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
            {fieldErrors.email && <p style={styles.err}>{fieldErrors.email}</p>}
          </div>

          {/* Phone */}
          <div style={styles.field}>
            <label htmlFor="phone" style={styles.label}>Phone number</label>
            <input
              id="phone" type="tel" autoComplete="tel"
              style={styles.input}
              placeholder="+251 9…"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          {/* Password */}
          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>
              Password <span style={styles.required}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password" type={showPassword ? 'text' : 'password'}
                required minLength={8} autoComplete="new-password"
                style={{ ...styles.input, paddingRight: 44 }}
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={styles.eyeBtn}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {fieldErrors.password && <p style={styles.err}>{fieldErrors.password}</p>}
          </div>

          {/* Role selector */}
          <div style={styles.field}>
            <label htmlFor="role" style={styles.label}>
              Account type <span style={styles.required}>*</span>
            </label>
            <select
              id="role"
              style={styles.input}
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label} — {r.desc}
                </option>
              ))}
            </select>

            {/* Role info pill */}
            {selectedRole && (
              <div style={{
                ...styles.rolePill,
                background: selectedRole.approval ? '#fef9c3' : '#dcfce7',
                borderColor: selectedRole.approval ? '#fde68a' : '#86efac',
                color: selectedRole.approval ? '#854d0e' : '#166534',
              }}>
                {selectedRole.approval
                  ? '⏳ Requires admin approval before you can sign in'
                  : '✓ Active immediately after registration'}
              </div>
            )}
          </div>

          {/* Region dropdown — Ethiopian regions with Amharic */}
          <div style={styles.field}>
            <label htmlFor="region" style={styles.label}>
              Region / City Administration
            </label>
            <select
              id="region"
              style={styles.input}
              value={form.region}
              onChange={e => setForm({ ...form, region: e.target.value })}
            >
              <option value="">— Select your region —</option>

              <optgroup label="City Administrations">
                {ETHIOPIAN_REGIONS.filter(r => r.type === 'city').map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </optgroup>

              <optgroup label="Regional States">
                {ETHIOPIAN_REGIONS.filter(r => r.type === 'region').map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Error */}
          {error && (
            <div style={styles.errorBox} role="alert">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: 16, color: 'var(--color-text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

// ── Inline styles ──────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg)',
    padding: '24px 16px',
  },
  card: {
    width: '100%',
    maxWidth: 460,
    background: 'var(--color-surface)',
    borderRadius: 12,
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
    padding: '32px 28px',
  },
  logo: {
    fontSize: '2rem',
    display: 'block',
    textAlign: 'center',
  },
  field: {
    marginBottom: 14,
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 14,
  },
  label: {
    display: 'block',
    fontSize: '0.82rem',
    fontWeight: 600,
    marginBottom: 5,
    color: '#374151',
  },
  required: {
    color: 'var(--color-danger)',
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    fontSize: '0.88rem',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  },
  eyeBtn: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    lineHeight: 1,
    padding: 2,
  },
  rolePill: {
    marginTop: 6,
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid',
    fontSize: '0.78rem',
    fontWeight: 600,
  },
  err: {
    color: 'var(--color-danger)',
    fontSize: '0.78rem',
    marginTop: 3,
  },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#991b1b',
    fontSize: '0.85rem',
    marginBottom: 14,
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    background: 'var(--color-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 0.15s',
    marginTop: 4,
  },
  successIcon: {
    width: 52,
    height: 52,
    background: '#dcfce7',
    color: '#166534',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.4rem',
    fontWeight: 700,
    margin: '0 auto',
  },
  backLink: {
    display: 'inline-block',
    marginTop: 16,
    color: 'var(--color-primary)',
    fontWeight: 600,
    fontSize: '0.88rem',
  },
};

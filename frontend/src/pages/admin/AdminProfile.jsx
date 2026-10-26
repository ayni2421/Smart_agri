import React, { useState } from 'react';
import { useAuth } from '../../App';
import { useMutation } from '@tanstack/react-query';
import { RegionSelect } from '../../utils/ethiopianRegions.jsx';
import { userApi, authApi } from '../../services/api';
import { User, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminProfile() {
  const { user, login } = useAuth();

  // ── Profile form ──────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    phone:     user?.phone     || '',
    region:    user?.region    || '',
    woreda:    user?.woreda    || '',
  });
  const [profileMsg, setProfileMsg] = useState(null); // { type: 'success'|'error', text }

  // ── Password form ─────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwMsg,   setPwMsg]   = useState(null);
  const [showPw,  setShowPw]  = useState({ current: false, next: false, confirm: false });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const profileMutation = useMutation({
    mutationFn: (data) => userApi.updateProfile(user._id, data),
    onSuccess: (res) => {
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
      // Refresh the stored user
      authApi.me().then(r => {
        const token = localStorage.getItem('samic_token');
        login(token, r.data.user);
      });
    },
    onError: (e) => {
      setProfileMsg({ type: 'error', text: e.response?.data?.error || 'Failed to update profile.' });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data) => userApi.changePassword(user._id, data),
    onSuccess: () => {
      setPwMsg({ type: 'success', text: 'Password changed successfully.' });
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    },
    onError: (e) => {
      setPwMsg({ type: 'error', text: e.response?.data?.error || 'Failed to change password.' });
    },
  });

  const handleProfileSave = (e) => {
    e.preventDefault();
    setProfileMsg(null);
    profileMutation.mutate(profile);
  };

  const handlePasswordSave = (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    passwordMutation.mutate({
      currentPassword: pwForm.currentPassword,
      newPassword:     pwForm.newPassword,
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">My Profile</h1>
          <p className="adm-page-subtitle">Manage your account details and password</p>
        </div>
      </div>

      <div className="adm-grid-2">

        {/* ── Profile details ─────────────────────────────────────────── */}
        <div className="adm-card">
          <div className="adm-card-head">
            <span className="adm-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={15} /> Account details
            </span>
          </div>
          <div className="adm-card-body">

            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--adm-border)' }}>
              <div style={{
                width: 64, height: 64,
                background: 'var(--adm-forest-active)',
                color: '#fff',
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontSize: 22,
                fontWeight: 700,
                fontFamily: 'Manrope, sans-serif',
                flexShrink: 0,
              }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 16 }}>
                  {user?.firstName} {user?.lastName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--adm-muted)', marginTop: 3 }}>{user?.email}</div>
                <span className="adm-badge adm-badge-green" style={{ marginTop: 6, display: 'inline-flex' }}>
                  {user?.role}
                </span>
              </div>
            </div>

            <form onSubmit={handleProfileSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

                <div>
                  <label style={lbl}>First name *</label>
                  <input className="adm-input" style={{ width: '100%' }}
                    value={profile.firstName}
                    onChange={e => setProfile({ ...profile, firstName: e.target.value })}
                    required />
                </div>

                <div>
                  <label style={lbl}>Last name *</label>
                  <input className="adm-input" style={{ width: '100%' }}
                    value={profile.lastName}
                    onChange={e => setProfile({ ...profile, lastName: e.target.value })}
                    required />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={lbl}>Email address</label>
                  <input className="adm-input" style={{ width: '100%', background: '#f5f5f5', color: 'var(--adm-muted)' }}
                    value={user?.email} disabled
                    title="Email cannot be changed here" />
                  <p style={{ fontSize: 10, color: 'var(--adm-muted)', marginTop: 3 }}>
                    Email address cannot be changed.
                  </p>
                </div>

                <div>
                  <label style={lbl}>Phone</label>
                  <input className="adm-input" style={{ width: '100%' }}
                    type="tel" placeholder="+251 9…"
                    value={profile.phone}
                    onChange={e => setProfile({ ...profile, phone: e.target.value })} />
                </div>

                <div>
                  <label style={lbl}>Woreda</label>
                  <input className="adm-input" style={{ width: '100%' }}
                    placeholder="Your woreda"
                    value={profile.woreda}
                    onChange={e => setProfile({ ...profile, woreda: e.target.value })} />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={lbl}>Region / City Administration</label>
                  <RegionSelect
                    className="adm-select"
                    style={{ width: '100%' }}
                    value={profile.region}
                    onChange={e => setProfile({ ...profile, region: e.target.value })}
                  />
                </div>
              </div>

              {profileMsg && (
                <Msg type={profileMsg.type} text={profileMsg.text} />
              )}

              <div style={{ marginTop: 16 }}>
                <button
                  type="submit"
                  className="adm-btn adm-btn-primary"
                  disabled={profileMutation.isLoading}
                >
                  {profileMutation.isLoading ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Change password ─────────────────────────────────────────── */}
        <div>
          <div className="adm-card" style={{ marginBottom: 16 }}>
            <div className="adm-card-head">
              <span className="adm-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={15} /> Change password
              </span>
            </div>
            <div className="adm-card-body">
              <form onSubmit={handlePasswordSave}>
                {[
                  ['currentPassword', 'Current password', 'current'],
                  ['newPassword',     'New password',     'next'],
                  ['confirm',         'Confirm new password', 'confirm'],
                ].map(([field, label, key]) => (
                  <div key={field} style={{ marginBottom: 14 }}>
                    <label style={lbl}>{label} *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="adm-input"
                        style={{ width: '100%', paddingRight: 40 }}
                        type={showPw[key] ? 'text' : 'password'}
                        placeholder={field === 'currentPassword' ? 'Your current password' : 'Min 8 characters'}
                        value={pwForm[field]}
                        onChange={e => setPwForm({ ...pwForm, [field]: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--adm-muted)' }}
                        aria-label={showPw[key] ? 'Hide' : 'Show'}
                      >
                        {showPw[key] ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                ))}

                {pwMsg && <Msg type={pwMsg.type} text={pwMsg.text} />}

                <button
                  type="submit"
                  className="adm-btn adm-btn-primary"
                  disabled={passwordMutation.isLoading}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                >
                  {passwordMutation.isLoading ? 'Changing…' : 'Change password'}
                </button>
              </form>
            </div>
          </div>

          {/* Account info card */}
          <div className="adm-card">
            <div className="adm-card-head">
              <span className="adm-card-title">Account information</span>
            </div>
            <div style={{ padding: '0 20px 16px' }}>
              {[
                ['User ID',        user?._id],
                ['Role',           user?.role],
                ['Account status', user?.status],
                ['Last login',     user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Unknown'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--adm-border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--adm-muted)' }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, maxWidth: '60%', textAlign: 'right', wordBreak: 'break-all' }}>
                    {label === 'Role' ? (
                      <span className="adm-badge adm-badge-blue">{value}</span>
                    ) : label === 'Account status' ? (
                      <span className="adm-badge adm-badge-green">{value}</span>
                    ) : (
                      value || '—'
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
function Msg({ type, text }) {
  const isSuccess = type === 'success';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      marginTop: 10, padding: '9px 12px',
      background: isSuccess ? '#f0fdf4' : '#fef2f2',
      border: `1px solid ${isSuccess ? '#86efac' : '#fecaca'}`,
      borderRadius: 7,
      fontSize: 12,
      color: isSuccess ? '#166534' : '#991b1b',
    }}>
      {isSuccess
        ? <CheckCircle2 size={14} />
        : <AlertCircle size={14} />}
      {text}
    </div>
  );
}

const lbl = { display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4, color: '#374151' };

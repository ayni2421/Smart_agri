import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { useMutation } from '@tanstack/react-query';
import { RegionSelect } from '../utils/ethiopianRegions.jsx';
import { userApi, authApi } from '../services/api';
import { ArrowLeft, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    phone:     user?.phone     || '',
    region:    user?.region    || '',
    woreda:    user?.woreda    || '',
  });
  const [profileMsg, setProfileMsg] = useState(null);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwMsg,   setPwMsg]   = useState(null);
  const [showPw,  setShowPw]  = useState({ c: false, n: false, cf: false });

  const profileMutation = useMutation({
    mutationFn: (d) => userApi.updateProfile(user._id, d),
    onSuccess: () => {
      setProfileMsg({ ok: true, text: 'Profile updated.' });
      authApi.me().then(r => login(localStorage.getItem('samic_token'), r.data.user));
    },
    onError: (e) => setProfileMsg({ ok: false, text: e.response?.data?.error || 'Update failed.' }),
  });

  const pwMutation = useMutation({
    mutationFn: (d) => userApi.changePassword(user._id, d),
    onSuccess: () => { setPwMsg({ ok: true, text: 'Password changed.' }); setPwForm({ currentPassword: '', newPassword: '', confirm: '' }); },
    onError: (e) => setPwMsg({ ok: false, text: e.response?.data?.error || 'Failed to change password.' }),
  });

  const handlePw = (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.newPassword !== pwForm.confirm) { setPwMsg({ ok: false, text: 'Passwords do not match.' }); return; }
    if (pwForm.newPassword.length < 8) { setPwMsg({ ok: false, text: 'Minimum 8 characters.' }); return; }
    pwMutation.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 80px', fontFamily: 'DM Sans, system-ui, sans-serif' }}>

      {/* Back */}
      <button onClick={() => navigate(-1)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#245c3a', fontSize: 13, fontWeight: 600, marginBottom: 20, padding: 0 }}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '20px', background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#245c3a', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
        <div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 17 }}>{user?.firstName} {user?.lastName}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{user?.email}</div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: '#dcfce7', color: '#166534', marginTop: 6, display: 'inline-block' }}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Profile form */}
      <div style={card}>
        <div style={ch}>Profile details</div>
        <div style={{ padding: '16px' }}>
          <form onSubmit={(e) => { e.preventDefault(); setProfileMsg(null); profileMutation.mutate(profile); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {[['firstName','First name'],['lastName','Last name']].map(([f,l]) => (
                <div key={f}>
                  <label style={lbl}>{l}</label>
                  <input className="adm-input" style={{ width: '100%', ...inputStyle }}
                    value={profile[f]} onChange={e => setProfile({ ...profile, [f]: e.target.value })} required />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Phone</label>
              <input className="adm-input" style={{ width: '100%', ...inputStyle }} type="tel" placeholder="+251 9…"
                value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Region</label>
              <RegionSelect style={{ width: '100%', ...inputStyle }} value={profile.region}
                onChange={e => setProfile({ ...profile, region: e.target.value })} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Woreda</label>
              <input className="adm-input" style={{ width: '100%', ...inputStyle }}
                value={profile.woreda} onChange={e => setProfile({ ...profile, woreda: e.target.value })} />
            </div>
            {profileMsg && <Msg {...profileMsg} />}
            <button type="submit" style={btnPrimary} disabled={profileMutation.isLoading}>
              {profileMutation.isLoading ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>
      </div>

      {/* Password */}
      <div style={card}>
        <div style={ch}>Change password</div>
        <div style={{ padding: '16px' }}>
          <form onSubmit={handlePw}>
            {[['currentPassword','Current password','c'],['newPassword','New password','n'],['confirm','Confirm new password','cf']].map(([f,l,k]) => (
              <div key={f} style={{ marginBottom: 12 }}>
                <label style={lbl}>{l}</label>
                <div style={{ position: 'relative' }}>
                  <input style={{ ...inputStyle, width: '100%', paddingRight: 38 }}
                    type={showPw[k] ? 'text' : 'password'} required
                    value={pwForm[f]} onChange={e => setPwForm({ ...pwForm, [f]: e.target.value })} />
                  <button type="button" onClick={() => setShowPw(p => ({ ...p, [k]: !p[k] }))}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                    {showPw[k] ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            ))}
            {pwMsg && <Msg {...pwMsg} />}
            <button type="submit" style={btnPrimary} disabled={pwMutation.isLoading}>
              {pwMutation.isLoading ? 'Changing…' : 'Change password'}
            </button>
          </form>
        </div>
      </div>

      {/* Sign out */}
      <button onClick={handleLogout}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginTop: 8 }}>
        <LogOut size={15} /> Sign out
      </button>
    </div>
  );
}

function Msg({ ok, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, padding: '8px 12px', borderRadius: 7, background: ok ? '#f0fdf4' : '#fef2f2', border: `1px solid ${ok ? '#86efac' : '#fecaca'}`, fontSize: 12, color: ok ? '#166534' : '#991b1b' }}>
      {ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />} {text}
    </div>
  );
}

const lbl = { display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4, color: '#374151' };
const inputStyle = { height: 36, padding: '0 10px', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
const btnPrimary = { width: '100%', padding: '10px', background: '#245c3a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' };
const card = { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: 14, overflow: 'hidden' };
const ch   = { padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#111827', borderBottom: '1px solid #f0f2ed' };

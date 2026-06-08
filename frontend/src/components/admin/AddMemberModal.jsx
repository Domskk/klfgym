import { useState, useEffect } from 'react';
import { C, T } from '../../theme';
import { adminCreateMember } from '../../services/api';
import { API_URL } from '../../services/api';

const PLANS = [
  { label: '1 Month — ₱800',    value: '1month',  months: 1  },
  { label: '3 Months — ₱2,300', value: '3months', months: 3  },
  { label: '6 Months — ₱4,300', value: '6months', months: 6  },
  { label: '1 Year — ₱8,300',   value: '1year',   months: 12 },
];

function computeEndDate(startDate, months) {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function Field({ label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ color: C.textSecondary, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
        {label}{required && <span style={{ color: C.gold, marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  background: '#0d0d0d', border: `1px solid ${C.border}`, borderRadius: 8,
  color: C.textPrimary, fontSize: 13, padding: '9px 12px', outline: 'none',
  fontFamily: T.body, width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s',
};

function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '9px', border: 'none', cursor: 'pointer', fontFamily: T.body,
      fontSize: 12, fontWeight: 600, borderRadius: 8, transition: 'all 0.15s',
      background: active ? C.gold : 'transparent',
      color: active ? '#000' : C.textMuted,
    }}>{label}</button>
  );
}

function PlanPicker({ value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {PLANS.map(p => (
        <button key={p.value} type="button" onClick={() => onChange(p.value)} style={{
          padding: '10px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
          border: `1px solid ${value === p.value ? C.gold : C.border}`,
          background: value === p.value ? 'rgba(240,192,64,0.08)' : '#0d0d0d',
          color: value === p.value ? C.gold : C.textSecondary,
          fontSize: 12, fontFamily: T.body, transition: 'all 0.15s',
        }}>{p.label}</button>
      ))}
    </div>
  );
}

function DateStrip({ start, end }) {
  return (
    <div style={{
      background: 'rgba(240,192,64,0.05)', border: `1px solid rgba(240,192,64,0.15)`,
      borderRadius: 8, padding: '10px 14px',
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
    }}>
      <div>
        <div style={{ color: C.textMuted, fontSize: 10, letterSpacing: 1 }}>START DATE</div>
        <div style={{ color: C.textPrimary, fontSize: 13, marginTop: 2 }}>{start}</div>
      </div>
      <div>
        <div style={{ color: C.textMuted, fontSize: 10, letterSpacing: 1 }}>END DATE</div>
        <div style={{ color: C.gold, fontSize: 13, marginTop: 2 }}>{end}</div>
      </div>
    </div>
  );
}

function SuccessScreen({ user, plan, endDate, qrImage, onClose }) {
  const downloadQR = () => {
    if (!qrImage) return;
    const a = document.createElement('a');
    a.href = qrImage;
    a.download = `${user?.full_name || 'member'}-qr.png`;
    a.click();
  };
  return (
    <div style={{ padding: '24px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'rgba(60,200,80,0.1)', border: '2px solid rgba(60,200,80,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
      }}>✓</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: C.textPrimary, fontSize: 16, fontWeight: 600 }}>{user?.full_name}</div>
        <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>{user?.email}</div>
        {plan && (
          <div style={{
            display: 'inline-block', marginTop: 8,
            background: 'rgba(240,192,64,0.1)', border: `1px solid rgba(240,192,64,0.3)`,
            borderRadius: 20, padding: '3px 10px', color: C.gold, fontSize: 11,
          }}>
            {plan?.label} · Expires {endDate}
          </div>
        )}
      </div>
      {qrImage ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ color: C.textMuted, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>Member QR Code</div>
          <div style={{ background: '#fff', padding: 12, borderRadius: 10, border: `2px solid rgba(240,192,64,0.3)` }}>
            <img src={qrImage} alt="QR Code" style={{ width: 160, height: 160, display: 'block' }} />
          </div>
          <button onClick={downloadQR} style={{
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.textSecondary, fontSize: 12, padding: '8px 18px',
            borderRadius: 8, cursor: 'pointer', fontFamily: T.body,
          }}>⬇ Download QR Code</button>
        </div>
      ) : (
        <div style={{ color: '#5aaa5a', fontSize: 13 }}>Membership updated successfully.</div>
      )}
      <button onClick={onClose} style={{
        width: '100%', padding: '11px', borderRadius: 8, cursor: 'pointer',
        background: C.gold, color: '#000', fontWeight: 700,
        fontSize: 13, border: 'none', fontFamily: T.body,
      }}>Done</button>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function AddMemberModal({ onClose, onSuccess, editUser = null }) {
  const isEditMode = !!editUser;
  const [tab,     setTab]     = useState(isEditMode ? 'update' : 'create');
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const [qrImage,     setQrImage]     = useState('');
  const [createdUser, setCreatedUser] = useState(null);
  const [resultPlan,  setResultPlan]  = useState(null);
  const [resultEnd,   setResultEnd]   = useState('');

  // ── Create form ──────────────────────────────────────────────────────────────
  const [createForm, setCreateForm] = useState({
    full_name: '', email: '', password: '',
    plan: '1month', membership_start: new Date().toISOString().split('T')[0],
  });
  const setC = (k, v) => setCreateForm(f => ({ ...f, [k]: v }));
  const createPlan    = PLANS.find(p => p.value === createForm.plan);
  const createEndDate = computeEndDate(createForm.membership_start, createPlan?.months || 1);

  // ── Update form ──────────────────────────────────────────────────────────────
  const [updateForm, setUpdateForm] = useState({
    userId: editUser?.id || '',
    email:  editUser?.email || '',
    plan:   '1month',
    membership_start: new Date().toISOString().split('T')[0],
  });
  const setU = (k, v) => setUpdateForm(f => ({ ...f, [k]: v }));
  const [foundUser, setFoundUser] = useState(editUser || null);
  const [searching, setSearching] = useState(false);
  const updatePlan    = PLANS.find(p => p.value === updateForm.plan);
  const updateEndDate = computeEndDate(updateForm.membership_start, updatePlan?.months || 1);

  useEffect(() => { setError(''); }, [tab]);

  // ── Lookup user by email ─────────────────────────────────────────────────────
  const lookupUser = async () => {
    if (!updateForm.email.trim()) { setError('Enter an email to search.'); return; }
    setSearching(true); setError(''); setFoundUser(null);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(
        `${API_URL}/users/lookup?email=${encodeURIComponent(updateForm.email.trim())}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'User not found');
      const user = data.user || (Array.isArray(data) ? data[0] : data);
      if (!user) throw new Error('No user found with that email');
      setFoundUser(user);
      setU('userId', user.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  // ── Submit: create ────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setError('');
    if (!createForm.full_name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setError('Name, email and password are required.'); return;
    }
    if (createForm.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data  = await adminCreateMember({
        full_name:        createForm.full_name,
        email:            createForm.email,
        password:         createForm.password,
        role:             createForm.role,
        membership_start: createForm.membership_start,
        membership_end:   createEndDate,
        membership_plan:  createPlan?.label,
      }, token);
      if (!data.user) throw new Error(data.error || 'Registration failed');
      setCreatedUser(data.user);
      setQrImage(data.qrImage || '');
      setResultPlan(createPlan);
      setResultEnd(createEndDate);
      setStep(2);
      onSuccess?.();   // ← re-fetch in parent
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Submit: update membership ─────────────────────────────────────────────────
  const handleUpdate = async () => {
    setError('');
    if (!foundUser) { setError('Search for a member first.'); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/users/${foundUser.id}/membership`, { 
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          membership_start: updateForm.membership_start,
          membership_end:   updateEndDate,
          membership_plan:  updatePlan?.label,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setCreatedUser(data.user || foundUser);
      setQrImage('');
      setResultPlan(updatePlan);
      setResultEnd(updateEndDate);
      setStep(2);
      onSuccess?.();   // ← re-fetch in parent
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
    >
      <div style={{
        background: '#0a0a0a', border: `1px solid ${C.border}`,
        borderRadius: 14, width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: `1px solid ${C.border}`,
        }}>
          <div>
            <div style={{ color: C.gold, fontFamily: T.display, fontSize: 16, letterSpacing: 1 }}>
              {step === 2
                ? (isEditMode || tab === 'update' ? 'MEMBERSHIP UPDATED ✓' : 'MEMBER CREATED ✓')
                : 'MEMBER MANAGEMENT'}
            </div>
            <div style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>
              {step === 2
                ? 'Changes saved successfully.'
                : 'Create a new member or update an existing membership'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        {/* ── Success screen ── */}
        {step === 2 ? (
          <SuccessScreen user={createdUser} plan={resultPlan} endDate={resultEnd} qrImage={qrImage} onClose={onClose} />
        ) : (
          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Tabs */}
            {!isEditMode && (
              <div style={{
                display: 'flex', gap: 6, background: '#0d0d0d',
                border: `1px solid ${C.border}`, borderRadius: 10, padding: 4,
              }}>
                <Tab label="➕ New Member"        active={tab === 'create'} onClick={() => setTab('create')} />
                <Tab label="♻️ Update Membership" active={tab === 'update'} onClick={() => setTab('update')} />
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(220,50,50,0.1)', border: '1px solid rgba(220,50,50,0.3)',
                borderRadius: 8, padding: '10px 14px', color: '#ff6b6b', fontSize: 12,
              }}>{error}</div>
            )}

            {/* ══ CREATE TAB ══ */}
            {tab === 'create' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Full Name" required>
                    <input style={inputStyle} placeholder="e.g. Juan dela Cruz"
                      value={createForm.full_name} onChange={e => setC('full_name', e.target.value)} />
                  </Field>
                </div>
                <Field label="Email Address" required>
                  <input style={inputStyle} type="email" placeholder="member@email.com"
                    value={createForm.email} onChange={e => setC('email', e.target.value)} />
                </Field>
                <Field label="Password" required>
                  <input style={inputStyle} type="password" placeholder="Min. 6 characters"
                    value={createForm.password} onChange={e => setC('password', e.target.value)} />
                </Field>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 6 }}>
                  <div style={{ color: C.textMuted, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                    Membership Plan
                  </div>
                  <PlanPicker value={createForm.plan} onChange={v => setC('plan', v)} />
                </div>
                <Field label="Start Date">
                  <input type="date" style={inputStyle} value={createForm.membership_start}
                    onChange={e => setC('membership_start', e.target.value)} />
                </Field>
                <DateStrip start={createForm.membership_start} end={createEndDate} />
                <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                  <button onClick={onClose} style={{
                    flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
                    background: 'transparent', border: `1px solid ${C.border}`,
                    color: C.textMuted, fontSize: 13, fontFamily: T.body,
                  }}>Cancel</button>
                  <button onClick={handleCreate} disabled={loading} style={{
                    flex: 2, padding: '10px', borderRadius: 8,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    background: loading ? '#333' : C.gold, color: '#000',
                    fontSize: 13, fontWeight: 700, fontFamily: T.body, border: 'none',
                  }}>{loading ? 'Creating…' : 'Create Member'}</button>
                </div>
              </>
            )}

            {/* ══ UPDATE TAB ══ */}
            {tab === 'update' && (
              <>
                <div style={{ color: C.textMuted, fontSize: 12, lineHeight: 1.6 }}>
                  Search for an existing member by email, then assign or renew their membership plan.
                </div>
                <Field label="Member Email" required>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input style={{ ...inputStyle, flex: 1 }} type="email" placeholder="member@email.com"
                      value={updateForm.email} onChange={e => setU('email', e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && lookupUser()}
                      disabled={!!editUser} />
                    {!editUser && (
                      <button onClick={lookupUser} disabled={searching} style={{
                        padding: '0 16px', borderRadius: 8, border: 'none',
                        background: searching ? '#333' : C.gold, color: '#000',
                        fontWeight: 700, fontSize: 12, cursor: searching ? 'not-allowed' : 'pointer',
                        fontFamily: T.body, whiteSpace: 'nowrap',
                      }}>{searching ? 'Searching…' : 'Find'}</button>
                    )}
                  </div>
                </Field>

                {foundUser && (
                  <div style={{
                    background: 'rgba(90,170,90,0.06)', border: '1px solid rgba(90,170,90,0.2)',
                    borderRadius: 8, padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'rgba(240,192,64,0.1)', border: `1px solid rgba(240,192,64,0.3)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: C.gold, fontWeight: 700, fontSize: 13,
                    }}>{(foundUser.full_name || '?')[0].toUpperCase()}</div>
                    <div>
                      <div style={{ color: C.textPrimary, fontSize: 13, fontWeight: 600 }}>{foundUser.full_name}</div>
                      <div style={{ color: C.textMuted, fontSize: 11, marginTop: 1 }}>
                        {foundUser.membership_end
                          ? `Current expiry: ${new Date(foundUser.membership_end).toLocaleDateString()}`
                          : 'No active membership'}
                      </div>
                    </div>
                    <div style={{
                      marginLeft: 'auto', fontSize: 9, fontWeight: 700, padding: '2px 8px',
                      borderRadius: 999, background: 'rgba(90,170,90,0.15)', color: '#5aaa5a',
                    }}>FOUND</div>
                  </div>
                )}

                {foundUser && (
                  <>
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 6 }}>
                      <div style={{ color: C.textMuted, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                        New Membership Plan
                      </div>
                      <PlanPicker value={updateForm.plan} onChange={v => setU('plan', v)} />
                    </div>
                    <Field label="Start Date">
                      <input type="date" style={inputStyle} value={updateForm.membership_start}
                        onChange={e => setU('membership_start', e.target.value)} />
                    </Field>
                    <DateStrip start={updateForm.membership_start} end={updateEndDate} />
                    <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                      <button onClick={onClose} style={{
                        flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
                        background: 'transparent', border: `1px solid ${C.border}`,
                        color: C.textMuted, fontSize: 13, fontFamily: T.body,
                      }}>Cancel</button>
                      <button onClick={handleUpdate} disabled={loading} style={{
                        flex: 2, padding: '10px', borderRadius: 8,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        background: loading ? '#333' : C.gold, color: '#000',
                        fontSize: 13, fontWeight: 700, fontFamily: T.body, border: 'none',
                      }}>{loading ? 'Updating…' : 'Update Membership'}</button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
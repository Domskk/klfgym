import { useState, useEffect, useCallback } from 'react';
import { C } from '../../../theme';
import { Avatar, StatusPill, GoldButton, OutlineButton, PanelCard, FormInput } from '../../shared';
import {
  getTrainers,
  addTrainer,
  deleteTrainer,
  getTrainerBookings,
  updateBookingStatus,
} from '../../../services/api';

const STATUS_META = {
  pending:    { color: '#F0C040', bg: '#1a1500', label: 'Pending' },
  confirmed:  { color: '#4a9af0', bg: '#0a1220', label: 'Confirmed' },
  completed:  { color: '#5aaa5a', bg: '#0a1a0a', label: 'Completed' },
  cancelled:  { color: '#888',    bg: '#1a1a1a', label: 'Cancelled' },
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtTime(t) {
  if (!t) return '—';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function BookingBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
      background: meta.bg, color: meta.color, textTransform: 'capitalize',
    }}>
      {meta.label}
    </span>
  );
}

// ── Trainer Detail (Expanded) ───────────────────────────────────────────────
function TrainerDetail({ trainer, token }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('bookings');

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTrainerBookings(trainer.id, token);
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [trainer.id, token]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Optimistic Status Update
  const handleStatusChange = async (bookingId, newStatus) => {
    const previousBookings = [...bookings];

    // Optimistic update
    setBookings(prev => 
      prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b)
    );

    try {
      const res = await updateBookingStatus(bookingId, newStatus, token);
      if (res.error) throw new Error(res.error);

      // Optional: Show success toast
      // alert(`Booking ${newStatus} successfully!`);
    } catch (err) {
      console.error(err);
      setBookings(previousBookings); // Rollback
      alert(err.message || 'Failed to update status');
    }
  };

  const activeBookings = bookings.filter(b => b.status !== 'cancelled');
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const bookedMembers = [...new Set(activeBookings.map(b => b.member?.id))].map(id => 
    activeBookings.find(b => b.member?.id === id)?.member
  ).filter(Boolean);

  const cellStyle = { padding: '10px 8px', fontSize: 12, color: '#aaa', borderBottom: '0.5px solid #1a1a1a' };
  const headStyle = { padding: '8px 8px', fontSize: 11, color: '#555', textAlign: 'left', fontWeight: 500 };

  return (
    <div style={{ margin: '0 0 2px 0', background: '#080808', border: `0.5px solid ${C.border}`, borderRadius: '0 0 10px 10px', padding: 16 }}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Total Bookings', value: activeBookings.length, color: C.gold },
          { label: 'Pending', value: pendingCount, color: '#F0C040' },
          { label: 'Confirmed', value: confirmedCount, color: '#4a9af0' },
          { label: 'Unique Members', value: bookedMembers.length, color: '#5aaa5a' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: '#0f0f0f', border: `0.5px solid ${C.border}`, borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ color: '#555', fontSize: 10, marginBottom: 4 }}>{s.label}</div>
            <div style={{ color: s.color, fontSize: 22, fontWeight: 600 }}>{loading ? '…' : s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {['bookings', 'members'].map(t => (
          <button 
            key={t} 
            onClick={() => setTab(t)}
            style={{
              padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500,
              background: tab === t ? C.gold : '#1a1a1a',
              color: tab === t ? '#000' : '#666',
            }}
          >
            {t === 'bookings' ? `Bookings (${activeBookings.length})` : `Members (${bookedMembers.length})`}
          </button>
        ))}
      </div>

      {error && <div style={{ color: '#aa5a5a', fontSize: 12, marginBottom: 10 }}>{error}</div>}

      {/* Bookings Tab */}
      {tab === 'bookings' && (
        activeBookings.length === 0 ? (
          <div style={{ color: '#444', textAlign: 'center', padding: '30px 0' }}>No bookings yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Member', 'Date', 'Time', 'Status', 'Action'].map(h => (
                  <th key={h} style={headStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeBookings.map(b => (
                <tr key={b.id}>
                  <td style={cellStyle}>
                    <div style={{ color: '#ddd', fontWeight: 500 }}>{b.member?.full_name || '—'}</div>
                  </td>
                  <td style={cellStyle}>{fmtDate(b.booking_date)}</td>
                  <td style={cellStyle}>{fmtTime(b.booking_time)}</td>
                  <td style={cellStyle}>
                    <BookingBadge status={b.status} />
                  </td>
                  <td style={cellStyle}>
                    <select
                      value={b.status}
                      onChange={(e) => handleStatusChange(b.id, e.target.value)}
                      style={{
                        background: '#1a1a1a', border: '0.5px solid #2a2a2a',
                        color: '#aaa', borderRadius: 6, padding: '4px 8px', fontSize: 11,
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {/* Members Tab */}
      {tab === 'members' && (
        bookedMembers.length === 0 ? (
          <div style={{ color: '#444', textAlign: 'center', padding: '30px 0' }}>No assigned members.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Member', 'Email', 'Sessions'].map(h => (
                  <th key={h} style={headStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookedMembers.map(m => {
                const sessionCount = activeBookings.filter(b => b.member?.id === m.id).length;
                return (
                  <tr key={m.id}>
                    <td style={cellStyle}>{m.full_name}</td>
                    <td style={cellStyle}>{m.email}</td>
                    <td style={cellStyle}>
                      <span style={{ color: C.gold, fontWeight: 600 }}>{sessionCount}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )
      )}
    </div>
  );
}

// Main Panel
export default function TrainersPanel({ token }) {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [newTrainer, setNewTrainer] = useState({ full_name: '', email: '', phone: '' });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const fetchTrainers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTrainers(token);
      setTrainers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchTrainers();
  }, [token, fetchTrainers]);

  const handleAddTrainer = async () => {
    if (!newTrainer.full_name.trim() || !newTrainer.email.trim()) {
      setAddError('Full name and email are required.');
      return;
    }
    setAddError('');
    setAddLoading(true);
    try {
      const data = await addTrainer(newTrainer, token);
      if (data.error) throw new Error(data.error);

      setTrainers(prev => [...prev, data.trainer || data]);
      setNewTrainer({ full_name: '', email: '', phone: '' });
      setShowAddForm(false);
      alert(`Trainer added successfully!`);
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this trainer? This cannot be undone.')) return;
    try {
      const data = await deleteTrainer(id, token);
      if (data.error) throw new Error(data.error);

      setTrainers(prev => prev.filter(t => t.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Trainers', value: trainers.length, color: C.gold },
          { label: 'Active', value: trainers.filter(t => t.is_active).length, color: '#22c55e' },
          { label: 'Inactive', value: trainers.filter(t => !t.is_active).length, color: '#888' },
        ].map(s => (
          <div key={s.label} style={{
            background: C.bgSecondary, borderRadius: 12, padding: 16,
            border: `0.5px solid ${C.border}`,
          }}>
            <div style={{ color: '#888', fontSize: 12 }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <GoldButton onClick={() => { setShowAddForm(v => !v); setAddError(''); }} style={{ alignSelf: 'flex-start' }}>
        {showAddForm ? 'Cancel' : '+ Add New Trainer'}
      </GoldButton>

      {showAddForm && (
        <PanelCard title="Add New Trainer">
          {addError && <div style={{ color: '#aa5a5a', marginBottom: 12 }}>{addError}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <FormInput placeholder="Full Name *" value={newTrainer.full_name} onChange={e => setNewTrainer({ ...newTrainer, full_name: e.target.value })} />
            <FormInput type="email" placeholder="Email *" value={newTrainer.email} onChange={e => setNewTrainer({ ...newTrainer, email: e.target.value })} />
            <FormInput placeholder="Phone" value={newTrainer.phone} onChange={e => setNewTrainer({ ...newTrainer, phone: e.target.value })} />
            <GoldButton onClick={handleAddTrainer} disabled={addLoading}>
              {addLoading ? 'Adding…' : 'Add Trainer'}
            </GoldButton>
          </div>
        </PanelCard>
      )}

      <PanelCard title="Trainer Roster" badge={`${trainers.length} coaches`}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>Loading trainers...</div>
        ) : trainers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>No trainers yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr auto', padding: '8px 12px', borderBottom: `0.5px solid ${C.border}` }}>
              {['Trainer', 'Email', 'Phone', 'Status', ''].map(h => (
                <span key={h} style={{ color: '#555', fontSize: 11, fontWeight: 500 }}>{h}</span>
              ))}
            </div>

            {trainers.map(t => (
              <div key={t.id}>
                <div
                  onClick={() => toggleExpand(t.id)}
                  style={{
                    display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr auto',
                    padding: '12px 12px', borderBottom: `0.5px solid ${C.border}`,
                    cursor: 'pointer', alignItems: 'center',
                    background: expandedId === t.id ? '#0f0f0f' : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#555', marginRight: 4 }}>{expandedId === t.id ? '▾' : '▸'}</span>
                    <Avatar initials={t.full_name?.slice(0, 2).toUpperCase()} size={36} />
                    <span style={{ color: '#ddd', fontWeight: 600 }}>{t.full_name}</span>
                  </div>
                  <span style={{ color: '#888', fontSize: 12 }}>{t.email}</span>
                  <span style={{ color: '#888', fontSize: 12 }}>{t.phone || '—'}</span>
                  <StatusPill status={t.is_active ? 'Available' : 'Inactive'} />
                  <div onClick={e => e.stopPropagation()}>
                    <OutlineButton danger onClick={() => handleDelete(t.id)}>Remove</OutlineButton>
                  </div>
                </div>

                {expandedId === t.id && <TrainerDetail trainer={t} token={token} />}
              </div>
            ))}
          </div>
        )}
      </PanelCard>
    </div>
  );
}
import { useState, useEffect, useCallback } from 'react';
import { C, T } from '../../../theme';
import { Avatar, GoldButton, StatusPill } from '../../shared';
import { createBooking, getMyBookings } from '../../../services/api';
import { API_URL } from '../../../services/api';

const CATEGORIES = ['All', 'Strength', 'Weight Loss', 'Yoga', 'Cardio', 'Powerlifting Coach'];

function TrainerCard({ trainer, onBook, bookingStatus }) {
  // bookingStatus: null | 'pending' | 'confirmed' | 'completed' | 'cancelled'
  const hasActiveBooking = bookingStatus === 'pending' || bookingStatus === 'confirmed';
  const canBook = trainer.is_active && !hasActiveBooking;

  const statusLabel = () => {
    if (bookingStatus === 'pending')   return 'Pending';
    if (bookingStatus === 'confirmed') return 'Confirmed';
    if (!trainer.is_active)            return 'Inactive';
    return 'Available';
  };

  const btnLabel = () => {
    if (bookingStatus === 'pending')   return 'Pending';
    if (bookingStatus === 'confirmed') return 'Confirmed';
    if (!trainer.is_active)            return 'Busy';
    return 'Book';
  };

  return (
    <div style={{
      background: C.bgSecondary, border: `0.5px solid ${C.border}`,
      borderRadius: 14, padding: 14,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <Avatar initials={trainer.full_name?.slice(0, 2).toUpperCase()} size={48} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: C.textPrimary, fontWeight: 500, fontSize: 14 }}>
          {trainer.full_name}
        </div>
        <div style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>
          {trainer.specialty || 'Personal Trainer'}
        </div>
        <div style={{ marginTop: 6 }}>
          <StatusPill status={statusLabel()} />
        </div>
      </div>
      <button
        onClick={() => canBook && onBook(trainer)}
        disabled={!canBook}
        style={{
          background: canBook ? C.gold : '#1e1e1e',
          color: canBook ? C.bgPrimary : C.textMuted,
          fontSize: 11, fontWeight: 600,
          padding: '8px 16px', borderRadius: 8,
          border: 'none', cursor: canBook ? 'pointer' : 'not-allowed',
        }}
      >
        {btnLabel()}
      </button>
    </div>
  );
}

function BookingModal({ trainer, onClose, onBookingSuccess }) {
  const [date, setDate]       = useState('');
  const [time, setTime]       = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConfirm = async () => {
    if (!date || !time) { alert('Please select date and time'); return; }
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await createBooking({ trainer_id: trainer.id, date, time }, token);
      if (res.error) {
        alert(res.error);
      } else {
        setSuccess(true);
        onBookingSuccess(); // trigger re-fetch in parent
      }
    } catch (err) {
      console.error('Booking error:', err);
      alert('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(0,0,0,0.85)', zIndex: 100,
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div style={{ width: '100%', background: '#111', borderRadius: '16px 16px 0 0', padding: '20px' }}>
        {success ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 48 }}>✅</div>
            <h3 style={{ color: C.textPrimary, margin: '12px 0' }}>Booking Confirmed!</h3>
            <p style={{ color: C.textMuted }}>
              With {trainer.full_name}<br />on {date} at {time}
            </p>
            <GoldButton onClick={onClose} style={{ marginTop: 24, width: '100%' }}>Done</GoldButton>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 600 }}>Book Session</div>
                <div style={{ color: C.textMuted, fontSize: 13 }}>with {trainer.full_name}</div>
              </div>
              <button onClick={onClose} style={{ fontSize: 22, color: C.textMuted, background: 'none', border: 'none' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ color: C.textMuted, fontSize: 12, marginBottom: 6 }}>Date</div>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  style={{ width: '100%', padding: 12, background: '#0f0f0f', border: `0.5px solid ${C.border}`, borderRadius: 8, color: 'white' }} />
              </div>
              <div>
                <div style={{ color: C.textMuted, fontSize: 12, marginBottom: 6 }}>Time</div>
                <input type="time" value={time} onChange={e => setTime(e.target.value)}
                  style={{ width: '100%', padding: 12, background: '#0f0f0f', border: `0.5px solid ${C.border}`, borderRadius: 8, color: 'white' }} />
              </div>
            </div>
            <GoldButton
              onClick={handleConfirm}
              disabled={loading || !date || !time}
              style={{ width: '100%', marginTop: 20 }}
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </GoldButton>
          </>
        )}
      </div>
    </div>
  );
}

export default function TrainersTab() {
  const [trainers, setTrainers]             = useState([]);
  const [myBookings, setMyBookings]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [filter, setFilter]                 = useState('All');
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  // ── Fetch both trainers and latest bookings from server ───────────────────
  const loadData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [trainersRes, bookingsRes] = await Promise.all([
        fetch(`${API_URL}/trainers`, { headers: { Authorization: `Bearer ${token}` } }),
        getMyBookings(token),
      ]);

      const trainersData = await trainersRes.json();
      const bookingsData = Array.isArray(bookingsRes)
        ? bookingsRes
        : bookingsRes?.records || [];

      setTrainers(Array.isArray(trainersData) ? trainersData : []);
      setMyBookings(bookingsData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Re-fetch when the tab becomes visible again (user switches back from admin)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData(true); // background refresh, no spinner
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadData]);

  // After a booking is created — re-fetch so we get the real server record
  const handleBookingSuccess = async () => {
    setSelectedTrainer(null);
    await loadData(true);
  };

  // Get the most relevant booking status for a trainer
  const getBookingStatus = (trainerId) => {
    const relevant = myBookings
      .filter(b => (b.trainer_id || b.trainer?.id) === trainerId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // newest first

    if (!relevant.length) return null;

    // Priority: confirmed > pending > completed > cancelled
    const priority = ['confirmed', 'pending', 'completed', 'cancelled'];
    for (const status of priority) {
      const found = relevant.find(b => b.status === status);
      if (found) return found.status;
    }
    return relevant[0].status;
  };

  const filteredTrainers = filter === 'All'
    ? trainers
    : trainers.filter(t => t.specialty?.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>

      {/* Header */}
      <div style={{ padding: '14px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: C.textPrimary, fontSize: 18, fontWeight: 600 }}>Our Trainers</div>
          <div style={{ color: C.textMuted, fontSize: 12 }}>Book a session with a certified coach</div>
        </div>
        {/* Manual refresh button */}
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          style={{
            background: 'transparent', border: `0.5px solid ${C.border}`,
            color: refreshing ? C.textMuted : C.gold,
            fontSize: 11, padding: '6px 12px', borderRadius: 8,
            cursor: refreshing ? 'not-allowed' : 'pointer', marginTop: 2,
          }}
        >
          {refreshing ? '...' : '↻ Refresh'}
        </button>
      </div>

      {/* Category Filters */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 20px', overflowX: 'auto' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '6px 16px', borderRadius: 999, fontSize: 12,
              border: `0.5px solid ${filter === cat ? C.gold : C.borderMid}`,
              background: filter === cat ? C.gold : C.bgSecondary,
              color: filter === cat ? C.bgPrimary : C.textMuted,
              whiteSpace: 'nowrap', cursor: 'pointer',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Trainers List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>Loading trainers...</div>
        ) : filteredTrainers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>No trainers found</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredTrainers.map(trainer => (
              <TrainerCard
                key={trainer.id}
                trainer={trainer}
                onBook={setSelectedTrainer}
                bookingStatus={getBookingStatus(trainer.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedTrainer && (
        <BookingModal
          trainer={selectedTrainer}
          onClose={() => setSelectedTrainer(null)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}
import { useState, useEffect, useCallback } from 'react';
import { C, T } from '../../../theme';
import { GoldButton, OutlineButton, PanelCard, FormInput, FormSelect } from '../../shared';
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
} from '../../../services/api';

const ANN_TYPES = ['Promo', 'Class', 'Event', 'General', 'New Trainer'];

const TYPE_META = {
  Promo:         { bg: '#1a1a00', color: '#F0C040', icon: '🏷️' },
  Class:         { bg: '#0f1a2a', color: '#4a9af0', icon: '🏋️' },
  Event:         { bg: '#1a0f2a', color: '#aa4af0', icon: '📅' },
  General:       { bg: '#1a1a1a', color: '#888',    icon: '📢' },
  'New Trainer': { bg: '#0f1f0f', color: '#5aaa5a', icon: '👤' },
};

function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div style={{
      background: '#1f0f0f', border: '0.5px solid #5a2a2a', borderRadius: 6,
      padding: '8px 12px', marginBottom: 12, color: '#aa5a5a', fontSize: 12,
    }}>
      {message}
    </div>
  );
}

  const emptyForm = { 
    title: '', 
    body: '', 
    type: 'General', 
    startDate: '', 
    endDate: '' 
  };  
// ==================== ANNOUNCEMENT FORM ====================
function AnnouncementForm({ initial, onSave, onCancel, token }) {


  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset form when switching between Create and Edit mode
  useEffect(() => {
    if (initial) {
      setForm({
        title:     initial.title     ?? '',
        body:      initial.body      ?? '',
        type:      initial.type      ?? 'General',
        startDate: initial.start_date ? initial.start_date.slice(0, 10) : '',
        endDate:   initial.end_date   ? initial.end_date.slice(0, 10)   : '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [initial]);

  const up = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    if (!form.title.trim() || !form.body.trim()) {
      setError('Title and body are required.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const payload = {
        title:     form.title,
        body:      form.body,
        type:      form.type,
        startDate: form.startDate || null,
        endDate:   form.endDate   || null,
      };

      let result;

      if (initial?.id) {
        // UPDATE
        result = await updateAnnouncement(initial.id, payload, token);
        if (result.error) throw new Error(result.error || 'Failed to update announcement');
      } else {
        // CREATE
        result = await createAnnouncement(payload, token);
        if (result.error) throw new Error(result.error || 'Failed to create announcement');
      }

      const savedData = result.data || result;
      onSave(savedData, initial?.id ? 'update' : 'create');

      // Clear form only after successful CREATE
      if (!initial?.id) {
        setForm(emptyForm);
      }

      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const dateStyle = {
    width: '100%', background: '#0f0f0f', border: '0.5px solid #2a2a2a',
    color: '#fff', padding: '9px 12px', borderRadius: 8, fontSize: 13,
    fontFamily: T.body, colorScheme: 'dark',
  };

  return (
    <PanelCard title={initial ? 'Edit Announcement' : 'Create Announcement'}>
      <ErrorBanner message={error} />

      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 3 }}>
          <div style={{ color: '#555', fontSize: 11, marginBottom: 5 }}>Title *</div>
          <FormInput
            placeholder="Announcement title"
            value={form.title}
            onChange={e => up('title', e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#555', fontSize: 11, marginBottom: 5 }}>Type</div>
          <FormSelect 
            value={form.type} 
            onChange={e => up('type', e.target.value)} 
            style={{ width: '100%' }}
          >
            {ANN_TYPES.map(t => <option key={t}>{t}</option>)}
          </FormSelect>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: '#555', fontSize: 11, marginBottom: 5 }}>Message Body *</div>
        <textarea
          value={form.body}
          onChange={e => up('body', e.target.value)}
          rows={3}
          placeholder="Write the announcement message here..."
          style={{
            width: '100%', background: '#0f0f0f', border: '0.5px solid #2a2a2a',
            color: '#fff', padding: '10px 12px', borderRadius: 8, fontSize: 13,
            fontFamily: T.body, resize: 'vertical',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#555', fontSize: 11, marginBottom: 5 }}>Valid From</div>
          <input 
            type="date" 
            value={form.startDate} 
            onChange={e => up('startDate', e.target.value)} 
            style={dateStyle} 
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#555', fontSize: 11, marginBottom: 5 }}>Valid Until</div>
          <input 
            type="date" 
            value={form.endDate} 
            onChange={e => up('endDate', e.target.value)} 
            style={dateStyle} 
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {onCancel && (
            <OutlineButton onClick={onCancel} disabled={loading}>
              Cancel
            </OutlineButton>
          )}
          <GoldButton onClick={submit} disabled={loading}>
            {loading 
              ? (initial ? 'Saving…' : 'Posting…') 
              : (initial ? 'Save Changes' : 'Post Announcement')
            }
          </GoldButton>
        </div>
      </div>
    </PanelCard>
  );
}

// ==================== ANNOUNCEMENT CARD ====================
function AnnouncementCard({ ann, onEdit, onDelete }) {
  const meta = TYPE_META[ann.type] || TYPE_META['General'];

  return (
    <div style={{
      background: '#0f0f0f', border: `0.5px solid ${C.border}`,
      borderRadius: 10, padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{
        width: 38, height: 38, background: meta.bg,
        border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, flexShrink: 0,
      }}>
        {meta.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ color: '#fff', fontWeight: 500, fontSize: 14 }}>{ann.title}</span>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
            background: meta.bg, color: meta.color,
          }}>
            {ann.type}
          </span>
        </div>
        <div style={{ color: '#555', fontSize: 12, lineHeight: 1.6, marginBottom: 6 }}>{ann.body}</div>
        <div style={{ color: '#333', fontSize: 11 }}>
          {formatDate(ann.created_at)}
          {ann.start_date && ann.end_date && (
            <span style={{ marginLeft: 10, color: '#444' }}>
              · {formatDate(ann.start_date)} → {formatDate(ann.end_date)}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <OutlineButton onClick={() => onEdit(ann)}>Edit</OutlineButton>
        <OutlineButton danger onClick={() => onDelete(ann.id)}>Delete</OutlineButton>
      </div>
    </div>
  );
}

// ==================== STAT CARD ====================
function StatCard({ label, value, accent }) {
  return (
    <div style={{
      background: C.bgSecondary, border: `0.5px solid ${C.border}`,
      borderRadius: 10, padding: '14px 16px',
    }}>
      <div style={{ color: '#555', fontSize: 11, marginBottom: 6 }}>{label}</div>
      <div style={{ color: accent, fontSize: 26, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function AnnouncementsPanel({ token }) {
  const [announcements, setAnnouncements] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [fetching, setFetching] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    setFetching(true);
    setLoadError('');
    try {
      const data = await getAnnouncements();
      if (data.error) throw new Error(data.error || 'Failed to load announcements');
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setFetching(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  function handleSave(savedAnn, action) {
    if (action === 'update' && editing) {
      setAnnouncements(prev => prev.map(a => a.id === editing.id ? savedAnn : a));
    } else {
      setAnnouncements(prev => [savedAnn, ...prev]);
    }
    setEditing(null);
    refresh();                    // Auto refresh after save
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this announcement?')) return;

    try {
      const data = await deleteAnnouncement(id, token);
      if (data.error) throw new Error(data.error || 'Failed to delete');

      setAnnouncements(prev => prev.filter(a => a.id !== id));
      refresh();                    // Auto refresh after delete
    } catch (err) {
      alert(err.message || 'Failed to delete announcement');
    }
  }

  const stats = [
    { label: 'Total Posts', value: announcements.length, accent: '#F0C040' },
    { label: 'Promos',      value: announcements.filter(a => a.type === 'Promo').length, accent: '#F0C040' },
    { label: 'Classes',     value: announcements.filter(a => a.type === 'Class').length, accent: '#4a9af0' },
    { label: 'Events',      value: announcements.filter(a => a.type === 'Event').length, accent: '#aa4af0' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Create / Edit Form */}
      <AnnouncementForm 
        initial={editing} 
        token={token} 
        onSave={handleSave} 
        onCancel={editing ? () => setEditing(null) : undefined} 
      />

      {/* Announcements List */}
      <div>
        <div style={{
          color: '#555', fontSize: 12, textTransform: 'uppercase',
          letterSpacing: '0.5px', marginBottom: 12,
        }}>
          Posted Announcements ({announcements.length})
        </div>

        <ErrorBanner message={loadError} />

        {fetching && (
          <div style={{ color: '#444', textAlign: 'center', padding: '40px 0', fontSize: 13 }}>
            Loading…
          </div>
        )}

        {!fetching && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {announcements.map(a => (
              <AnnouncementCard 
                key={a.id} 
                ann={a} 
                onEdit={setEditing} 
                onDelete={handleDelete} 
              />
            ))}
            {announcements.length === 0 && (
              <div style={{ color: '#555', textAlign: 'center', padding: '60px 0', fontSize: 13 }}>
                No announcements yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
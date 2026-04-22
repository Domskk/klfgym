const supabase = require('../config/db');
const { sendEmail } = require('../services/notification.services');

const createAnnouncement = async (req, res) => {
  const { title, body, type = 'General', startDate, endDate } = req.body;

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title,
      body,
      type,
      start_date: startDate,
      end_date: endDate,
      created_by: req.user.id
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Optional: Send email notification
  const { data: members } = await supabase
    .from('users')
    .select('email, full_name')
    .not('email', 'is', null);

  const html = `
    <h2>📢 ${title}</h2>
    <p>${body}</p>
    ${startDate && endDate ? `<p><strong>Valid:</strong> ${new Date(startDate).toLocaleDateString()} → ${new Date(endDate).toLocaleDateString()}</p>` : ''}
    <br/>
    <p>— KLF Gym Team</p>
  `;

  Promise.allSettled(
    (members || []).map(m => sendEmail(m.email, `[KLF Gym] ${title}`, html))
  ).then(results => {
    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed > 0) console.error(`${failed} announcement emails failed`);
  });

  res.status(201).json({ message: 'Announcement created', data });
};

const updateAnnouncement = async (req, res) => {
  const { id } = req.params;
  const { title, body, type, startDate, endDate } = req.body;

  console.log(`[UPDATE ANNOUNCEMENT] ID: ${id}`);
  console.log(`[UPDATE ANNOUNCEMENT] User: ${req.user?.id} | Role: ${req.user?.role || 'unknown'}`);
  console.log(`[UPDATE ANNOUNCEMENT] Payload:`, req.body);

  const { data, error } = await supabase
    .from('announcements')
    .update({
      title,
      body,
      type,
      start_date: startDate,
      end_date: endDate,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Supabase Update Error:', error);
    return res.status(500).json({ error: error.message });
  }

  if (!data) {
    console.error('No rows updated — this usually means RLS blocked the operation or the row does not exist.');
    return res.status(404).json({ 
      error: 'Announcement not found or you do not have permission to update it.' 
    });
  }

  console.log('[UPDATE ANNOUNCEMENT] Success:', data);
  res.json({ message: 'Announcement updated successfully', data });
};

const getAnnouncements = async (req, res) => {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const deleteAnnouncement = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('announcements')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: 'Announcement deleted (soft delete)' });
};

module.exports = {
  createAnnouncement,
  updateAnnouncement,
  getAnnouncements,
  deleteAnnouncement
};
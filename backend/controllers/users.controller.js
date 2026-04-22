const supabase = require('../config/db');
const QRCode   = require('qrcode');
const { refreshUserAnalytics } = require('../services/analytics.refresh');

// GET /api/users/profile
const getProfile = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const qrImage = user.qr_token
      ? await QRCode.toDataURL(`KLF-SCAN:${user.qr_token}`)
      : null;

    res.json({
      id:              user.id,
      email:           user.email,
      full_name:       user.full_name,
      role:            user.role,
      membership_plan: user.membership_plan || null,
      membership_end:  user.membership_end  || null,
      qrImage,
      qr_token:        user.qr_token,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// GET /api/users/lookup?email=xxx
const lookupByEmail = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const { data: user, error } = await supabase
    .from('users')
    .select('id, full_name, email, phone, role, membership_plan, membership_end, is_active')
    .eq('email', email.trim())
    .single();

  if (error || !user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
};

// PATCH /api/users/:id/membership
const updateMembership = async (req, res) => {
  const { membership_start, membership_end, membership_plan } = req.body;

  try {
    const { data: user, error } = await supabase
      .from('users')
      .update({
        membership_start,
        membership_end,
        membership_plan,
        is_active: true, // reactivate if previously cancelled
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Refresh analytics after membership change
    await refreshUserAnalytics(req.params.id).catch(err =>
      console.error('Analytics refresh failed:', err.message)
    );

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update membership' });
  }
};

module.exports = { getProfile, lookupByEmail, updateMembership };
const express = require('express');
const router = express.Router();
const { getProfile, lookupByEmail, updateMembership } = require('../controllers/users.controller');
const authenticate   = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { getUserAttendance, getUserAnalytics } = require('../controllers/attendance.controller');
const supabase = require('../config/db');
const bcrypt = require('bcrypt');

// GET /api/users/profile
router.get('/profile', authenticate, getProfile);

// PATCH /api/users/profile — update name/email
router.patch('/profile', authenticate, async (req, res) => {
  const { full_name, email } = req.body;
  try {
    const { data: user, error } = await supabase
      .from('users')
      .update({ full_name, email })
      .eq('id', req.user.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PATCH /api/users/profile/password — change password
router.patch('/profile/password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) return res.status(400).json({ error: 'Current password is incorrect.' });

    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });

    const password_hash = await bcrypt.hash(newPassword, 10);
    await supabase.from('users').update({ password_hash }).eq('id', req.user.id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});
// GET /api/users/lookup
router.get('/lookup', authenticate, roleMiddleware(['admin', 'trainer']), lookupByEmail);

// GET /api/users?email=xxx — fuzzy search, used by admin member list
router.get('/', authenticate, roleMiddleware(['admin']), async (req, res) => {
  const { email } = req.query;
  const query = supabase
    .from('users')
    .select('id, full_name, email, membership_end, membership_plan');
  if (email) query.ilike('email', `%${email}%`);
  const { data, error } = await query.limit(5);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/attendance', authenticate, getUserAttendance);
router.get('/analytics', authenticate, getUserAnalytics);

// PATCH /api/users/:id/membership — assign or renew membership
router.patch('/:id/membership', authenticate, roleMiddleware(['admin', 'trainer']), updateMembership);

module.exports = router;
const express = require('express');
const router = express.Router();
const { getProfile, lookupByEmail, updateMembership } = require('../controllers/users.controller');
const authenticate   = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const supabase = require('../config/db');

// GET /api/users/profile
router.get('/profile', authenticate, getProfile);

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

// PATCH /api/users/:id/membership — assign or renew membership
router.patch('/:id/membership', authenticate, roleMiddleware(['admin', 'trainer']), updateMembership);

module.exports = router;
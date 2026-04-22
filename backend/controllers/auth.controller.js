/**
 * Auth Controller
 * Handles register, login, and membership cancellation.
 * Membership updates (assign/renew) live in users.routes.js → PATCH /api/users/:id/membership
 */

const bcrypt = require('bcryptjs');
const supabase = require('../config/db');
const { generateToken } = require('../utils/jwt.utils');
const { generateQRForMember } = require('../services/qr.service');
const { refreshUserAnalytics } = require('../services/analytics.refresh');

// ── Register ──────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const {
      email,
      password,
      full_name,
      role             = 'member',
      membership_start = null,
      membership_end   = null,
      membership_plan  = null,
    } = req.body;

    // Check duplicate email
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash,
        full_name,
        role,
        is_active:        true,
        membership_start,
        membership_end,
        membership_plan,
      })
      .select()
      .single();

    if (error) throw error;

    // Generate QR Code
    const { qrToken, qrImage } = await generateQRForMember(user.id);

    // Generate JWT
    const token = generateToken(user);

    // Seed analytics row immediately (fire-and-forget)
    if (role === 'member') {
      refreshUserAnalytics(user.id).catch(err =>
        console.error('Analytics seed failed for new user:', err.message)
      );
    }

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id:        user.id,
        email:     user.email,
        full_name: user.full_name,
        role:      user.role,
      },
      qrToken,
      qrImage,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.is_active === false) {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id:        user.id,
        email:     user.email,
        full_name: user.full_name,
        role:      user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

// ── Cancel / Deactivate Membership ───────────────────────────────────────────
const cancelMembership = async (req, res) => {
  const { userId } = req.params;
  const { reason, customReason } = req.body || {};

  try {
    const { error: updateError } = await supabase
      .from('users')
      .update({
        membership_end: new Date().toISOString().split('T')[0],
        is_active:      false,
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Log dropout reason if provided
    if (reason) {
      await supabase.from('dropout_reasons').insert({
        user_id:       userId,
        reason:        reason,
        custom_reason: customReason || null,
        submitted_by:  req.user.id,
      });
    }

    // Refresh analytics
    await refreshUserAnalytics(userId);

    res.json({ success: true, message: 'Membership cancelled successfully' });
  } catch (err) {
    console.error('Cancel membership error:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, cancelMembership };
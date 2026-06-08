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
const crypto = require('crypto');
const { sendEmail } = require('../services/notification.services');

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

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', email)
      .single();

    if (!user) return res.json({ success: true });

    const resetToken  = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await supabase.from('users').update({
      reset_token:        resetToken,
      reset_token_expiry: resetExpiry,
    }).eq('id', user.id);

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // ← reuse existing sendEmail instead of creating a new transporter
    await sendEmail(
      user.email,
      'Reset Your Password — KL Fitness',
      `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
          <h2 style="color:#F0C040;margin-bottom:8px">KL FITNESS</h2>
          <p>Hi <strong>${user.full_name}</strong>,</p>
          <p>We received a request to reset your password. Click the button below — this link expires in <strong>1 hour</strong>.</p>
          <a href="${resetLink}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#F0C040;color:#000;border-radius:8px;font-weight:700;text-decoration:none;font-size:14px">
            Reset My Password
          </a>
          <p style="color:#888;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
          <hr style="border:none;border-top:1px solid #222;margin:24px 0"/>
          <p style="color:#555;font-size:11px">KL Fitness Gym Management System</p>
        </div>
      `
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to send reset email.' });
  }
};

// ── Reset Password ────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    if (!token || !newPassword)
      return res.status(400).json({ error: 'Token and new password are required.' });

    if (newPassword.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const { data: user } = await supabase
      .from('users')
      .select('id, reset_token_expiry')
      .eq('reset_token', token)
      .single();

    if (!user)
      return res.status(400).json({ error: 'Invalid or expired reset link.' });

    if (new Date(user.reset_token_expiry) < new Date())
      return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });

    const password_hash = await bcrypt.hash(newPassword, 10);

    await supabase.from('users').update({
      password_hash,
      reset_token:        null,
      reset_token_expiry: null,
    }).eq('id', user.id);

    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
};

module.exports = { register, login, cancelMembership, forgotPassword, resetPassword };
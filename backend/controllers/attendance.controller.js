const supabase = require('../config/db');

// ── Plan Limits ───────────────────────────────────────────────────────────────
const PLAN_LIMITS = {
  '1 Month — ₱800':   { daily: 1, monthly: null },
  '3 Months — ₱800':  { daily: 1, monthly: null },
  '6 Months — ₱800':  { daily: 1, monthly: null },
  '1 Year — ₱800':    { daily: 1, monthly: null },
  'default':           { daily: 1, monthly: null },
};

// ── Attendance Limit Check ────────────────────────────────────────────────────
const checkAttendanceLimit = async (userId) => {
  const { data: user } = await supabase
    .from('users')
    .select('membership_plan')
    .eq('id', userId)
    .single();

  const plan   = user?.membership_plan || 'default';
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS['default'];

  const now          = new Date();
  const startOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Daily check
  if (limits.daily !== null) {
    const { count: dailyCount } = await supabase
      .from('attendance_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('scanned_at', startOfDay);

    if (dailyCount >= limits.daily) {
      return {
        exceeded: true,
        message: `Daily check-in limit reached (${limits.daily}/day for ${plan} plan).`,
      };
    }
  }

  // Monthly check
  if (limits.monthly !== null) {
    const { count: monthlyCount } = await supabase
      .from('attendance_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('scanned_at', startOfMonth);

    if (monthlyCount >= limits.monthly) {
      return {
        exceeded: true,
        message: `Monthly check-in limit reached (${limits.monthly}/month for ${plan} plan).`,
      };
    }
  }

  return { exceeded: false };
};

// ── Smart Scan: auto check-in OR check-out ────────────────────────────────────
const scanQR = async (req, res) => {
  let qrToken     = req.body.qrToken;
  const scannerId = req.user.id;

  if (!qrToken || typeof qrToken !== 'string')
    return res.status(400).json({ error: 'QR Token is required' });

  if (qrToken.includes(':')) qrToken = qrToken.split(':').pop().trim();
  qrToken = qrToken.trim();

  try {
    // 1. Resolve member
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, full_name, is_active, membership_start, membership_end')
      .eq('qr_token', qrToken)
      .single();

    if (userError || !user)
      return res.status(404).json({ error: 'Invalid QR Code' });

    if (!user.is_active)
      return res.status(403).json({ error: 'Membership cancelled. Please visit the front desk.' });

    if (!user.membership_end)
      return res.status(403).json({ error: 'No active membership. Please avail a plan at the front desk.' });

    if (new Date(user.membership_end) < new Date())
      return res.status(403).json({ error: 'Membership expired. Please renew at the front desk.' });

    // 2. Look for an open (not yet checked out) log within the last 24 hours
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: openLog } = await supabase
      .from('attendance_logs')
      .select('id, scanned_at')
      .eq('user_id', user.id)
      .is('checked_out_at', null)
      .gte('scanned_at', cutoff24h)
      .order('scanned_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3a. CHECK-OUT — close the open log (no limit check needed)
    if (openLog) {
      const checkedOutAt = new Date().toISOString();
      const durationMins = Math.round(
        (new Date(checkedOutAt) - new Date(openLog.scanned_at)) / 60000
      );

      const { data: closedLog, error: updateErr } = await supabase
        .from('attendance_logs')
        .update({ checked_out_at: checkedOutAt })
        .eq('id', openLog.id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      return res.json({
        success:           true,
        action:            'checkout',
        message:           `Check-out successful for ${user.full_name}`,
        gym_duration_mins: durationMins,
        log:               closedLog,
      });
    }

    // 3b. No open log — check limit BEFORE allowing a new check-in
    const limitResult = await checkAttendanceLimit(user.id);
    if (limitResult.exceeded) {
      return res.status(429).json({ error: limitResult.message });
    }

    // 3c. CHECK-IN — create a new log
    const { data: newLog, error: insertErr } = await supabase
      .from('attendance_logs')
      .insert({ user_id: user.id, scanner_id: scannerId })
      .select(`*, users!attendance_logs_user_id_fkey (full_name)`)
      .single();

    if (insertErr) throw insertErr;

    return res.json({
      success: true,
      action:  'checkin',
      message: `Check-in successful for ${user.full_name}`,
      log:     newLog,
    });

  } catch (err) {
    console.error('Scan Error:', err);
    res.status(500).json({ error: 'Failed to process attendance' });
  }
};

// ── Get Today's Attendance ────────────────────────────────────────────────────
const getTodayAttendance = async (req, res) => {
  try {
    const now        = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { data, error } = await supabase
      .from('attendance_logs')
      .select(`
        *,
        users!attendance_logs_user_id_fkey (
          id, full_name, is_active, membership_end, membership_plan
        )
      `)
      .gte('scanned_at', startOfDay)
      .order('scanned_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error('Get today attendance error:', err);
    res.status(500).json({ error: 'Failed to fetch today attendance' });
  }
};

// ── Get My Attendance (member view) ──────────────────────────────────────────
const getMyAttendance = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const { data, error } = await supabase
      .from('attendance_logs')
      .select(`
        id, scanned_at, checked_out_at, session_type,
        users!attendance_logs_user_id_fkey (
          full_name, is_active, membership_end
        )
      `)
      .eq('user_id', req.user.id)
      .order('scanned_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const records = (data || []).map(log => ({
      ...log,
      gym_duration_mins: log.checked_out_at
        ? Math.round((new Date(log.checked_out_at) - new Date(log.scanned_at)) / 60000)
        : null,
    }));

    res.json({ records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

// ── Explicit Checkout by Log ID (optional endpoint) ───────────────────────────
const checkOut = async (req, res) => {
  try {
    const { logId } = req.params;
    const now = new Date().toISOString();

    const { data: log } = await supabase
      .from('attendance_logs')
      .select('id, scanned_at, checked_out_at, user_id')
      .eq('id', logId)
      .single();

    if (!log)
      return res.status(404).json({ error: 'Log not found' });

    if (log.checked_out_at)
      return res.status(409).json({ error: 'Already checked out' });

    if (log.user_id !== req.user.id && req.user.role === 'member')
      return res.status(403).json({ error: 'Forbidden' });

    const durationMins = Math.round((new Date(now) - new Date(log.scanned_at)) / 60000);

    const { data: updated, error } = await supabase
      .from('attendance_logs')
      .update({ checked_out_at: now })
      .eq('id', logId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, gym_duration_mins: durationMins, log: updated });
  } catch (err) {
    res.status(500).json({ error: 'Checkout failed' });
  }
};

// ── Get User Attendance (Activity Tab) ────────────────────────────────────────
// Returns all attendance logs for authenticated user, sorted by most recent first
const getUserAttendance = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('attendance_logs')
      .select(`
        id,
        user_id,
        scanned_at,
        checked_out_at,
        session_type,
        scanner_id
      `)
      .eq('user_id', userId)
      .order('scanned_at', { ascending: false });

    if (error) throw error;

    // Transform data to include duration for frontend
    const logs = (data || []).map(log => ({
      ...log,
      duration_mins: log.checked_out_at
        ? Math.round((new Date(log.checked_out_at) - new Date(log.scanned_at)) / 60000)
        : null,
    }));

    res.json(logs);
  } catch (err) {
    console.error('Get user attendance error:', err);
    res.status(500).json({ error: 'Failed to fetch attendance logs' });
  }
};

// ── Get User Analytics (Activity Tab) ────────────────────────────────────────
// Returns engagement analytics for authenticated user
const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Fetch user analytics record
    const { data: analytics, error: analyticsError } = await supabase
      .from('user_analytics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (analyticsError) {
      console.error('Analytics fetch error:', analyticsError);
      // Return default analytics if none exist
      return res.json({
        user_id: userId,
        attendance_frequency: 0,
        last_visit_gap_days: 999,
        membership_duration_days: 0,
        engagement_score: 0,
        dropout_risk_score: 0,
        risk_level: 'Low',
        primary_reason: null,
        visits_last_7_days: 0,
        visits_last_30_days: 0,
        current_streak_days: 0,
        last_updated: now.toISOString(),
      });
    }

    res.json(analytics || {});
  } catch (err) {
    console.error('Get user analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

module.exports = { scanQR, checkOut, getTodayAttendance, getMyAttendance, getUserAttendance, getUserAnalytics, };
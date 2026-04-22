const supabase = require('../config/db');

const scanQR = async (req, res) => {
  let qrToken = req.body.qrToken;
  const scannerId = req.user.id;

  if (!qrToken || typeof qrToken !== 'string') {
    return res.status(400).json({ error: 'QR Token is required' });
  }

  // Clean token
  if (qrToken.includes(':')) {
    qrToken = qrToken.split(':').pop().trim();
  }
  qrToken = qrToken.trim();

  try {
    // Get user with membership info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, full_name, is_active, membership_end')
      .eq('qr_token', qrToken)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Invalid QR Code' });
    }

    // === NEW: Membership Check ===
    const now = new Date();
    const membershipEnd = user.membership_end ? new Date(user.membership_end) : null;

    if (!user.is_active) {
      return res.status(403).json({ 
        error: 'Membership has been cancelled. Please renew at the front desk.' 
      });
    }

    if (membershipEnd && membershipEnd < now) {
      return res.status(403).json({ 
        error: 'Membership has expired. Please renew your membership.' 
      });
    }

    // Duplicate scan prevention (30 minutes)
    const windowMinutes = parseInt(process.env.ATTENDANCE_DUPLICATE_WINDOW_MINUTES || 30);
    const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    const { data: recent } = await supabase
      .from('attendance_logs')
      .select('id')
      .eq('user_id', user.id)
      .gte('scanned_at', cutoff)
      .limit(1);

    if (recent && recent.length > 0) {
      return res.status(409).json({
        error: `Already checked in within the last ${windowMinutes} minutes`
      });
    }

    // Log the attendance
    const { data: newLog, error: insertError } = await supabase
      .from('attendance_logs')
      .insert({ 
        user_id: user.id, 
        scanner_id: scannerId 
      })
      .select(`
        *,
        users!attendance_logs_user_id_fkey (full_name)
      `)
      .single();

    if (insertError) throw insertError;

    res.json({
      success: true,
      message: `✅ Check-in successful for ${user.full_name}`,
      member: newLog
    });

  } catch (err) {
    console.error("Scan Error:", err);
    res.status(500).json({ error: 'Failed to process attendance' });
  }
};

const getTodayAttendance = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { data, error } = await supabase
      .from('attendance_logs')
      .select(`
        *,
        users!attendance_logs_user_id_fkey (
          id,
          full_name,
          is_active,
          membership_end,
          membership_plan
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

const getMyAttendance = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const { data, error } = await supabase
      .from('attendance_logs')
      .select(`
        *,
        users!attendance_logs_user_id_fkey (
          full_name,
          is_active,
          membership_end
        )
      `)
      .eq('user_id', req.user.id)
      .order('scanned_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({ records: data || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

module.exports = { scanQR, getTodayAttendance, getMyAttendance };
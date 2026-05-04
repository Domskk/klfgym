const supabase = require('../config/db');
const { calculateDropoutRisk } = require('../services/analytics.services');
const { refreshUserAnalytics } = require('../services/analytics.refresh');

// GET /analytics/dropout-risk/:userId
const getDropoutRisk = async (req, res) => {
  const { userId } = req.params;

  try {
    // Refresh first so user_analytics stays in sync
    await refreshUserAnalytics(userId);

    const { data, error } = await supabase
      .from('user_analytics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Analytics not found for this user' });
    }

    res.json({
      userId,
      riskScore:            data.dropout_risk_score,
      riskLevel:            data.risk_level,
      attendanceFrequency:  data.attendance_frequency,
      lastVisitGapDays:     data.last_visit_gap_days,
      visitsLast7Days:      data.visits_last_7_days,
      visitsLast30Days:     data.visits_last_30_days,
      currentStreakDays:    data.current_streak_days,
      engagementScore:      data.engagement_score,
      membershipDurationDays: data.membership_duration_days,
      primaryReason:        data.primary_reason,
      lastUpdated:          data.last_updated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /analytics/at-risk
const getAtRiskMembers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_analytics')
      .select(`
        user_id,
        dropout_risk_score,
        risk_level,
        attendance_frequency,
        last_visit_gap_days,
        visits_last_7_days,
        visits_last_30_days,
        primary_reason,
        last_updated,
        users (
          full_name,
          email,
          membership_end,
          is_active,
          membership_plan,
          membership_start
        )
      `)
      .in('risk_level', ['Medium', 'High'])
      .order('dropout_risk_score', { ascending: false });

    if (error) throw new Error(error.message);

    const atRisk = (data ?? []).map(row => {
      const user = row.users || {};
      
      // ── NEW FILTER: Only members with actual membership plan ──
      if (!user.membership_plan || !user.membership_start) {
        return null; // Skip users who only signed up but never purchased membership
      }

      const isCanceled = user.is_active === false;
      let explanation = row.primary_reason
        ? `Low attendance + reported "${row.primary_reason.replace(/_/g, ' ')}"`
        : 'Low attendance frequency';

      if (isCanceled) {
        explanation = 'Membership cancelled by admin';
      }

      return {
        userId: row.user_id,
        full_name: user.full_name || 'Unknown',
        email: user.email || '',
        membership_end: user.membership_end,
        riskScore: row.dropout_risk_score || 0,
        riskLevel: row.risk_level || 'Medium',
        explanation,
        attendanceFrequency: row.attendance_frequency,
        lastVisitGapDays: row.last_visit_gap_days,
        isCanceled,
      };
    }).filter(Boolean); // Remove null entries

    res.json(atRisk);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /analytics/refresh-all  (admin only — call once to backfill user_analytics)
const refreshAllAnalytics = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'member')
      .eq('is_active', true);

    if (error) throw new Error(error.message);

    await Promise.all((users ?? []).map(u => refreshUserAnalytics(u.id)));

    res.json({ message: `Refreshed analytics for ${users?.length ?? 0} members` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// GET /analytics/stats
const getAnalyticsStats = async (req, res) => {
  try {
    // === Membership Stats ===
    const { count: totalRegistered, error: err1 } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'member');

    const { count: activeMembers, error: err2 } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'member')
      .eq('is_active', true);

    const { count: expiredMembers, error: err3 } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'member')
      .lt('membership_end', new Date().toISOString())
      .eq('is_active', true);

    const { count: monthlyMembers, error: err4 } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'member')
      .eq('membership_plan', 'monthly')
      .eq('is_active', true);

    const { count: quarterlyMembers, error: err5 } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'member')
      .eq('membership_plan', 'quarterly')
      .eq('is_active', true);

    // === Trainer Stats ===
    const { count: totalTrainers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'trainer');

    // === Attendance Pattern (Last 30 Days) ===
    const { data: logs } = await supabase
      .from('attendance_logs')
      .select('scanned_at')
      .gte('scanned_at', new Date(Date.now() - 30 * 86400000).toISOString());

    const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Index 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    (logs || []).forEach(l => {
      const dayIndex = new Date(l.scanned_at).getDay();
      dayCounts[dayIndex]++;
    });

    const maxCount = Math.max(...dayCounts) || 1;

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const attendancePattern = dayLabels.map((label, i) => ({
      label,
      count: dayCounts[i],
      pct: Math.round((dayCounts[i] / maxCount) * 100)
    }));

    // Week Sessions
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const { count: weekSessions } = await supabase
      .from('attendance_logs')
      .select('*', { count: 'exact', head: true })
      .gte('scanned_at', weekStart.toISOString());

    res.json({
      active_members: activeMembers || 0,
      total_registered: totalRegistered || 0,
      total_members: (activeMembers || 0) + (expiredMembers || 0),
      monthly_members: monthlyMembers || 0,
      quarterly_members: quarterlyMembers || 0,
      expired_members: expiredMembers || 0,
      total_trainers: totalTrainers || 0,
      week_sessions: weekSessions || 0,
      attendancePattern,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getDropoutRisk, getAtRiskMembers, refreshAllAnalytics, getAnalyticsStats };

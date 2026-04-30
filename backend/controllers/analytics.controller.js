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
          is_active
        )
      `)
      .in('risk_level', ['Medium', 'High'])
      .order('dropout_risk_score', { ascending: false });

    if (error) throw new Error(error.message);

    const atRisk = (data ?? []).map(row => {
      const user = row.users || {};
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
    });

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
    // Attendance by day of week (last 30 days)
    const { data: logs } = await supabase
      .from('attendance_logs')
      .select('scanned_at')
      .gte('scanned_at', new Date(Date.now() - 30 * 86400000).toISOString());

    const dayCounts = [0,0,0,0,0,0,0]; // Sun-Sat
    const dayTotals = [0,0,0,0,0,0,0];
    (logs || []).forEach(l => {
      dayCounts[new Date(l.scanned_at).getDay()]++;
    });
    const maxDay = Math.max(...dayCounts) || 1;
    const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const attendancePattern = dayLabels.map((label, i) => ({
      label,
      pct: Math.round((dayCounts[i] / maxDay) * 100),
      count: dayCounts[i],
    }));

    // Sessions per month (last 6 months)
    const monthLabels = [];
    const monthCounts = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString();
      const { count } = await supabase
        .from('attendance_logs')
        .select('*', { count: 'exact', head: true })
        .gte('scanned_at', start)
        .lte('scanned_at', end);
      monthLabels.push(label);
      monthCounts.push(count || 0);
    }

    // Total check-ins this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const { count: weekSessions } = await supabase
      .from('attendance_logs')
      .select('*', { count: 'exact', head: true })
      .gte('scanned_at', weekStart.toISOString());

    res.json({ attendancePattern, sessionTrend: { labels: monthLabels, counts: monthCounts }, weekSessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getDropoutRisk, getAtRiskMembers, refreshAllAnalytics, getAnalyticsStats };

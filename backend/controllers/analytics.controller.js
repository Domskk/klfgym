const supabase = require('../config/db');
const { calculateDropoutRisk } = require('../services/analytics.services');
const { refreshUserAnalytics } = require('../services/analytics.refresh');

// GET /analytics/dropout-risk/:userId
const getDropoutRisk = async (req, res) => {
  const { userId } = req.params;
  try {
    await refreshUserAnalytics(userId);
    const { data, error } = await supabase
      .from('user_analytics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data)
      return res.status(404).json({ error: 'Analytics not found for this user' });

    res.json({
      userId,
      riskScore:              data.dropout_risk_score,
      riskLevel:              data.risk_level,
      attendanceFrequency:    data.attendance_frequency,
      lastVisitGapDays:       data.last_visit_gap_days,
      visitsLast7Days:        data.visits_last_7_days,
      visitsLast30Days:       data.visits_last_30_days,
      currentStreakDays:      data.current_streak_days,
      engagementScore:        data.engagement_score,
      membershipDurationDays: data.membership_duration_days,
      primaryReason:          data.primary_reason,
      lastUpdated:            data.last_updated,
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
        user_id, dropout_risk_score, risk_level,
        attendance_frequency, last_visit_gap_days,
        visits_last_7_days, visits_last_30_days,
        primary_reason, last_updated,
        users (
          full_name, email, membership_end,
          is_active, membership_plan, membership_start
        )
      `)
      .in('risk_level', ['Moderate', 'Vigorous'])
      .order('dropout_risk_score', { ascending: false });

    if (error) throw new Error(error.message);

    const atRisk = (data ?? []).map(row => {
      const user = row.users || {};
      if (!user.membership_plan || !user.membership_start) return null;

      const isCanceled = user.is_active === false;
      let explanation = row.primary_reason
        ? `Low attendance + reported "${row.primary_reason.replace(/_/g, ' ')}"`
        : 'Low attendance frequency';
      if (isCanceled) explanation = 'Membership cancelled by admin';

      return {
        userId:              row.user_id,
        full_name:           user.full_name || 'Unknown',
        email:               user.email || '',
        membership_end:      user.membership_end,
        riskScore:           row.dropout_risk_score || 0,
        riskLevel:           row.risk_level || 'Moderate',
        explanation,
        attendanceFrequency: row.attendance_frequency,
        lastVisitGapDays:    row.last_visit_gap_days,
        isCanceled,
      };
    }).filter(Boolean);

    res.json(atRisk);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /analytics/refresh-all
const refreshAllAnalytics = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users').select('id').eq('role', 'member').eq('is_active', true);
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
    // ── Member counts ────────────────────────────────────────────────────────
    const { count: totalRegistered } = await supabase
      .from('users').select('*', { count: 'exact', head: true }).eq('role', 'member');

    const { count: activeMembers } = await supabase
      .from('users').select('*', { count: 'exact', head: true })
      .eq('role', 'member').eq('is_active', true);

    const { count: expiredMembers } = await supabase
      .from('users').select('*', { count: 'exact', head: true })
      .eq('role', 'member').lt('membership_end', new Date().toISOString()).eq('is_active', true);

    const { count: totalTrainers } = await supabase
      .from('users').select('*', { count: 'exact', head: true }).eq('role', 'trainer');

    // ── Attendance by Day of Week (last 30 days) ─────────────────────────────
    const { data: logs30 } = await supabase
      .from('attendance_logs')
      .select('scanned_at')
      .gte('scanned_at', new Date(Date.now() - 30 * 86400000).toISOString());

    const dayCounts = [0,0,0,0,0,0,0];
    (logs30 || []).forEach(l => {
      dayCounts[new Date(l.scanned_at).getDay()]++;
    });
    const maxDay = Math.max(...dayCounts) || 1;
    const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const attendancePattern = dayLabels.map((label, i) => ({
      label,
      count: dayCounts[i],
      pct:   Math.round((dayCounts[i] / maxDay) * 100),
    }));

    // ── Daily Time Series (last 30 days) ─────────────────────────────────────
    const { data: logsAll } = await supabase
      .from('attendance_logs')
      .select('scanned_at')
      .gte('scanned_at', new Date(Date.now() - 30 * 86400000).toISOString())
      .order('scanned_at', { ascending: true });

    const dailyMap = {};
    (logsAll || []).forEach(l => {
      const day = new Date(l.scanned_at).toISOString().split('T')[0];
      dailyMap[day] = (dailyMap[day] || 0) + 1;
    });
    const timeSeries = Array.from({ length: 30 }, (_, i) => {
      const d   = new Date(Date.now() - (29 - i) * 86400000);
      const key = d.toISOString().split('T')[0];
      return {
        date:  key,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: dailyMap[key] || 0,
      };
    });

    // ── Weekly Time Series (last 12 weeks) ───────────────────────────────────
    const { data: logs12w } = await supabase
      .from('attendance_logs')
      .select('scanned_at')
      .gte('scanned_at', new Date(Date.now() - 84 * 86400000).toISOString())
      .order('scanned_at', { ascending: true });

    const weekMap = {};
    (logs12w || []).forEach(l => {
      const d        = new Date(l.scanned_at);
      const day      = d.getDay();
      const monday   = new Date(d);
      monday.setDate(d.getDate() - ((day + 6) % 7));
      const key = monday.toISOString().split('T')[0];
      weekMap[key] = (weekMap[key] || 0) + 1;
    });
    const weeklySeries = Array.from({ length: 12 }, (_, i) => {
      const monday = new Date();
      const dayOfWeek = monday.getDay();
      monday.setDate(monday.getDate() - ((dayOfWeek + 6) % 7) - (11 - i) * 7);
      const key = monday.toISOString().split('T')[0];
      return {
        week:  key,
        label: monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: weekMap[key] || 0,
      };
    });

    // ── Monthly Time Series (last 12 months) ─────────────────────────────────
    const { data: logsYear } = await supabase
      .from('attendance_logs')
      .select('scanned_at')
      .gte('scanned_at', new Date(Date.now() - 365 * 86400000).toISOString());

    const monthMap = {};
    (logsYear || []).forEach(l => {
      const d   = new Date(l.scanned_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`;
      monthMap[key] = (monthMap[key] || 0) + 1;
    });
    const monthSeries = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`;
      return {
        month: key,
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        count: monthMap[key] || 0,
      };
    });

    // ── Membership Growth (new members per month, last 12 months) ────────────
    const { data: newMembers } = await supabase
      .from('users')
      .select('created_at')
      .eq('role', 'member')
      .gte('created_at', new Date(Date.now() - 365 * 86400000).toISOString());

    const memberGrowthMap = {};
    (newMembers || []).forEach(u => {
      const d   = new Date(u.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`;
      memberGrowthMap[key] = (memberGrowthMap[key] || 0) + 1;
    });
    let cumulative = 0;
    const memberGrowthSeries = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`;
      const newCount = memberGrowthMap[key] || 0;
      cumulative += newCount;
      return {
        month:    key,
        label:    d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        newCount,
        cumulative,
      };
    });

    // ── Avg Gym Duration per day (last 30 days, requires checked_out_at) ──────
    const { data: durationLogs } = await supabase
      .from('attendance_logs')
      .select('scanned_at, checked_out_at')
      .gte('scanned_at', new Date(Date.now() - 30 * 86400000).toISOString())
      .not('checked_out_at', 'is', null);

    const durationByDay = {};
    (durationLogs || []).forEach(l => {
      const day  = new Date(l.scanned_at).toISOString().split('T')[0];
      const mins = Math.round((new Date(l.checked_out_at) - new Date(l.scanned_at)) / 60000);
      if (!durationByDay[day]) durationByDay[day] = { total: 0, count: 0 };
      durationByDay[day].total += mins;
      durationByDay[day].count += 1;
    });
    const durationSeries = Array.from({ length: 30 }, (_, i) => {
      const d   = new Date(Date.now() - (29 - i) * 86400000);
      const key = d.toISOString().split('T')[0];
      const day = durationByDay[key];
      return {
        date:    key,
        label:   d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        avgMins: day ? Math.round(day.total / day.count) : null,
        count:   day?.count || 0,
      };
    });

    // ── Trend calculation helper (last 7 vs prev 7 days) ─────────────────────
    const last7  = timeSeries.slice(-7).reduce((s, d) => s + d.count, 0);
    const prev7  = timeSeries.slice(-14, -7).reduce((s, d) => s + d.count, 0);
    const trendPct = prev7 === 0 ? null : Math.round(((last7 - prev7) / prev7) * 100);

    // ── Week sessions ─────────────────────────────────────────────────────────
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const { count: weekSessions } = await supabase
      .from('attendance_logs').select('*', { count: 'exact', head: true })
      .gte('scanned_at', weekStart.toISOString());

    res.json({
      active_members:      activeMembers    || 0,
      total_registered:    totalRegistered  || 0,
      total_members:       (activeMembers || 0) + (expiredMembers || 0),
      expired_members:     expiredMembers   || 0,
      total_trainers:      totalTrainers    || 0,
      week_sessions:       weekSessions     || 0,
      trend_pct:           trendPct,          // % change vs prior 7 days
      attendancePattern,
      timeSeries,          // daily — last 30 days
      weeklySeries,        // weekly — last 12 weeks
      monthSeries,         // monthly — last 12 months
      memberGrowthSeries,  // new + cumulative members per month
      durationSeries,      // avg gym time per day (last 30 days)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getDropoutRisk, getAtRiskMembers, refreshAllAnalytics, getAnalyticsStats };
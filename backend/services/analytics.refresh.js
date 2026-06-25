const supabase = require('../config/db');
const { calculateDropoutRisk } = require('./analytics.services');

const refreshUserAnalytics = async (userId) => {
  const now = new Date().toISOString(); // Use ISO string for consistency

  // ── Optimized Attendance Stats (single query where possible) ──
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const { data: attendanceStats, error: statsError } = await supabase
    .from('attendance_logs')
    .select(`
      total_visits:count,
      last_visit:max(scanned_at),
      visits_7_days:count.filter(scanned_at.gte.${sevenDaysAgo}),
      visits_30_days:count.filter(scanned_at.gte.${thirtyDaysAgo})
    `)
    .eq('user_id', userId)
    .single();

  if (statsError && statsError.code !== 'PGRST116') { 
    console.error('Error fetching attendance stats:', statsError);
  }

  const totalVisits = attendanceStats?.total_visits || 0;
  const lastVisit = attendanceStats?.last_visit;
  const visitsLast7Days = attendanceStats?.visits_7_days || 0;
  const visitsLast30Days = attendanceStats?.visits_30_days || 0;

  const lastVisitGapDays = lastVisit
    ? Math.floor((Date.now() - new Date(lastVisit).getTime()) / 86400000)
    : 999;

  // ── Current Streak (efficient) ──
  const currentStreak = await calculateCurrentStreak(userId);

  // ── Membership Duration ──
  const { data: user } = await supabase
    .from('users')
    .select('membership_start')
    .eq('id', userId)
    .single();

  const membershipDurationDays = user?.membership_start
    ? Math.floor((Date.now() - new Date(user.membership_start).getTime()) / 86400000)
    : 0;

  // ── Dropout Reasons ──
  const { data: reasons } = await supabase
    .from('dropout_reasons')
    .select('reason')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Calculate risk
  const risk = calculateDropoutRisk({
    attendanceFrequency: totalVisits,
    lastVisitGapDays,
    membershipDurationDays,
    visitsLast7Days,
    visitsLast30Days,
  }, reasons || []);

  const engagementScore = Math.round((1 - risk.riskScore) * 100);

  // ── Upsert ──
  const { error: upsertError } = await supabase
    .from('user_analytics')
    .upsert({
      user_id: userId,
      attendance_frequency: totalVisits,
      last_visit_gap_days: lastVisitGapDays,
      membership_duration_days: membershipDurationDays,
      visits_last_7_days: visitsLast7Days,
      visits_last_30_days: visitsLast30Days,
      current_streak_days: currentStreak,
      dropout_risk_score: risk.riskScore,
      risk_level: risk.riskLevel,
      primary_reason: reasons?.[0]?.reason ?? null,
      engagement_score: engagementScore,
      last_updated: now,
    }, { onConflict: 'user_id' });

  if (upsertError) {
    console.error('Failed to upsert analytics:', upsertError);
    throw upsertError;
  }

  return { success: true, riskScore: risk.riskScore };
};

// Helper: Calculate current streak efficiently
const calculateCurrentStreak = async (userId) => {
  const { data: recentLogs } = await supabase
    .from('attendance_logs')
    .select('scanned_at')
    .eq('user_id', userId)
    .gte('scanned_at', new Date(Date.now() - 365 * 86400000).toISOString()) // Last year max
    .order('scanned_at', { ascending: false });

  if (!recentLogs?.length) return 0;

  const visitDates = new Set(
    recentLogs.map(l => new Date(l.scanned_at).toISOString().split('T')[0])
  );

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(currentDate);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];

    if (visitDates.has(dateStr)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

module.exports = { refreshUserAnalytics };
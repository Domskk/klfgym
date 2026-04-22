const supabase = require('../config/db');
const { calculateDropoutRisk } = require('./analytics.services');

const refreshUserAnalytics = async (userId) => {
  const now = Date.now();

  // Fetch all attendance logs for this user
  const { data: logs } = await supabase
    .from('attendance_logs')
    .select('scanned_at')
    .eq('user_id', userId)
    .order('scanned_at', { ascending: false });

  const attendanceFrequency = logs?.length ?? 0;

  const lastVisitGapDays = logs?.length > 0
    ? Math.floor((now - new Date(logs[0].scanned_at).getTime()) / 86400000)
    : 999;

  const visitsLast7Days = logs?.filter(l =>
    (now - new Date(l.scanned_at).getTime()) <= 7 * 86400000
  ).length ?? 0;

  const visitsLast30Days = logs?.filter(l =>
    (now - new Date(l.scanned_at).getTime()) <= 30 * 86400000
  ).length ?? 0;

  // Current consecutive-day streak
  let streak = 0;
  const visitDays = new Set(
    logs?.map(l => new Date(l.scanned_at).toDateString()) ?? []
  );
  for (let i = 0; i < 365; i++) {
    const day = new Date(now - i * 86400000).toDateString();
    if (visitDays.has(day)) streak++;
    else break;
  }

  // Membership duration
  const { data: user } = await supabase
    .from('users')
    .select('membership_start')
    .eq('id', userId)
    .single();

  const membershipDurationDays = user?.membership_start
    ? Math.floor((now - new Date(user.membership_start).getTime()) / 86400000)
    : 0;

  // Dropout reasons
  const { data: reasons } = await supabase
    .from('dropout_reasons')
    .select('reason')
    .eq('user_id', userId);

  const risk = calculateDropoutRisk(
    {
      attendanceFrequency,
      lastVisitGapDays,
      membershipDurationDays,
      visitsLast7Days,
      visitsLast30Days,
    },
    reasons ?? []
  );

  // Engagement score: simple inverse of risk (0–100)
  const engagementScore = Math.round((1 - risk.riskScore) * 100);

  await supabase.from('user_analytics').upsert(
    {
      user_id:                  userId,
      attendance_frequency:     attendanceFrequency,
      last_visit_gap_days:      lastVisitGapDays,
      membership_duration_days: membershipDurationDays,
      visits_last_7_days:       visitsLast7Days,
      visits_last_30_days:      visitsLast30Days,
      current_streak_days:      streak,
      dropout_risk_score:       risk.riskScore,
      risk_level:               risk.riskLevel,
      primary_reason:           reasons?.[0]?.reason ?? null,
      engagement_score:         engagementScore,
      last_updated:             new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
};

module.exports = { refreshUserAnalytics };
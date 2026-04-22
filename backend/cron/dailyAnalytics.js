/**
 * Daily Cron Job
 * Runs at 2AM every day:
 *  1. Refreshes analytics for all members
 *  2. Sends membership expiry notifications
 *  3. Sends re-engagement push to high-risk inactive members
 */

const cron = require('node-cron');
const supabase = require('../config/db');
const { refreshUserAnalytics } = require('../services/analytics.refresh');
const { sendEmail, sendPush } = require('../services/notification.services');

cron.schedule('0 2 * * *', async () => {
  console.log('🔄 Daily Analytics & Notification Job started...');

  try {
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'member')     
      .eq('is_active', true);    

    if (membersError) throw new Error(membersError.message);

    let analyticsCount = 0;
    for (const member of members || []) {
      try {
        await refreshUserAnalytics(member.id); 
        analyticsCount++;
      } catch (err) {
        console.error(` Analytics failed for user ${member.id}:`, err.message);
      }
    }

    console.log(` Analytics refreshed for ${analyticsCount} members`);

// membership expiry notifications
    const now = new Date().toISOString();
    const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: expiringUsers } = await supabase
      .from('users')
      .select('id, email, full_name, membership_end')
      .gte('membership_end', now)
      .lte('membership_end', next7Days)
      .not('membership_end', 'is', null)
      .eq('is_active', true);

    let expiryCount = 0;
    for (const user of expiringUsers || []) {
      try {
        const daysLeft = Math.ceil(
          (new Date(user.membership_end) - new Date()) / (1000 * 60 * 60 * 24)
        );

        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a1a2e; padding: 30px; text-align: center;">
              <h1 style="color: #F0C040; margin: 0;">⚠️ Membership Expiring Soon</h1>
            </div>
            <div style="padding: 30px; background: #fff;">
              <p>Hi <strong>${user.full_name}</strong>,</p>
              <p>Your KLF Gym membership expires in <strong style="color: #e94560;">${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>
                on <strong>${new Date(user.membership_end).toLocaleDateString()}</strong>.</p>
              <p>Renew now to continue your training without interruption and get <strong>10% off</strong> your next month!</p>
              <p style="color: #888; font-size: 13px;">— The KLF Gym Team</p>
            </div>
          </div>
        `;

        await sendEmail(user.email, '⚠️ Your KLF Gym Membership is Expiring Soon!', html);

        // Log notification in DB
        await supabase.from('notifications').insert({
          user_id: user.id,
          type:    'membership_expiry',
          title:   `Membership expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
          message: `Your membership will expire on ${new Date(user.membership_end).toLocaleDateString()}.`,
          channel: 'email',
        });

        expiryCount++;
      } catch (err) {
        console.error(`Expiry email failed for ${user.email}:`, err.message);
      }
    }

    console.log(`Sent ${expiryCount} membership expiry notifications`);

// re-engagement notifications
    const { data: highRisk } = await supabase
      .from('user_analytics')
      .select('user_id, last_visit_gap_days')
      .gt('last_visit_gap_days', 21)
      .eq('risk_level', 'High');

    let reEngageCount = 0;
    for (const item of highRisk || []) {
      try {
        await sendPush(
          item.user_id,
          '💪 We Miss You at KLF Gym!',
          `It's been ${item.last_visit_gap_days} days! Come back and keep your momentum going.`
        );

        // Log re-engagement notification
        await supabase.from('notifications').insert({
          user_id: item.user_id,
          type:    're_engagement',
          title:   'We miss you at KLF Gym!',
          message: `It's been ${item.last_visit_gap_days} days since your last visit.`,
          channel: 'push',
        });

        reEngageCount++;
      } catch (err) {
        console.error(`Re-engagement push failed for user ${item.user_id}:`, err.message);
      }
    }

    console.log(`Sent ${reEngageCount} re-engagement notifications`);

  } catch (err) {
    console.error('Daily Job Failed:', err.message);
  }

  console.log('Daily Analytics & Notification Job completed');
});

module.exports = {};